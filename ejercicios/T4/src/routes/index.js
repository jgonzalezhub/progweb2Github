import { Router } from 'express';
import todosRoutes from './todos.routes.js';

const router = Router();

router.use('/todos', todosRoutes);

router.get('/', (req, res) => {
  res.json({
    mensaje: 'Todo API v1',
    endpoints: {
      todos: '/api/todos',
      health: '/health'
    }
  });
});

export default router;
