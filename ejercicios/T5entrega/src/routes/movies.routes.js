import { Router } from 'express';
import uploadMiddleware from '../utils/handleStorage.js';
import {
  getMovies,
  getMovie,
  createMovie,
  updateMovie,
  deleteMovie,
  rentMovie,
  returnMovie,
  topMovies,
  uploadCover,
  getCover
} from '../controllers/movies.controllers.js';

import { validate, validateObjectId } from '../middleware/validate.middleware.js';
import { createMovieSchema, updateMovieSchema } from '../schemas/movie.schema.js';

const router = Router();

router.get('/', getMovies);
router.get('/stats/top', topMovies);
router.get('/:id', validateObjectId(), getMovie);

router.post('/', validate(createMovieSchema), createMovie);
router.put('/:id', validateObjectId(), validate(updateMovieSchema), updateMovie);
router.delete('/:id', validateObjectId(), deleteMovie);

router.patch('/:id/rent', validateObjectId(), rentMovie);
router.patch('/:id/return', validateObjectId(), returnMovie);

router.patch('/:id/cover',
  validateObjectId(),
  uploadMiddleware.single('cover'),
  uploadCover
);

router.get('/:id/cover', validateObjectId(), getCover);

export default router;