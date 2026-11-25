/**
 * Helpers de validación de entrada compartidos por los algoritmos.
 */

/**
 * Valida que `valor` sea un entero dentro de [min, max] (límites opcionales).
 * @param {number} valor - Valor a validar
 * @param {string} nombre - Nombre descriptivo para el mensaje de error
 * @param {number} [min] - Límite inferior (inclusivo)
 * @param {number} [max] - Límite superior (inclusivo)
 */
function validarEntero(valor, nombre, { min, max } = {}) {
    if (!Number.isInteger(valor)) {
        throw new Error(`${nombre} debe ser un entero; recibido: ${valor}.`);
    }
    if (min !== undefined && valor < min) {
        throw new Error(`${nombre} debe ser mayor o igual a ${min}; recibido: ${valor}.`);
    }
    if (max !== undefined && valor > max) {
        throw new Error(`${nombre} debe ser menor o igual a ${max}; recibido: ${valor}.`);
    }
}

/**
 * Valida que `valores` sea un arreglo y que todos sus elementos cumplan
 * `validarEntero`.
 * @param {number[]} valores - Arreglo a validar
 * @param {string} nombre - Nombre descriptivo para el mensaje de error
 * @param {number} [min] - Límite inferior (inclusivo)
 * @param {number} [max] - Límite superior (inclusivo)
 */
function validarEnteros(valores, nombre, { min, max } = {}) {
    if (!Array.isArray(valores)) {
        throw new Error(`${nombre} debe ser un arreglo.`);
    }
    for (const v of valores) {
        validarEntero(v, nombre, { min, max });
    }
}

module.exports = { validarEntero, validarEnteros };
