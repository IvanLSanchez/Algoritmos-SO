/** Formatea un número con coma decimal estilo es-AR (2 decimales). */
export function numero(n, decimales = 2) {
  return n.toLocaleString('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });
}

/** Parsea una lista separada por comas/espacios a enteros. Devuelve null si hay algo inválido. */
export function parsearLista(texto) {
  const partes = String(texto).split(/[\s,;]+/).filter((p) => p !== '');
  if (partes.length === 0) return null;
  const numeros = partes.map((p) => Number(p));
  if (numeros.some((n) => !Number.isInteger(n))) return null;
  return numeros;
}

/** Nombre de proceso por índice: 0 → A, 1 → B, ... */
export function nombreProceso(i) {
  return String.fromCharCode(65 + i);
}

/** Paleta de colores por proceso (índice). */
export const COLORES_PROCESO = [
  '#f87171', '#fb923c', '#facc15', '#4ade80', '#2dd4bf',
  '#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fbbf24',
  '#818cf8', '#fb7185', '#22d3ee', '#a3e635', '#e879f9',
];

export function colorProceso(i) {
  return COLORES_PROCESO[i % COLORES_PROCESO.length];
}
