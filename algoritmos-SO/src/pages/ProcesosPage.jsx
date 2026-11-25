import React, { useMemo, useState } from 'react';
import Debugger from '../components/Debugger.jsx';
import { numero, parsearLista, nombreProceso, colorProceso } from '../utils/formato.js';
import {
  FCFS, SJF, SJRF, Prioridad, RR,
} from '../algorithms/GestionDeProcesos.js';

const ALGORITMOS = [
  { id: 'FCFS', nombre: 'FCFS', descripcion: 'First Come First Served (no expropiativo)', usaPrioridad: false, usaQuantum: false },
  { id: 'SJF', nombre: 'SJF', descripcion: 'Shortest Job First (por ráfaga total)', usaPrioridad: false, usaQuantum: true },
  { id: 'SJRF', nombre: 'SJRF', descripcion: 'Shortest Remaining First (por ráfaga restante)', usaPrioridad: false, usaQuantum: true },
  { id: 'Prioridad', nombre: 'Prioridad', descripcion: 'Menor valor = mayor prioridad', usaPrioridad: true, usaQuantum: true },
  { id: 'RR', nombre: 'Round Robin', descripcion: 'Cola circular con quantum fijo', usaPrioridad: false, usaQuantum: true, soloQuantumPositivo: true },
];

const EJEMPLO = {
  llegadas: '0, 2, 4, 6, 8',
  rafagas: '3, 6, 4, 5, 3',
  prioridades: '3, 1, 4, 2, 5',
  quantum: '-1',
};

function ejecutar(algoritmo, c, t, p, q) {
  switch (algoritmo) {
    case 'FCFS': return FCFS(c, t);
    case 'SJF': return SJF(c, t, q);
    case 'SJRF': return SJRF(c, t, q);
    case 'Prioridad': return Prioridad(c, t, p, q);
    case 'RR': return RR(c, t, q);
    default: return [];
  }
}

/**
 * Calcula espera, finalización y penalización por proceso a partir de los pasos.
 *
 * Convención de la cátedra (ver capturas de clase):
 * - Espera: tiempo desde la llegada hasta que el proceso empieza a ejecutar
 *   por primera vez (primeraEjecucion - c).
 * - Finalización: instante de finalización medido desde la llegada,
 *   contando el tick final como completo (finUltimaRafaga + 1 - c).
 * - Penalización: finalización / t.
 */
function calcularMetricas(steps, c, t) {
  const n = c.length;
  const primeraEjecucion = new Array(n).fill(null);
  const finUltimaRafaga = new Array(n).fill(null);

  for (const paso of steps) {
    if (primeraEjecucion[paso.proceso] === null) {
      primeraEjecucion[paso.proceso] = paso.inicio;
    }
    if (paso.rafagasRestantes === 0) {
      finUltimaRafaga[paso.proceso] = paso.fin;
    }
  }

  const filas = [];
  let sumaPenalizacion = 0;
  for (let i = 0; i < n; i++) {
    const espera = primeraEjecucion[i] - c[i];
    const finalizacion = finUltimaRafaga[i] + 1 - c[i];
    const penalizacion = finalizacion / t[i];
    sumaPenalizacion += penalizacion;
    filas.push({ proceso: i, espera, finalizacion, penalizacion });
  }
  return { filas, promedioPenalizacion: sumaPenalizacion / n };
}

/** Construye la línea de tiempo: tiempo → proceso que corre (o -1 si ocioso). */
function construirTimeline(steps) {
  const timeline = [];
  let reloj = 0;
  for (const paso of steps) {
    while (reloj < paso.inicio) { timeline.push(-1); reloj++; }
    for (let k = paso.inicio; k <= paso.fin; k++) { timeline.push(paso.proceso); reloj++; }
  }
  return timeline;
}

export default function ProcesosPage() {
  const [algoritmo, setAlgoritmo] = useState('FCFS');
  const [llegadasTxt, setLlegadasTxt] = useState(EJEMPLO.llegadas);
  const [rafagasTxt, setRafagasTxt] = useState(EJEMPLO.rafagas);
  const [prioridadesTxt, setPrioridadesTxt] = useState(EJEMPLO.prioridades);
  const [quantumTxt, setQuantumTxt] = useState(EJEMPLO.quantum);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [modoDebug, setModoDebug] = useState(false);
  const [pasoActual, setPasoActual] = useState(0);

  const config = ALGORITMOS.find((a) => a.id === algoritmo);

  const simular = () => {
    setError(null);
    const c = parsearLista(llegadasTxt);
    const t = parsearLista(rafagasTxt);
    if (!c || !t) {
      setError('Las llegadas y las ráfagas deben ser listas de enteros separadas por comas.');
      return;
    }
    if (c.length !== t.length) {
      setError(`Llegadas (${c.length}) y ráfagas (${t.length}) deben tener la misma cantidad de elementos.`);
      return;
    }
    let p;
    if (config.usaPrioridad) {
      p = parsearLista(prioridadesTxt);
      if (!p || p.length !== t.length) {
        setError('Las prioridades deben ser una lista de enteros de la misma longitud que las ráfagas.');
        return;
      }
    }
    let q = -1;
    if (config.usaQuantum) {
      q = Number(quantumTxt);
      if (!Number.isInteger(q) || q < -1) {
        setError('El quantum debe ser un entero: -1 = no expropiativo, 0 = expropiativo, > 0 = con quantum.');
        return;
      }
      if (config.soloQuantumPositivo && q < 1) {
        setError('Round Robin requiere un quantum mayor o igual a 1.');
        return;
      }
    }
    try {
      const steps = ejecutar(algoritmo, c, t, p, q);
      setResultado({ steps, c, t, p, q });
      setPasoActual(0);
    } catch (e) {
      setError(e.message);
      setResultado(null);
    }
  };

  const timeline = useMemo(
    () => (resultado ? construirTimeline(resultado.steps) : []),
    [resultado],
  );
  const metricas = useMemo(
    () => (resultado ? calcularMetricas(resultado.steps, resultado.c, resultado.t) : null),
    [resultado],
  );

  // En modo debug, los pasos visibles son los primeros `pasoActual + 1`
  const pasosVisibles = resultado
    ? (modoDebug ? resultado.steps.slice(0, pasoActual + 1) : resultado.steps)
    : [];
  const timelineVisible = useMemo(() => construirTimeline(pasosVisibles), [pasosVisibles]);

  const etiquetasPasos = resultado
    ? resultado.steps.map(
        (s) => `${nombreProceso(s.proceso)}: ${s.inicio} → ${s.fin}${s.rafagasRestantes === 0 ? ' ✔ termina' : ` (restan ${s.rafagasRestantes})`}`,
      )
    : [];

  const pasoDetalle = modoDebug && resultado && resultado.steps[pasoActual]
    ? resultado.steps[pasoActual]
    : null;

  return (
    <>
      <section className="card">
        <h2>🖥️ Planificación de Procesos <span className="badge">{config.descripcion}</span></h2>
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
            <label>Tiempos de llegada (c)</label>
            <input value={llegadasTxt} onChange={(e) => setLlegadasTxt(e.target.value)} placeholder="0, 2, 4, 6, 8" />
            <div className="hint">Uno por proceso: A, B, C…</div>
          </div>
          <div className="field">
            <label>Ráfagas de CPU (t)</label>
            <input value={rafagasTxt} onChange={(e) => setRafagasTxt(e.target.value)} placeholder="3, 6, 4, 5, 3" />
          </div>
          {config.usaPrioridad && (
            <div className="field">
              <label>Prioridades (p)</label>
              <input value={prioridadesTxt} onChange={(e) => setPrioridadesTxt(e.target.value)} placeholder="3, 1, 4, 2, 5" />
              <div className="hint">Menor valor = mayor prioridad</div>
            </div>
          )}
          {config.usaQuantum && (
            <div className="field">
              <label>Quantum (q)</label>
              <input value={quantumTxt} onChange={(e) => setQuantumTxt(e.target.value)} placeholder="-1" />
              <div className="hint">
                {config.soloQuantumPositivo
                  ? 'Debe ser ≥ 1'
                  : '-1 = no expropiativo · 0 = expropiativo · >0 = con quantum'}
              </div>
            </div>
          )}
          <div className="field field-action">
            <label aria-hidden="true">&nbsp;</label>
            <button className="btn btn-primary" onClick={simular}>▶ Simular</button>
          </div>
        </div>
        {error && <div className="error-box">⚠️ {error}</div>}
      </section>

      {resultado && (
        <section className="card">
          <h2>
            Diagrama de Gantt — {config.nombre}
            <span className="badge">{resultado.steps.length} pasos</span>
          </h2>
          <label className="debug-toggle" style={{ marginBottom: 12 }}>
            <input
              type="checkbox"
              checked={modoDebug}
              onChange={(e) => { setModoDebug(e.target.checked); setPasoActual(0); }}
            />
            🐞 Modo debugger (paso a paso)
          </label>
          {modoDebug && (
            <Debugger
              total={resultado.steps.length}
              paso={pasoActual}
              onChange={setPasoActual}
              etiquetas={etiquetasPasos}
            />
          )}
          <div className="table-wrap">
            <table className="grid">
              <thead>
                <tr>
                  <th className="row-head">Clock</th>
                  {timeline.map((_, k) => <th key={k}>{k}</th>)}
                </tr>
              </thead>
              <tbody>
                {resultado.c.map((llegada, i) => (
                  <tr key={i} className={modoDebug && !pasosVisibles.some((s) => s.proceso === i) ? 'dimmed' : ''}>
                    <td className="row-head">{nombreProceso(i)}</td>
                    {timeline.map((_, k) => {
                      const corriendo = k < timelineVisible.length && timelineVisible[k] === i;
                      const esLlegada = k === llegada;
                      return (
                        <td
                          key={k}
                          className={`gantt-cell ${corriendo ? 'running' : ''} ${esLlegada ? 'arrival' : ''} ${k < timelineVisible.length && timelineVisible[k] === -1 ? 'idle' : ''}`}
                          style={corriendo ? { background: colorProceso(i) } : undefined}
                          title={corriendo ? `${nombreProceso(i)} ejecutando en t=${k}` : esLlegada ? `${nombreProceso(i)} llega en t=${k}` : ''}
                        />
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td className="row-head">Clock</td>
                  {timeline.map((_, k) => <td key={k} style={{ fontWeight: 700 }}>{k}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="gantt-legend">
            <span><i style={{ background: '#fff' }} />✕ llegada del proceso</span>
            {resultado.c.map((_, i) => (
              <span key={i}><i style={{ background: colorProceso(i) }} /> {nombreProceso(i)}</span>
            ))}
            <span><i style={{ background: 'repeating-linear-gradient(45deg,#f8fafc,#f8fafc 4px,#e2e8f0 4px,#e2e8f0 5px)' }} /> CPU ociosa</span>
          </div>
          {pasoDetalle && (
            <div className="step-detail">
              <h3>🐞 Paso {pasoActual + 1}</h3>
              <ul>
                <li>Se ejecuta <code>{nombreProceso(pasoDetalle.proceso)}</code> desde <code>t={pasoDetalle.inicio}</code> hasta <code>t={pasoDetalle.fin}</code>.</li>
                <li>
                  {pasoDetalle.rafagasRestantes === 0
                    ? <>El proceso <code>{nombreProceso(pasoDetalle.proceso)}</code> <strong>termina</strong> en este paso.</>
                    : <>A <code>{nombreProceso(pasoDetalle.proceso)}</code> le quedan <code>{pasoDetalle.rafagasRestantes}</code> ráfagas restantes.</>}
                </li>
              </ul>
            </div>
          )}
        </section>
      )}

      {metricas && (
        <section className="card">
          <h2>📊 Métricas por proceso</h2>
          <div className="table-wrap">
            <table className="grid" style={{ maxWidth: 520 }}>
              <thead>
                <tr>
                  <th>Procesos</th>
                  <th>Espera</th>
                  <th>Finalizac.</th>
                  <th>Penalizac.</th>
                </tr>
              </thead>
              <tbody>
                {metricas.filas.map((f) => (
                  <tr key={f.proceso}>
                    <td className="row-head" style={{ borderLeft: `4px solid ${colorProceso(f.proceso)}` }}>
                      {nombreProceso(f.proceso)}
                    </td>
                    <td className="metric-ok">{f.espera}</td>
                    <td className="metric-ok">{f.finalizacion}</td>
                    <td className="metric-ok">{numero(f.penalizacion)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="row-head metric-head">Promedio</td>
                  <td className="metric-head" colSpan={2} />
                  <td className="metric-total">{numero(metricas.promedioPenalizacion)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {resultado && (
        <section className="card">
          <h2>📥 Datos de entrada</h2>
          <div className="table-wrap">
            <table className="grid" style={{ maxWidth: 420 }}>
              <thead>
                <tr>
                  <th>Procesos</th>
                  <th>c (llegada)</th>
                  <th>t (ráfaga)</th>
                  {resultado.p && <th>p (prioridad)</th>}
                </tr>
              </thead>
              <tbody>
                {resultado.c.map((llegada, i) => (
                  <tr key={i}>
                    <td className="row-head" style={{ borderLeft: `4px solid ${colorProceso(i)}` }}>{nombreProceso(i)}</td>
                    <td>{llegada}</td>
                    <td>{resultado.t[i]}</td>
                    {resultado.p && <td>{resultado.p[i]}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}
