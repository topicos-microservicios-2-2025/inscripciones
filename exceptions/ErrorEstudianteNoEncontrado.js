const ErrorBase = require('./ErrorBase');

class ErrorEstudianteNoEncontrado extends ErrorBase {
    constructor(registro) {
        super(`El estudiante con registro ${registro} no fue encontrado.`, 'E_EST_NO_ENCONTRADO', 404);
    }
}
module.exports = ErrorEstudianteNoEncontrado;