import React, { useState } from 'react';
import axios from 'axios';
import './register.css';
import { useNavigate } from 'react-router-dom'
import loginIcon from '../assets/login-icon.png';

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
            <div className='register-header'>
                <img className="register-icon" src={loginIcon} alt="Pokeball"></img>
                <h2>CREAR CUENTA DE ENTRENADOR</h2>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <input 
                        type="text"
                        placeholder='Nombre'
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <input 
                        type="text"
                        placeholder='Apellido'
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </div>
                <div className="form-group">
                        <input 
                            type="text"
                            placeholder='Nombre del usuario'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                </div>
                <div className="form-group">
                    <input 
                        type="password"
                        placeholder='Contraseña'
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