const ErrorBase = require('./ErrorBase');

class ErrorInscribirDisminuyendoCupos extends ErrorBase {
    constructor(conflictos, mensaje) {
        // El mensaje será visible al usuario
        super(mensaje, 'E_INSCRIPCION_CON_DISMINUCION_CUPOS', 400);
        this.conflictos = conflictos; // Aquí guardamos el array de conflictos
    }
}
module.exports = ErrorInscribirDisminuyendoCupos;