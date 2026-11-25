import React, { useEffect, useState } from 'react';

/**
 * Barra de depuración paso a paso.
 *
 * @param {number} total - Cantidad total de pasos
 * @param {number} paso - Índice actual (0-based)
 * @param {Function} onChange - Callback con el nuevo índice
 * @param {string[]} [etiquetas] - Etiqueta corta por paso (opcional)
 */
export default function Debugger({ total, paso, onChange, etiquetas }) {
  const [reproduciendo, setReproduciendo] = useState(false);
  const [velocidad, setVelocidad] = useState(800);

  useEffect(() => {
    if (!reproduciendo) return undefined;
    const id = setInterval(() => {
      onChange((actual) => Math.min(actual + 1, total - 1));
    }, velocidad);
    return () => clearInterval(id);
  }, [reproduciendo, velocidad, total, onChange]);

  // Al llegar al último paso, frenar la reproducción
  useEffect(() => {
    if (paso >= total - 1) setReproduciendo(false);
  }, [paso, total]);

  useEffect(() => {
    setReproduciendo(false);
  }, [total]);

  if (total === 0) return null;

  const irA = (n) => {
    setReproduciendo(false);
    onChange(Math.max(0, Math.min(total - 1, n)));
  };

  return (
    <div className="debugger">
      <span className="step-label">
        Paso <strong>{paso + 1}</strong> / {total}
        {etiquetas && etiquetas[paso] ? ` — ${etiquetas[paso]}` : ''}
      </span>
      <button className="dbg-btn" title="Ir al inicio" onClick={() => irA(0)} disabled={paso === 0}>
        ⏮
      </button>
      <button className="dbg-btn" title="Paso anterior" onClick={() => irA(paso - 1)} disabled={paso === 0}>
        ◀
      </button>
      <button
        className={`dbg-btn ${reproduciendo ? 'playing' : ''}`}
        title={reproduciendo ? 'Pausar' : 'Reproducir'}
        onClick={() => {
          if (!reproduciendo && paso >= total - 1) onChange(0);
          setReproduciendo(!reproduciendo);
        }}
      >
        {reproduciendo ? '⏸' : '▶'}
      </button>
      <button className="dbg-btn" title="Paso siguiente" onClick={() => irA(paso + 1)} disabled={paso >= total - 1}>
        ▶
      </button>
      <button className="dbg-btn" title="Ir al final" onClick={() => irA(total - 1)} disabled={paso >= total - 1}>
        ⏭
      </button>
      <input
        type="range"
        min={0}
        max={total - 1}
        value={paso}
        onChange={(e) => irA(Number(e.target.value))}
      />
      <select value={velocidad} onChange={(e) => setVelocidad(Number(e.target.value))} title="Velocidad de reproducción">
        <option value={1600}>0.5×</option>
        <option value={800}>1×</option>
        <option value={400}>2×</option>
        <option value={200}>4×</option>
      </select>
    </div>
  );
}
