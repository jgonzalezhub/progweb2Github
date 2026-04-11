import { z } from 'zod';

// ============================================================
// Registro: email + password
// ============================================================
export const registerSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'El email es requerido' })
      .email('Email no válido')
      .transform((val) => val.toLowerCase().trim()),
    password: z
      .string({ required_error: 'La contraseña es requerida' })
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
  })
});

// ============================================================
// Validación de código de email
// ============================================================
export const validationCodeSchema = z.object({
  body: z.object({
    code: z
      .string({ required_error: 'El código es requerido' })
      .length(6, 'El código debe tener exactamente 6 dígitos')
      .regex(/^\d{6}$/, 'El código solo debe contener dígitos')
  })
});

// ============================================================
// Login
// ============================================================
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'El email es requerido' })
      .email('Email no válido')
      .transform((val) => val.toLowerCase().trim()),
    password: z.string({ required_error: 'La contraseña es requerida' })
  })
});

// ============================================================
// Onboarding personal (nombre, apellidos, NIF)
// ============================================================
export const onboardingPersonalSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'El nombre es requerido' })
      .min(2, 'Mínimo 2 caracteres')
      .max(50, 'Máximo 50 caracteres'),
    lastName: z
      .string({ required_error: 'Los apellidos son requeridos' })
      .min(2, 'Mínimo 2 caracteres')
      .max(100, 'Máximo 100 caracteres'),
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

// ============================================================
// Onboarding empresa — discriminatedUnion (bonus)
// Autónomo: isFreelance = true → no requiere name de empresa
// Empresa: isFreelance = false → requiere name
// ============================================================
export const onboardingCompanySchema = z.object({
  body: z.discriminatedUnion('isFreelance', [
    z.object({
      isFreelance: z.literal(true),
      cif: z
        .string({ required_error: 'El CIF es requerido' })
        .min(9, 'CIF no válido')
        .max(9, 'CIF no válido')
        .transform((val) => val.toUpperCase()),
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
        .min(9, 'CIF no válido')
        .max(9, 'CIF no válido')
        .transform((val) => val.toUpperCase()),
      name: z
        .string({ required_error: 'El nombre de la empresa es requerido' })
        .min(2, 'Mínimo 2 caracteres'),
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

// ============================================================
// Invitar compañero
// ============================================================
export const inviteSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'El email es requerido' })
      .email('Email no válido')
      .transform((val) => val.toLowerCase().trim())
  })
});

// ============================================================
// Cambiar contraseña — refine (bonus)
// ============================================================
export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z.string({ required_error: 'La contraseña actual es requerida' }),
      newPassword: z
        .string({ required_error: 'La nueva contraseña es requerida' })
        .min(8, 'La contraseña debe tener al menos 8 caracteres'),
      confirmPassword: z.string({ required_error: 'La confirmación es requerida' })
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: 'Las contraseñas no coinciden',
      path: ['confirmPassword']
    })
    .refine((data) => data.newPassword !== data.currentPassword, {
      message: 'La nueva contraseña debe ser diferente a la actual',
      path: ['newPassword']
    })
});
