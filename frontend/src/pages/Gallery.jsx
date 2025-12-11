// frontend/src/pages/Gallery.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Gallery.css'; 

const API_URL = "http://localhost:4000/api";

const TypeBadge = ({ type }) => {
    if (!type) return null; 
    const lowerType = type.toLowerCase();
    return (
        <span className={`type-badge type-${lowerType}`}>
            {type}
        </span>
    );
};

const handleNukeData = async () => {
    const confirm1 = window.confirm("⚠️ ¿ESTÁS SEGURO? ⚠️\n\nEsto borrará TODOS los Pokémon capturados y toda la información de especies de la base de datos.");
    if (!confirm1) return;

    const confirm2 = window.confirm("¿De verdad? Esta acción no se puede deshacer.");
    if (!confirm2) return;

    try {
        const token = localStorage.getItem('token');
        await axios.delete('http://localhost:4000/api/admin/nuke-pokemon', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        alert("💥 Base de datos limpia. Todo ha vuelto a 0.");
        
        window.location.reload(); 
    } catch (error) {
        console.error(error);
        alert("Error al intentar borrar los datos.");
    }
};


function Gallery() {
    const [pokemons, setPokemons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'detail'
    const [selectedPokemon, setSelectedPokemon] = useState(null); 

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
            setError("Error al cargar tus Pokémon.");
        }
        setLoading(false);
    };

    const openDetailView = (poke) => {
        setSelectedPokemon(poke);
        setViewMode('detail');
    };

    const closeDetailView = () => {
        setSelectedPokemon(null);
        setViewMode('grid'); 
    };

    const handleRelease = async (id) => {
        if (!window.confirm("¿Seguro que quieres liberar a este Pokémon? :(")) return;
        const token = localStorage.getItem('token');
        try {
            await axios.delete(`${API_URL}/pokemon/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPokemons(pokemons.filter(poke => poke.CapturedPokemonID !== id));
            if (viewMode === 'detail' && selectedPokemon?.CapturedPokemonID === id) {
                closeDetailView();
            }
        } catch (err) { alert("Error al liberar"); }
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

    if (loading) return <div className="loading">Cargando PC...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (selectedPokemon) {
    console.log("Datos del Pokémon seleccionado:", selectedPokemon);
}

    if (viewMode === 'detail' && selectedPokemon) {
        return (
            <div className="detail-view-container">
                <button className="btn-back" onClick={closeDetailView}>← Volver a la Caja</button>
                
                <div className="detail-card">
                    <div className="detail-header">
                        {/* Verificamos si estamos editando ESTE pokemon específico */}
                        {editingId === selectedPokemon.CapturedPokemonID ? (
                            <div className="edit-mode-detail">
                                <input 
                                    type="text" 
                                    value={editNickname}
                                    onChange={(e) => setEditNickname(e.target.value)}
                                    className="detail-edit-input" 
                                />
                                <button onClick={() => saveNickname(selectedPokemon.CapturedPokemonID)}>Guardar</button>
                                <button onClick={cancelEditing}>Cancelar</button>
                            </div>
                        ) : (
                            <>
                                <h1>{selectedPokemon.Nickname || selectedPokemon.SpeciesName}</h1>
                                <span className="detail-id">ID: #{selectedPokemon.CapturedPokemonID}</span>
                            </>
                        )}
                    </div>
                    
                    <div className="detail-body">
                        <div className="detail-image">
                            <img src={selectedPokemon.SpriteURL} alt={selectedPokemon.SpeciesName} />
                        </div>
                        <div className="detail-stats">
                            <p><strong>Especie:</strong> {selectedPokemon.SpeciesName}</p>
                            <p className="detail-type-container">
                                <strong>Tipo:</strong>
                                <span>
                                    <TypeBadge type={selectedPokemon.Type1} />
                                    <TypeBadge type={selectedPokemon.Type2} />
                                </span>
                            </p>
                            <p><strong>Nivel:</strong> {selectedPokemon.Level}</p>
                            <p><strong>Naturaleza:</strong> {selectedPokemon.Nature}</p>
                            <p><strong>Género:</strong> {selectedPokemon.Gender}</p>
                            <p>
                                <strong>Fecha:</strong> {selectedPokemon.fecha_simple}
                            </p>
                        </div>
                    </div>

                    <div className="detail-actions">
                        <button 
                            className="btn-edit" 
                            onClick={() => startEditing(selectedPokemon)}
                        >
                            ✏️
                        </button>
                        <button 
                            className="btn-release" 
                            onClick={() => handleRelease(selectedPokemon.CapturedPokemonID)}
                        >
                            ❌
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="galeria-container">
            <div className="gallery-header">
                <h2>Mis Pokémon ({pokemons.length})</h2>
                {/* BOTONES PARA CAMBIAR VISTA */}
                <div className="view-controls">
                    <button 
                        className={viewMode === 'grid' ? 'active' : ''} 
                        onClick={() => setViewMode('grid')}>
                        Grid ▦
                    </button>
                    <button 
                        className={viewMode === 'list' ? 'active' : ''} 
                        onClick={() => setViewMode('list')}>
                        Lista ☰
                    </button>
                </div>
            </div>
            
            {pokemons.length === 0 ? (
                <p>Caja vacía.</p>
            ) : (
                <>
                    {viewMode === 'grid' && (
                        <div className="pokemon-grid">
                            {pokemons.map(poke => (
                                <div key={poke.CapturedPokemonID} className="pokemon-card" onClick={() => openDetailView(poke)}>
                                    <img src={poke.SpriteURL} alt={poke.SpeciesName} />
                                    
                                    <div className="card-info">
                                        {/* --- LÓGICA DE EDICIÓN --- */}
                                        {editingId === poke.CapturedPokemonID ? (
                                            <div onClick={(e) => e.stopPropagation()} style={{width: '100%'}}>
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
                                            </div>
                                        ) : (
                                            <>
                                                <h3>{poke.Nickname || poke.SpeciesName}</h3>
                                                <div className="card-types">
                                                    <TypeBadge type={poke.Type1} />
                                                    <TypeBadge type={poke.Type2} />
                                                </div>
                                                
                                                {/* Botones de acción */}
                                                <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                                                    <button 
                                                        className="btn-edit" 
                                                        onClick={() => startEditing(poke)}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button 
                                                        className="btn-release" 
                                                        onClick={() => handleRelease(poke.CapturedPokemonID)}
                                                    >
                                                        ❌
                                                    </button>
                                                </div>
                                                <p className="card-subtext">Click para detalles</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 3. VISTA LISTA (Tabla) */}
                    {viewMode === 'list' && (
                        <table className="pokemon-list-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nombre</th>
                                    <th>Especie</th>
                                    <th>Nivel</th>
                                    <th>Tipo</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pokemons.map(poke => {
                                    // Determinamos si ESTA fila específica es la que se está editando
                                    const isEditing = editingId === poke.CapturedPokemonID;

                                    return (
                                        <tr key={poke.CapturedPokemonID} onClick={() => openDetailView(poke)}>
                                            <td>#{poke.CapturedPokemonID}</td>
                                            <td>
                                                {isEditing ? (
                                                    <input 
                                                        type="text" 
                                                        value={editNickname}
                                                        onChange={(e) => setEditNickname(e.target.value)}
                                                        onClick={(e) => e.stopPropagation()} 
                                                        className="table-edit-input"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    poke.Nickname || '-'
                                                )}
                                            </td>

                                            <td>{poke.SpeciesName}</td>
                                            <td>{poke.Level}</td>
                                            
                                            <td>
                                                <TypeBadge type={poke.Type1} />
                                                <TypeBadge type={poke.Type2} />
                                            </td>

                                            {/* --- COLUMNA ACCIONES (CAMBIANTE) --- */}
                                            <td className="btn-list" onClick={(e) => e.stopPropagation()}>
                                                {isEditing ? (
                                                    <>
                                                        {/* Botones de Guardar/Cancelar para la tabla */}
                                                        <button 
                                                            className="btn-save-small" 
                                                            onClick={() => saveNickname(poke.CapturedPokemonID)}
                                                            title="Guardar"
                                                        >
                                                            ✅
                                                        </button>
                                                        <button 
                                                            className="btn-cancel-small" 
                                                            onClick={cancelEditing}
                                                            title="Cancelar"
                                                        >
                                                            🚫
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button className="btn-edit-small" onClick={() => startEditing(poke)}>✏️</button>
                                                        <button className="btn-release-small" onClick={() => handleRelease(poke.CapturedPokemonID)}>❌</button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </>
            )}
            {/* <button 
                onClick={handleNukeData} 
                style={{
                    backgroundColor: '#2d3436', 
                    color: '#d63031', // Rojo sangre
                    border: '2px solid #d63031', 
                    padding: '10px 20px', 
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: '20px'
                }}
            >
                ☢️ PURGAR DATOS (DEV)
            </button> */}
            
        </div>
    );
}

export default Gallery;

