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

export const createClientSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'El nombre es requerido' }).min(2, 'Mínimo 2 caracteres'),
    cif: z
      .string({ required_error: 'El CIF es requerido' })
      .min(9, 'CIF no válido')
      .max(9, 'CIF no válido')
      .transform((v) => v.toUpperCase()),
    email: z.string().email('Email no válido').optional(),
    phone: z.string().optional(),
    address: addressSchema
  })
});

export const updateClientSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    name: z.string().min(2).optional(),
    cif: z
      .string()
      .min(9)
      .max(9)
      .transform((v) => v.toUpperCase())
      .optional(),
    email: z.string().email('Email no válido').optional(),
    phone: z.string().optional(),
    address: addressSchema
  })
});
