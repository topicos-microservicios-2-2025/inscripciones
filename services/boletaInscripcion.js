const { where } = require('sequelize');
const { Estudiante, Carrera, Facultad, Periodo, Gestion, Detalle_carrera_cursadas, ActaDeNotas, Pre_requisito, Detalle_Inscripcion, DetalleNota, Horario, Boleta_Inscripcion, Plan_de_estudio, Detalle_materia, Grupo_Materia, Aula, Modulo, Materia, Docente, MateriasVencidas, AulaHorario } = require('../models');

const { sequelize } = require('../models');

exports.getBoletaInscripcion = async (registroEstudiante, año=2025, semestre=1) => {
    try {
        const t = await sequelize.transaction();
        // Obtener boleta de inscripción
        const boleta = await Boleta_Inscripcion.findOne({
            include: [
                {
                    model: Periodo,
                    where: { numero: semestre },
                    include: [
                        {
                            model: Gestion,
                            where: { año: año },
                            attributes: ['año']
                        }
                    ],
                    attributes: ['numero']
                },
                {
                    model: Estudiante,
                    where: { registro: registroEstudiante },
                    attributes: ['id', 'registro', 'nombre', 'apellidoPaterno', 'apellidoMaterno']
                },
                {
                    model: Detalle_Inscripcion,
                    include: [
                        {
                            model: Grupo_Materia,
                            attributes: ['id', 'sigla'],
                            include: [
                                {
                                    model: Materia,
                                    attributes: ['id', 'sigla', 'nombre', 'nivel']
                                },
                                {
                                    model: Docente,
                                    attributes: ['id', 'nombre', 'apellidoPaterno', 'apellidoMaterno']
                                },
                                {
                                    model: AulaHorario,
                                    attributes: ['id'],
                                    include: [
                                        {
                                            model: Aula,
                                            attributes: ['id', 'numero'],
                                            include: [
                                                {
                                                    model: Modulo,
                                                    attributes: ['id', 'nombre', 'numero']
                                                }
                                            ]
                                        },
                                        {
                                            model: Horario,
                                            attributes: ['id', 'dia', 'inicio', 'final']
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ],
            attributes: ['id', 'fechaDeInscripcion'],
            transaction: t
        });
        return boleta;
    } catch (error) {
        console.error('Error al obtener boleta de inscripción:', error);
        throw error;
    }
}

