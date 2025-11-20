import { useState } from 'react'
import { Routes, Route } from 'react-router-dom';
import Register from './pages/Register'; // Importamos nuestra página

function App() {
  return (
    <div className="App">
      <header>
        <h1>Poké-Captura</h1>
      </header>
      
      <main>
        <Routes>
          {/* Ruta para el registro */}
          <Route path="/" element={<Register />} />
          
          {/* Más rutas vendrán aquí (Login, Juego, Galería) */}
          {/* <Route path="/login" element={<Login />} /> */}
          {/* <Route path="/" element={<Game />} /> */}
        </Routes>
      </main>
    </div>
  );
}

export default App;