'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Modulos', [
      {
        numero: 1,
        tipo: 'Edificio',
        nombre: 'Edificio FICCT',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        numero: 2,
        tipo: 'Edificio',
        nombre: 'Edificio Derecho',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Modulos', null, {});
  }
};
