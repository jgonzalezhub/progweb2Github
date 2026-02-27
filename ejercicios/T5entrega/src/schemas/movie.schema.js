import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const createMovieSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    director: z.string(),
    year: z.number().min(1888).max(currentYear),
    genre: z.enum(['action', 'comedy', 'drama', 'horror', 'scifi']),
    copies: z.number().min(0).optional()
  })
});

export const updateMovieSchema = createMovieSchema.partial();