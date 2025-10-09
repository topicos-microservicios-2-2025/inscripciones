const BaseCommand = require('../baseCommand');
const { getEstudianteWithMaestroOferta } = require('../../services/inscripcion');

class GetEstudianteWithMaestroOfertaCommand extends BaseCommand {
  async execute() {
    const { registro } = this.data;
    const estudiante = await getEstudianteWithMaestroOferta(registro);
    return { success: true, estudiante };
  }
}

module.exports = GetEstudianteWithMaestroOfertaCommand;
