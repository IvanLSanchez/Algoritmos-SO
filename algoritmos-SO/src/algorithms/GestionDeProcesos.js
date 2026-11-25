/**
 * Algoritmos de planificación de procesos.
 *
 * Convención de parámetros (listas en paralelo, mismo índice = mismo proceso):
 * - c: tiempos de creación/llegada
 * - t: ráfagas de CPU (burst times)
 * - p: prioridades (menor valor = mayor prioridad)
 * - q: quantum (-1 = no expropiativo, 0 = expropiativo, > 0 = con quantum)
 *
 * Todos los algoritmos devuelven un array de pasos:
 *   { proceso, inicio, fin, rafagasRestantes }
 * donde `inicio` y `fin` son inclusivos y el tiempo arranca en 0.
 */

const { validarEntero, validarEnteros } = require('./validaciones');

/**
 * Estrategias de ejecución: deciden cuánto avanza un proceso antes de
 * reevaluar. Son agnósticas al algoritmo de selección.
 *
 * Cada estrategia recibe `{ seleccionado, t, tiemposRestantes, q }` y
 * devuelve `{ deltaFin, terminado }`.
 */
const estrategiasEjecucion = {
    // q = -1: No expropiativo (corre hasta terminar)
    noPreemptive: ({seleccionado, t, tiemposRestantes}) => {
        tiemposRestantes[seleccionado] = 0;
        return {deltaFin: t[seleccionado] - 1, terminado: true};
    },

    // q = 0: Expropiativo (avanza 1 unidad y reevalúa)
    preemptive: ({seleccionado, tiemposRestantes}) => {
        tiemposRestantes[seleccionado] -= 1;
        return {deltaFin: 0, terminado: tiemposRestantes[seleccionado] === 0};
    },

    // q > 0: Con quantum (Round Robin)
    conQuantum: ({seleccionado, tiemposRestantes, q}) => {
        const restante = tiemposRestantes[seleccionado];
        if (restante <= q) {
            tiemposRestantes[seleccionado] = 0;
            return {deltaFin: restante - 1, terminado: true};
        } else {
            tiemposRestantes[seleccionado] = restante - q;
            return {deltaFin: q - 1, terminado: false};
        }
    }
};

/**
 * Factory: devuelve la estrategia de ejecución según el quantum.
 * @param {number} q - -1 = no expropiativo, 0 = expropiativo, > 0 = con quantum
 * @returns {Function} Estrategia de ejecución
 */
function crearEstrategiaEjecucion(q) {
    if (q === -1) return estrategiasEjecucion.noPreemptive;
    if (q === 0) return estrategiasEjecucion.preemptive;
    return estrategiasEjecucion.conQuantum;
}

/**
 * Estrategias de selección: deciden el orden de los procesos disponibles.
 *
 * Cada estrategia recibe `(disponibles, ctx)` y devuelve la lista ordenada
 * (el motor toma el primero). `ctx` = { c, t, tiemposRestantes, p }.
 */
const estrategiasSeleccion = {
    // FCFS: por tiempo de llegada
    fcfs: (disponibles, {c}) =>
        disponibles.slice().sort((a, b) => c[a] - c[b] || a - b),

    // SJF: por ráfaga total, luego llegada, luego índice
    sjf: (disponibles, {c, t}) =>
        disponibles.slice().sort((a, b) => t[a] - t[b] || c[a] - c[b] || a - b),

    // SJRF: por ráfaga restante, luego llegada, luego índice
    sjrf: (disponibles, {c, tiemposRestantes}) =>
        disponibles.slice().sort((a, b) => tiemposRestantes[a] - tiemposRestantes[b] || c[a] - c[b] || a - b),

    // Prioridad: por prioridad (menor = más prioritario), luego llegada, luego índice
    prioridad: (disponibles, {c, p}) =>
        disponibles.slice().sort((a, b) => p[a] - p[b] || c[a] - c[b] || a - b)
};

/**
 * Factory: crea la estrategia de selección de Round Robin.
 *
 * A diferencia de las demás estrategias (puras), RR necesita estado: una
 * cola circular que recuerda el orden de rotación. En cada llamada:
 *   1. Descarta de la cola los procesos que ya terminaron.
 *   2. Agrega los recién llegados en orden de llegada.
 *   3. Rota: saca el frente y lo pasa al final.
 *
 * @returns {Function} Estrategia de selección con estado
 */
function crearSeleccionRR() {
    let cola = [];

    return (disponibles, {c}) => {
        // 1. Quitar de la cola los procesos que ya terminaron
        cola = cola.filter(i => disponibles.includes(i));

        // 2. Agregar los recién llegados en orden de llegada
        const nuevos = disponibles
            .filter(i => !cola.includes(i))
            .sort((a, b) => c[a] - c[b] || a - b);
        cola.push(...nuevos);

        // 3. Rotar: el frente pasa al final
        const seleccionado = cola.shift();
        cola.push(seleccionado);

        return [seleccionado, ...cola];
    };
}

/**
 * Motor genérico de planificación: extrae el loop común a todos los
 * algoritmos (elegir disponible, ejecutar un tramo, avanzar el reloj).
 *
 * @param {number[]} c - Tiempos de creación/llegada
 * @param {number[]} t - Tiempos de ráfaga (burst times)
 * @param {Object} opts - Opciones del planificador
 * @param {Function} opts.seleccionar - Estrategia de selección
 * @param {Function} opts.ejecutar - Estrategia de ejecución
 * @param {number[]} [opts.p] - Prioridades (solo para Prioridad)
 * @param {number} [opts.q] - Quantum (para estrategias con quantum)
 * @returns {Array} Pasos de ejecución
 */
function planificador(c, t, {seleccionar, ejecutar, p, q}) {
    if (!Array.isArray(c) || !Array.isArray(t)) {
        throw new Error('Los tiempos de llegada y rafagas deben ser arreglos.');
    }
    if (c.length !== t.length) {
        throw new Error('Los arreglos de llegada y rafagas deben tener la misma longitud.');
    }
    validarEnteros(c, 'Los tiempos de llegada', { min: 0 });
    validarEnteros(t, 'Las rafagas', { min: 1 });
    if (p !== undefined) {
        if (!Array.isArray(p) || p.length !== t.length) {
            throw new Error('Las prioridades deben ser un arreglo de la misma longitud que las rafagas.');
        }
        validarEnteros(p, 'Las prioridades');
    }

    const steps = [];
    let tiempoActual = 0;

    const pendientes = c.map((_, i) => i);
    const tiemposRestantes = t.map(T => T);

    while (pendientes.length > 0) {
        const disponibles = pendientes.filter(i => c[i] <= tiempoActual);

        if (disponibles.length > 0) {
            const ordenados = seleccionar(disponibles, {c, t, tiemposRestantes, p});
            const seleccionado = ordenados[0];
            const inicio = tiempoActual;

            const {deltaFin, terminado} = ejecutar({
                seleccionado,
                t,
                tiemposRestantes,
                q
            });

            const fin = inicio + deltaFin;

            steps.push({
                proceso: seleccionado,
                inicio,
                fin,
                rafagasRestantes: tiemposRestantes[seleccionado]
            });

            tiempoActual = fin + 1;

            if (terminado) {
                pendientes.splice(pendientes.indexOf(seleccionado), 1);
            }
        } else {
            tiempoActual = Math.min(...pendientes.map(i => c[i]));
        }
    }

    return steps;
}

/**
 * FCFS: First Come First Served (no expropiativo, por orden de llegada).
 *
 * @param {number[]} c - Tiempos de creación/llegada
 * @param {number[]} t - Tiempos de ráfaga (burst times)
 * @returns {Array} Pasos de ejecución
 */
function FCFS(c, t) {
    return planificador(c, t, {
        seleccionar: estrategiasSeleccion.fcfs,
        ejecutar: estrategiasEjecucion.noPreemptive
    });
}

/**
 * SJF: Shortest Job First (por ráfaga total).
 *
 * @param {number[]} c - Tiempos de creación/llegada
 * @param {number[]} t - Tiempos de ráfaga (burst times)
 * @param {number} q - Quantum: -1 = no expropiativo, 0 = expropiativo, > 0 = con quantum
 * @returns {Array} Pasos de ejecución
 */
function SJF(c, t, q = 0) {
    return planificador(c, t, {
        seleccionar: estrategiasSeleccion.sjf,
        ejecutar: crearEstrategiaEjecucion(q),
        q
    });
}

/**
 * SJRF: Shortest Job Remaining First (por ráfaga restante).
 *
 * @param {number[]} c - Tiempos de creación/llegada
 * @param {number[]} t - Tiempos de ráfaga (burst times)
 * @param {number} q - Quantum: -1 = no expropiativo, 0 = expropiativo, > 0 = con quantum
 * @returns {Array} Pasos de ejecución
 */
function SJRF(c, t, q = 0) {
    return planificador(c, t, {
        seleccionar: estrategiasSeleccion.sjrf,
        ejecutar: crearEstrategiaEjecucion(q),
        q
    });
}

/**
 * Prioridad: selección por prioridad (menor valor = mayor prioridad).
 *
 * @param {number[]} c - Tiempos de creación/llegada
 * @param {number[]} t - Tiempos de ráfaga (burst times)
 * @param {number[]} p - Prioridades
 * @param {number} q - Quantum: -1 = no expropiativo, 0 = expropiativo, > 0 = con quantum
 * @returns {Array} Pasos de ejecución
 */
function Prioridad(c, t, p, q = 0) {
    return planificador(c, t, {
        seleccionar: estrategiasSeleccion.prioridad,
        ejecutar: crearEstrategiaEjecucion(q),
        p,
        q
    });
}

/**
 * RR: Round Robin (cola circular con quantum fijo).
 *
 * @param {number[]} c - Tiempos de creación/llegada
 * @param {number[]} t - Tiempos de ráfaga (burst times)
 * @param {number} q - Quantum (debe ser > 0)
 * @returns {Array} Pasos de ejecución
 */
function RR(c, t, q) {
    validarEntero(q, 'El quantum', { min: 1 });

    return planificador(c, t, {
        seleccionar: crearSeleccionRR(),
        ejecutar: estrategiasEjecucion.conQuantum,
        q
    });
}
