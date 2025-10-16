const ErrorBase = require('./ErrorBase');

class ErrorBoletaInscritaNoEncontrada extends ErrorBase {
    constructor(idBoleta) {
        super(`La boleta de inscripción con idBoleta ${idBoleta} no fue encontrada.`, 'E_BOLETA_INSCRITA_NO_ENCONTRADA', 400);
    }
}
module.exports = ErrorBoletaInscritaNoEncontrada;