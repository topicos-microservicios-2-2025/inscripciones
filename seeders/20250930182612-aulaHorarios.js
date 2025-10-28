'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    // --- 1. OBTENER IDs NECESARIOS DE LA BASE DE DATOS (SIN CAMBIOS) ---

    const allHorariosData = await queryInterface.sequelize.query(
      `SELECT id, dia, inicio AS "horaInicio", final AS "horaFin" FROM "Horarios" 
       ORDER BY inicio ASC, final ASC, 
         CASE dia WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3 WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 END;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const bloquesTiempoMap = {};
    const bloquesTiempoKeys = [];
    allHorariosData.forEach(h => {
      const key = `${h.horaInicio}_${h.horaFin}`;
      if (!bloquesTiempoMap[key]) {
        bloquesTiempoMap[key] = [];
        bloquesTiempoKeys.push(key);
      }
      bloquesTiempoMap[key].push(h);
    });

    const aulasData = await queryInterface.sequelize.query(
      `SELECT id FROM "Aulas" ORDER BY id ASC;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const numAulas = aulasData.length;

    const gruposMateriaData = await queryInterface.sequelize.query(
      `SELECT id FROM "Grupo_Materias" ORDER BY id ASC;`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const numGrupos = gruposMateriaData.length;

    if (numGrupos == 0 || numAulas == 0 || bloquesTiempoKeys.length == 0) {
      console.log("Advertencia: Faltan datos cruciales. Abortando.");
      return;
    }

    // --- 2. DEFINICIÓN DE ASIGNACIONES y ALGORITMO (MODIFICADO) ---

    const aulaHorarioEntries = [];

    let aulaIndex = 0;          
    let bloqueKeyIndex = 0;     

    const GRUPOS_POR_BLOQUE = 5;
    const modalidad3Dias = ['Lunes', 'Miércoles', 'Viernes'];
    const modalidad2Dias = ['Martes', 'Jueves'];
    const MAX_REINTENTOS = bloquesTiempoKeys.length; // Máximo de veces que intentamos buscar un bloque

    gruposMateriaData.forEach((grupo, grupoIndex) => {
      const grupoMateriaId = grupo.id;

      // Determinamos el modo y los días
      const is3DayMode = (grupoIndex % 2 === 0);
      const diasAsignar = is3DayMode ? modalidad3Dias : modalidad2Dias;
      const diasRequeridos = diasAsignar.length;
      let asignacionesExitosas = 0;

      // --- CONTROL DE AVANCE DEL BLOQUE DE TIEMPO (Lógica Original) ---
      if (grupoIndex > 0 && grupoIndex % GRUPOS_POR_BLOQUE === 0) {
        bloqueKeyIndex++;
      }
      // Aseguramos que el índice no exceda el límite
      if (bloqueKeyIndex >= bloquesTiempoKeys.length) {
        bloqueKeyIndex = 0;
      }
      
      // --- BÚSQUEDA ROBUSTA Y ASIGNACIÓN (Lógica Corregida) ---
      
      const aulaId = aulasData[aulaIndex % numAulas].id;
      let intentos = 0;
      let bloqueFinalValido = null;
      
      // Intentamos encontrar un bloque de tiempo válido que contenga todos los días necesarios.
      while (intentos < MAX_REINTENTOS) {
          const keyActual = bloquesTiempoKeys[bloqueKeyIndex % bloquesTiempoKeys.length];
          const horariosBloqueActual = bloquesTiempoMap[keyActual];
          
          let diasEncontrados = 0;
          
          // Verificamos cuántos días requeridos existen en este bloque de tiempo
          diasAsignar.forEach(diaObjetivo => {
              const horarioEncontrado = horariosBloqueActual.find(h => h.dia === diaObjetivo);
              if (horarioEncontrado) {
                  diasEncontrados++;
              }
          });
          
          // Si encontramos todos los días, este es nuestro bloque de asignación
          if (diasEncontrados === diasRequeridos) {
              bloqueFinalValido = keyActual;
              break; 
          }
          
          // Si no es válido, pasamos al siguiente bloque de tiempo y reintentamos.
          bloqueKeyIndex++;
          intentos++;
          
          // Ciclar el índice para no salir del array de bloques
          if (bloqueKeyIndex >= bloquesTiempoKeys.length) {
              bloqueKeyIndex = 0;
          }
      }

      // Si se encontró un bloque final válido, procedemos a la asignación
      if (bloqueFinalValido) {
          const horariosBloqueFinal = bloquesTiempoMap[bloqueFinalValido];

          diasAsignar.forEach(diaObjetivo => {
              const horarioEncontrado = horariosBloqueFinal.find(h => h.dia === diaObjetivo);
              
              if (horarioEncontrado) {
                  aulaHorarioEntries.push({
                      aulaId: aulaId,
                      horarioId: horarioEncontrado.id,
                      grupoMateriaId: grupoMateriaId,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                  });
                  asignacionesExitosas++;
              }
          });
      }

      // Advertencia si no se logró la asignación completa.
      if (asignacionesExitosas !== diasRequeridos) {
          console.warn(`⚠️ Grupo ${grupoMateriaId} (Índice ${grupoIndex}) NO PUDO ser asignado COMPLETAMENTE. Solo se asignaron ${asignacionesExitosas} de ${diasRequeridos} días. Posiblemente faltan horarios en la tabla base.`);
      }

      // Avanzamos al siguiente aula para el siguiente Grupo Materia (independiente de si hubo éxito)
      aulaIndex++;
    });

    // --- 3. INSERCIÓN MASIVA (SIN CAMBIOS) ---
    console.log(`Insertando ${aulaHorarioEntries.length} asignaciones en AulaHorario. (Total Grupos: ${numGrupos})`);
    await queryInterface.bulkInsert('AulaHorarios', aulaHorarioEntries, {});

  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('AulaHorarios', null, {});
  }
};