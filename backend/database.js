// backend/database.js
import sqlite3 from 'sqlite3';

const DBSOURCE = "pokemon_project.db"; 

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error("Error al abrir la base de datos:", err.message);
        throw err;
    }
    
    console.log('Conectado a la base de datos SQLite.');

    db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
        if (pragmaErr) {
            console.error("Error al habilitar foreign keys:", pragmaErr.message);
        } else {
            console.log("Claves foráneas habilitadas.");
            
            db.serialize(() => {
                
                // --- Tabla 1: Trainer (MODIFICADA) ---
                db.run(`CREATE TABLE IF NOT EXISTS Trainer (
                    TrainerID INTEGER PRIMARY KEY AUTOINCREMENT,
                    FirstName TEXT NOT NULL,
                    LastName TEXT NOT NULL,
                    Username TEXT NOT NULL UNIQUE, 
                    PasswordHash TEXT NOT NULL 
                )`, (err) => {
                    if (err) console.error("Error creando tabla Trainer:", err.message);
                });

                db.run(`CREATE TABLE IF NOT EXISTS PokemonSpecies (
                    SpeciesID INTEGER PRIMARY KEY,
                    SpeciesName TEXT NOT NULL UNIQUE,
                    Type1 TEXT,
                    Type2 TEXT,
                    BaseHeight REAL,
                    BaseWeight REAL,
                    SpriteURL TEXT,
                    BaseHP INTEGER,
                    BaseAttack INTEGER,
                    BaseDefense INTEGER,
                    BaseSpAttack INTEGER,
                    BaseSpDefense INTEGER,
                    BaseSpeed INTEGER,
                    Habitat TEXT,
                    FlavorText TEXT
                )`, (err) => {
                    if (err) console.error("Error creando tabla PokemonSpecies:", err.message);
                });

                db.run(`CREATE TABLE IF NOT EXISTS CapturedPokemon (
                    CapturedPokemonID INTEGER PRIMARY KEY AUTOINCREMENT,
                    TrainerID INTEGER NOT NULL,
                    SpeciesID INTEGER NOT NULL,
                    Nickname TEXT,
                    Level INTEGER DEFAULT 1,
                    CurrentHP INTEGER,
                    Gender TEXT,
                    Height REAL,
                    Weight REAL,
                    Nature TEXT,
                    DateCaptured TEXT DEFAULT (datetime('now', 'localtime')),
                    Ability TEXT,
                    
                    FOREIGN KEY (TrainerID) 
                       REFERENCES Trainer(TrainerID) 
                       ON DELETE CASCADE, 
                       
                    FOREIGN KEY (SpeciesID) 
                       REFERENCES PokemonSpecies(SpeciesID) 
                       ON DELETE RESTRICT
                )`, (err) => {
                    if (err) console.error("Error creando tabla CapturedPokemon:", err.message);
                });
            });
        }
    });
});

export default db;