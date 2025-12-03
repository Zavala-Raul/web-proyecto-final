import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'
import './login.css';
import loginIcon from '../assets/login-icon.png';

const API_URL = "http://localhost:4000/api";

function Login() 
{
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const handleLogin = async(e) => {
        e.preventDefault();
        setError(null);

        try
        {
            const response = await axios.post(`${API_URL}/login`,{
                    Username: username,
                    Password: password
                });
            
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('username', response.data.username);

            alert("¡Login exitoso!");

            
            navigate('/game');
        } catch (err) {
            if (err.response && err.response.data.error)
            {
                setError(err.response.data.error);
            }
            else 
            {
                setError("Error al iniciar sesión.");
            }
        }
    };
    return (<div className="login-container">
                <div className="login-header">
                    <img className="login-icon" src={loginIcon} alt="Pokeball"></img>
                    <h2>Iniciar Sesión</h2>
                </div>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <input 
                            type="text" 
                            placeholder="Nombre de usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <input 
                            type="password" 
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit">Entrar</button>
                </form>
                {error && <p className="error-message">{error}</p>}
                
                {/* Botón para ir a registrarse si no tienes cuenta */}
                <div className="signup-container">
                    <span>¿No tienes cuenta?</span>
                    <button type="button" onClick={() => navigate('/register')}>
                        Regístrate aquí
                    </button>
                </div>
            </div>)
}
export default Login;