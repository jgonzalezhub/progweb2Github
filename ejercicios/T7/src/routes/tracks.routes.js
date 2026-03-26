// src/routes/tracks.routes.js
import { Router } from 'express';
import authMiddleware from '../middleware/session.middleware.js';
import checkRol from '../middleware/rol.middleware.js';
import * as controller from '../controllers/tracks.controller.js';

const router = Router();

// Públicas
router.get('/', controller.getTracks);
router.get('/:id', controller.getTrack);

// Requiere autenticación
router.post('/', 
  authMiddleware,              // 1. Verificar token
  checkRol(['admin', 'user']), // 2. Solo admin o user
  controller.createTrack
);

// Solo admin puede eliminar
router.delete('/:id',
  authMiddleware,              // 1. Verificar token  
  checkRol(['admin']),         // 2. Solo admin
  controller.deleteTrack
);

export default router;