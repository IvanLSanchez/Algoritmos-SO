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

function SJF(c, t, q = 0){
    const steps = [];
    let tiempoActual = 0;
    const conQuantum = q > 0
    
    const pendientes = c.map((_, i) => i);
    const tiemposRestantesPendientes = t.map(T => T);
    
    while(pendientes.length > 0){
        const disponibles = pendientes.filter(i => c[i] <= tiempoActual);

        if(disponibles.length > 0){
            disponibles.sort((a, b) => t[a] - t[b] || c[a] - c[b] || a - b);

            const seleccionado = disponibles[0];
            const inicio = tiempoActual;
            let fin = inicio - 1;

            if(!conQuantum){
                fin += t[seleccionado];
                tiemposRestantesPendientes[seleccionado] = 0;
            }else{
                const rafagasRestantesAux = tiemposRestantesPendientes[seleccionado] - q;
                if(rafagasRestantesAux >= 0){
                    fin += q;
                    tiemposRestantesPendientes[seleccionado] = rafagasRestantesAux;
                }else{
                    fin += tiemposRestantesPendientes[seleccionado];
                    tiemposRestantesPendientes[seleccionado] = 0;
                }
            }

            steps.push({
                proceso: seleccionado,
                inicio: inicio,
                fin: fin,
                rafagasRestantes: tiemposRestantesPendientes[seleccionado]
            });

            tiempoActual = fin + 1;

            if (tiemposRestantesPendientes[seleccionado] === 0){
                const pendienteAQuitar = pendientes.indexOf(seleccionado);
                pendientes.splice(pendienteAQuitar, 1);
            }
        }else{
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
