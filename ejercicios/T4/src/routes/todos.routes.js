import { Router } from 'express';
import * as controller from '../controllers/todos.controller.js';
import { validate } from '../middleware/validateRequest.js';
import {
  createTodoSchema,
  updateTodoSchema,
  idSchema
} from '../schemas/todos.schema.js';

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', validate(idSchema), controller.getById);
router.post('/', validate(createTodoSchema), controller.create);
router.put('/:id', validate(updateTodoSchema), controller.update);
router.delete('/:id', validate(idSchema), controller.remove);
router.patch('/:id/toggle', validate(idSchema), controller.toggle);

export default router;
