'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Aulas', [
      // 40 aulas del moduloId 1
      ...Array.from({ length: 40 }, (_, i) => ({
        numero: i + 1,
        capacidad: 30,
        tipo: 'Teorica',
        moduloId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),

      // 10 aulas del moduloId 1 de tipo Laboratorio
      ...Array.from({ length: 10 }, (_, i) => ({
        numero: i + 41,
        capacidad: 40,
        tipo: 'Laboratorio',
        moduloId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),

      // Aulas especiales
      {
        numero: 41,
        capacidad: 250,
        tipo: 'Auditorio',
        moduloId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        numero: 42,
        capacidad: 50,
        tipo: 'Sala de estudio',
        moduloId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },

      // 50 aulas del moduloId 2 de tipo Teorico
      ...Array.from({ length: 50 }, (_, i) => ({
        numero: i + 1,
        capacidad: 25,
        tipo: 'Teorica',
        moduloId: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),

    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Aulas', null, {});
  }
};
