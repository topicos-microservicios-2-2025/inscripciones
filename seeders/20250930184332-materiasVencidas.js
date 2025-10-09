'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    
    // 1. Obtener el ID del primer estudiante (el que tendrá las materias vencidas)
    const [estudiantes] = await queryInterface.sequelize.query(
      // Se asume que el ID más bajo es el primer estudiante insertado
      `SELECT id FROM "Estudiantes" ORDER BY id ASC LIMIT 1;`
    );

    const estudianteId = estudiantes.length ? estudiantes[0].id : null;

    if (!estudianteId) {
        console.error("ERROR: No se encontró ningún estudiante en la base de datos.");
        return;
    }

    // 2. Obtener todos los IDs de las materias de la tabla "Materias"
    // Es crucial ordenar por ID para tomar la "primera mitad" de forma consistente
    const [materias] = await queryInterface.sequelize.query(
      `SELECT id FROM "Materias" ORDER BY id ASC;`
    );
    
    const materiaIds = materias.map(m => m.id);
    const totalMaterias = materiaIds.length;
    
    // 3. Calcular la mitad y seleccionar las materias (usando Math.ceil para asegurar la primera mitad)
    const mitadMaterias = Math.ceil(totalMaterias / 2); 
    // Seleccionamos los IDs de la primera mitad de las materias
    const materiasVencidasIds = materiaIds.slice(0, mitadMaterias); 
    
    // 4. Construir el array final de registros
    const registrosFinales = [];

    materiasVencidasIds.forEach(materiaId => {
      console.log(`Asignando materiaId ${materiaId} como vencida para estudianteId ${estudianteId}`);
      registrosFinales.push({
        estudianteId: estudianteId, // El primer estudiante
        materiaId: materiaId,      // Una de las materias de la primera mitad
        nota: Math.floor(Math.random() * 100) + 51, // Nota aleatoria entre 51 y 100
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    // 5. Insertar los registros en la base de datos
    // Esto insertará aproximadamente 27 registros para el primer estudiante.
    await queryInterface.bulkInsert('MateriasVencidas', registrosFinales, {});
  },

  async down(queryInterface, Sequelize) {
    // Esto eliminará todos los registros de la tabla MateriasVencidas
    await queryInterface.bulkDelete('MateriasVencidas', null, {});
  }
};
