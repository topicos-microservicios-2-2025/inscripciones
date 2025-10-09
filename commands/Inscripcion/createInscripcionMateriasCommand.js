const BaseCommand = require('../baseCommand');
const { createInscripcion } = require('../../services/inscripcion');

class CreateInscripcionMateriasCommand extends BaseCommand {
  async execute() {
    const { estudianteId, grupoMateriasIds } = this.data;
    const result = await createInscripcion({ estudianteId, grupoMateriasIds });
    return { success: true, result };
  }
}

module.exports = CreateInscripcionMateriasCommand;
