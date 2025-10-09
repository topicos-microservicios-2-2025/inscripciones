'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    // 1. Obtener todos los IDs de las materias de la base de datos usando sus siglas.
    const [materias] = await queryInterface.sequelize.query(
      `SELECT id FROM "Materias" ORDER BY id ASC;`
    );

    // 2. Definir las constantes de grupos y docentes
    const grupos = [
      { sigla: 'SC', docenteId: 1 },
      { sigla: 'SA', docenteId: 2 }
    ];
    const periodoId = 1;
    const cupoBase = 15; // Un cupo razonable para el ejemplo

    // 3. Construir el array final de registros
    const registrosFinales = [];

    // Iterar sobre cada materia obtenida de la base de datos
    materias.forEach(materia => {
      // El ID de la materia es el ID real de la base de datos
      const materiaId = materia.id;

      // Crear dos grupos para esta materia
      grupos.forEach(grupo => {
        registrosFinales.push({
          sigla: grupo.sigla,
          docenteId: grupo.docenteId,
          materiaId: materiaId, // El ID real de la materia
          periodoId: periodoId,
          cupo: cupoBase,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
    });

    // 4. Insertar los registros finales
    // Esto insertará 2 * 54 = 108 registros.
    await queryInterface.bulkInsert('Grupo_Materias', registrosFinales, {});
  },


  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Grupo_Materias', null, {});
  }
};
