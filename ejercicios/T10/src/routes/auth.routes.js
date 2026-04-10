import { Router } from 'express';
import { registerCtrl, loginCtrl, getMeCtrl } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/session.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/register', validateBody(registerSchema), registerCtrl);
router.post('/login', validateBody(loginSchema), loginCtrl);
router.get('/me', authMiddleware, getMeCtrl);

export default router;
