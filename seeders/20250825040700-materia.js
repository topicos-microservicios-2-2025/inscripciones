'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Materias', [
      // ------------------------------------
      //           1er. SEMESTRE (NIVEL 1)
      // ------------------------------------
      {
        nombre: 'FISICA I',
        horasDeEstudio: 8, // 4 HT + 4 HP
        sigla: 'FIS100',
        nivel: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'INTRODUCCION A LA INFORMATICA',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF110',
        nivel: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'ESTRUCTURAS DISCRETAS',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF119',
        nivel: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'INGLES TECNICO I',
        horasDeEstudio: 6, // 3 HT + 3 HP
        sigla: 'LIN100',
        nivel: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'CALCULO I',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'MAT101',
        nivel: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // ------------------------------------
      //           2do. SEMESTRE (NIVEL 2)
      // ------------------------------------
      {
        nombre: 'FISICA II',
        horasDeEstudio: 8, // 4 HT + 4 HP
        sigla: 'FIS102',
        nivel: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'PROGRAMACION I',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF120',
        nivel: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'INGLES TECNICO II',
        horasDeEstudio: 6, // 3 HT + 3 HP
        sigla: 'LIN101',
        nivel: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'CALCULO II',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'MAT102',
        nivel: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'ALGEBRA LINEAL',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'MAT103',
        nivel: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // ------------------------------------
      //           3er. SEMESTRE (NIVEL 3)
      // ------------------------------------
      {
        nombre: 'ADMINISTRACION',
        horasDeEstudio: 6, // 3 HT + 3 HP
        sigla: 'ADM100',
        nivel: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'PROGRAMACION II',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF210',
        nivel: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'ARQUITECTURA DE COMPUTADORAS',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF211',
        nivel: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'ECUACIONES DIFERENCIALES',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'MAT207',
        nivel: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'FISICA III',
        horasDeEstudio: 8, // 4 HT + 4 HP
        sigla: 'FIS200',
        nivel: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // OPTATIVAS III (Se le asigna nivel 3)
      {
        nombre: 'TEORIA DE CAMPOS',
        horasDeEstudio: 6, // 3 HT + 3 HP
        sigla: 'ELT241',
        nivel: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'ANALISIS DE CIRCUITOS',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'RDS210',
        nivel: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },


      // ------------------------------------
      //           4to. SEMESTRE (NIVEL 4)
      // ------------------------------------
      {
        nombre: 'CONTABILIDAD',
        horasDeEstudio: 6, // 3 HT + 3 HP
        sigla: 'ADM200',
        nivel: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'ESTRUCTURA DE DATOS I',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF220',
        nivel: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'PROGRAMACION ENSAMBLADOR',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF221',
        nivel: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'PROBABILIDADES Y ESTADIST.I',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'MAT202',
        nivel: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'METODOS NUMERICOS',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'MAT205',
        nivel: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // OPTATIVAS IV (Se le asigna nivel 4)
      {
        nombre: 'ANALISIS DE CIRCUITOS ELECTRONICOS',
        horasDeEstudio: 6, // 3 HT + 3 HP
        sigla: 'RDS220',
        nivel: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // ------------------------------------
      //           5to. SEMESTRE (NIVEL 5)
      // ------------------------------------
      {
        nombre: 'ESTRUCTURAS DE DATOS II',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF310',
        nivel: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'BASE DE DATOS I',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF312',
        nivel: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'PROGRAMAC.LOGICA Y FUNCIONAL',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF318',
        nivel: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'LENGUAJES FORMALES',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF319',
        nivel: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'PROBABILIDADES Y ESTADISTICAS II',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'MAT302',
        nivel: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // ELECTIVAS I (Se le asigna nivel 5)
      {
        nombre: 'MODELADO Y SIMULACION DE SISTEMAS',
        horasDeEstudio: 4, // 2 HT + 2 HP
        sigla: 'ELC101',
        nivel: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'PROGRAMACION GRAFICA',
        horasDeEstudio: 4, // 2 HT + 2 HP
        sigla: 'ELC102',
        nivel: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // OPTATIVAS V (Se le asigna nivel 5)
      {
        nombre: 'ORGANIZACION Y METODOS',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'ADM330',
        nivel: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'ECONOMIA PARA LA GESTION',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'ECO300',
        nivel: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'SISTEMAS LOGICOS Y DIGITALES I',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'ELT352',
        nivel: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'SENALES Y SISTEMAS',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'ELT354',
        nivel: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'ELECTRON. APLICADA A REDES',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'RDS310',
        nivel: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // ------------------------------------
      //           6to. SEMESTRE (NIVEL 6)
      // ------------------------------------
      {
        nombre: 'BASES DE DATOS II',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF322',
        nivel: 6,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'SISTEMAS OPERATIVOS I',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF323',
        nivel: 6,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'COMPILADORES',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF329',
        nivel: 6,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'SISTEMAS DE INFORMACION I',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF342',
        nivel: 6,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'INVESTIG. OPERATIVA I',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'MAT329',
        nivel: 6,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // ------------------------------------
      //           7mo. SEMESTRE (NIVEL 7)
      // ------------------------------------
      {
        nombre: 'SISTEMAS DE INFORMACION II',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF412',
        nivel: 7,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'SISTEMAS OPERATIVOS II',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF413',
        nivel: 7,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'INTELIGENCIA ARTIFICIAL',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF418',
        nivel: 7,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'REDES I',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF433',
        nivel: 7,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'INVESTIGAC.OPERATIVA II',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'MAT419',
        nivel: 7,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // ------------------------------------
      //           8vo. SEMESTRE (NIVEL 8)
      // ------------------------------------
      {
        nombre: 'PREPARAC.Y EVALUAC.DE PROYECTOS',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'ECO449',
        nivel: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'INGENIERIA DE SOFTWARE I',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF422',
        nivel: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'REDES II',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF423',
        nivel: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'SISTEMAS EXPERTOS',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF428',
        nivel: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'SISTEMAS DE INFORM.GEOGRAFICA',
        horasDeEstudio: 6, // 3 HT + 3 HP
        sigla: 'INF442',
        nivel: 8,
        createdAt: new Date(),
        updatedAt: new Date()
      },

      // ------------------------------------
      //           9no. SEMESTRE (NIVEL 9)
      // ------------------------------------
      {
        nombre: 'TALLER DE GRADO I',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF511',
        nivel: 9,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'INGENIERIA DE SOFTWARE II',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF512',
        nivel: 9,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'TECNOLOGIA WEB',
        horasDeEstudio: 6, // 4 HT + 2 HP
        sigla: 'INF513',
        nivel: 9,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'ARQUITECTURA DEL SOFTWARE',
        horasDeEstudio: 6, // 3 HT + 3 HP
        sigla: 'INF552',
        nivel: 9,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Materias', null, {});
  }
};
