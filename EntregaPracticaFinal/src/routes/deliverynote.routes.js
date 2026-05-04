import { Router } from 'express';
import {
  createDeliveryNote,
  getDeliveryNotes,
  getDeliveryNoteById,
  downloadPDF,
  signDeliveryNote,
  deleteDeliveryNote
} from '../controllers/deliverynote.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { validate, validateObjectId } from '../middleware/validate.middleware.js';
import { uploadImage } from '../middleware/upload.js';
import { createDeliveryNoteSchema } from '../validators/deliverynote.validator.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: DeliveryNotes
 *   description: Gestión de albaranes
 */

/**
 * @swagger
 * /api/deliverynote:
 *   post:
 *     summary: Crear un albarán
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [project, format]
 *             properties:
 *               project:
 *                 type: string
 *               client:
 *                 type: string
 *               format:
 *                 type: string
 *                 enum: [material, hours]
 *               description:
 *                 type: string
 *               workDate:
 *                 type: string
 *                 format: date
 *               material:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *               hours:
 *                 type: number
 *               workers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     hours:
 *                       type: number
 *     responses:
 *       201:
 *         description: Albarán creado
 */
router.post('/', authMiddleware, validate(createDeliveryNoteSchema), createDeliveryNote);

/**
 * @swagger
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     summary: Descargar albarán en PDF
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF del albarán
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       302:
 *         description: Redirige al PDF en la nube (albarán firmado)
 *       404:
 *         description: Albarán no encontrado
 */
router.get('/pdf/:id', authMiddleware, validateObjectId(), downloadPDF);

/**
 * @swagger
 * /api/deliverynote:
 *   get:
 *     summary: Listar albaranes (con paginación y filtros)
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [material, hours]
 *       - in: query
 *         name: signed
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -workDate
 */
router.get('/', authMiddleware, getDeliveryNotes);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   get:
 *     summary: Obtener un albarán por ID (con populate)
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del albarán con usuario, cliente y proyecto poblados
 *       404:
 *         description: Albarán no encontrado
 */
router.get('/:id', authMiddleware, validateObjectId(), getDeliveryNoteById);

/**
 * @swagger
 * /api/deliverynote/{id}/sign:
 *   patch:
 *     summary: Firmar un albarán (multipart/form-data con imagen de firma)
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Albarán firmado correctamente
 *       400:
 *         description: Ya está firmado o falta la firma
 */
router.patch('/:id/sign', authMiddleware, validateObjectId(), uploadImage.single('signature'), signDeliveryNote);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   delete:
 *     summary: Eliminar un albarán (solo si no está firmado)
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Albarán eliminado
 *       400:
 *         description: No se puede borrar un albarán firmado
 */
router.delete('/:id', authMiddleware, validateObjectId(), deleteDeliveryNote);

export default router;
