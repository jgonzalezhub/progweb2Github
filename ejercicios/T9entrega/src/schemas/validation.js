const { z } = require("zod");

// Esquema de registro: email válido, nombre no vacío y contraseña mínima de 6 caracteres
const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6),
});

// Esquema de login: solo email y contraseña
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Esquema de creación de libro: todos los campos obligatorios excepto description
const createBookSchema = z.object({
  isbn: z.string().min(1),
  title: z.string().min(1),
  author: z.string().min(1),
  genre: z.string().min(1),
  description: z.string().optional(),
  publishedYear: z.number().int().min(1000).max(new Date().getFullYear()),
  copies: z.number().int().min(1),
  available: z.number().int().min(0).optional(),
});

// Esquema de actualización de libro: todos los campos son opcionales (PATCH parcial)
const updateBookSchema = createBookSchema.partial();

// Esquema de préstamo: solo requiere el ID del libro a pedir prestado
const createLoanSchema = z.object({
  bookId: z.number().int().positive(),
});

// Esquema de reseña: rating obligatorio entre 1-5, comentario opcional
const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  createBookSchema,
  updateBookSchema,
  createLoanSchema,
  createReviewSchema,
};
