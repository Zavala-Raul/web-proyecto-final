import express from 'express';
import db from '../database.js';
import axios from 'axios';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

const GENDERS = ['M', 'F'];
const TYPE_TRANSLATIONS = {
    normal: "Normal", fire: "Fuego", water: "Agua", grass: "Planta",
    electric: "Eléctrico", ice: "Hielo", fighting: "Lucha", poison: "Veneno",
    ground: "Tierra", flying: "Volador", psychic: "Psíquico", bug: "Bicho",
    rock: "Roca", ghost: "Fantasma", dragon: "Dragón", steel: "Acero",
    fairy: "Hada", dark: "Siniestro"
};
const NATURES = [
    "Fuerte", "Huérfana", "Audaz", "Firme", "Pícara", 
    "Osada", "Dócil", "Plácida", "Agitada", "Floja", 
    "Miedosa", "Activa", "Seria", "Alegre", "Ingenua", 
    "Modesta", "Afable", "Mansa", "Tímida", "Alocada", 
    "Serena", "Amable", "Grosera", "Cauta", "Rara"
];



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

        const flavorTextEntry = species.flavor_text_entries.find(e => e.language.name === 'es') 
                             || species.flavor_text_entries.find(e => e.language.name === 'en');
        
        const type1En = basic.types[0]?.type.name;
        const type2En = basic.types[1]?.type.name;
        const type1Es = type1En ? (TYPE_TRANSLATIONS[type1En] || type1En) : null;
        const type2Es = type2En ? (TYPE_TRANSLATIONS[type2En] || type2En) : null;

        const newSpecies = {
            SpeciesID: basic.id,
            SpeciesName: basic.name,
            Type1: type1Es,
            Type2: type2Es,
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
                TO_CHAR(
                    (cp."DateCaptured" AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City'), 
                    'DD/MM/YYYY'
                ) as fecha_simple,
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

router.get("/random", async (req, res) => {
    try {
        const randomId = Math.floor(Math.random() * 1025) + 1;

        const speciesData = await getOrFetchSpeciesData(randomId);

        res.json({
            id: speciesData.SpeciesID,
            name: speciesData.SpeciesName, 
            sprite: speciesData.SpriteURL,
            flavorText: speciesData.FlavorText, 
            types: [speciesData.Type1, speciesData.Type2] 
        });

    } catch (error) {
        console.error("Error generando pokemon random:", error);
        res.status(500).json({ error: "Error obteniendo pokemon de juego" });
    }
});

router.delete("/admin/nuke-pokemon", verifyToken, async (req, res) => {
    try {

        await db.query('TRUNCATE TABLE "CapturedPokemon", "PokemonSpecies" RESTART IDENTITY CASCADE');
        
        console.log("⚠️ TABLAS POKEMON PURGADAS ⚠️");
        res.json({ message: "Tablas de Pokémon y Especies reiniciadas a cero." });
    } catch (error) {
        console.error("Error al purgar DB:", error.message);
        res.status(500).json({ error: "No se pudo reiniciar la base de datos." });
    }
});

router.get("/pokedex", verifyToken, async (req, res) => {
    try {
        const sql = `
            SELECT 
                ps.*,
                -- SUBCONSULTA: Busca el nombre del PRIMER entrenador que lo atrapó
                (
                    SELECT T."FirstName" || ' ' || T."LastName"
                    FROM "CapturedPokemon" cp
                    JOIN "Trainer" T ON cp."TrainerID" = T."TrainerID" 
                    WHERE cp."SpeciesID" = ps."SpeciesID"
                    ORDER BY cp."DateCaptured" ASC
                    LIMIT 1
                ) as "DescubiertoPor"
            FROM "PokemonSpecies" ps
            ORDER BY ps."SpeciesID" ASC
        `;

        const result = await db.query(sql);
        res.json(result.rows);

    } catch (error) {
        console.error("Error al obtener la Pokedex:", error.message);
        res.status(500).json({ error: "Error al cargar la enciclopedia." });
    }
});

export default router;