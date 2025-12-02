// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Register from './pages/Register'; 
import Login from './pages/login';
import './App.css'; 

// --- COMPONENTES TEMPORALES (Placeholders) ---
// Estos evitan que la app falle mientras creamos los archivos reales
const GamePlaceholder = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h2>🎮 Pantalla del Juego</h2>
    <p>¡Si ves esto, el Login funcionó y te redirigió bien!</p>
    <p>(Aquí pondremos el código real del juego después)</p>
  </div>
);

const GaleriaPlaceholder = () => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h2>📸 Galería de Capturas</h2>
    <p>(Aquí pondremos la lista de Pokémon después)</p>
  </div>
);

function App() {
  const navigate = useNavigate();

  // Función simple para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('token'); // Borra el token
    localStorage.removeItem('username');
    navigate('/login'); // Te regresa al login
  };

  // Verificamos si hay un usuario logueado para mostrar el botón de salir
  const isLoggedIn = !!localStorage.getItem('token'); 

  return (
    <div className="App">
      <header>
        <h1>Poké-Captura</h1>
        {/* Solo mostramos el botón si hay token (truco visual simple) */}
        {isLoggedIn && (
            <button onClick={handleLogout} style={{ float: 'right' }}>
                Cerrar Sesión
            </button>
        )}
      </header>
      
      <main>
        <Routes>
          {/* Redirige la raíz '/' al Login por defecto */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* Rutas de Auth */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          
          {/* Rutas Protegidas (Usando los placeholders) */}
          <Route path="/game" element={<GamePlaceholder />} />
          <Route path="/galeria" element={<GaleriaPlaceholder />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;