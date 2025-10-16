const ErrorBase = require('./ErrorBase');

class ErrorColisionHorario extends ErrorBase {
    constructor(conflictos) {
        // El mensaje será visible al usuario
        super("La inscripción falló debido a colisión de horarios entre las materias seleccionadas.", 'E_COLISION_HORARIO', 400);
        this.conflictos = conflictos; // Aquí guardamos el array de conflictos
    }
}
module.exports = ErrorColisionHorario;