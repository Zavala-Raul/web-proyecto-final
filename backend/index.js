import express from 'express';
import cors from 'cors';

import trainerRoutes from './routes/trainers.routes.js';
import pokemonRoutes from './routes/pokemon.routes.js';

const app = express();
const PORT = process.env.PORT || 4000;


app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
    res.json({ message: "API Modularizada de Poké-Captura funcionando 🚀" });
});

app.use('/api', trainerRoutes);
app.use('/api', pokemonRoutes);

app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});