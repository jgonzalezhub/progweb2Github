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
 *                 description: ID del proyecto (ObjectId)
 *                 example: 507f1f77bcf86cd799439011
 *               client:
 *                 type: string
 *                 description: ID del cliente (se infiere del proyecto si se omite)
 *                 example: 507f1f77bcf86cd799439012
 *               format:
 *                 type: string
 *                 enum: [material, hours]
 *                 example: hours
 *               description:
 *                 type: string
 *                 example: Instalación de fontanería
 *               workDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-06-01"
 *               material:
 *                 type: string
 *                 example: Tuberías de cobre
 *               quantity:
 *                 type: number
 *                 example: 15
 *               unit:
 *                 type: string
 *                 example: metros
 *               hours:
 *                 type: number
 *                 example: 8
 *               workers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Juan García
 *                     hours:
 *                       type: number
 *                       example: 8
 *     responses:
 *       201:
 *         description: Albarán creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/DeliveryNote'
 *       400:
 *         description: Error de validación o empresa no asociada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Proyecto no encontrado en la empresa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *         description: ID del albarán (ObjectId)
 *     responses:
 *       200:
 *         description: PDF del albarán generado al vuelo
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       302:
 *         description: Redirige al PDF en la nube (albarán ya firmado con pdfUrl guardada)
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Albarán no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *         description: Filtrar por ID de proyecto
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *         description: Filtrar por ID de cliente
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [material, hours]
 *         description: Filtrar por tipo de albarán
 *       - in: query
 *         name: signed
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado de firma
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de trabajo desde (inclusive)
 *         example: "2025-01-01"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de trabajo hasta (inclusive)
 *         example: "2025-12-31"
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -workDate
 *         description: Campo de ordenación (prefijo - para descendente)
 *     responses:
 *       200:
 *         description: Lista paginada de albaranes
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Pagination'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/DeliveryNote'
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authMiddleware, getDeliveryNotes);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   get:
 *     summary: Obtener un albarán por ID (con populate de usuario, cliente y proyecto)
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del albarán (ObjectId)
 *     responses:
 *       200:
 *         description: Datos del albarán con usuario, cliente y proyecto populados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/DeliveryNote'
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Albarán no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', authMiddleware, validateObjectId(), getDeliveryNoteById);

/**
 * @swagger
 * /api/deliverynote/{id}/sign:
 *   patch:
 *     summary: Firmar un albarán con imagen de firma (multipart/form-data)
 *     description: |
 *       Recibe la imagen de firma, la optimiza con Sharp, la sube a Cloudinary,
 *       genera el PDF del albarán y lo sube también a la nube.
 *       Un albarán firmado no puede modificarse ni borrarse.
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del albarán (ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [signature]
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *                 description: Imagen de la firma (PNG, JPG, WebP — máx. 5MB)
 *     responses:
 *       200:
 *         description: Albarán firmado correctamente. Devuelve el albarán actualizado con signatureUrl y pdfUrl.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Albarán firmado correctamente
 *                 data:
 *                   $ref: '#/components/schemas/DeliveryNote'
 *       400:
 *         description: El albarán ya está firmado o falta el fichero de firma
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Albarán no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *         description: ID del albarán (ObjectId)
 *     responses:
 *       200:
 *         description: Albarán eliminado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Albarán eliminado correctamente
 *       400:
 *         description: No se puede borrar un albarán firmado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: true
 *               message: CANNOT_DELETE_SIGNED_NOTE
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Albarán no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authMiddleware, validateObjectId(), deleteDeliveryNote);

export default router;
