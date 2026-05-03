import { Router } from 'express';
import {
  registerCtrl,
  validateEmailCtrl,
  loginCtrl,
  onboardingPersonalCtrl,
  onboardingCompanyCtrl,
  uploadLogoCtrl,
  getMeCtrl,
  refreshTokenCtrl,
  logoutCtrl,
  deleteUserCtrl,
  inviteUserCtrl,
  changePasswordCtrl
} from '../controllers/user.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import checkRol from '../middleware/rol.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { uploadImage } from '../middleware/upload.js';
import { authLimiter } from '../middleware/rate-limit.js';
import {
  registerSchema,
  validationCodeSchema,
  loginSchema,
  onboardingPersonalSchema,
  onboardingCompanySchema,
  inviteSchema,
  changePasswordSchema
} from '../validators/user.validator.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión de usuarios y autenticación
 */

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: Usuario registrado
 *       409:
 *         description: Email ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
const applyAuthLimiter = process.env.NODE_ENV !== 'test' ? authLimiter : (req, res, next) => next();

router.post('/register', applyAuthLimiter, validate(registerSchema), registerCtrl);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login correcto, devuelve token JWT
 *       401:
 *         description: Contraseña incorrecta
 *       403:
 *         description: Email no verificado
 *       404:
 *         description: Usuario no encontrado
 */
router.post('/login', applyAuthLimiter, validate(loginSchema), loginCtrl);

/**
 * @swagger
 * /api/user/refresh:
 *   post:
 *     summary: Renovar access token con refresh token
 *     tags: [Users]
 */
router.post('/refresh', refreshTokenCtrl);

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Obtener usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario
 *       401:
 *         description: No autenticado
 */
router.get('/', authMiddleware, getMeCtrl);

/**
 * @swagger
 * /api/user/register:
 *   put:
 *     summary: Actualizar datos personales (onboarding)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put('/register', authMiddleware, validate(onboardingPersonalSchema), onboardingPersonalCtrl);

/**
 * @swagger
 * /api/user/validation:
 *   put:
 *     summary: Verificar código de email
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 6
 *     responses:
 *       200:
 *         description: Email verificado
 *       429:
 *         description: Máximo de intentos alcanzado
 */
router.put('/validation', authMiddleware, validate(validationCodeSchema), validateEmailCtrl);

/**
 * @swagger
 * /api/user/company:
 *   patch:
 *     summary: Crear o unirse a una empresa
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/company', authMiddleware, validate(onboardingCompanySchema), onboardingCompanyCtrl);

/**
 * @swagger
 * /api/user/logo:
 *   patch:
 *     summary: Subir logo de la empresa
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 */
router.patch('/logo', authMiddleware, uploadImage.single('logo'), uploadLogoCtrl);

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.post('/logout', authMiddleware, logoutCtrl);

/**
 * @swagger
 * /api/user:
 *   delete:
 *     summary: Eliminar cuenta (?soft=true para soft delete)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 */
router.delete('/', authMiddleware, deleteUserCtrl);

/**
 * @swagger
 * /api/user/invite:
 *   post:
 *     summary: Invitar a un compañero (solo admin)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/invite',
  authMiddleware,
  checkRol(['admin']),
  validate(inviteSchema),
  inviteUserCtrl
);

/**
 * @swagger
 * /api/user/password:
 *   put:
 *     summary: Cambiar contraseña
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.put('/password', authMiddleware, validate(changePasswordSchema), changePasswordCtrl);

export default router;
