import React, { useMemo, useState } from 'react';
import Debugger from '../components/Debugger.jsx';
import { parsearLista } from '../utils/formato.js';
import { FIFO, LRU, reloj } from '../algorithms/GestionDeMemoria.js';

const ALGORITMOS = [
  { id: 'FIFO', nombre: 'FIFO', descripcion: 'Reemplaza la página más antigua (índice circular)', ejecutar: (d, s) => FIFO(d, s) },
  { id: 'LRU', nombre: 'LRU', descripcion: 'Reemplaza la página menos recientemente usada', ejecutar: (d, s) => LRU(d, s) },
  { id: 'Reloj', nombre: 'Reloj / 2ª oportunidad', descripcion: 'Segunda oportunidad con bits de vida', ejecutar: (d, s) => reloj(d, s) },
];

const EJEMPLO = {
  demanda: '2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5, 3, 2, 6, 1',
  marcos: '4',
};

/** Texto de metadata según algoritmo, para mostrar dentro de cada celda de marco. */
function metaPorSlot(algoritmo, paso, slot) {
  if (!paso) return '';
  if (algoritmo === 'FIFO') {
    return paso.metadata.siguiente === slot ? '↓ sig.' : '';
  }
  if (algoritmo === 'LRU') {
    const u = paso.metadata.ultimaConsulta[slot];
    return u >= 0 ? `t=${u}` : '';
  }
  if (algoritmo === 'Reloj') {
    return `♥${paso.metadata.vidas[slot]}`;
  }
  return '';
}

export default function MemoriaPage() {
  const [algoritmo, setAlgoritmo] = useState('FIFO');
  const [demandaTxt, setDemandaTxt] = useState(EJEMPLO.demanda);
  const [marcosTxt, setMarcosTxt] = useState(EJEMPLO.marcos);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState(null);
  const [modoDebug, setModoDebug] = useState(false);
  const [pasoActual, setPasoActual] = useState(0);

  const config = ALGORITMOS.find((a) => a.id === algoritmo);

  const simular = () => {
    setError(null);
    const demanda = parsearLista(demandaTxt);
    const marcos = Number(marcosTxt);
    if (!demanda) {
      setError('La demanda debe ser una lista de enteros separada por comas.');
      return;
    }
    if (!Number.isInteger(marcos) || marcos < 1) {
      setError('La cantidad de marcos debe ser un entero mayor o igual a 1.');
      return;
    }
    try {
      const steps = config.ejecutar(demanda, marcos);
      setResultado({ steps, demanda, marcos });
      setPasoActual(0);
    } catch (e) {
      setError(e.message);
      setResultado(null);
    }
  };

  const fallosTotales = useMemo(
    () => (resultado ? resultado.steps.filter((s) => s.fallo).length : 0),
    [resultado],
  );

  const ultimoVisible = resultado
    ? (modoDebug ? pasoActual : resultado.steps.length - 1)
    : -1;

  const fallosVisibles = resultado
    ? resultado.steps.slice(0, ultimoVisible + 1).filter((s) => s.fallo).length
    : 0;

  const etiquetasPasos = resultado
    ? resultado.steps.map((s, i) => `Página ${resultado.demanda[i]} → ${s.fallo ? 'FALLO' : 'acierto'}`)
    : [];

  const pasoDetalle = modoDebug && resultado && resultado.steps[pasoActual]
    ? { ...resultado.steps[pasoActual], pagina: resultado.demanda[pasoActual] }
    : null;

  return (
    <>
      <section className="card">
        <h2>🧠 Gestión de Memoria <span className="badge">{config.descripcion}</span></h2>
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
          <div className="field field-wide">
            <label>Demanda de páginas</label>
            <input value={demandaTxt} onChange={(e) => setDemandaTxt(e.target.value)} placeholder={EJEMPLO.demanda} />
            <div className="hint">Secuencia de páginas referenciadas</div>
          </div>
          <div className="field">
            <label>Marcos (slots)</label>
            <input value={marcosTxt} onChange={(e) => setMarcosTxt(e.target.value)} placeholder="4" />
          </div>
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
            Tabla de marcos — {config.nombre}
            <span className="badge">{resultado.steps.length} referencias</span>
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
            <span className="fallos-badge">
              {modoDebug ? fallosVisibles : fallosTotales} fallos
              <small>{modoDebug ? `hasta el paso ${pasoActual + 1}` : `de ${resultado.steps.length} referencias`}</small>
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
          <div className="table-wrap">
            <table className="grid">
              <thead>
                <tr>
                  <th className="row-head">Demanda</th>
                  {resultado.demanda.map((pagina, i) => (
                    <th
                      key={i}
                      style={i === ultimoVisible && modoDebug ? { background: 'var(--accent-2)' } : undefined}
                    >
                      {pagina}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: resultado.marcos }, (_, slot) => (
                  <tr key={slot}>
                    <td className="row-head">F{slot + 1}</td>
                    {resultado.steps.map((paso, i) => {
                      if (i > ultimoVisible) {
                        return <td key={i} className="mem-cell empty" />;
                      }
                      const valor = paso.memoria[slot];
                      const esPuntero = paso.puntero === slot;
                      const clase = valor === null || valor === undefined
                        ? 'empty'
                        : esPuntero && paso.fallo
                          ? 'inserted'
                          : esPuntero && !paso.fallo
                            ? 'hit'
                            : '';
                      return (
                        <td key={i} className={`mem-cell ${clase}`}>
                          {valor ?? ''}
                          {valor !== null && valor !== undefined && (
                            <div className="mem-meta">{metaPorSlot(algoritmo, paso, slot)}</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr>
                  <td className="row-head metric-total">{modoDebug ? fallosVisibles : fallosTotales}</td>
                  {resultado.steps.map((paso, i) => (
                    <td
                      key={i}
                      className={i > ultimoVisible ? '' : paso.fallo ? 'mem-fallo' : 'mem-acierto'}
                    >
                      {i > ultimoVisible ? '' : paso.fallo ? 'F' : 'A'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="gantt-legend">
            <span><i style={{ background: 'var(--warn-soft)', borderColor: 'var(--warn)' }} /> inserción/reemplazo (fallo)</span>
            <span><i style={{ background: 'var(--hit-soft)', borderColor: 'var(--hit)' }} /> página encontrada (acierto)</span>
            <span><strong style={{ color: 'var(--fail)' }}>F</strong> fallo · <strong style={{ color: 'var(--hit)' }}>A</strong> acierto</span>
            {algoritmo === 'FIFO' && <span>↓ sig. = próximo slot a reemplazar</span>}
            {algoritmo === 'LRU' && <span>t= instante de última consulta</span>}
            {algoritmo === 'Reloj' && <span>♥ bit de vida (segunda oportunidad)</span>}
          </div>
          {pasoDetalle && (
            <div className="step-detail">
              <h3>🐞 Paso {pasoActual + 1} — llega la página {pasoDetalle.pagina}</h3>
              <ul>
                {pasoDetalle.fallo ? (
                  <li>
                    <strong style={{ color: 'var(--fail)' }}>FALLO de página</strong>: se inserta <code>{pasoDetalle.pagina}</code> en el marco <code>F{pasoDetalle.puntero + 1}</code>.
                  </li>
                ) : (
                  <li>
                    <strong style={{ color: 'var(--hit)' }}>ACIERTO</strong>: la página <code>{pasoDetalle.pagina}</code> ya estaba en memoria
                    {pasoDetalle.puntero >= 0 && <> (marco <code>F{pasoDetalle.puntero + 1}</code>)</>}.
                  </li>
                )}
                <li>Estado de memoria: <code>[{pasoDetalle.memoria.map((m) => (m === null ? '—' : m)).join(', ')}]</code></li>
                {algoritmo === 'FIFO' && <li>Próximo slot a reemplazar: <code>F{pasoDetalle.metadata.siguiente + 1}</code></li>}
                {algoritmo === 'LRU' && <li>Última consulta por marco: <code>[{pasoDetalle.metadata.ultimaConsulta.join(', ')}]</code></li>}
                {algoritmo === 'Reloj' && <li>Bits de vida: <code>[{pasoDetalle.metadata.vidas.join(', ')}]</code></li>}
              </ul>
            </div>
          )}
        </section>
      )}
    </>
  );
}
