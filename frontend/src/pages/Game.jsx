// frontend/src/Game.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Game.css'; 

const BACKEND_URL = "http://localhost:4000/api";

function Game() {
    const [pokemon, setPokemon] = useState(null); // Datos del Pokémon actual
    const [guess, setGuess] = useState("");       // Input del usuario
    const [message, setMessage] = useState("");   // feedback
    const [isCorrect, setIsCorrect] = useState(false); // adivinó
    const [loading, setLoading] = useState(true);

    const fetchRandomPokemon = async () => {
        setLoading(true);
        setIsCorrect(false);
        setMessage("");
        setGuess("");

        const randomId = Math.floor(Math.random() * 1000) + 1;

        try {
            const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${randomId}`);
            setPokemon(response.data);
        } catch (error) {
            console.error("Error fetching pokemon:", error);
            setMessage("Error cargando Pokémon. Revisa tu internet.");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRandomPokemon();
    }, []);

    const saveCapture = async (pokemonData) => {
        const token = localStorage.getItem('token');
        if (!token) {
            setMessage("Error: No estás logueado. No se guardó.");
            return;
        }

        try {
            await axios.post(`${BACKEND_URL}/capturar`, {
                speciesId: pokemonData.id,
                nickname: pokemon.name
            }, {
                headers: {
                    'Authorization': `Bearer ${token}` 
                }
            });
            console.log("¡Captura guardada en BD!");
        } catch (error) {
            console.error("Error guardando captura:", error);
        }
    };

    const handleGuess = (e) => {
        e.preventDefault();
        if (!pokemon) return;

        const userGuess = guess.toLowerCase().trim();
        const pokemonName = pokemon.name.toLowerCase();

        if (userGuess === pokemonName) {
            setIsCorrect(true);
            setMessage(`¡Correcto! ¡Es ${pokemon.name.toUpperCase()}!`);
            
            saveCapture(pokemon);

            setTimeout(() => {
                fetchRandomPokemon();
            }, 2500);

        } else {
            setMessage("¡Incorrecto! Intenta de nuevo.");
            setTimeout(() => setMessage(""), 1500);
        }
    };

    if (loading) return <div className="game-container"><h2>Buscando Pokémon salvaje...</h2></div>;
    if (!pokemon) return null;

    return (
        <div className="game-container">
            <h2>¿Quién es este Pokémon?</h2>

            <div className="pokemon-image-container">
                <img 
                    src={pokemon.sprites.front_default} 
                    alt="Pokemon" 
                    className={`pokemon-img ${!isCorrect ? 'silhouette' : ''}`}
                />
            </div>

            {/* Pista: Guiones bajos por cada letra */}
            <div className="hint-text">
                {isCorrect 
                    ? pokemon.name.toUpperCase() 
                    : pokemon.name.split('').map(() => '_ ').join('') 
                }
            </div>

            {/* Formulario (solo visible si no ha ganado aún) */}
            {!isCorrect && (
                <form onSubmit={handleGuess}>
                    <input 
                        type="text" 
                        placeholder="Escribe el nombre..." 
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        autoFocus
                    />
                    <button type="submit">Adivinar</button>
                    <button type="button" onClick={fetchRandomPokemon} style={{marginLeft: '10px', backgroundColor: '#666'}}>
                        Saltar
                    </button>
                </form>
            )}

            {/* Mensajes de feedback */}
            {message && (
                <p className={`feedback-msg ${isCorrect ? 'success' : 'error'}`}>
                    {message}
                </p>
            )}
        </div>
    );
}

export default Game;