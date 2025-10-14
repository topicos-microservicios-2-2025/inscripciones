const { tryCatch } = require('bullmq');
const { Estudiante, Carrera, Facultad, Periodo, Gestion, Detalle_carrera_cursadas, ActaDeNotas, Pre_requisito, Detalle_Inscripcion, DetalleNota, Horario, Boleta_Inscripcion, Plan_de_estudio, Detalle_materia, Grupo_Materia, Aula, Modulo, Materia, Docente, MateriasVencidas, AulaHorario } = require('../models');

const { sequelize } = require('../models');

// =========================================================================
// FUNCIONES AUXILIARES (InscripcionHelper)
// =========================================================================

/**
 * Paso 1: Obtiene los grupos con bloqueo de fila y sus detalles de horario/materia.
 */
const buscarYBloquearGrupoMaterias = async (grupoMateriasIds, t) => {
    // Esencial: El lock y la transacción deben ir en la consulta

    try {
        await Promise.all(
            grupoMateriasIds.map(id => 
                Grupo_Materia.findOne({
                    where: { id: id },
                    attributes: ['id', 'cupo', 'sigla'],
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                })
            )
        );
        return await Promise.all(
            grupoMateriasIds.map(async id => {
                const grupo = await Grupo_Materia.findOne({
                    where: { id: id },
                    attributes: ['id', 'cupo', 'sigla'],
                    transaction: t,
                    //lock: t.LOCK.UPDATE,
                    include: [
                        {
                            model: Materia,
                            attributes: ['sigla'],
                            //required: true
                        },
                        {
                            model: AulaHorario,
                            attributes: ['grupoMateriaId'],
                            //required: false, // <-- CAMBIO CLAVE: Cambia a INNER JOIN (requerido)
                            include: [{
                                model: Horario,
                                attributes: ['dia', 'inicio', 'final'],
                                //required: false // Asegura que también sea INNER JOIN
                            }]
                        }
                    ]
                });
                if (grupo==null){
                    console.log("Grupo no encontrado para id:", id);
                }
                return grupo;
            })
        );
    } catch (error) {
        console.error("Error al buscar y bloquear grupos materia:", error);
        throw error; // Propagar el error para manejo externo
    }
};

/**
 * Paso 2: Ejecuta la lógica de validación de cupos y lanza un error/hace rollback si falla.
 * Retorna los IDs de los grupos válidos.
 */
const validarCupos = async (gruposCheck, grupoMateriasIds, t) => {
    let sinCupos = [];
    const gruposAInscribirIds = [];

    gruposCheck.forEach(grupo => {
        console.log(grupo.cupo)
        if (grupo.cupo <= 0) {
            sinCupos.push(grupo ? grupo.id : grupoMateriasIds.find(id =>
                !gruposCheck.some(g => g && g.id === id)
            ));
        } else {
            gruposAInscribirIds.push(grupo.id);
        }
    });

    console.log("Grupos sin cupo detectados:", sinCupos);
    if (sinCupos.length > 0) {
        console.warn("Grupos sin cupo:", sinCupos);
        const grupoSinCupo = await Grupo_Materia.findAll({
            where: { id: sinCupos.filter(id => id !== undefined) },
            include: [{ model: Materia }],
            transaction: t
        });

        return {
            success: false,
            grupoSinCupo
        };
    }
    return {
        success: true,
        gruposAInscribirIds
    };
};


/**
 * Paso 3 checkea la colicion de horarios.
 */
function checkHorarioConflicto(horarios) {
    try {
        const conflictos = [];
        const horariosPorDia = horarios.reduce((acc, h) => {
            const dia = h.dia;
            if (!acc[dia]) {
                acc[dia] = [];
            }
            acc[dia].push(h);
            return acc;
        }, {});

        for (const dia in horariosPorDia) {
            const slots = horariosPorDia[dia];

            // 1. Ordenar los slots por hora de inicio (para simplificar la comparación)
            slots.sort((a, b) => a.inicio.localeCompare(b.inicio));

            for (let i = 0; i < slots.length; i++) {
                for (let j = i + 1; j < slots.length; j++) {
                    const slotA = slots[i];
                    const slotB = slots[j];

                    // 2. Condición de Cruce: Si la hora de inicio del slot B es ANTES que la hora de finalización del slot A, hay solapamiento.
                    // slotB.inicio < slotA.final
                    if (slotB.inicio < slotA.final) {
                        conflictos.push({
                            dia: dia,
                            grupoA: `${slotA.materiaSigla}-${slotA.grupoSigla}`,
                            rangoA: `${slotA.inicio}-${slotA.final}`,
                            grupoB: `${slotB.materiaSigla}-${slotB.grupoSigla}`,
                            rangoB: `${slotB.inicio}-${slotB.final}`
                        });
                    }
                }
            }
        }
        return conflictos;

    } catch (error) {
        console.error("Error al verificar conflictos de horario:", error);
        throw error; // Propagar el error para manejo externo
    }
}


/**
 * Paso 3: Disminuye los cupos y crea la boleta/detalles.
 */
const inscribirDisminuyendoCupos = async (estudianteId, gruposAInscribirIds, t) => {

    // Disminuir el cupo atómicamente
    await Grupo_Materia.decrement(
        { cupo: 1 },
        { where: { id: gruposAInscribirIds }, transaction: t }
    );

    // Crear la Boleta de Inscripcion
    const boleta = await Boleta_Inscripcion.create({
        estudianteId,
        fechaDeInscripcion: new Date(),
    }, { transaction: t });

    const idBoleta = boleta.dataValues.id;

    // Crear el detalle de inscripcion con bulkCreate
    const detallesInscripcion = gruposAInscribirIds.map((grupoMateriaId) => ({
        grupoMateriaId,
        boletaInscripcionId: idBoleta
    }));

    await Detalle_Inscripcion.bulkCreate(detallesInscripcion, { transaction: t });

    return idBoleta;
};

const buscarBoleta = async (idBoleta, t) => {
    try {
        const boleta = await Boleta_Inscripcion.findOne({
            where: { id: idBoleta },
            include: [
                {
                    model: Estudiante,
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
        console.error("Error al buscar la boleta de inscripción:", error);
        throw error; // Propagar el error para manejo externo
    }

}

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
                                exclude: ['createdAt', 'updatedAt', 'fechaNac', 'ci', 'profesion']
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
        console.log("Iniciando createInscripcion con data:", data);
        let t;
        try {

            t = await sequelize.transaction();
            const { estudianteId, grupoMateriasIds } = data;

            console.log("Iniciando proceso de inscripción para estudianteId:", estudianteId);

            // 1. OBTENER Y BLOQUEAR GRUPOS
            console.log("Paso 1: Buscando y bloqueando grupos materia:", grupoMateriasIds);
            const gruposCheck = await buscarYBloquearGrupoMaterias(grupoMateriasIds, t);

            console.log("Grupos materia obtenidos y bloqueados:", gruposCheck);

            // 2. VALIDACIÓN DE CUPOS
            console.log("Paso 2: Validando cupos para los grupos materia bloqueados.");
            const { success, gruposAInscribirIds, grupoSinCupo } = await validarCupos(gruposCheck, grupoMateriasIds, t);

            if (!success) {
                console.log("Inscripción fallida: Algunos grupos no tienen cupo.", grupoSinCupo);
                // Ya se hizo rollback dentro de validarCupos
                await t.rollback();
                return {
                    message: "no se puede inscribir por falta de cupos",
                    grupoSinCupo
                }
            }

            // 3. VALIDACIÓN DE HORARIOS
            console.log("Paso 3: Validando conflictos de horario entre los grupos a inscribir.");
            // Obtener todos los horarios de los grupos a inscribir
            // Primero, obtenemos todos los grupos (ya los tenemos en gruposCheck)
            // Luego, filtramos solo los que vamos a inscribir (gruposAInscribirIds)
            // Finalmente, extraemos y aplanamos sus horarios
            const todosLosHorarios = gruposCheck
                .filter(grupo => grupo && gruposAInscribirIds.includes(grupo.id)) // El grupo debe existir
                .flatMap(grupo =>
                    // Aplanamos: por cada grupo, aplanamos sus AulaHorarios
                    grupo.AulaHorarios.flatMap(ah =>
                        // Si hay un horario asociado (no es nulo), creamos el objeto de slot
                        ah.Horario ? [{
                            dia: ah.Horario.dia,
                            inicio: ah.Horario.inicio,
                            final: ah.Horario.final,
                            grupoSigla: grupo.sigla,
                            materiaSigla: grupo.Materium.sigla // Usamos el alias de Materia
                        }] : []
                    )
                );
            console.log("Horarios a validar:", todosLosHorarios);

            const conflictosDeHorario = checkHorarioConflicto(todosLosHorarios);

            if (conflictosDeHorario.length > 0) {
                console.log("Inscripción fallida: Conflictos de horario detectados.", conflictosDeHorario);
                // ... (Lógica de formateo de error de horario) ...
                await t.rollback();
                return {
                    message: "no se puede inscribir por colicion de horarios",
                    conflictosDeHorario
                }
            }

            // 4. CREACIÓN DE REGISTROS (Requiere la transacción)
            console.log("Paso 4: Creando registros de inscripción y disminuyendo cupos.");
            const idBoleta = await inscribirDisminuyendoCupos(estudianteId, gruposAInscribirIds, t);

            // 5. OBTENER RESULTADO (Requiere la transacción)
            console.log("Paso 5: Obteniendo la boleta de inscripción creada con todos los detalles.");
            const BoletaInscrita = await buscarBoleta(idBoleta, t);

            // 6. CONFIRMAR
            console.log("Inscripción completada exitosamente para estudianteId:", estudianteId);
            await t.commit();
            return { message: 'Inscripción creada exitosamente', BoletaInscrita };

        } catch (error) {
            console.error("Error durante el proceso de inscripción:", error);
            if (t) await t.rollback();
            throw error;
        }
    }
};