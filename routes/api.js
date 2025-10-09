const express = require('express');
const router = express.Router();
const api = require('../controllers/api');
/**
 * @swagger
 * tags:
 *   name: Aulas
 *   description: Endpoints para gestionar aulas
 */

/**
 * @swagger
 * /aulas:
 *   get:
 *     summary: Obtener todas las aulas
 *     tags: [Aulas]
 *     responses:
 *       200:
 *         description: Lista de aulas
 */
router.get('/:registro', api.getEstudianteByRegistro);

module.exports = router;
