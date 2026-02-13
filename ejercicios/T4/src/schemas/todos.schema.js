import { z } from 'zod';

export const idSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
  })
});

export const createTodoSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'El título es requerido').min(3, 'El título debe tener al menos 3 caracteres'),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional()
  }),
  query: z.object({}).strict().optional(),
  params: z.object({}).strict().optional()
});

export const updateTodoSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
  }),
  body: z.object({
    title: z.string().min(3, 'El título debe tener al menos 3 caracteres').optional(),
    description: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
    completed: z.boolean().optional()
  })
});
