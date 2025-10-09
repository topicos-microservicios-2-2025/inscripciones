'use strict';

/** @type {import('sequelize-cli').Migration} */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Primero obtenemos algunos IDs existentes de estudiantes y detalles de inscripción
    
  },

  async down(queryInterface, Sequelize) {
    //await queryInterface.bulkDelete('MateriasVencidas', null, {});
  }
};
