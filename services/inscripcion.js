const { Estudiante, Carrera, Facultad, Periodo, Gestion, Detalle_carrera_cursadas, ActaDeNotas, Pre_requisito, Detalle_Inscripcion, DetalleNota, Horario, Boleta_Inscripcion, Plan_de_estudio, Detalle_materia, Grupo_Materia, Aula, Modulo, Materia, Docente, MateriasVencidas, AulaHorario } = require('../models');

const { sequelize } = require('../models');

const ErrorEstudianteNoEncontrado = require('../exceptions/ErrorEstudianteNoEncontrado');
const ErrorSinCupo = require('../exceptions/ErrorSinCupo');
const ErrorColisionHorario = require('../exceptions/ErrorColisionHotario');
const ErrorBloquearMaterias = require('../exceptions/ErrorBloquearMaterias');
const ErrorInscribirDisminuyendoCupos = require('../exceptions/ErrorInscribirDisminuyendoCupos');
const ErrorBoletaInscritaNoEncontrada = require('../exceptions/ErrorBoletaInscritaNoEncontrada');
const ErrorYaInscrito = require('../exceptions/ErrorYaInscrito');

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
                if (grupo == null) {
                    console.log("Grupo no encontrado para id:", id);
                }
                return grupo;
            })
        );
    } catch (error) {
        //console.error("Error al buscar y bloquear grupos materia:", error);
        //throw error; // Propagar el error para manejo externo
        throw new ErrorBloquearMaterias("Error al buscar y bloquear grupos materia");
    }
};

/**
 * Paso 2: Ejecuta la lógica de validación de cupos y lanza un error/hace rollback si falla.
 * Retorna los IDs de los grupos válidos.
 */
const validarCupos = async (gruposCheck, grupoMateriasIds, t) => {
    //try {

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
        //console.warn("Grupos sin cupo:", sinCupos);
        const grupoSinCupo = await Grupo_Materia.findAll({
            where: { id: sinCupos.filter(id => id !== undefined) },
            include: [{ model: Materia }],
            transaction: t
        });
        throw new ErrorSinCupo(grupoSinCupo);
    }
    return {
        success: true,
        gruposAInscribirIds
    };
    //} catch (error) {
    //console.error("Error al validar cupos:", error);
    //throw error; // Propagar el error para manejo externo


    //await t.rollback();
    //throw new Error("Error al validar cupos");
    //};
};

/**
 * Paso 3 checkea la colicion de horarios.
 */
const checkHorarioConflicto = (horarios) => {
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
    if (conflictos.length > 0) {
        throw new ErrorColisionHorario(conflictos);
    }
    return conflictos;
};

/**
 * Paso 3: Disminuye los cupos y crea la boleta/detalles.
 */

const getCurrentPeriod = () => {
    const fechaActual = new Date();
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth() + 1; // getMonth() es 0-indexado (Enero=0)

    // Semestre 1: Enero (1) a Junio (6)
    // Semestre 2: Julio (7) a Diciembre (12)
    const semestre = (mes >= 1 && mes <= 6) ? 1 : 2;

    return { año: año, semestre: semestre };
};
const inscribirDisminuyendoCupos = async (estudianteId, gruposAInscribirIds, t) => {

    try {
        // Disminuir el cupo atómicamente
        await Grupo_Materia.decrement(
            { cupo: 1 },
            { where: { id: gruposAInscribirIds }, transaction: t }
        );

        const { año, semestre } = getCurrentPeriod();
        const periodo = await Periodo.findOne({
            where: { numero: semestre },
            include: [{
                model: Gestion,
                where: { año: año }
            }],
            transaction: t
        });

        if (!periodo) {
            throw new ErrorInscribirDisminuyendoCupos("Periodo no encontrado para año y semestre dados");
        }

        // Crear la Boleta de Inscripcion
        const boleta = await Boleta_Inscripcion.create({
            estudianteId,
            fechaDeInscripcion: new Date(),
            periodoId: periodo.id
        }, { transaction: t });

        const idBoleta = boleta.dataValues.id;

        // Crear el detalle de inscripcion con bulkCreate
        const detallesInscripcion = gruposAInscribirIds.map((grupoMateriaId) => ({
            grupoMateriaId,
            boletaInscripcionId: idBoleta
        }));

        await Detalle_Inscripcion.bulkCreate(detallesInscripcion, { transaction: t });

        return idBoleta;
    } catch (error) {
        throw new ErrorInscribirDisminuyendoCupos(error.details, error.message);
    }
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
        throw new ErrorBoletaInscritaNoEncontrada(error.idBoleta);
    }

};

module.exports = {
    
    getEstudianteWithMaestroOferta: async (registro) => {

        try {
            // 1. Obtener Estudiante y Plan de Estudio
            console.log("Buscando estudiante con registro:", registro);
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
            console.log("Estudiante encontrado:", estudiante.nombre, estudiante.apellidoPaterno);

            // --- 2. OBTENER MATERIAS VENCIDAS (SIEMPRE) ---
            const materiasVencidas = await
                MateriasVencidas.findAll({
                    where: {
                        estudianteId: estudiante.id,
                    },
                    include: {
                        model: Materia,
                    },
                    attributes: {
                        exclude: ['carreraId']
                    }
                });

            console.log(`Materias vencidas encontradas: ${materiasVencidas.length}`);

            // Formatear las materias vencidas para el retorno
            const materiaVencidasR = materiasVencidas.map(mv => {
                let nvm = mv.Materium.dataValues;
                nvm["nota"] = mv.nota;
                return nvm;
            });

            console.log("Materias vencidas formateadas:", materiaVencidasR.length);


            // =========================================================
            // LÓGICA DE VERIFICACIÓN DE BOLETA EXISTENTE
            // =========================================================

            const { año, semestre } = getCurrentPeriod();

            const periodoActual = await Periodo.findOne({
                where: { numero: semestre },
                include: [{
                    model: Gestion,
                    where: { año: año }
                }],
            });

            if (!periodoActual) {
                throw new Error("Periodo no encontrado para año y semestre dados");
            }

            console.log("Periodo actual encontrado:", periodoActual.numero, "Año:", periodoActual.Gestion.año);

            const boletaExistente = await Boleta_Inscripcion.findOne({
                where: {
                    estudianteId: estudiante.id,
                    periodoId: periodoActual.id
                }
            });

            if (boletaExistente) {
                console.log("✅ Boleta de inscripción existente encontrada. Retornando detalles de inscripción.");

                // Si existe, buscar y retornar la boleta completa
                const BoletaInscrita = await buscarBoleta(boletaExistente.id, null);
                console.log("Boleta inscrita obtenida:", BoletaInscrita.id);

                // RETORNO CON BOLETA + VENCIDAS
                return {
                    estudiante,
                    materiasVencidasLista: materiaVencidasR,
                    BoletaInscrita // Se manda BoletaInscrita
                };
            }

            // =========================================================
            // LÓGICA DE MAESTRO OFERTA (SI NO HAY BOLETA)
            // =========================================================

            const planDeEstudioId = estudiante.Detalle_carrera_cursadas[0].dataValues.Plan_de_estudio.id;

            // --- 3. OBTENER MATERIAS DEL PLAN DE ESTUDIO CON SUS PRERREQUISITOS ---
            const detallesMaterias = await Detalle_materia.findAll({
                where: {
                    planDeEstudioId: planDeEstudioId
                },
                include: [
                    {
                        model: Materia,
                        include: [{
                            model: Pre_requisito,
                            as: 'Prerequisitos',
                            attributes: ['prerequisitoId'],
                            required: false
                        }]
                    }
                ]
            });
            let materiasPlanDeEstudio = detallesMaterias.map(detalle => detalle.Materium);

            // Crear el Set de IDs vencidos para búsquedas rápidas (de las materiasVencidas obtenidas arriba)
            const vencidasIds = new Set(materiasVencidas.map(mv => mv.materiaId));


            // --- 4. APLICAR LÓGICA DE PRERREQUISITOS ---

            // 4.1. Filtrar Materias Pendientes
            let materiasPendientes = materiasPlanDeEstudio.filter(materia => !vencidasIds.has(materia.id));

            // 4.2. Aplicar el filtro de Prerrequisitos
            const materiasElegibles = materiasPendientes.filter(materia => {

                const prerequisitosDeMateria = materia.Prerequisitos;

                if (!prerequisitosDeMateria || prerequisitosDeMateria.length === 0) {
                    return true;
                }

                const todosPrerequisitosCumplidos = prerequisitosDeMateria.every(prereq => {
                    return vencidasIds.has(prereq.prerequisitoId);
                });

                return todosPrerequisitosCumplidos;
            });

            // Obtenemos solo los IDs de las materias que SÍ puede tomar.
            const materiaIdsElegibles = materiasElegibles.map(materia => materia.id);

            // --- 5. OBTENER MAESTRO OFERTA ---
            const maestroOferta = await Materia.findAll({
                where: {
                    id: materiaIdsElegibles
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

            console.log("❌ No se encontró boleta. Retornando Maestro Oferta.");

            // RETORNO CON MAESTRO OFERTA + VENCIDAS
            return { estudiante, materiasVencidasLista: materiaVencidasR, maestroOferta };

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

            // =========================================================
            // PASO 0: VERIFICAR INSCRIPCIÓN PREVIA EN EL PERIODO ACTUAL
            // =========================================================
            console.log("Paso 0: Verificando inscripción previa para el estudiante.");

            const { año, semestre } = getCurrentPeriod();

            // 0.1. Buscar el ID del Periodo actual (reutilizando lógica)
            const periodoActual = await Periodo.findOne({
                where: { numero: semestre },
                include: [{
                    model: Gestion,
                    where: { año: año }
                }],
                transaction: t // Incluir en la transacción
            });

            if (!periodoActual) {
                // Si el periodo no está configurado, es un error de sistema.
                throw new Error("El período de inscripción actual no está configurado.");
            }

            // 0.2. Buscar Boleta existente para este estudiante y período
            const boletaExistente = await Boleta_Inscripcion.findOne({
                where: {
                    estudianteId: estudianteId,
                    periodoId: periodoActual.id
                },
                transaction: t
            });

            if (boletaExistente) {
                // Si la boleta existe, revertir la transacción y lanzar el error.
                console.warn("❌ Estudiante ya tiene una boleta para este periodo.");
                throw new ErrorYaInscrito(semestre, año); // Lanzar el nuevo error
            }

            // 1. OBTENER Y BLOQUEAR GRUPOS
            //console.log("Paso 1: Buscando y bloqueando grupos materia:", grupoMateriasIds);
            const gruposCheck = await buscarYBloquearGrupoMaterias(grupoMateriasIds, t);

            //console.log("Grupos materia obtenidos y bloqueados:", gruposCheck);

            // 2. VALIDACIÓN DE CUPOS
            console.log("Paso 2: Validando cupos para los grupos materia bloqueados.");
            const { success, gruposAInscribirIds, grupoSinCupo } = await validarCupos(gruposCheck, grupoMateriasIds, t);

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
                        }] : [] // Si no hay horario, retornamos un array vacío (no agregamos nada
                    )
                );
            //console.log("Horarios a validar:", todosLosHorarios);

            const conflictosDeHorario = checkHorarioConflicto(todosLosHorarios, t);

            // 4. CREACIÓN DE REGISTROS (Requiere la transacción)
            console.log("Paso 4: Creando registros de inscripción y disminuyendo cupos.");
            const idBoleta = await inscribirDisminuyendoCupos(estudianteId, gruposAInscribirIds, t);

            // 5. OBTENER RESULTADO (Requiere la transacción)
            console.log("Paso 5: Obteniendo la boleta de inscripción creada con todos los detalles.");
            const BoletaInscrita = await buscarBoleta(idBoleta, t);

            // 6. CONFIRMAR
            console.log("Inscripción completada exitosamente para estudianteId:", estudianteId);
            await t.commit();
            return {
                success: true,
                result: {
                    message: 'Inscripción creada exitosamente',
                    BoletaInscrita
                }
            };

        } catch (error) {

            console.log("❌❌❌ Error durante el proceso de inscripción, DETENIENDO TRANSACCION❌❌❌");

            if (t) await t.rollback();

            if (error instanceof ErrorBoletaInscritaNoEncontrada) {
                // console.log("Error capturado: Boleta no encontrada");
                return {
                    success: false,
                    result: {
                        message: "no se puedo inscribir por error en la boleta",
                        detalles: error.message
                    }
                };
            }

            if (error instanceof ErrorBloquearMaterias) {
                // console.log("Error capturado: No se pudo bloquear materias");
                return {
                    success: false,
                    result: {
                        message: "no se puedo inscribir por error conflictos en la base de datos",
                        detalles: error.materias
                    }
                };
            }

            if (error instanceof ErrorSinCupo) {
                console.log("Error capturado: Materias Sin cupo");
                const r = {
                    success: false,
                    result: {
                        message: "no se puede inscribir por falta de cupos",
                        grupoSinCupo: error.sinCupos
                    }
                };
                console.log(r);
                return r;
            }

            if (error instanceof ErrorColisionHorario) {
                // console.log("Error capturado: Colision de Horarios");
                return {
                    success: false,
                    result: {
                        message: "no se puede inscribir por colicion de horarios",
                        conflictosDeHorario: error.conflictos
                    }
                };
            }

            if (error instanceof ErrorInscribirDisminuyendoCupos) {
                // console.log("Error capturado: Disminución de cupos al inscribir");
                return {
                    success: false,
                    result: {
                        message: "no se puede inscribir por conflictos en base de datos al disminuir cupos",
                        detalles: error.conflictos
                    }
                };
            }

            if (error instanceof ErrorYaInscrito) {
                console.log("Error capturado: Estudiante ya inscrito en el periodo actual");
                return {
                    success: false,
                    result: {
                        message: error.message
                    }
                };
            }

            // Error genérico no manejado
            console.error("Error no manejado durante la inscripción:", error);
            return {
                success: false,
                result: {
                    message: "no se puedo inscribir por error desconocido",
                    detalles: error.message
                }
            };
        }
    }
};