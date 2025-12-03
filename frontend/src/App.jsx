// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import Register from './pages/Register'; 
import Login from './pages/login';
import Game from './pages/Game'; 
import Gallery from './pages/Gallery';
import './App.css'; 


const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/game" replace />;
  }
  return children;
};

function App() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token'); 

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('username');
    window.location.href = '/login'; 
  };

  return (
    <div className="App">
      <section className="dark-bar"></section>
      <header>
        {/* MENÚ DE NAVEGACIÓN: Solo se ve si estás logueado */}
        {isLoggedIn && (
            <>
              <h1>Poké-Captura</h1>
              <nav style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center', marginTop: '10px' }}>
                  {/* Usamos Link para navegar sin recargar la página */}
                  <Link to="/game" className="nav-link">🎮 Jugar</Link>
                  <Link to="/gallery" className="nav-link">📸 Mi PC</Link>
                  
                  <button onClick={handleLogout} style={{ backgroundColor: '#ff4444', color: 'white' }}>
                      Cerrar Sesión
                  </button>
              </nav>
            </>
        )}
      </header>
      
      <main>
        <Routes>
          {/* CASO 1: Ruta Raíz 
             Si entras a '/', el PublicRoute decidirá:
             - Si estás logueado -> Te manda a /game
             - Si NO estás logueado -> Te manda a /login (porque el hijo es Login)
          */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* CASO 2: Rutas Públicas (Login/Register)
             Las envolvemos en PublicRoute para que los logueados no entren aquí
          */}
          <Route path="/login" element={
              <PublicRoute>
                  <Login />
              </PublicRoute>
          } />
          
          <Route path="/register" element={
              <PublicRoute>
                  <Register />
              </PublicRoute>
          } />
          
          {/* CASO 3: Rutas Privadas (Game/Gallery)
             Las envolvemos en ProtectedRoute para que los NO logueados no entren
          */}
          <Route path="/game" element={
              <ProtectedRoute>
                  <Game />
              </ProtectedRoute>
          } />
          
          <Route path="/gallery" element={
              <ProtectedRoute>
                  <Gallery />
              </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;