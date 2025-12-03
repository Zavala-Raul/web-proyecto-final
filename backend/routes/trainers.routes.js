import bcrypt from 'bcrypt';
import db from '../database.js';
import express from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = "SecretoMoment"; 
const router = express.Router(); 
const saltRounds = 10;

// Tabla de Trainers

router.post("/register", async (req, res) => {
    const { FirstName, LastName, Username, Password } = req.body;

    if (!FirstName || !LastName || !Username || !Password) {
        return res.status(400).json({ error: "Todos los campos son requeridos." });
    }

    try {
        const passwordHash = await bcrypt.hash(Password, saltRounds);

        const sql = `
                    INSERT INTO "Trainer" ("FirstName", "LastName", "Username", "PasswordHash") 
                    VALUES ($1, $2, $3, $4) 
                    RETURNING "TrainerID", "FirstName", "LastName", "Username"
                `;        
        const params = [FirstName, LastName, Username, passwordHash];

        const result = await db.query(sql, params);
        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error(err);
        if (err.code === '23505') {
            return res.status(409).json({ error: "El nombre de usuario ya existe." });
        }
        res.status(500).json({ error: "Error al registrar usuario." });
    }
});

router.post("/login", async (req, res) => {
    const { Username, Password } = req.body;

    try {
        // CAMBIOS: Comillas y $1
        const sql = 'SELECT * FROM "Trainer" WHERE "Username" = $1';
        const result = await db.query(sql, [Username]);

        if (result.rows.length === 0) {
             return res.status(401).json({ error: "Credenciales inválidas." });
        }

        const trainer = result.rows[0];

        const match = await bcrypt.compare(Password, trainer.PasswordHash);

        if (match) {
            const token = jwt.sign(
                { id: trainer.TrainerID, username: trainer.Username }, 
                SECRET_KEY, 
                { expiresIn: '2h' } 
            );
            
            res.json({
                message: "Login exitoso",
                token: token, 
                username: trainer.Username
            });
        } else {
            return res.status(401).json({ error: "Credenciales inválidas." });
        }

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error interno." });
    }
});

router.get("/trainers", async (req, res) => {
    try {
        const sql = 'SELECT "TrainerID", "FirstName", "LastName", "Username" FROM "Trainer"';
        const result = await db.query(sql);
        res.json(result.rows);
    }   catch (err) {
        console.error("Error en GET /api/trainers:", err.message);
        res.status(500).json({ error: "Error al consultar entrenadores." });
    }
});

router.get("/trainers/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const sql = 'SELECT "TrainerID", "FirstName", "LastName", "Username" FROM "Trainer" WHERE "TrainerID" = $1';
        const result = await db.query(sql, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Entrenador no encontrado." });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error en GET /api/trainers/:id:", err.message);
        res.status(500).json({ error: "Error al consultar entrenador." });
    }
});

router.put("/trainers/:id", async (req, res) => {
    const { FirstName, LastName } = req.body;
    const { id } = req.params;

    if (!FirstName || !LastName) {
        return res.status(400).json({ error: "FirstName y LastName son requeridos." });
    }

    try {
        const sql = `
            UPDATE "Trainer" 
            SET "FirstName" = $1, "LastName" = $2 
            WHERE "TrainerID" = $3
        `;
        const params = [FirstName, LastName, id];
        const result = await db.query(sql, params);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Entrenador no encontrado." });
        }
        res.json({ message: "Entrenador actualizado exitosamente." });

    } catch (err) {
        console.error("Error en PUT /api/trainers/:id:", err.message);
        res.status(500).json({ error: "Error al actualizar entrenador." });
    }
});

router.delete("/trainers/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const sql = 'DELETE FROM "Trainer" WHERE "TrainerID" = $1';
        const result = await db.query(sql, [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Entrenador no encontrado." });
        }
        res.json({ message: "Entrenador eliminado exitosamente." });
    } catch (err) {
        console.error("Error en DELETE /api/trainers/:id:", err.message);
        res.status(500).json({ error: "Error al eliminar entrenador." });
    }
});

export default router;