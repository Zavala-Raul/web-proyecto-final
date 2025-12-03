import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'

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
                <h2>Iniciar Sesión</h2>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Usuario:</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Contraseña:</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit">Entrar</button>
                </form>
                {error && <p className="error-message">{error}</p>}
                
                {/* Botón para ir a registrarse si no tienes cuenta */}
                <p>¿No tienes cuenta? <button onClick={() => navigate('/register')}>Regístrate aquí</button></p>
            </div>)
}
export default Login;