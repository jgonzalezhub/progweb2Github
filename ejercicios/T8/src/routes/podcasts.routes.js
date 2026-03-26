// src/routes/podcasts.routes.js
import { Router } from 'express';
import {
  getPodcastsCtrl,
  getAllPodcastsCtrl,
  getPodcastCtrl,
  createPodcastCtrl,
  updatePodcastCtrl,
  deletePodcastCtrl,
  publishPodcastCtrl
} from '../controllers/podcasts.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { podcastSchema, updatePodcastSchema } from '../validators/podcast.validator.js';
import authMiddleware from '../middleware/session.middleware.js';
import checkRol from '../middleware/rol.middleware.js';

const router = Router();

/**
 * @openapi
 * /api/podcasts:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: Listar podcasts publicados
 *     responses:
 *       200:
 *         description: Lista de podcasts publicados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 podcasts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Podcast'
 */
router.get('/', getPodcastsCtrl);

/**
 * @openapi
 * /api/podcasts/admin/all:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: Listar todos los podcasts (admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todos los podcasts incluidos no publicados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 podcasts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Podcast'
 *       401:
 *         $ref: '#/components/responses/ErrorResponse'
 *       403:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/admin/all', authMiddleware, checkRol(['admin']), getAllPodcastsCtrl);

/**
 * @openapi
 * /api/podcasts/{id}:
 *   get:
 *     tags:
 *       - Podcasts
 *     summary: Obtener un podcast por id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Podcast encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 podcast:
 *                   $ref: '#/components/schemas/Podcast'
 *       404:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.get('/:id', getPodcastCtrl);

/**
 * @openapi
 * /api/podcasts:
 *   post:
 *     tags:
 *       - Podcasts
 *     summary: Crear podcast
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PodcastInput'
 *     responses:
 *       201:
 *         description: Podcast creado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 podcast:
 *                   $ref: '#/components/schemas/Podcast'
 *       401:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.post('/', authMiddleware, validate(podcastSchema), createPodcastCtrl);

/**
 * @openapi
 * /api/podcasts/{id}:
 *   put:
 *     tags:
 *       - Podcasts
 *     summary: Actualizar propio podcast
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
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PodcastInput'
 *     responses:
 *       200:
 *         description: Podcast actualizado
 *       401:
 *         $ref: '#/components/responses/ErrorResponse'
 *       403:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.put('/:id', authMiddleware, validate(updatePodcastSchema), updatePodcastCtrl);

/**
 * @openapi
 * /api/podcasts/{id}:
 *   delete:
 *     tags:
 *       - Podcasts
 *     summary: Eliminar podcast (admin)
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
 *         description: Podcast eliminado
 *       401:
 *         $ref: '#/components/responses/ErrorResponse'
 *       403:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.delete('/:id', authMiddleware, checkRol(['admin']), deletePodcastCtrl);

/**
 * @openapi
 * /api/podcasts/{id}/publish:
 *   patch:
 *     tags:
 *       - Podcasts
 *     summary: Publicar/despublicar podcast (admin)
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
 *         description: Estado de publicación actualizado
 *       401:
 *         $ref: '#/components/responses/ErrorResponse'
 *       403:
 *         $ref: '#/components/responses/ErrorResponse'
 */
router.patch('/:id/publish', authMiddleware, checkRol(['admin']), publishPodcastCtrl);

export default router;
