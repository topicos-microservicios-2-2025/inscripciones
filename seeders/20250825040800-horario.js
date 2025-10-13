'use strict';

const generarHorarios = (dia, horaInicio, duracionMinutos, numIntervalos) => {
  // Función auxiliar para formatear HH:MM
  const formatTime = (h, m) => {
    const hour = h.toString().padStart(2, '0');
    const minute = m.toString().padStart(2, '0');
    return `${hour}:${minute}`;
  };

  return Array.from({ length: numIntervalos }, (_, i) => {
    // 1. Calcular los minutos totales de inicio para este intervalo
    // (Hora base en minutos) + (Número de intervalos anteriores * Duración del intervalo)
    const inicioTotalMinutos = (horaInicio * 60) + (i * duracionMinutos);

    console.log(`Generando horario para ${dia} - Intervalo ${i + 1}: inicioTotalMinutos = ${inicioTotalMinutos}`);

    // 2. Calcular la hora y minuto de INICIO
    const startHour = Math.floor(inicioTotalMinutos / 60);
    const startMinute = inicioTotalMinutos % 60;

    console.log(`  Hora de inicio: ${startHour}`);
    console.log(`  Hora de inicio minutos: ${startMinute}`);

    // 3. Calcular la hora y minuto de FIN
    const finalTotalMinutos = inicioTotalMinutos + duracionMinutos;
    const endHour = Math.floor(finalTotalMinutos / 60);
    const endMinute = finalTotalMinutos % 60;

    console.log(`  Hora de fin: ${endHour}`);
    console.log(`  Hora de fin minutos: ${endMinute}`);

    console.log("======================================================")

    return {
      dia: dia,
      inicio: formatTime(startHour, startMinute),
      final: formatTime(endHour, endMinute),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Horarios', [
      // Lunes
      ...generarHorarios('Lunes', 7, 90, 10),   // 7:00 - 22:00
      // Martes
      ...generarHorarios('Martes', 7, 135, 7),  // 7:00 - 22:45
      // Miércoles
      ...generarHorarios('Miércoles', 7, 90, 10), // 7:00 - 22:00
      // Jueves
      ...generarHorarios('Jueves', 7, 135, 7), // 7:00 - 22:45
      // Viernes
      ...generarHorarios('Viernes', 7, 90, 10), // 7:00 - 22:00
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Horarios', null, {});
  }
};
