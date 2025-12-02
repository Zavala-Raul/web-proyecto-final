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

        const sql = 'INSERT INTO Trainer (FirstName, LastName, Username, PasswordHash) VALUES (?,?,?,?)';
        const params = [FirstName, LastName, Username, passwordHash];

        db.run(sql, params, function(err) {
            if (err) {
                if (err.message.includes("UNIQUE constraint failed")) {
                    return res.status(409).json({ error: "El nombre de usuario ya existe." });
                }
                console.error("Error en POST /api/register:", err.message);
                return res.status(500).json({ error: "Error al registrar el entrenador." });
            }
            
            res.status(201).json({
                TrainerID: this.lastID,
                FirstName,
                LastName,
                Username
            });
        });
    } catch (hashError) {
        console.error("Error en el hasheo:", hashError);
        res.status(5.00).json({ error: "Error interno del servidor." });
    }
});

router.post("/login", (req, res) => {
    const { Username, Password } = req.body;

    if (!Username || !Password) {
        return res.status(400).json({ error: "Usuario y contraseña requeridos." });
    }

    const sql = "SELECT * FROM Trainer WHERE Username = ?";
    
    db.get(sql, [Username], async (err, trainer) => {
        if (err) {
            console.error("Error en POST /api/login:", err.message);
            return res.status(500).json({ error: "Error al consultar la base de datos." });
        }

        if (!trainer) {
            return res.status(401).json({ error: "Credenciales inválidas." }); 
        }

        try {
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
        } catch (compareError) {
            console.error("Error en la comparación de hash:", compareError);
            res.status(500).json({ error: "Error interno del servidor." });
        }
    });
});

router.get("/trainers", (req, res) => {
    
    // Seleccionamos explícitamente para NUNCA incluir los hashes
    const sql = "SELECT TrainerID, FirstName, LastName, Username FROM Trainer";
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Error en GET /api/trainers:", err.message);
            return res.status(500).json({ error: "Error al consultar la base de datos." });
        }
        res.json(rows); // Devuelve la lista de entrenadores
    });
});

router.get("/trainers/:id", (req, res) => {
    const sql = "SELECT TrainerID, FirstName, LastName, Username FROM Trainer WHERE TrainerID = ?";
    const params = [req.params.id];

    db.get(sql, params, (err, row) => {
        if (err) {
            console.error("Error en GET /api/trainers/:id:", err.message);
            return res.status(500).json({ error: "Error al consultar la base de datos." });
        }
        if (!row) {
            return res.status(404).json({ error: "Entrenador no encontrado." });
        }
        res.json(row);
    });
});

router.put("/trainers/:id", (req, res) => {
    const { FirstName, LastName } = req.body;
    const { id } = req.params;

    if (!FirstName || !LastName) {
        return res.status(400).json({ error: "FirstName y LastName son requeridos." });
    }

    const sql = 'UPDATE Trainer SET FirstName = ?, LastName = ? WHERE TrainerID = ?';
    const params = [FirstName, LastName, id];

    db.run(sql, params, function(err) {
        if (err) {
            console.error("Error en PUT /api/trainers/:id:", err.message);
            return res.status(500).json({ error: "Error al actualizar la base de datos." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Entrenador no encontrado." });
        }
        res.json({ message: "Perfil actualizado exitosamente." });
    });
});

router.delete("/trainers/:id", (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM Trainer WHERE TrainerID = ?';

    db.run(sql, id, function(err) {
        if (err) {
            console.error("Error en DELETE /api/trainers/:id:", err.message);
            return res.status(500).json({ error: "Error al eliminar de la base de datos." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Entrenador no encontrado." });
        }
        res.json({ message: "Entrenador eliminado exitosamente." });
    });
});

export default router;