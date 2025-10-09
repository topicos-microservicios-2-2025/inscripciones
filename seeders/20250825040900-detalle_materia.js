'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    // 1. Definir los créditos por sigla (basado en la columna CR de tu tabla original)
    const creditosPorSigla = {
      // 1er Semestre
      'FIS100': 6, 'INF110': 5, 'INF119': 5, 'LIN100': 4, 'MAT101': 5,
      // 2do Semestre
      'FIS102': 6, 'INF120': 5, 'LIN101': 4, 'MAT102': 5, 'MAT103': 5,
      // 3er Semestre
      'ADM100': 4, 'INF210': 5, 'INF211': 5, 'MAT207': 5, 'FIS200': 6,
      // Optativas III
      'ELT241': 4, 'RDS210': 5,
      // 4to Semestre
      'ADM200': 4, 'INF220': 5, 'INF221': 5, 'MAT202': 5, 'MAT205': 5,
      // Optativas IV
      'RDS220': 4,
      // 5to Semestre
      'INF310': 5, 'INF312': 5, 'INF318': 5, 'INF319': 5, 'MAT302': 5,
      // Electivas I
      'ELC101': 3, 'ELC102': 3,
      // Optativas V
      'ADM330': 5, 'ECO300': 5, 'ELT352': 5, 'ELT354': 5, 'RDS310': 5,
      // 6to Semestre
      'INF322': 5, 'INF323': 5, 'INF329': 5, 'INF342': 5, 'MAT329': 5,
      // 7mo Semestre
      'INF412': 5, 'INF413': 5, 'INF418': 5, 'INF433': 5, 'MAT419': 5,
      // 8vo Semestre
      'ECO449': 5, 'INF422': 5, 'INF423': 5, 'INF428': 5, 'INF442': 4,
      // 9no Semestre
      'INF511': 5, 'INF512': 5, 'INF513': 5, 'INF552': 4,
    };
    
    // 2. Obtener el ID del Plan de Estudios
    // Usamos el código 'INF-2023' para asegurar que encontramos el plan correcto.
    const [planDeEstudio] = await queryInterface.sequelize.query(
      `SELECT id FROM "Plan_de_estudios" WHERE codigo = 'INF-2023' LIMIT 1;`
    );

    const planDeEstudioId = planDeEstudio.length ? planDeEstudio[0].id : null;

    if (!planDeEstudioId) {
        console.error("ERROR: No se encontró el Plan de Estudio con código 'INF-2023'.");
        return;
    }

    // 3. Obtener todos los IDs y siglas de las Materias
    const [materias] = await queryInterface.sequelize.query(
      `SELECT id, sigla FROM "Materias";`
    );

    const registrosFinales = [];

    // 4. Mapear materias, plan y créditos para la inserción
    materias.forEach(materia => {
      const creditos = creditosPorSigla[materia.sigla];

      if (creditos !== undefined) {
        registrosFinales.push({
          creditos: creditos,
          planDeEstudioId: planDeEstudioId,
          materiaId: materia.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        // Esto indica si alguna materia se insertó pero se olvidó el crédito en el mapa
        console.warn(`ADVERTENCIA: No se encontró la definición de créditos para la sigla: ${materia.sigla}`);
      }
    });

    // 5. Insertar los registros finales
    await queryInterface.bulkInsert('Detalle_materia', registrosFinales, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Detalle_materia', null, {});
  }
};
