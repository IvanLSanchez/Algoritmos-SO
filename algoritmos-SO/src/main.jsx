import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import ProcesosPage from './pages/ProcesosPage.jsx';
import MemoriaPage from './pages/MemoriaPage.jsx';
import DiscoPage from './pages/DiscoPage.jsx';
import './styles.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="app-header">
          <div className="app-title">
            <span className="app-logo"><img src="/favicon.svg" alt="Logo" /></span>
            <div>
              <h1>Algoritmos de Sistemas Operativos</h1>
              <p>Simulador interactivo con modo debugger paso a paso</p>
            </div>
          </div>
          <nav className="app-nav">
            <NavLink to="/procesos">🖥️ Procesos</NavLink>
            <NavLink to="/memoria">🧠 Memoria</NavLink>
            <NavLink to="/disco">💽 Disco</NavLink>
          </nav>
        </header>
        <div className="disclaimer">
          <span className="disclaimer-icon">⚠️</span>
          <p>
            <strong>Herramienta didáctica para estudiantes.</strong> Algunos algoritmos pueden admitir
            más de una solución válida (empates, criterios de desempate, etc.) y los resultados pueden
            ser propensos a errores: <strong>corroborá siempre las soluciones</strong>. El objetivo es
            ayudarte a entender cada algoritmo y a generar revisiones o nuevos ejercicios para practicar.
          </p>
        </div>
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/procesos" replace />} />
            <Route path="/procesos" element={<ProcesosPage />} />
            <Route path="/memoria" element={<MemoriaPage />} />
            <Route path="/disco" element={<DiscoPage />} />
          </Routes>
        </main>
        <footer className="app-footer">
          Cátedra de Sistemas Operativos — FCFS · SJF · SJRF · Prioridad · RR · FIFO · LRU · Reloj · SSTF · SCAN · C-SCAN · LOOK · C-LOOK
        </footer>
      </div>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);
