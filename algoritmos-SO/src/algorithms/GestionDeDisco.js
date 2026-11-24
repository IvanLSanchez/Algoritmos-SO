function enDisco(pista, maxPista, mensajeError) {
    if (pista < 0 || pista > maxPista) {
        throw new Error(mensajeError);
    }
}

function motorDisco(inicio, demanda, seleccionSiguiente, estado = {}, maxPista = 199) {
    enDisco(inicio, maxPista, `La pista inicial ${inicio} esta fuera del rango valido [0, ${maxPista}].`);

    for (const pista of demanda) {
        enDisco(pista, maxPista, `La pista ${pista} de la demanda esta fuera del rango valido [0, ${maxPista}].`);
    }

    const cola = [...demanda];
    const steps = [];
    let actual = inicio;

    function procesarPaso(seleccion) {
        const valor = seleccion && seleccion.valor !== undefined
            ? seleccion.valor
            : seleccion;
        const contar = seleccion && seleccion.contar !== undefined
            ? seleccion.contar
            : true;
        const eliminar = seleccion && seleccion.eliminar !== undefined
            ? seleccion.eliminar
            : true;

        if (valor === null || valor === undefined) {
            return false;
        }

        if (eliminar) {
            const indice = cola.indexOf(valor);
            if (indice !== -1) {
                cola.splice(indice, 1);
            }
        }

        steps.push({
            desde: actual,
            hasta: valor,
            diferencia: contar ? Math.abs(actual - valor) : 0
        });

        actual = valor;
        return true;
    }

    while (cola.length > 0) {
        const seleccion = seleccionSiguiente(actual, cola, estado);

        if (Array.isArray(seleccion)) {
            for (const paso of seleccion) {
                if (!procesarPaso(paso)) {
                    break;
                }
            }
        } else {
            procesarPaso(seleccion);
        }
    }

    return steps;
}

function FIFO(inicio, demanda) {
    return motorDisco(inicio, demanda, (actual, cola) => cola[0]);
}

function SSTF(inicio, demanda) {
    return motorDisco(inicio, demanda, (actual, cola) => {
        return cola.reduce((masCercano, pista) =>
            Math.abs(pista - actual) < Math.abs(masCercano - actual) ? pista : masCercano
        );
    });
}

function SCAN(inicio, demanda, direccionInicial = 'derecha', maxPista = 199) {
    return motorDisco(
        inicio,
        demanda,
        (actual, cola, estado) => {
            const candidatos = cola.filter(p =>
                estado.direccion === 'derecha' ? p >= actual : p <= actual
            );

            if (candidatos.length > 0) {
                const siguiente = estado.direccion === 'derecha'
                    ? Math.min(...candidatos)
                    : Math.max(...candidatos);

                // Si es el último pedido, cerrar al extremo del disco
                if (cola.length === 1) {
                    const extremo = estado.direccion === 'derecha' ? maxPista : 0;
                    return [
                        { valor: siguiente },
                        { valor: extremo, eliminar: false }
                    ];
                }

                return siguiente;
            }

            // Llegó al extremo del disco: registrar el rebote como paso intermedio
            const extremo = estado.direccion === 'derecha' ? maxPista : 0;
            estado.direccion = estado.direccion === 'derecha' ? 'izquierda' : 'derecha';
            return extremo;
        },
        { direccion: direccionInicial }
    );
}

function CSCAN(inicio, demanda, maxPista = 199) {
    return motorDisco(
        inicio,
        demanda,
        (actual, cola, estado) => {
            if (estado.fase === 'subiendo') {
                const mayoresOIguales = cola.filter(p => p >= actual);

                if (mayoresOIguales.length > 0) {
                    return Math.min(...mayoresOIguales);
                }

                // No hay más pedidos hacia arriba: ir al extremo superior
                estado.fase = 'saltando';
                return { valor: maxPista, eliminar: false };
            }

            if (estado.fase === 'saltando') {
                // Del extremo superior salta al extremo inferior (no se cuenta)
                estado.fase = 'bajando';
                return { valor: 0, contar: false, eliminar: false };
            }

            // Fase bajando: atiende los pedidos de menor a mayor
            return Math.min(...cola);
        },
        { fase: 'subiendo' }
    );
}

function LOOK(inicio, demanda, direccionInicial = 'derecha') {
    return motorDisco(
        inicio,
        demanda,
        (actual, cola, estado) => {
            const candidatos = cola.filter(p =>
                estado.direccion === 'derecha' ? p >= actual : p <= actual
            );

            if (candidatos.length > 0) {
                return estado.direccion === 'derecha'
                    ? Math.min(...candidatos)
                    : Math.max(...candidatos);
            }

            // No hay más pedidos en esta dirección: invertir sin ir al extremo
            estado.direccion = estado.direccion === 'derecha' ? 'izquierda' : 'derecha';
            return estado.direccion === 'derecha'
                ? Math.min(...cola)
                : Math.max(...cola);
        },
        { direccion: direccionInicial }
    );
}

function CLOOK(inicio, demanda, direccionInicial = 'derecha') {
    return motorDisco(
        inicio,
        demanda,
        (actual, cola, estado) => {
            if (estado.fase === 'subiendo') {
                const mayoresOIguales = cola.filter(p => p >= actual);

                if (mayoresOIguales.length > 0) {
                    return Math.min(...mayoresOIguales);
                }

                // No hay más pedidos hacia arriba: saltar al más pequeño (no se cuenta)
                estado.fase = 'bajando';
                return { valor: Math.min(...cola), contar: false };
            }

            // Fase bajando: atiende los pedidos de menor a mayor
            return Math.min(...cola);
        },
        { fase: 'subiendo' }
    );
}

module.exports = {
    motorDisco,
    FIFO,
    SSTF,
    SCAN,
    CSCAN,
    LOOK,
    CLOOK
};


