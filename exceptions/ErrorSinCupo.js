const ErrorBase = require('./ErrorBase');

class ErrorSinCupo extends ErrorBase {
    constructor(sinCupos) {
        // El mensaje será visible al usuario
        super("La inscripción no se pudo completar por falta de cupos en algunos grupos.", 'E_SIN_CUPO', 400);
        this.sinCupos = sinCupos; // Aquí guardamos el array de grupos sin cupo
    }
}

module.exports = ErrorSinCupo;
