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
import authMiddleware from '../middleware/session.middleware.js';
import checkRol from '../middleware/rol.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { upload } from '../middleware/upload.middleware.js';
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

// Rutas sin autenticación
router.post('/register', validate(registerSchema), registerCtrl);
router.post('/login', validate(loginSchema), loginCtrl);
router.post('/refresh', refreshTokenCtrl);

// Rutas con autenticación
router.get('/', authMiddleware, getMeCtrl);
router.put('/register', authMiddleware, validate(onboardingPersonalSchema), onboardingPersonalCtrl);
router.put('/validation', authMiddleware, validate(validationCodeSchema), validateEmailCtrl);
router.patch('/company', authMiddleware, validate(onboardingCompanySchema), onboardingCompanyCtrl);
router.patch('/logo', authMiddleware, upload.single('logo'), uploadLogoCtrl);
router.post('/logout', authMiddleware, logoutCtrl);
router.delete('/', authMiddleware, deleteUserCtrl);

// Rutas de admin
router.post('/invite', authMiddleware, checkRol(['admin']), validate(inviteSchema), inviteUserCtrl);

// Bonus: cambiar contraseña
router.put('/password', authMiddleware, validate(changePasswordSchema), changePasswordCtrl);

export default router;
