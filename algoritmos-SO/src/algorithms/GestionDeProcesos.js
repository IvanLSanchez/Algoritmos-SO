/**
 * utilizan listas en paralelo
 * c = tiempo de creacion
 * t = rafagas de cpu
 * priority = prioridades
 * q = quantum (si es 0 es sin quantum)
 */
function FCFS(c, t) {
    const steps = [];
    let tiempoActual = 0;

    const orden = c.map((_,i) => i).sort((a,b) => c[a] - c[b])
    
    for(const i of orden){
        const inicio = Math.max(tiempoActual, c[i]);
        const fin = inicio + t[i] - 1; //usamos menos uno porque arracamos en 0
        
        steps.push({
            proceso: i,
            inicio: inicio,
            fin: fin,
            rafagasRestantes: 0 
        });

        tiempoActual = fin + 1;
    }

    return steps;
}

// ===== STRATEGY PATTERN PARA SJF =====

/**
 * Estrategias de ejecución - cada una encapsula su lógica
 * @param {Object} ctx - Contexto: {seleccionado, t, tiemposRestantes, q}
 * @returns {{deltaFin: number, terminado: boolean}}
 */
const estrategiasSJF = {
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
 * Factory: selecciona estrategia según q
 * @param {number} q - -1=no preemptive, 0=preemptive, >0=quantum
 * @returns {Function}
 */
function crearEstrategiaSJF(q) {
    if (q === -1) return estrategiasSJF.noPreemptive;
    if (q === 0) return estrategiasSJF.preemptive;
    return estrategiasSJF.conQuantum;
}

/**
 * SJF con Strategy Pattern
 * @param {number[]} c - Tiempos de creación/llegada
 * @param {number[]} t - Tiempos de ráfaga (burst times)
 * @param {number} q - Quantum: -1=no preemptive, 0=preemptive, >0=quantum
 * @returns {Array} Pasos de ejecución
 */
function SJF(c, t, q = 0) {
    const steps = [];
    let tiempoActual = 0;
    
    const estrategia = crearEstrategiaSJF(q);
    
    const pendientes = c.map((_, i) => i);
    const tiemposRestantes = t.map(T => T);
    
    while (pendientes.length > 0) {
        const disponibles = pendientes.filter(i => c[i] <= tiempoActual);

        if (disponibles.length > 0) {
            // Ordenar por tiempo TOTAL (no restante), luego llegada, luego índice
            disponibles.sort((a, b) => t[a] - t[b] || c[a] - c[b] || a - b);

            const seleccionado = disponibles[0];
            const inicio = tiempoActual;

            // Delegar a la estrategia
            const {deltaFin, terminado} = estrategia({
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

function SJRF(c, t, q = 0){
    const steps = [];
    let tiempoActual = 0;
    const conQuantum = q > 0;

    return steps;
}
