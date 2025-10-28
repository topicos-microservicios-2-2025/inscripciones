const ErrorBase = require('./ErrorBase');

class ErrorYaInscrito extends ErrorBase {
    constructor(semestre, año) {
        // El mensaje será visible al usuario
        super(`Ya tiene materias inscritas en este semestre ${semestre}, gestion ${año}.`, 'E_YA_INSCRITO', 400);
    }
}

module.exports = ErrorYaInscrito;
