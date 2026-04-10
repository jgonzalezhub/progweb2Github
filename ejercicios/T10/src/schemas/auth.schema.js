import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string({ required_error: 'El nombre es requerido' }).min(2, 'Mínimo 2 caracteres').max(100),
  email: z.string({ required_error: 'El email es requerido' }).email('Email no válido'),
  password: z.string({ required_error: 'La contraseña es requerida' }).min(6, 'Mínimo 6 caracteres')
});

export const loginSchema = z.object({
  email: z.string({ required_error: 'El email es requerido' }).email('Email no válido'),
  password: z.string({ required_error: 'La contraseña es requerida' })
});
