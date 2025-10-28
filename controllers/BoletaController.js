const { getBoletaInscripcion } = require('../services/boletaInscripcion');

const getCurrentPeriod = () => {
    const fechaActual = new Date();
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth() + 1; // getMonth() es 0-indexado (Enero=0)

    // Semestre 1: Enero (1) a Junio (6)
    // Semestre 2: Julio (7) a Diciembre (12)
    const semestre = (mes >= 1 && mes <= 6) ? 1 : 2;

    return { año: año, semestre: semestre };
};

exports.getBoletaInscripcion = async (req, res) => {
    try {
        const { año, semestre } = getCurrentPeriod();
        console.log(`Año actual: ${año}, Semestre actual: ${semestre}`);
        const registroEstudiante = req.params.registro;
        const boleta = await getBoletaInscripcion(registroEstudiante, año, semestre);
        if (!boleta) {
            return res.status(200).json({
                mensaje: 'Boleta de inscripción no encontrada',
                exito: false
            });
        }
        res.status(200).json({
            mensaje: 'Boleta de inscripción obtenida exitosamente',
            exito: true,
            data: boleta
        });
    } catch (error) {
        console.error('Error en BoletaController:', error);
        res.status(500).json({ 
            mensaje: 'Error al obtener la boleta de inscripción',
            exito: false,
            error: error.message 
        });
    }
}