import { Router } from 'express';
import { getRooms, createRoom, getRoomMessages } from '../controllers/rooms.controller.js';
import { authMiddleware } from '../middleware/session.middleware.js';
import { validateBody, validateObjectId } from '../middleware/validate.middleware.js';
import { createRoomSchema } from '../schemas/room.schema.js';

const router = Router();

router.get('/', getRooms);
router.post('/', authMiddleware, validateBody(createRoomSchema), createRoom);
router.get('/:id/messages', validateObjectId(), getRoomMessages);

export default router;
