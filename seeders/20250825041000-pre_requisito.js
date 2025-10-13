'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize)  {
    // 1. Definir los datos de prerrequisitos usando SIGLAS (códigos estables)
    // El formato es: { materia_que_requiere: [prerrequisito_1, prerrequisito_2, ...] }
    const prerequisitosPorSigla = {
      // 1er. SEMESTRE (NIVEL 1) estas materias no se insertan ya que no tienen prerrequisitos, pero se entiende que son null
      'FIS100': [null],
      'INF110': [null],
      'LIN100': [null],
      'INF119': [null],
      'MAT101': [null],

      // 2do. SEMESTRE (NIVEL 2)
      'FIS102': ['FIS100'],
      'INF120': ['INF110'],
      'LIN101': ['LIN100'],
      'MAT102': ['MAT101'],
      'MAT103': ['INF119'],

      // 3er. SEMESTRE (NIVEL 3)
      'INF210': ['INF120', 'MAT103'],
      'INF211': ['FIS102', 'INF120'],
      'MAT207': ['MAT102'],
      'FIS200': ['FIS102'],
      // Optativas III
      //'ELT241': ['FIS102'],
      //'RDS210': ['FIS102'],

      // 4to. SEMESTRE (NIVEL 4)
      'ADM200': ['ADM100'],
      'INF220': ['INF210', 'MAT101'],
      'INF221': ['INF211'],
      'MAT202': ['MAT102'],
      'MAT205': ['MAT207'],
      // Optativas IV
      //'RDS220': ['RDS210'],

      // 5to. SEMESTRE (NIVEL 5)
      'INF310': ['INF220'],
      'INF312': ['INF220'],
      'INF318': ['INF220'],
      'INF319': ['INF220'],
      'MAT302': ['MAT202'],
      // Optativas V
      // 'ADM330': ['ADM200'],
      // 'ELT352': ['RDS220'],
      // 'ELT354': ['ELT241'],
      // 'RDS310': ['RDS220'],

      // 6to. SEMESTRE (NIVEL 6)
      'INF322': ['INF312'],
      'INF323': ['INF310'],
      'INF329': ['INF310', 'INF319'],
      'INF342': ['INF312'],
      'MAT329': ['MAT302'],

      // 7mo. SEMESTRE (NIVEL 7)
      'INF412': ['INF322', 'INF342'],
      'INF413': ['INF323'],
      'INF418': ['INF310', 'INF318'],
      'INF433': ['INF323'],
      'MAT419': ['MAT329'],

      // 8vo. SEMESTRE (NIVEL 8)
      'ECO449': ['MAT419'],
      'INF422': ['INF412'],
      'INF423': ['INF433'],
      'INF428': ['INF412', 'INF418'],
      'INF442': ['INF412'],

      // 9no. SEMESTRE (NIVEL 9) - Tienen los mismos 5 prerrequisitos
      'INF511': ['ECO449', 'INF422', 'INF423', 'INF428', 'INF442'],
      'INF512': ['ECO449', 'INF422', 'INF423', 'INF428', 'INF442'],
      'INF513': ['ECO449', 'INF422', 'INF423', 'INF428', 'INF442'],
      'INF552': ['ECO449', 'INF422', 'INF423', 'INF428', 'INF442'],
    };

    // 2. Obtener todos los IDs de las materias de la base de datos
    // Esto asegura que usemos los IDs reales, sin importar su secuencia.
    const [materias] = await queryInterface.sequelize.query(
      `SELECT id, sigla FROM "Materias";`
    );

    // 3. Mapear las siglas a sus IDs
    const siglaToId = materias.reduce((acc, materia) => {
      acc[materia.sigla] = materia.id;
      return acc;
    }, {});

    // 4. Construir el array de inserción final
    const registrosFinales = [];

    // Iterar sobre cada materia que tiene prerrequisitos
    for (const materiaSigla in prerequisitosPorSigla) {
      const materiaId = siglaToId[materiaSigla];
      const prerequisitosSiglas = prerequisitosPorSigla[materiaSigla];

      // Iterar sobre los prerrequisitos de esa materia
      prerequisitosSiglas.forEach(prerequisitoSigla => {
        const prerequisitoId = siglaToId[prerequisitoSigla];

        // Solo insertamos si ambos IDs fueron encontrados (para evitar errores con datos faltantes)
        if (materiaId && prerequisitoId) {
          registrosFinales.push({
            materiaId: materiaId,
            prerequisitoId: prerequisitoId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
            // Esto es útil para debug. Indica qué sigla no se encontró en la tabla 'Materias'.
            console.error(`ERROR: No se encontró el ID para: ${!materiaId ? materiaSigla : prerequisitoSigla}`);
        }
      });
    }

    // 5. Insertar los registros finales
    await queryInterface.bulkInsert('Pre_requisitos', registrosFinales, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Pre_requisitos', null, {});
  }
};
