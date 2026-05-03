import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'El email es requerido' })
      .email('Email no válido')
      .transform((v) => v.toLowerCase().trim()),
    password: z
      .string({ required_error: 'La contraseña es requerida' })
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
  })
});

export const validationCodeSchema = z.object({
  body: z.object({
    code: z
      .string({ required_error: 'El código es requerido' })
      .length(6, 'El código debe tener exactamente 6 dígitos')
      .regex(/^\d{6}$/, 'El código solo debe contener dígitos')
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'El email es requerido' })
      .email('Email no válido')
      .transform((v) => v.toLowerCase().trim()),
    password: z.string({ required_error: 'La contraseña es requerida' })
  })
});

export const onboardingPersonalSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'El nombre es requerido' }).min(2).max(50),
    lastName: z.string({ required_error: 'Los apellidos son requeridos' }).min(2).max(100),
    nif: z
      .string({ required_error: 'El NIF es requerido' })
      .regex(/^[0-9]{8}[A-Z]$/, 'NIF no válido (formato: 12345678A)'),
    address: z
      .object({
        street: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        postalCode: z.string().optional()
      })
      .optional()
  })
});

export const onboardingCompanySchema = z.object({
  body: z.discriminatedUnion('isFreelance', [
    z.object({
      isFreelance: z.literal(true),
      cif: z
        .string({ required_error: 'El CIF es requerido' })
        .min(9)
        .max(9)
        .transform((v) => v.toUpperCase()),
      address: z
        .object({
          street: z.string().optional(),
          city: z.string().optional(),
          province: z.string().optional(),
          postalCode: z.string().optional()
        })
        .optional()
    }),
    z.object({
      isFreelance: z.literal(false),
      cif: z
        .string({ required_error: 'El CIF es requerido' })
        .min(9)
        .max(9)
        .transform((v) => v.toUpperCase()),
      name: z.string({ required_error: 'El nombre de la empresa es requerido' }).min(2),
      address: z
        .object({
          street: z.string().optional(),
          city: z.string().optional(),
          province: z.string().optional(),
          postalCode: z.string().optional()
        })
        .optional()
    })
  ])
});

export const inviteSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'El email es requerido' })
      .email('Email no válido')
      .transform((v) => v.toLowerCase().trim())
  })
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string({ required_error: 'La contraseña actual es requerida' }),
      newPassword: z
        .string({ required_error: 'La nueva contraseña es requerida' })
        .min(8, 'Mínimo 8 caracteres'),
      confirmPassword: z.string({ required_error: 'La confirmación es requerida' })
    })
    .refine((d) => d.newPassword === d.confirmPassword, {
      message: 'Las contraseñas no coinciden',
      path: ['confirmPassword']
    })
    .refine((d) => d.newPassword !== d.currentPassword, {
      message: 'La nueva contraseña debe ser diferente a la actual',
      path: ['newPassword']
    })
});
