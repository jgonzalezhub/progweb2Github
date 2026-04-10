import { z } from 'zod';

export const createRoomSchema = z.object({
  name: z.string({ required_error: 'El nombre es requerido' }).min(2, 'Mínimo 2 caracteres').max(50),
  description: z.string().max(200).optional()
});
