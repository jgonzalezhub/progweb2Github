import { z } from 'zod';

const addressSchema = z
  .object({
    street: z.string().optional(),
    number: z.string().optional(),
    postal: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional()
  })
  .optional();

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'El nombre es requerido' }).min(2),
    projectCode: z.string({ required_error: 'El código de proyecto es requerido' }).min(1),
    client: z.string({ required_error: 'El cliente es requerido' }),
    address: addressSchema,
    email: z.string().email('Email no válido').optional(),
    notes: z.string().optional(),
    active: z.boolean().optional()
  })
});

export const updateProjectSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    name: z.string().min(2).optional(),
    projectCode: z.string().min(1).optional(),
    client: z.string().optional(),
    address: addressSchema,
    email: z.string().email().optional(),
    notes: z.string().optional(),
    active: z.boolean().optional()
  })
});
