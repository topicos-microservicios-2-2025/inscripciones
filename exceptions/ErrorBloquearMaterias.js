const ErrorBase = require('./ErrorBase');

class ErrorBloquearMaterias extends ErrorBase {
    constructor(materias) {
        // El mensaje será visible al usuario
        super("La inscripción falló debido a no se pudo bloquear tabla GrupoMateria.", 'E_BLOQUEAR_MATERIAS', 400);

    }
}
module.exports = ErrorBloquearMaterias;