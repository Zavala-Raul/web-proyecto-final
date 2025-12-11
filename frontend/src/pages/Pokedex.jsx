import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Pokedex.css'; 

const API_URL = "http://localhost:4000/api";

const TypeBadge = ({ type }) => {
    if (!type) return null;
    const lowerType = type.toLowerCase();
    return <span className={`type-badge type-${lowerType}`}>{type}</span>;
};

function Pokedex() {
    const [species, setSpecies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSpecie, setSelectedSpecie] = useState(null);

    useEffect(() => {
        fetchPokedex();
    }, []);

    const fetchPokedex = async () => {
        const token = localStorage.getItem('token');
        try {
            const response = await axios.get(`${API_URL}/pokedex`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSpecies(response.data);
        } catch (error) {
            console.error("Error cargando pokedex:", error);
        }
        setLoading(false);
    };

    const filteredSpecies = species.filter(s => 
        s.SpeciesName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.SpeciesID.toString().includes(searchTerm)
    );

    const StatBar = ({ label, value, color }) => {
        const percentage = Math.min((value / 255) * 100, 100);
        return (
            <div className="stat-row">
                <span className="stat-label">{label}</span>
                <div className="stat-track">
                    <div 
                        className="stat-fill" 
                        style={{ width: `${percentage}%`, backgroundColor: color }}
                    ></div>
                </div>
                <span className="stat-value">{value}</span>
            </div>
        );
    };

    if (loading) return <div className="loading">Cargando base de datos biológica...</div>;

    return (
        <div className="pokedex-container">
            {/* Header igual... */}

            <div className="pokedex-grid">
                {filteredSpecies.map(specie => {
                    const discoverer = specie.DescubiertoPor;
                    const isDiscovered = !!discoverer; 

                    return (
                        <div 
                            key={specie.SpeciesID} 
                            className={`pokedex-card ${!isDiscovered ? 'locked' : ''}`}
                            onClick={() => isDiscovered && setSelectedSpecie(specie)}
                        >
                            <span className="dex-num">#{specie.SpeciesID.toString().padStart(3, '0')}</span>
                            
                            <img 
                                src={specie.SpriteURL} 
                                alt={specie.SpeciesName} 
                                className={!isDiscovered ? 'pokemon-mystery' : ''}
                            />

                            {isDiscovered ? (
                                <>
                                    <h3>{specie.SpeciesName}</h3>
                                    <div className="discoverer-badge">
                                        👑 {discoverer}
                                    </div>
                                </>
                            ) : (
                                <h3 className="dex-unknown-text">???</h3>
                            )}

                            <div className="types-mini">
                                {isDiscovered ? (
                                    <>
                                        <TypeBadge type={specie.Type1} />
                                        <TypeBadge type={specie.Type2} />
                                    </>
                                ) : (
                                    <span className="unknown-label">Sin descubrir</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* MODAL DE DETALLE (ENCICLOPEDIA COMPLETA) */}
            {selectedSpecie && (
                <div className="pokedex-modal-overlay" onClick={() => setSelectedSpecie(null)}>
                    <div className="pokedex-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-btn" onClick={() => setSelectedSpecie(null)}>×</button>
                        
                        <div className="dex-detail-header">
                            <div>
                                <h2>{selectedSpecie.SpeciesName}</h2>
                                <span className="dex-category">{selectedSpecie.Habitat} Pokémon</span>
                            </div>
                            <span className="dex-big-num">#{selectedSpecie.SpeciesID}</span>
                        </div>

                        <div className="dex-detail-body">
                            <div className="dex-visuals">
                                <img src={selectedSpecie.SpriteURL} alt={selectedSpecie.SpeciesName} />
                                <div className="dex-types-large">
                                    <TypeBadge type={selectedSpecie.Type1} />
                                    <TypeBadge type={selectedSpecie.Type2} />
                                </div>
                                <p className="dex-flavor">
                                    "{selectedSpecie.FlavorText || 'Datos no registrados.'}"
                                </p>
                            </div>

                            <div className="dex-data">
                                <div className="physical-data">
                                    <p><strong>Altura:</strong> {selectedSpecie.BaseHeight} m</p>
                                    <p><strong>Peso:</strong> {selectedSpecie.BaseWeight} kg</p>
                                </div>

                                <h3>Estadísticas Base</h3>
                                <div className="stats-container">
                                    <StatBar label="HP" value={selectedSpecie.BaseHP} color="#ff5959" />
                                    <StatBar label="Ataque" value={selectedSpecie.BaseAttack} color="#f5ac78" />
                                    <StatBar label="Defensa" value={selectedSpecie.BaseDefense} color="#fae078" />
                                    <StatBar label="Sp. Atk" value={selectedSpecie.BaseSpAttack} color="#9db7f5" />
                                    <StatBar label="Sp. Def" value={selectedSpecie.BaseSpDefense} color="#a7db8d" />
                                    <StatBar label="Velocid." value={selectedSpecie.BaseSpeed} color="#fa92b2" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Pokedex;