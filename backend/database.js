// backend/database.js
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config(); 

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false 
    }
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error adquiriendo cliente de BD', err.stack);
    }
    console.log('🐘 Conectado exitosamente a PostgreSQL en Aiven');
    release();
});

export default pool;