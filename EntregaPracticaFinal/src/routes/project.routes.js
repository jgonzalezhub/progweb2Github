import { Router } from 'express';
import {
  createProject,
  updateProject,
  getProjects,
  getArchivedProjects,
  getProjectById,
  deleteProject,
  restoreProject
} from '../controllers/project.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { validate, validateObjectId } from '../middleware/validate.middleware.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Gestión de proyectos
 */

/**
 * @swagger
 * /api/project:
 *   post:
 *     summary: Crear un proyecto
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, projectCode, client]
 *             properties:
 *               name:
 *                 type: string
 *               projectCode:
 *                 type: string
 *               client:
 *                 type: string
 *               address:
 *                 $ref: '#/components/schemas/Address'
 *               email:
 *                 type: string
 *               notes:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Proyecto creado
 *       409:
 *         description: Código de proyecto ya existe
 */
router.post('/', authMiddleware, validate(createProjectSchema), createProject);

/**
 * @swagger
 * /api/project/archived:
 *   get:
 *     summary: Listar proyectos archivados
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 */
router.get('/archived', authMiddleware, getArchivedProjects);

/**
 * @swagger
 * /api/project:
 *   get:
 *     summary: Listar todos los proyectos (con paginación y filtros)
 *     tags: [Projects]
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
 *         name: client
 *         schema:
 *           type: string
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 */
router.get('/', authMiddleware, getProjects);

/**
 * @swagger
 * /api/project/{id}:
 *   get:
 *     summary: Obtener un proyecto por ID
 *     tags: [Projects]
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
 *         description: Datos del proyecto
 *       404:
 *         description: Proyecto no encontrado
 */
router.get('/:id', authMiddleware, validateObjectId(), getProjectById);

/**
 * @swagger
 * /api/project/{id}:
 *   put:
 *     summary: Actualizar un proyecto
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/:id', authMiddleware, validateObjectId(), validate(updateProjectSchema), updateProject);

/**
 * @swagger
 * /api/project/{id}:
 *   delete:
 *     summary: Eliminar o archivar un proyecto (?soft=true)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 */
router.delete('/:id', authMiddleware, validateObjectId(), deleteProject);

/**
 * @swagger
 * /api/project/{id}/restore:
 *   patch:
 *     summary: Restaurar un proyecto archivado
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.patch('/:id/restore', authMiddleware, validateObjectId(), restoreProject);

export default router;
