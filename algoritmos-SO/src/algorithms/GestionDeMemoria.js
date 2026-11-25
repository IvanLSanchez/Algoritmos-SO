/**
 * Algoritmos de planificación de memoria.
 *
 * Convención de parámetros:
 * - demanda: lista de demanda de páginas
 * - slots: cantidad de bloques disponibles
 *
 * Todos los algoritmos devuelven un array de pasos:
 *   { memoria, metadata, puntero, fallo }
 *
 * `metadata` contiene datos propios de cada algoritmo:
 *   - FIFO: { siguiente }
 *   - LRU:  { ultimaConsulta }
 *   - Reloj: { vidas }
 *
 * `puntero` indica el slot relevante del paso actual:
 *   - En fallo: slot donde se insertó/reemplazó la página.
 *   - En acierto: slot donde se encontró la página.
 *   - -1 si no aplica.
 */

/**
 * Motor genérico de gestión de memoria.
 *
 * Recorre la demanda de páginas y delega el comportamiento de acierto y fallo
 * a las estrategias concretas de cada algoritmo.
 *
 * @param {number[]} demanda - Secuencia de páginas demandadas
 * @param {number} slots - Cantidad de marcos disponibles
 * @param {Object} estrategia - Estrategia del algoritmo
 * @param {Function} estrategia.crearEstado - Inicializa la metadata del algoritmo
 * @param {Function} estrategia.acierto - Maneja una página que ya está en memoria
 * @param {Function} estrategia.fallo - Maneja una página que no está en memoria
 * @param {Function} estrategia.formatearPaso - Construye el paso a devolver
 * @returns {Array} Pasos de ejecución
 */
import { validarEntero, validarEnteros } from './validaciones.js';

function motorMemoria(demanda, slots, { crearEstado, acierto, fallo, formatearPaso }) {
    validarEntero(slots, 'La cantidad de marcos', { min: 1 });
    validarEnteros(demanda, 'La demanda');

    const steps = [];
    const memoria = new Array(slots).fill(null);
    const estado = crearEstado(slots);

    for (let i = 0; i < demanda.length; i++) {
        const pagina = demanda[i];
        const indice = memoria.indexOf(pagina);
        const paso = indice !== -1
            ? acierto({ memoria, estado, indice, pagina, slots, paso: i })
            : fallo({ memoria, estado, pagina, slots, paso: i });

        steps.push(formatearPaso({ memoria, estado, paso }));
    }

    return steps;
}

/**
 * FIFO: First In, First Out.
 *
 * Reemplaza la página más antigua usando un índice circular.
 */
function FIFO(demanda, slots) {
    return motorMemoria(demanda, slots, {
        crearEstado: () => ({ siguiente: 0 }),

        acierto: () => ({
            puntero: -1,
            fallo: false
        }),

        fallo: ({ memoria, estado, pagina, slots }) => {
            const indice = estado.siguiente;
            memoria[indice] = pagina;
            estado.siguiente = (indice + 1) % slots;

            return {
                puntero: indice,
                fallo: true
            };
        },

        formatearPaso: ({ memoria, estado, paso }) => ({
            memoria: [...memoria],
            metadata: { siguiente: estado.siguiente },
            puntero: paso.puntero,
            fallo: paso.fallo
        })
    });
}

/**
 * LRU: Least Recently Used.
 *
 * Reemplaza la página que hace más tiempo no se consulta.
 */
function LRU(demanda, slots) {
    return motorMemoria(demanda, slots, {
        crearEstado: () => ({ ultimaConsulta: new Array(slots).fill(-1) }),

        acierto: ({ estado, indice, paso }) => {
            estado.ultimaConsulta[indice] = paso;
            return {
                puntero: indice,
                fallo: false
            };
        },

        fallo: ({ memoria, estado, pagina, paso }) => {
            const indice = estado.ultimaConsulta.indexOf(Math.min(...estado.ultimaConsulta));
            memoria[indice] = pagina;
            estado.ultimaConsulta[indice] = paso;

            return {
                puntero: indice,
                fallo: true
            };
        },

        formatearPaso: ({ memoria, estado, paso }) => ({
            memoria: [...memoria],
            metadata: { ultimaConsulta: [...estado.ultimaConsulta] },
            puntero: paso.puntero,
            fallo: paso.fallo
        })
    });
}

/**
 * Reloj (Clock): reemplazo de páginas con segunda oportunidad.
 *
 * Cada slot tiene un bit de vida/oportunidad (0 o 1).
 *
 * Reglas:
 * - Acierto: se pone la vida del slot en 1 (máximo 1). El puntero no se mueve.
 * - Fallo: se avanza cíclicamente desde el slot siguiente al puntero actual.
 *   Si el slot tiene vida 0, se reemplaza y se inserta la página con vida 1.
 *   Si tiene vida 1, se baja a 0 y se continúa buscando.
 *   El puntero queda en el slot donde se insertó la página.
 */
function reloj(demanda, slots) {
    return motorMemoria(demanda, slots, {
        crearEstado: () => ({ vidas: new Array(slots).fill(0), puntero: slots - 1 }),

        acierto: ({ estado, indice }) => {
            estado.vidas[indice] = 1;
            return {
                puntero: estado.puntero,
                fallo: false
            };
        },

        fallo: ({ memoria, estado, pagina, slots }) => {
            // Empezar a buscar desde el siguiente al último insertado
            let indice = (estado.puntero + 1) % slots;

            while (true) {
                if (estado.vidas[indice] === 0) {
                    memoria[indice] = pagina;
                    estado.vidas[indice] = 1;
                    estado.puntero = indice;
                    break;
                }

                estado.vidas[indice] = 0;
                indice = (indice + 1) % slots;
            }

            return {
                puntero: indice,
                fallo: true
            };
        },

        formatearPaso: ({ memoria, estado, paso }) => ({
            memoria: [...memoria],
            metadata: { vidas: [...estado.vidas] },
            puntero: paso.puntero,
            fallo: paso.fallo
        })
    });
}

export { FIFO, LRU, reloj };

