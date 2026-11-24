/**
 * Algoritmos de planificacion de memoria.
 *
 * Convención de parámetros:
 * - demanda: lista de demanda de paginas
 * - slots: cantidad de bloques disponibles
 *
 * Todos los algoritmos devuelven un array de pasos:
 *   { memoria, puntero, fallo }
 *
 * puntero indica en que slots de memoria se ubico en el paso actual. si es -1 no hay puntero en el paso
 */

function FIFO(demanda, slots) {
    const steps = [];
    let memoria = new Array(slots).fill(null);
    let i = 0;

    let puntero;
    let fallo;
    for (const pagina of demanda) {
        if (memoria.includes(pagina)) {
            puntero = -1;
            fallo = false;
        } else {
            memoria[i] = pagina;
            puntero = i;
            fallo = true;

            i = (i + 1) % slots;
        }

        steps.push({
            memoria: [...memoria],
            puntero: puntero,
            fallo: fallo
        });
    }

    return steps;
}

function LRU(demanda, slots) {
    const steps = [];
    let memoria = new Array(slots).fill(null);
    let ultimaConsulta = new Array(slots).fill(-1);

    let puntero;
    let fallo;
    for (let i = 0; i < demanda.length; i++) {
        const pagina = demanda[i];

        if (memoria.includes(pagina)) {
            puntero = memoria.indexOf(pagina);
            fallo = false;
        } else {
            const slotACambiar = ultimaConsulta.indexOf(Math.min(...ultimaConsulta));
            memoria[slotACambiar] = pagina;
            puntero = slotACambiar;
            fallo = true;
        }

        steps.push({
            memoria: [...memoria],
            puntero: puntero,
            fallo: fallo
        });

        ultimaConsulta[puntero] = i;
    }

    return steps;
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
 *
 * @param {number[]} demanda - Secuencia de páginas demandadas
 * @param {number} slots - Cantidad de marcos disponibles
 * @returns {Array} Pasos con { memoria, vidas, puntero, fallo }
 */
function reloj(demanda, slots) {
    const steps = [];
    let memoria = new Array(slots).fill(null);
    let vidas = new Array(slots).fill(0);
    let puntero = 0;

    for (const pagina of demanda) {
        const indiceExistente = memoria.indexOf(pagina);
        let fallo;

        if (indiceExistente !== -1) {
            vidas[indiceExistente] = 1;
            fallo = false;
        } else {
            let avances = 0;
            let indice = puntero;

            while (avances < slots) {
                indice = indice % slots;

                if (vidas[indice] === 0) {
                    memoria[indice] = pagina;
                    vidas[indice] = 1;
                    puntero = (indice + 1) % slots;
                    break;
                }

                vidas[indice] = 0;
                indice++;
                avances++;
            }

            fallo = true;
        }

        steps.push({
            memoria: [...memoria],
            vidas: [...vidas],
            puntero: fallo ? (puntero - 1 + slots) % slots : puntero,
            fallo: fallo
        });
    }

    return steps;
}

module.exports = { FIFO, LRU, reloj };

