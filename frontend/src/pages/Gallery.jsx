import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Gallery.css'; 

const API_URL = "http://localhost:4000/api";

function Gallery() {
    const [pokemons, setPokemons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [editingId, setEditingId] = useState(null); 
    const [editNickname, setEditNickname] = useState(""); 

    useEffect(() => {
        fetchMyPokemon();
    }, []);

    const fetchMyPokemon = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError("No has iniciado sesión.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(`${API_URL}/mis-pokemon`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPokemons(response.data);
        } catch (err) {
            console.error(err);
            setError("Error al cargar tus Pokémon.");
        }
        setLoading(false);
    };

    const handleRelease = async (id) => {
        
        if (!window.confirm("¿Seguro que quieres liberar a este Pokémon? :(")) return;

        const token = localStorage.getItem('token');
        try {
            await axios.delete(`${API_URL}/pokemon/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setPokemons(pokemons.filter(poke => poke.CapturedPokemonID !== id));
            
        } catch (err) {
            alert("Error al liberar Pokémon");
        }
    };

    const startEditing = (poke) => {
        setEditingId(poke.CapturedPokemonID);
        setEditNickname(poke.Nickname || ""); 
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditNickname("");
    };

    const saveNickname = async (id) => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(`${API_URL}/pokemon/${id}`, 
                { nickname: editNickname },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const updatedList = pokemons.map(poke => {
                if (poke.CapturedPokemonID === id) {
                    return { ...poke, Nickname: editNickname }; 
                }
                return poke;
            });
            
            setPokemons(updatedList);
            setEditingId(null); 
        } catch (err) {
            alert("Error al actualizar apodo");
        }
    };

    if (loading) return <div>Cargando PC de Bill...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="galeria-container">
            <h2>Mis Pokémon Capturados ({pokemons.length})</h2>
            
            {pokemons.length === 0 ? (
                <p>Aún no has capturado nada. ¡Ve a jugar!</p>
            ) : (
                <div className="pokemon-grid">
                    {pokemons.map(poke => (
                        <div key={poke.CapturedPokemonID} className="pokemon-card">
                            <img src={poke.SpriteURL} alt={poke.SpeciesName} />
                            
                            <div className="card-info">
                                {/* LÓGICA DE EDICIÓN VISUAL */}
                                {editingId === poke.CapturedPokemonID ? (
                                    // MODO EDICIÓN: Muestra Input
                                    <>
                                        <input 
                                            className="edit-input"
                                            type="text" 
                                            value={editNickname}
                                            onChange={(e) => setEditNickname(e.target.value)}
                                            placeholder="Nuevo apodo..."
                                            autoFocus
                                        />
                                        <div className="card-actions">
                                            <button onClick={() => saveNickname(poke.CapturedPokemonID)} style={{background:'green', color:'white'}}>Guardar</button>
                                            <button onClick={cancelEditing} style={{background:'gray', color:'white'}}>Cancelar</button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h3>{poke.Nickname || poke.SpeciesName}</h3>
                                        {poke.Nickname && <span className="species-name">({poke.SpeciesName})</span>}
                                        <p>Nvl: {poke.Level} | {poke.Type1}</p>
                                        
                                        <div className="card-actions">
                                            <button 
                                                className="btn-edit" 
                                                onClick={() => startEditing(poke)}
                                            >
                                                ✏️ Apodo
                                            </button>
                                            <button 
                                                className="btn-release" 
                                                onClick={() => handleRelease(poke.CapturedPokemonID)}
                                            >
                                                ❌ Liberar
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Gallery;