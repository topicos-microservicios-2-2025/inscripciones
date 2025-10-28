var express = require('express');
var router = express.Router();

var boletaController = require("../controllers/BoletaController");

/**
 * @swagger
 * tag:
 *   name: Tasks
 *   description: Endpoints para gestionar tareas asíncronas
 */

/**
 * @swagger
 * /boleta:
 *   post:
 *     summary: para encolar la tarea asincrona
 *     tags: [Boleta]
 *     responses:
 *       200:
 *         description: tarea encolada
 */
//router.post('/', boletaController.createBoletaInscripcion);


/**
 * @swagger
 * /boleta/{registro}:
 *   get:
 *     summary: para ver el estado de la tarea
 *     tags: [Boleta]
 *     responses:
 *       200:
 *         description: tarea encontrada
 *         status: [procesada, procesando, error]
 *         response: {
 *          data: []
 *         }
 */
router.get('/:registro', boletaController.getBoletaInscripcion);


module.exports = router;
