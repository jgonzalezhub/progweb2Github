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
 *                 example: Reforma Oficina Central
 *               projectCode:
 *                 type: string
 *                 example: PRJ-2025-001
 *               client:
 *                 type: string
 *                 description: ID del cliente (ObjectId)
 *                 example: 507f1f77bcf86cd799439011
 *               address:
 *                 $ref: '#/components/schemas/Address'
 *               email:
 *                 type: string
 *                 format: email
 *                 example: contacto@proyecto.com
 *               notes:
 *                 type: string
 *                 example: Proyecto con acceso limitado los lunes
 *               active:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Proyecto creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Project'
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
 *         description: Cliente no encontrado en la empresa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Ya existe un proyecto con ese código en la empresa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authMiddleware, validate(createProjectSchema), createProject);

/**
 * @swagger
 * /api/project/archived:
 *   get:
 *     summary: Listar proyectos archivados (con paginación)
 *     tags: [Projects]
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
 *     responses:
 *       200:
 *         description: Lista paginada de proyectos archivados
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
 *                         $ref: '#/components/schemas/Project'
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *         description: Filtrar por ID de cliente
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Búsqueda parcial por nombre (insensible a mayúsculas)
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo/inactivo
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *         description: Campo de ordenación (prefijo - para descendente)
 *     responses:
 *       200:
 *         description: Lista paginada de proyectos
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
 *                         $ref: '#/components/schemas/Project'
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *         description: ID del proyecto (ObjectId de MongoDB)
 *     responses:
 *       200:
 *         description: Datos del proyecto con cliente populado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Proyecto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *                 format: email
 *               notes:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Proyecto actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Error de validación
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
 *         description: Proyecto o cliente no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Ya existe un proyecto con ese código en la empresa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', authMiddleware, validateObjectId(), validate(updateProjectSchema), updateProject);

/**
 * @swagger
 * /api/project/{id}:
 *   delete:
 *     summary: Eliminar o archivar un proyecto
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
 *         description: Si true archiva (soft delete), si false borra definitivamente
 *     responses:
 *       200:
 *         description: Proyecto eliminado o archivado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Proyecto archivado correctamente
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Proyecto no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *     responses:
 *       200:
 *         description: Proyecto restaurado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Proyecto restaurado correctamente
 *       401:
 *         description: Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Proyecto no encontrado o no archivado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id/restore', authMiddleware, validateObjectId(), restoreProject);

export default router;
