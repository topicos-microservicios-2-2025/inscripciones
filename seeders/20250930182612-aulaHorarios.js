'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    // --- 1. OBTENER IDs NECESARIOS DE LA BASE DE DATOS ---

    // a) OBTENER TODOS LOS HORARIOS Y AGRUPARLOS POR BLOQUE DE TIEMPO (inicio/fin)
    const allHorariosData = await queryInterface.sequelize.query(
      `SELECT id, dia, inicio AS "horaInicio", final AS "horaFin" FROM "Horarios" 
       ORDER BY inicio ASC, final ASC, 
         CASE dia WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3 WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 END;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Agrupamos los horarios por la llave (inicio/fin) y mantenemos los días ordenados
    const bloquesTiempoMap = {};
    const bloquesTiempoKeys = []; // Array para mantener el ORDEN de los bloques (7:00, 8:30, 9:15, etc.)

    allHorariosData.forEach(h => {
      const key = `${h.inicio}_${h.horaFin}`;
      if (!bloquesTiempoMap[key]) {
        bloquesTiempoMap[key] = [];
        bloquesTiempoKeys.push(key);
      }
      bloquesTiempoMap[key].push(h);
    });

    // b) OBTENER IDs DE AULAS (Los 52 IDs)
    const aulasData = await queryInterface.sequelize.query(
      `SELECT id FROM "Aulas" ORDER BY id ASC;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const numAulas = aulasData.length; // 52

    // c) OBTENER IDs DE GRUPO_MATERIA (Los 108 IDs)
    const gruposMateriaData = await queryInterface.sequelize.query(
      `SELECT id FROM "Grupo_Materias" ORDER BY id ASC;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const numGrupos = gruposMateriaData.length; // 108

    if (numGrupos === 0 || numAulas === 0 || bloquesTiempoKeys.length === 0) {
      console.log("Advertencia: Faltan datos cruciales. Abortando.");
      return;
    }

    // --- 2. DEFINICIÓN DE ASIGNACIONES y ALGORITMO ---

    const aulaHorarioEntries = [];

    // Variables de control de posición:
    let aulaIndex = 0;          // Controla qué Aula se usa (avanza en cada grupo)
    let bloqueKeyIndex = 0;     // Controla qué Bloque de Tiempo se usa (avanza cada 5 grupos)

    // Variables de configuración de asignación:
    const GRUPOS_POR_BLOQUE = 5;
    const modalidad3Dias = ['Lunes', 'Miércoles', 'Viernes'];
    const modalidad2Dias = ['Martes', 'Jueves'];

    // Iteramos sobre todos los grupos (108 grupos)
    gruposMateriaData.forEach((grupo, grupoIndex) => {
      const grupoMateriaId = grupo.id;

      // --- CONTROL DE AVANCE DEL BLOQUE DE TIEMPO (El nuevo requerimiento) ---
      // Si el índice del grupo es múltiplo de GRUPOS_POR_BLOQUE (cada 5 grupos), avanzamos al siguiente horario.
      if (grupoIndex > 0 && grupoIndex % GRUPOS_POR_BLOQUE === 0) {
        bloqueKeyIndex++;
      }

      // Si ya usamos todos los bloques de tiempo (ej., hasta las 22:45), volvemos al inicio.
      if (bloqueKeyIndex >= bloquesTiempoKeys.length) {
        bloqueKeyIndex = 0;
        // Opcional: Podríamos reiniciar el aulaIndex aquí también si quisiéramos reutilizar Aulas 1-52 completamente
      }

      // --- SELECCIÓN DE DÍAS Y BLOQUE DE TIEMPO ---

      const is3DayMode = (grupoIndex % 2 === 0);
      const diasAsignar = is3DayMode ? modalidad3Dias : modalidad2Dias;

      // Obtenemos el bloque de horarios actual (ej., todos los horarios 08:30:00-10:00:00)
      const bloqueKey = bloquesTiempoKeys[bloqueKeyIndex];
      const horariosBloqueActual = bloquesTiempoMap[bloqueKey];

      // --- ASIGNACIÓN DE AULA Y CREACIÓN DE ENTRADAS ---

      // Asignamos la siguiente Aula (Garantiza unicidad de la combinación Aula-Horario)
      const aulaId = aulasData[aulaIndex % numAulas].id;

      diasAsignar.forEach(diaObjetivo => {

        // Encontramos el ID de Horario para el DÍA y el BLOQUE DE TIEMPO actual
        const horarioEncontrado = horariosBloqueActual.find(h => h.dia === diaObjetivo);

        if (horarioEncontrado) {
          aulaHorarioEntries.push({
            aulaId: aulaId,
            horarioId: horarioEncontrado.id,
            grupoMateriaId: grupoMateriaId,

            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      });

      // Avanzamos al siguiente aula para el siguiente Grupo Materia
      aulaIndex++;
    });

    // --- 3. INSERCIÓN MASIVA ---
    console.log(`Insertando ${aulaHorarioEntries.length} asignaciones en AulaHorario. (Total Grupos: ${numGrupos})`);
    await queryInterface.bulkInsert('AulaHorarios', aulaHorarioEntries, {});

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('AulaHorarios', null, {});
  }
};