// frontend/src/pages/Game.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Game.css'; 

const BACKEND_URL = "http://localhost:4000/api";

function Game() {
    const [pokemon, setPokemon] = useState(null);
    const [guess, setGuess] = useState("");
    const [message, setMessage] = useState("");
    const [isCorrect, setIsCorrect] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hintLevel, setHintLevel] = useState(0); 
    const [flavorText, setFlavorText] = useState(""); 

    const fetchRandomPokemon = async () => {
        setLoading(true);
        setIsCorrect(false);
        setMessage("");
        setGuess("");
        setHintLevel(0); 
        setFlavorText("");

        try {
            // 1. LLAMADA ÚNICA A TU BACKEND
            // Tu backend ya se encarga de ir a PokeAPI, traducir a Español y guardar en DB.
            const response = await axios.get(`${BACKEND_URL}/random`);
            const data = response.data;
            
            // 2. USO DIRECTO DE DATOS
            // data.types viene como ["Fuego", "Volador"] (gracias a tu routes.js)
            setPokemon({
                id: data.id,
                name: data.name,
                sprites: { front_default: data.sprite }, 
                types: data.types || [] 
            });

            setFlavorText(data.flavorText || "Descripción no disponible.");

        } catch (error) {
            console.error("Error fetching pokemon:", error);
            setMessage("Error cargando Pokémon. Revisa que el servidor esté corriendo.");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRandomPokemon();
    }, []);

    const saveCapture = async (pokemonData) => {
        const token = localStorage.getItem('token');
        if (!token) return; 

        try {
            await axios.post(`${BACKEND_URL}/capturar`, {
                speciesId: pokemonData.id,
                nickname: pokemonData.name 
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
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
            setHintLevel(2); 

            setTimeout(() => {
                fetchRandomPokemon();
            }, 3500); 

        } else {
            setMessage("¡Incorrecto! Intenta de nuevo.");
            setTimeout(() => setMessage(""), 1500);
        }
    };

    const handleHint = () => {
        if (hintLevel < 2) {
            setHintLevel(prev => prev + 1);
        }
    };

    
    
    const rawType1 = pokemon?.types?.[0]; 
    const rawType2 = pokemon?.types?.[1]; 

    const typeName1 = rawType1 ? rawType1.toLowerCase() : null; 
    const typeName2 = rawType2 ? rawType2.toLowerCase() : null; 

    const cardVars = {};
    if (typeName1) {
        cardVars['--color-1'] = `var(--type-${typeName1})`;
        cardVars['--color-2'] = typeName2 
            ? `var(--type-${typeName2})` 
            : `var(--type-${typeName1})`;
    }

    if (loading) return <div className="game-container"><h2>Buscando Pokémon salvaje...</h2></div>;
    if (!pokemon) return null;

    const showSilhouette = !isCorrect && hintLevel < 2;

    return (
        <div>
            <h2 style={{ textAlign: 'center', margin: '30px 0', color: '#333' }}>
                ¿Quién es este Pokémon?
            </h2>

            <div className="generation-card">
                
                <div className="game-card" style={cardVars}>
                    
                    <div className="pokemon-image-container">
                        <img 
                            src={pokemon.sprites.front_default} 
                            alt="Pokemon" 
                            className={`pokemon-img ${showSilhouette ? 'silhouette' : ''}`}
                        />
                    </div>

                    <div className="hints-area">
                        {hintLevel >= 1 && (
                            <p className="flavor-text-hint">
                                💡 <em>"{flavorText}"</em>
                            </p>
                        )}
                        {hintLevel >= 2 && !isCorrect && (
                            <p className="visual-hint-msg">¡Imagen revelada!</p>
                        )}
                    </div>

                    <div className="controls-box" style={{
                            marginTop: '25px',
                            border: '3px solid rgba(0, 0, 0, 0.2)',
                            borderRadius: '12px',
                            padding: '20px',
                            backgroundColor: 'rgba(255, 255, 255, 0.4)',
                            width: '100%',
                            boxSizing: 'border-box'
                    }}>
                        <div className="hint-text" style={{ marginBottom: '20px' }}>
                            {isCorrect 
                                ? pokemon.name.toUpperCase() 
                                : pokemon.name.split('').map(() => '_ ').join('') 
                            }
                        </div>

                        {!isCorrect && (
                            <form onSubmit={handleGuess}>
                                <input 
                                    type="text" 
                                    placeholder="Escribe el nombre..." 
                                    value={guess}
                                    onChange={(e) => setGuess(e.target.value)}
                                    autoFocus
                                    className="game-input"
                                />
                                
                                <div className="button-group">
                                    <button type="submit" className="btn-guess">Adivinar</button>
                                    
                                    {hintLevel < 2 && (
                                        <button type="button" onClick={handleHint} className="btn-hint">
                                            🔍 Pista ({2 - hintLevel})
                                        </button>
                                    )}
                                    
                                    <button type="button" onClick={fetchRandomPokemon} className="btn-skip">
                                        Saltar
                                    </button>
                                </div>
                            </form>
                        )}

                        {message && (
                            <p className={`feedback-msg ${isCorrect ? 'success' : 'error'}`} style={{ marginTop: '15px' }}>
                                {message}
                            </p>
                        )}
                    </div> 
                </div> 
            </div> 
        </div>
    );
}

export default Game;