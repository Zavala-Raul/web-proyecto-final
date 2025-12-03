import express from 'express';
import db from '../database.js';
import axios from 'axios';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

const NATURES = ["Adamant", "Bashful", "Bold", "Brave", "Calm", "Careful", "Docile", "Gentle", "Hardy", "Hasty", "Impish", "Jolly", "Lax", "Lonely", "Mild", "Modest", "Naive", "Naughty", "Quiet", "Quirky", "Rash", "Relaxed", "Sassy", "Serious", "Timid"];
const GENDERS = ['M', 'F'];

const getOrFetchSpeciesData = async (speciesId) => {
    const sqlFind = 'SELECT * FROM "PokemonSpecies" WHERE "SpeciesID" = $1';
    const result = await db.query(sqlFind, [speciesId]);

    if (result.rows.length > 0) {
        console.log(`Especie ${speciesId} encontrada en caché (DB local).`);
        return result.rows[0];
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
            INSERT INTO "PokemonSpecies" (
                "SpeciesID", "SpeciesName", "Type1", "Type2", "BaseHeight", "BaseWeight", 
                "SpriteURL", "BaseHP", "BaseAttack", "BaseDefense", "BaseSpAttack", 
                "BaseSpDefense", "BaseSpeed", "Habitat", "FlavorText"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *
        `;
        const params = Object.values(newSpecies);
        const insertResult = await db.query(sqlInsert, params);
        return insertResult.rows[0];
    } catch (apiError) {
        console.error("Error al llamar a la PokeAPI:", apiError.message);
        throw new Error("Error al consultar la PokeAPI.");
    }
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
            INSERT INTO "CapturedPokemon" 
            ("TrainerID", "SpeciesID", "Nickname", "Level", "Gender", "Height", "Weight", "Nature") 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING "CapturedPokemonID"
        `;

        const params = [trainerId, speciesId, nickname || null, level, gender, height, weight, nature];
        const result = await db.query(sql, params);

        res.status(201).json({ 
            message: "¡Pokémon capturado!",
            capturedPokemonID: result.rows[0].CapturedPokemonID 
        });

    } catch (error) {
        console.error("Error en el proceso de captura:", error.message);
        res.status(500).json({ error: error.message });
    }
});

router.get("/mis-pokemon", verifyToken, async (req, res) => {
    const userId = req.user.id; 

    try {
        const sql = `
            SELECT
                cp."CapturedPokemonID",
                cp."Nickname",
                cp."Level",
                cp."Gender",
                cp."Nature",
                cp."DateCaptured",
                ps."SpeciesName",
                ps."SpriteURL",
                ps."Type1",
                ps."Type2"
            FROM "CapturedPokemon" AS cp
            JOIN "PokemonSpecies" AS ps ON cp."SpeciesID" = ps."SpeciesID"
            WHERE cp."TrainerID" = $1
            ORDER BY cp."DateCaptured" DESC
        `;

        const result = await db.query(sql, [userId]);
        res.json(result.rows);
        }
    catch (err) {
        console.error("Error en GET /api/mis-pokemon:", err.message);
        res.status(500).json({ error: "Error al consultar Pokémon capturados." });
    }    
});

router.put("/pokemon/:id", verifyToken, async (req, res) => {
    const { nickname } = req.body;
    const pokemonId = req.params.id;
    const userId = req.user.id;

    if (nickname === undefined) {
        return res.status(400).json({ error: "El campo 'nickname' es requerido." });
    }

    const newNickname = nickname || null; 

    try {
        const sql = `
            UPDATE "CapturedPokemon" 
            SET "Nickname" = $1 
            WHERE "CapturedPokemonID" = $2 AND "TrainerID" = $3
        `;
        const params = [newNickname, pokemonId, userId];
        const result = await db.query(sql, params);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Pokémon no encontrado o no tienes permiso para editarlo." });
        }
        res.json({ message: "Apodo actualizado exitosamente."
        });
    } catch (err) {
        console.error("Error en PUT /api/pokemon/:id:", err.message);
        res.status(500).json({ error: "Error al actualizar apodo del Pokémon." });
    }
});

router.delete("/pokemon/:id", verifyToken, async (req, res) => {
    const pokemonId = req.params.id;
    const userId = req.user.id;

    try {
        const sql = 'DELETE FROM "CapturedPokemon" WHERE "CapturedPokemonID" = $1 AND "TrainerID" = $2';
        const params = [pokemonId, userId];

        const result = await db.query(sql, params);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Pokémon no encontrado o no tienes permiso para liberarlo." });
        }
        res.json({ message: "¡Pokémon liberado con éxito!" });
    } catch (err) {
        console.error("Error en DELETE /api/pokemon/:id:", err.message);
        res.status(500).json({ error: "Error al liberar Pokémon." });
    }
});

export default router;