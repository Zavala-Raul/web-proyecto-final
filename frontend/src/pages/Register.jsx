import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const API_URL = 'http://localhost:4000/api';

function Register()
{
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError(null);
        setSuccess(null);

        if (!firstName || !lastName || !username || !password)
        {
            setError("Todos los campos son obligatorios.")
            return;
        }

        const newTrainer = {
            FirstName: firstName, 
            LastName: lastName,
            Username: username,
            Password: password
        };

        try{
            const response = await axios.post(`${API_URL}/register`, newTrainer);

            setSuccess(`¡Bienvenido, ${response.data.FirstName}! Tu cuenta ha sido creada. Serás redirigido al login.`);

            setFirstName('');
            setLastName('');
            setUsername('');
            setPassword('');

            setTimeout(() => {
                navigate('/login');
            },3000);

        } catch (err) {
            if (err.response && err.response.data.error) {
                setError(err.response.data.error)
            } else {
                setError("Error al conectar con el servidor. Intenta más tarde.");
            }
            console.error("Error en el registro:", err);
        }
    };

    return (
        <div className="register-container">
            <h2>Crear Cuenta de Entrenador</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Nombre:</label>
                    <input 
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Apellido:</label>
                    <input 
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label>Usuario (Username):</label>
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
                
                <button type="submit">Registrarme</button>
            </form>

            {/* Mensajes de éxito o error */}
            {success && <p className="success-message">{success}</p>}
            {error && <p className="error-message">{error}</p>}
        </div>
    );
}

export default Register;