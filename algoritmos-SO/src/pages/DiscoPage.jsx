import React, { useMemo, useState } from 'react';
import Debugger from '../components/Debugger.jsx';
import { parsearLista } from '../utils/formato.js';
import {
  FIFO, SSTF, SCAN, CSCAN, LOOK, CLOOK,
} from '../algorithms/GestionDeDisco.js';

const ALGORITMOS = [
  { id: 'FIFO', nombre: 'FIFO', descripcion: 'Atiende en orden de llegada', usaDireccion: false, ejecutar: (i, d) => FIFO(i, d) },
  { id: 'SSTF', nombre: 'SSTF', descripcion: 'Shortest Seek Time First (el más cercano)', usaDireccion: false, ejecutar: (i, d) => SSTF(i, d) },
  { id: 'SCAN', nombre: 'SCAN', descripcion: 'Barre hasta el extremo del disco y rebota', usaDireccion: true, ejecutar: (i, d, dir, max) => SCAN(i, d, dir, max) },
  { id: 'CSCAN', nombre: 'C-SCAN', descripcion: 'Barre en una dirección y vuelve a 0 sin contar', usaDireccion: false, ejecutar: (i, d, dir, max) => CSCAN(i, d, max) },
  { id: 'LOOK', nombre: 'LOOK', descripcion: 'Como SCAN pero rebota en el último pedido', usaDireccion: true, ejecutar: (i, d, dir) => LOOK(i, d, dir) },
  { id: 'CLOOK', nombre: 'C-LOOK', descripcion: 'Como C-SCAN pero salta al pedido más chico', usaDireccion: false, ejecutar: (i, d) => CLOOK(i, d) },
];

const EJEMPLO = {
  inicio: '50',
  demanda: '42, 180, 135, 38, 145, 75, 15, 95',
  direccion: 'derecha',
  maxPista: '199',
};

/** Gráfico de línea del recorrido del cabezal (SVG). */
function GraficoRecorrido({ puntos, maxPista, hastaIndice }) {
  const ancho = 640;
  const alto = 300;
  const margen = { izq: 42, der: 16, arr: 18, aba: 28 };
  const w = ancho - margen.izq - margen.der;
  const h = alto - margen.arr - margen.aba;

  const visibles = puntos.slice(0, hastaIndice + 1);
  const x = (i) => margen.izq + (puntos.length <= 1 ? 0 : (i / (puntos.length - 1)) * w);
  const y = (pista) => margen.arr + (pista / maxPista) * h;

  const segmentos = [];
  for (let i = 1; i < visibles.length; i++) {
    segmentos.push({
      x1: x(i - 1), y1: y(visibles[i - 1].pista),
      x2: x(i), y2: y(visibles[i].pista),
      salto: visibles[i].salto,
    });
  }

  const marcasY = [0, Math.round(maxPista / 4), Math.round(maxPista / 2), Math.round((3 * maxPista) / 4), maxPista];

  return (
    <svg className="disk-chart" viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label="Recorrido del cabezal">
      <defs>
        <linearGradient id="diskGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      {marcasY.map((pista) => (
        <g key={pista}>
          <line className="grid-line" x1={margen.izq} x2={ancho - margen.der} y1={y(pista)} y2={y(pista)} />
          <text x={margen.izq - 6} y={y(pista) + 3} textAnchor="end">{pista}</text>
        </g>
      ))}
      <line className="axis" x1={margen.izq} x2={ancho - margen.der} y1={alto - margen.aba} y2={alto - margen.aba} />
      <text x={ancho - margen.der} y={alto - 8} textAnchor="end">paso →</text>
      <text x={8} y={margen.arr - 4}>pista</text>
      {segmentos.map((s, i) => (
        <line
          key={i}
          className={s.salto ? 'jump' : 'line'}
          x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
        />
      ))}
      {visibles.map((p, i) => (
        <g key={i}>
          <circle
            className={`pt ${i === 0 ? 'start' : ''} ${i === visibles.length - 1 ? 'active' : ''}`}
            cx={x(i)} cy={y(p.pista)} r={5}
          />
          <text x={x(i)} y={y(p.pista) - 9} textAnchor="middle" style={{ fontWeight: 700 }}>
            {p.pista}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function DiscoPage() {
  const [algoritmo, setAlgoritmo] = useState('FIFO');
  const [inicioTxt, setInicioTxt] = useState(EJEMPLO.inicio);
  const [demandaTxt, setDemandaTxt] = useState(EJEMPLO.demanda);
  const [direccion, setDireccion] = useState(EJEMPLO.direccion);
  const [maxPistaTxt, setMaxPistaTxt] = useState(EJEMPLO.maxPista);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [modoDebug, setModoDebug] = useState(false);
  const [pasoActual, setPasoActual] = useState(0);

  const config = ALGORITMOS.find((a) => a.id === algoritmo);

  const simular = () => {
    setError(null);
    const inicio = Number(inicioTxt);
    const demanda = parsearLista(demandaTxt);
    const maxPista = Number(maxPistaTxt);
    if (!Number.isInteger(inicio)) {
      setError('La pista inicial debe ser un entero.');
      return;
    }
    if (!demanda) {
      setError('La demanda debe ser una lista de enteros separada por comas.');
      return;
    }
    if (!Number.isInteger(maxPista) || maxPista < 1) {
      setError('La pista máxima debe ser un entero mayor o igual a 1.');
      return;
    }
    try {
      const steps = config.ejecutar(inicio, demanda, direccion, maxPista);
      setResultado({ steps, inicio, demanda, maxPista });
      setPasoActual(0);
    } catch (e) {
      setError(e.message);
      setResultado(null);
    }
  };

  const total = useMemo(
    () => (resultado ? resultado.steps.reduce((acc, s) => acc + s.diferencia, 0) : 0),
    [resultado],
  );

  // Recorrido completo del cabezal: posición inicial + cada "hasta"
  const puntos = useMemo(() => {
    if (!resultado) return [];
    const pts = [{ pista: resultado.inicio, salto: false }];
    for (const s of resultado.steps) {
      pts.push({ pista: s.hasta, salto: s.diferencia === 0 && s.desde !== s.hasta });
    }
    return pts;
  }, [resultado]);

  const ultimoVisible = resultado
    ? (modoDebug ? pasoActual : resultado.steps.length - 1)
    : -1;

  const totalVisible = resultado
    ? resultado.steps.slice(0, ultimoVisible + 1).reduce((acc, s) => acc + s.diferencia, 0)
    : 0;

  const etiquetasPasos = resultado
    ? resultado.steps.map((s) => `${s.desde} → ${s.hasta} (${s.diferencia})`)
    : [];

  const pasoDetalle = modoDebug && resultado && resultado.steps[pasoActual]
    ? resultado.steps[pasoActual]
    : null;

  return (
    <>
      <section className="card">
        <h2>💽 Planificación de Disco <span className="badge">{config.descripcion}</span></h2>
        <div className="algo-tabs">
          {ALGORITMOS.map((a) => (
            <button
              key={a.id}
              className={a.id === algoritmo ? 'active' : ''}
              onClick={() => { setAlgoritmo(a.id); setResultado(null); setError(null); }}
            >
              {a.nombre}
            </button>
          ))}
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Pista inicial</label>
            <input value={inicioTxt} onChange={(e) => setInicioTxt(e.target.value)} placeholder="50" />
          </div>
          <div className="field" style={{ gridColumn: 'span 2' }}>
            <label>Demanda de pistas</label>
            <input value={demandaTxt} onChange={(e) => setDemandaTxt(e.target.value)} placeholder={EJEMPLO.demanda} />
          </div>
          {config.usaDireccion && (
            <div className="field">
              <label>Dirección inicial</label>
              <select value={direccion} onChange={(e) => setDireccion(e.target.value)}>
                <option value="derecha">→ Derecha (pistas mayores)</option>
                <option value="izquierda">← Izquierda (pistas menores)</option>
              </select>
            </div>
          )}
          <div className="field">
            <label>Pista máxima</label>
            <input value={maxPistaTxt} onChange={(e) => setMaxPistaTxt(e.target.value)} placeholder="199" />
            <div className="hint">Extremo del disco (para SCAN / C-SCAN)</div>
          </div>
          <div className="field">
            <button className="btn btn-primary" onClick={simular}>▶ Simular</button>
          </div>
        </div>
        {error && <div className="error-box">⚠️ {error}</div>}
      </section>

      {resultado && (
        <section className="card">
          <h2>
            Recorrido del cabezal — {config.nombre}
            <span className="badge">{resultado.steps.length} movimientos</span>
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 12 }}>
            <label className="debug-toggle">
              <input
                type="checkbox"
                checked={modoDebug}
                onChange={(e) => { setModoDebug(e.target.checked); setPasoActual(0); }}
              />
              🐞 Modo debugger (paso a paso)
            </label>
            <span className="fallos-badge" style={{ background: 'var(--warn-soft)', borderColor: 'var(--warn)', color: '#92400e' }}>
              Σ desplazamiento: {modoDebug ? totalVisible : total} pistas
              <small>{modoDebug ? `hasta el paso ${pasoActual + 1}` : 'total del recorrido'}</small>
            </span>
          </div>
          {modoDebug && (
            <Debugger
              total={resultado.steps.length}
              paso={pasoActual}
              onChange={setPasoActual}
              etiquetas={etiquetasPasos}
            />
          )}
          <div className="disk-layout">
            <div className="table-wrap">
              <table className="grid">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Desde</th>
                    <th>Hasta</th>
                    <th>Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.steps.map((s, i) => (
                    <tr
                      key={i}
                      style={modoDebug && i === ultimoVisible ? { background: '#ede9fe' } : undefined}
                    >
                      <td className="row-head">{i + 1}</td>
                      <td>{s.desde}</td>
                      <td>{s.hasta}</td>
                      <td className={s.diferencia === 0 && s.desde !== s.hasta ? '' : 'metric-ok'}>
                        {s.diferencia === 0 && s.desde !== s.hasta ? 'salto (0)' : s.diferencia}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="row-head disk-total" colSpan={3}>{config.nombre}</td>
                    <td className="disk-total">{modoDebug ? totalVisible : total}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <GraficoRecorrido
                puntos={puntos}
                maxPista={resultado.maxPista}
                hastaIndice={ultimoVisible + 1}
              />
              <div className="gantt-legend">
                <span><i style={{ background: 'var(--ok)' }} /> posición inicial ({resultado.inicio})</span>
                <span><i style={{ background: 'var(--accent-2)' }} /> posición actual</span>
                <span>línea punteada = salto sin costo (C-SCAN / C-LOOK)</span>
              </div>
            </div>
          </div>
          {pasoDetalle && (
            <div className="step-detail">
              <h3>🐞 Paso {pasoActual + 1}</h3>
              <ul>
                <li>El cabezal se mueve de la pista <code>{pasoDetalle.desde}</code> a la pista <code>{pasoDetalle.hasta}</code>.</li>
                <li>
                  {pasoDetalle.diferencia === 0 && pasoDetalle.desde !== pasoDetalle.hasta
                    ? <>Es un <strong>salto de retorno</strong>: no suma desplazamiento.</>
                    : <>Desplazamiento: <code>{pasoDetalle.diferencia}</code> pistas. Acumulado: <code>{totalVisible}</code>.</>}
                </li>
              </ul>
            </div>
          )}
        </section>
      )}
    </>
  );
}
