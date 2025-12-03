import express from 'express';
import db from '../database.js';
import axios from 'axios';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

const NATURES = ["Adamant", "Bashful", "Bold", "Brave", "Calm", "Careful", "Docile", "Gentle", "Hardy", "Hasty", "Impish", "Jolly", "Lax", "Lonely", "Mild", "Modest", "Naive", "Naughty", "Quiet", "Quirky", "Rash", "Relaxed", "Sassy", "Serious", "Timid"];
const GENDERS = ['M', 'F'];

const getOrFetchSpeciesData = (speciesId) => {
    return new Promise((resolve, reject) => {
        const sqlFind = "SELECT * FROM PokemonSpecies WHERE SpeciesID = ?";
        
        db.get(sqlFind, [speciesId], async (err, row) => {
            if (err) return reject(new Error("Error al buscar especie en DB local."));
            
            if (row) {
                console.log(`Especie ${speciesId} encontrada en caché (DB local).`);
                return resolve(row);
            }

            try {
                console.log(`Especie ${speciesId} NO encontrada. Buscando en PokeAPI...`);
                const basicDataPromise = axios.get(`https://pokeapi.co/api/v2/pokemon/${speciesId}`);
                const speciesDataPromise = axios.get(`https://pokeapi.co/api/v2/pokemon-species/${speciesId}`);
                
                const [basicRes, speciesRes] = await Promise.all([basicDataPromise, speciesDataPromise]);

                const basic = basicRes.data;
                const species = speciesRes.data;

                const flavorTextEntry = species.flavor_text_entries.find(e => e.language.name === 'en');

                const newSpecies = {
                    SpeciesID: basic.id,
                    SpeciesName: basic.name,
                    Type1: basic.types[0]?.type.name || null,
                    Type2: basic.types[1]?.type.name || null,
                    BaseHeight: basic.height / 10, 
                    BaseWeight: basic.weight / 10, 
                    SpriteURL: basic.sprites.front_default,
                    BaseHP: basic.stats.find(s => s.stat.name === 'hp').base_stat,
                    BaseAttack: basic.stats.find(s => s.stat.name === 'attack').base_stat,
                    BaseDefense: basic.stats.find(s => s.stat.name === 'defense').base_stat,
                    BaseSpAttack: basic.stats.find(s => s.stat.name === 'special-attack').base_stat,
                    BaseSpDefense: basic.stats.find(s => s.stat.name === 'special-defense').base_stat,
                    BaseSpeed: basic.stats.find(s => s.stat.name === 'speed').base_stat,
                    Habitat: species.habitat?.name || null,
                    FlavorText: flavorTextEntry?.flavor_text.replace(/\s+/g, ' ') || null
                };

                const sqlInsert = `
                    INSERT INTO PokemonSpecies (
                        SpeciesID, SpeciesName, Type1, Type2, BaseHeight, BaseWeight, SpriteURL, 
                        BaseHP, BaseAttack, BaseDefense, BaseSpAttack, BaseSpDefense, BaseSpeed, 
                        Habitat, FlavorText
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const params = Object.values(newSpecies);

                db.run(sqlInsert, params, function(err) {
                    if (err) return reject(new Error("Error al guardar nueva especie en DB."));
                    console.log(`Especie ${newSpecies.SpeciesName} guardada en DB local.`);
                    resolve(newSpecies); 
                });

            } catch (apiError) {
                console.error("Error al llamar a la PokeAPI:", apiError.message);
                reject(new Error("Error al consultar la PokeAPI."));
            }
        });
    });
};


// Metodos de API
router.post("/capturar", verifyToken, async (req, res) => {
    const { speciesId, nickname } = req.body;

    const trainerId = req.user.id;

    if (!trainerId || !speciesId) {
        return res.status(400).json({ error: "trainerId y speciesId son requeridos." });
    }

    try {
        const speciesData = await getOrFetchSpeciesData(speciesId);


        const level = Math.floor(Math.random() * 5) + 1;
        const gender = GENDERS[Math.floor(Math.random() * GENDERS.length)];
        const nature = NATURES[Math.floor(Math.random() * NATURES.length)];
        const height = (speciesData.BaseHeight * (Math.random() * 0.4 + 0.8)).toFixed(2); 
        const weight = (speciesData.BaseWeight * (Math.random() * 0.4 + 0.8)).toFixed(2); 
        const sql = `
            INSERT INTO CapturedPokemon 
            (TrainerID, SpeciesID, Nickname, Level, Gender, Height, Weight, Nature) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [trainerId, speciesId, nickname || null, level, gender, height, weight, nature];

        db.run(sql, params, function(err) {
            if (err) {
                console.error("Error en POST /api/capturar:", err.message);
                return res.status(500).json({ error: "Error al guardar la captura." });
            }
            res.status(201).json({ 
                message: "¡Pokémon capturado exitosamente!",
                capturedPokemonID: this.lastID 
            });
        });

    } catch (error) {
        console.error("Error en el proceso de captura:", error.message);
        res.status(500).json({ error: error.message });
    }
});

router.get("/mis-pokemon", verifyToken, (req, res) => {
    const userId = req.user.id; 
    const sql = `
        SELECT
            cp.CapturedPokemonID,
            cp.Nickname,
            cp.Level,
            cp.Gender,
            cp.Nature,
            cp.DateCaptured,
            ps.SpeciesName,
            ps.SpriteURL,
            ps.Type1,
            ps.Type2
        FROM CapturedPokemon AS cp
        JOIN PokemonSpecies AS ps ON cp.SpeciesID = ps.SpeciesID
        WHERE cp.TrainerID = ?
        ORDER BY cp.DateCaptured DESC
    `;

    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error("Error en GET /api/mis-pokemon:", err.message);
            return res.status(500).json({ error: "Error interno." });
        }
        res.json(rows); 
    });
});

router.put("/pokemon/:id", verifyToken, (req, res) => {
    const { nickname } = req.body;
    const pokemonId = req.params.id;
    const userId = req.user.id;

    if (nickname === undefined) {
        return res.status(400).json({ error: "El campo 'nickname' es requerido." });
    }

    const newNickname = nickname || null; 

    const sql = 'UPDATE CapturedPokemon SET Nickname = ? WHERE CapturedPokemonID = ? AND TrainerID = ?';
    const params = [newNickname, pokemonId, userId];

    db.run(sql, params, function(err) {
        if (err) {
            console.error("Error en PUT /api/pokemon/:id:", err.message);
            return res.status(500).json({ error: "Error al actualizar la base de datos." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Pokémon no encontrado o no tienes permiso para editarlo." });
        }
        res.json({ message: "Apodo actualizado exitosamente." });
    });
});

router.delete("/pokemon/:id", verifyToken, (req, res) => {
    const pokemonId = req.params.id;
    const userId = req.user.id;

    db.get("SELECT * FROM CapturedPokemon WHERE CapturedPokemonID = ?", [pokemonId], (err, row) => {
        if (row) {
            console.log("El Pokémon existe en la BD. Pertenece al TrainerID:", row.TrainerID);
            if (row.TrainerID !== userId) {
                console.log("¡ALERTA! El usuario intenta borrar un pokemon que NO es suyo.");
            }
        } else {
            console.log("El Pokémon con ese ID NO existe en la base de datos.");
        }
    });

    const sql = 'DELETE FROM CapturedPokemon WHERE CapturedPokemonID = ? AND TrainerID = ?';
    const params = [pokemonId, userId];

    db.run(sql, params, function(err) {
        if (err) {
            console.error("Error en DELETE /api/pokemon/:id:", err.message);
            return res.status(500).json({ error: "Error al eliminar de la base de datos." });
        }
        console.log(`Filas afectadas (deleted): ${this.changes}`);
        if (this.changes === 0) {
            return res.status(404).json({ error: "Pokémon no encontrado o no tienes permiso para liberarlo." });
        }
        res.json({ message: "Pokémon liberado exitosamente." });
    });
});

export default router;