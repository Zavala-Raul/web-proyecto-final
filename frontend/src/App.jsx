// frontend/src/App.jsx
import React from 'react';
import { Routes, Route, Navigate, useNavigate, Link, useLocation } from 'react-router-dom';
import { FaQuestionCircle, FaLaptop, FaSignOutAlt, FaBookOpen } from 'react-icons/fa'; 

import Register from './pages/Register'; 
import Login from './pages/login';
import Game from './pages/Game'; 
import Gallery from './pages/Gallery';
import Pokedex from './pages/Pokedex'; 
import './App.css'; 

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token) return <Navigate to="/game" replace />;
  return children;
};

function App() {
  const navigate = useNavigate();
  const location = useLocation(); 
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
        {isLoggedIn && (
            <>
              <h1>Poké-Captura</h1>
              
              <nav className="main-nav">
                  <Link 
                    to="/game" 
                    className={`nav-btn ${location.pathname === '/game' ? 'active' : ''}`}
                  >
                    <FaQuestionCircle size={20} /> 
                    <span>Adivinar</span>
                  </Link>

                  <Link 
                    to="/gallery" 
                    className={`nav-btn ${location.pathname === '/gallery' ? 'active' : ''}`}
                  >
                    <FaLaptop size={20} />
                    <span>Mi PC</span>
                  </Link>
                  
                  <Link 
                    to="/pokedex" 
                    className={`nav-btn ${location.pathname === '/pokedex' ? 'active' : ''}`}
                  >
                    <FaBookOpen size={20} />
                    <span>Pokédex</span>
                  </Link>
                  
                  <button onClick={handleLogout} className="nav-btn logout-btn">
                      <FaSignOutAlt size={20} />
                      <span>Salir</span>
                  </button>
              </nav>
            </>
        )}
      </header>
      
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          
          <Route path="/game" element={<ProtectedRoute><Game /></ProtectedRoute>} />
          <Route path="/gallery" element={<ProtectedRoute><Gallery /></ProtectedRoute>} />
          <Route path="/pokedex" element={<ProtectedRoute><Pokedex /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;