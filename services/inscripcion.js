const { Estudiante, Carrera, Facultad, Periodo, Gestion, Detalle_carrera_cursadas, ActaDeNotas, Pre_requisito, Detalle_Inscripcion, DetalleNota, Horario, Boleta_Inscripcion, Plan_de_estudio, Detalle_materia, Grupo_Materia, Aula, Modulo, Materia, Docente, MateriasVencidas, AulaHorario } = require('../models');

const { sequelize } = require('../models');

module.exports = {

    getEstudianteWithMaestroOferta: async (registro) => {

        try {
            const estudiante = await Estudiante
                .findOne(
                    {
                        where: {
                            registro: registro
                        },
                        attributes: ['id', 'ci', 'nombre', 'apellidoPaterno', 'apellidoMaterno', 'fechaNacimiento', 'nacionalidad', 'registro'],
                        include: [
                            {
                                model: Detalle_carrera_cursadas,
                                attributes: {
                                    exclude: ['createdAt', 'updatedAt', 'estudianteId', 'planDeEstudioId']
                                },
                                include: [
                                    {
                                        model: Plan_de_estudio,
                                        attributes: {
                                            exclude: ['createdAt', 'updatedAt']
                                        },
                                    }
                                ]
                            }
                        ],

                    });

            if (!estudiante) {
                throw new Error('Estudiante no encontrado');
            }

            const planDeEstudioId = estudiante.Detalle_carrera_cursadas[0].dataValues.Plan_de_estudio.id;

            // --- 1. OBTENER MATERIAS DEL PLAN DE ESTUDIO CON SUS PRERREQUISITOS ---
            const detallesMaterias = await Detalle_materia.findAll({
                where: {
                    planDeEstudioId: planDeEstudioId
                },
                include: [
                    {
                        model: Materia,
                        // Incluimos los prerrequisitos aquí para hacer la validación en el Paso 3
                        include: [{
                            model: Pre_requisito,
                            as: 'Prerequisitos',
                            attributes: ['prerequisitoId'],
                            required: false
                        }]
                    }
                ]
            });
            // Extraemos las instancias de Materia (que ahora incluyen sus Prerequisitos)
            let materiasPlanDeEstudio = detallesMaterias.map(detalle => detalle.Materium);


            // --- 2. OBTENER MATERIAS VENCIDAS (y sus IDs) ---
            const materiasVencidas = await
                MateriasVencidas.findAll({
                    where: {
                        estudianteId: estudiante.id,
                    },
                    include: {
                        model: Materia, // <-- Estás incluyendo el modelo Materia aquí
                    },
                    attributes: {
                        exclude: ['carreraId']
                    }
                });

            // Crear el Set de IDs vencidos para búsquedas rápidas
            const vencidasIds = new Set(materiasVencidas.map(mv => mv.materiaId));


            // --- 3. APLICAR LÓGICA DE PRERREQUISITOS (Reemplazando el filtro por nivel) ---

            // 3.1. Filtrar Materias Pendientes (que no estén vencidas)
            let materiasPendientes = materiasPlanDeEstudio.filter(materia => !vencidasIds.has(materia.id));

            // 3.2. Aplicar el filtro de Prerrequisitos
            const materiasElegibles = materiasPendientes.filter(materia => {

                const prerequisitosDeMateria = materia.Prerequisitos;

                // Si la materia NO tiene prerrequisitos, es elegible (true).
                if (!prerequisitosDeMateria || prerequisitosDeMateria.length === 0) {
                    return true;
                }

                // Si tiene prerrequisitos, verificar que TODOS estén vencidos.
                const todosPrerequisitosCumplidos = prerequisitosDeMateria.every(prereq => {
                    return vencidasIds.has(prereq.prerequisitoId);
                });

                return todosPrerequisitosCumplidos;
            });

            // Obtenemos solo los IDs de las materias que SÍ puede tomar.
            const materiaIdsElegibles = materiasElegibles.map(materia => materia.id);

            // --- 4. OBTENER MAESTRO OFERTA (con la lista filtrada) ---
            // Usamos la lista de IDs que pasaron el filtro de prerrequisitos
            const maestroOferta = await Materia.findAll({
                where: {
                    id: materiaIdsElegibles // <--- USAMOS LA LISTA FILTRADA POR PRERREQUISITOS
                },
                include: [{
                    model: Grupo_Materia,
                    include: [
                        {
                            model: Docente,
                            attributes: {
                                exclude: ['createdAt', 'updatedAt', 'fechaNac','ci', 'profesion']
                            }
                        },
                        {
                            model: AulaHorario,
                            attributes: {
                                exclude: ['createdAt', 'updatedAt']
                            },
                            include: [
                                {
                                    model: Aula,
                                    attributes: ['numero'],
                                    include: [
                                        {
                                            model: Modulo,
                                            attributes: ['numero', 'nombre'],
                                        }
                                    ]
                                },
                                {
                                    model: Horario,
                                    attributes: ['inicio', 'final', 'dia'],
                                }
                            ]
                        }
                    ],
                    attributes: {
                        exclude: ['createdAt', 'updatedAt']
                    },
                }],
                attributes: { exclude: ['createdAt', 'updatedAt', 'docenteId', 'periodoId'] },
                order: [['nivel', 'ASC']]
            });

            // Opcional: Para el retorno, es mejor devolver las materiasElegibles completas
            return { estudiante, materiasVencidasLista: materiasVencidas.map(mv => mv.Materium), maestroOferta };
        } catch (error) {
            console.error('Error al obtener la oferta académica:', error);
            throw error;
        }
    },

    createInscripcion: async (data) => {
        let t;
        try {
            // 1. Iniciar la transacción
            t = await sequelize.transaction();
            const { estudianteId, grupoMateriasIds } = data;

            // 2. A) Verificar si hay cupo y obtener las instancias de Grupo_Materia
            // Usamos findOne para obtener cada grupo individualmente y asegurar el estado más reciente.
            // Usamos Promise.all para esperar todas las verificaciones.
            const gruposCheck = await Promise.all(grupoMateriasIds.map(id =>
                Grupo_Materia.findOne({
                    where: { id: id },
                    attributes: ['id', 'cupo'],
                    transaction: t, // 👈 CRUCIAL: Leer dentro de la transacción
                    lock: t.LOCK.UPDATE // 👈 Recomendado: Bloquear la fila para evitar concurrencia
                })
            ));

            let sinCupos = [];
            const gruposAInscribirIds = [];

            gruposCheck.forEach(grupo => {
                if (!grupo || grupo.cupo <= 0) {
                    sinCupos.push(grupo.id);
                } else {
                    gruposAInscribirIds.push(grupo.id);
                }
            });

            // 2. B) Validar antes de continuar
            if (sinCupos.length > 0) {
                // Si hay grupos sin cupo, lanzamos un error y el bloque 'catch' lo maneja.
                // NO debes llamar a t.rollback() aquí, ya que el 'catch' lo hará.
                const grupoSinCupo = await Grupo_Materia.findAll({
                    where: { id: sinCupos },
                    include: [
                        {
                            model: Materia
                        }
                    ]
                });
                console.log("grupos sin cupo: ", grupoSinCupo);
                t.rollback(); // Asegurarse de hacer rollback inmediatamente
                return { message: "materias sin cupo", grupoSinCupo };
                //throw new Error(`No hay cupo en los siguientes grupos: ${sinCupos.join(', ')}`);
            }

            // 3. Disminuir el cupo atómicamente (Una sola consulta, más eficiente y seguro)
            await Grupo_Materia.decrement(
                { cupo: 1 },
                {
                    where: { id: gruposAInscribirIds },
                    transaction: t // 👈 CRUCIAL: La disminución ocurre dentro de la transacción
                }
            );

            // 4. Crear la Boleta de Inscripcion
            const boleta = await Boleta_Inscripcion.create({
                estudianteId,
                fecha: new Date(),
            }, { transaction: t }); // 👈 Pasar transacción

            const idBoleta = boleta.dataValues.id;
            console.log("la botlata de id: ", idBoleta)

            // 5. Crear el detalle de inscripcion con bulkCreate
            const detallesInscripcion = gruposAInscribirIds.map((grupoMateriaId) => ({
                grupoMateriaId,
                boletaInscripcionId: idBoleta
            }));

            await Detalle_Inscripcion.bulkCreate(detallesInscripcion, { transaction: t }); // 👈 Pasar transacción

            // 6. Obtener la boleta inscrita (Solo lectura, pero es bueno pasar la transacción)
            const BoletaInscrita = await Boleta_Inscripcion.findOne({
                where: { id: idBoleta },
                include: [
                    {
                        model: Estudiante,
                        attributes: { exclude: ['createdAt', 'updatedAt'] }
                    },
                    {
                        model: Detalle_Inscripcion,
                        include: [
                            {
                                model: Grupo_Materia,
                                include: [
                                    {
                                        model: Materia,
                                        attributes: { exclude: ['createdAt', 'updatedAt'] }
                                    },
                                    {
                                        model: Docente,
                                        attributes: { exclude: ['createdAt', 'updatedAt'] }
                                    },
                                ]
                            }
                        ],
                    }
                ],
                transaction: t
            }); // 👈 Pasar transacción

            console.log(JSON.stringify(BoletaInscrita, null, 2));
            // 7. Si todo salió bien, confirmar
            await t.commit();
            return { message: 'Inscripción creada exitosamente', BoletaInscrita };
        } catch (error) {
            console.error('Error al crear la inscripción:', error);

            // El rollback se ejecuta SOLO si 't' se inicializó y está activo
            if (t && !t.finished) {
                await t.rollback();
            }

            // Manejar el error de "Sin Cupo"
            //if (error.message.startsWith('No hay cupo')) {
            //const sinCuposMatch = error.message.match(/\[(.*?)\]/);
            //const sinCupos = sinCuposMatch ? sinCuposMatch[1].split(', ') : [];
            //    return { message: error.message, sinCupos };
            //}

            // Devolver el error genérico
            return { message: 'Error interno de inscripción', details: error.message };
        }
    }
};