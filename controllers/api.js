// Controlador CRUD para Aula
const models = require('../models');

exports.createAula = async (req, res) => {
    try {
        res.status(201).json("sin construir");
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getEstudianteByRegistro = async (req, res) => {
    try {
        const estudiante = await models.Estudiante.findOne({
            where: { registro: req.params.registro },
            include: [
                // Boletas de Inscripción
                {
                    model: models.Boleta_Inscripcion,
                    include: [
                        {
                            model: models.Detalle_Inscripcion,
                            include: {
                                model: models.Grupo_Materia,
                                include: [
                                    {
                                        model: models.Materia,
                                    },
                                    {
                                        model: models.Docente
                                    }
                                ]
                            }
                        },
                    ]
                },
                // Materias Vencidas
                {
                    model: models.MateriasVencidas,
                    include: {
                        model: models.Detalle_Inscripcion,
                    }
                }
            ]
        });

        if (!estudiante) {
            return res.status(404).json({ 
                mensaje: 'Estudiante no encontrado',
                exito: false 
            });
        }

        return res.status(200).json({
            mensaje: 'Estudiante encontrado exitosamente',
            exito: true,
            data: estudiante
        });

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            mensaje: 'Error al obtener el estudiante',
            exito: false,
            error: error.message
        });
    }
};
