import Movie from '../models/movie.model.js';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';

const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:3000';

/* CRUD */

export const getMovies = async (req, res) => {
  const { genre } = req.query;
  const filter = {};
  if (genre) filter.genre = genre;

  const movies = await Movie.find(filter).lean();
  res.json({ data: movies });
};

export const getMovie = async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).json({ message: 'Película no encontrada' });

  res.json({ data: movie });
};

export const createMovie = async (req, res) => {
  const movie = await Movie.create(req.body);
  res.status(201).json({ data: movie });
};

export const updateMovie = async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!movie) return res.status(404).json({ message: 'Película no encontrada' });

  res.json({ data: movie });
};

export const deleteMovie = async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).json({ message: 'Película no encontrada' });

  // eliminar cover si existe
  if (movie.cover) {
    try {
      await unlink(join(process.cwd(), 'storage', movie.cover));
    } catch {}
  }

  await Movie.findByIdAndDelete(req.params.id);
  res.status(204).send();
};

/* RENT */

export const rentMovie = async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).json({ message: 'Película no encontrada' });

  if (movie.availableCopies === 0) {
    return res.status(400).json({ message: 'No hay copias disponibles' });
  }

  movie.availableCopies--;
  movie.timesRented++;
  await movie.save();

  res.json({ data: movie });
};

/* RETURN */

export const returnMovie = async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).json({ message: 'Película no encontrada' });

  if (movie.availableCopies < movie.copies) {
    movie.availableCopies++;
    await movie.save();
  }

  res.json({ data: movie });
};

/* TOP 5 */

export const topMovies = async (req, res) => {
  const movies = await Movie.find()
    .sort({ timesRented: -1 })
    .limit(5)
    .lean();

  res.json({ data: movies });
};

/* COVER */

export const uploadCover = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se subió imagen' });
  }

  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).json({ message: 'Película no encontrada' });

  // eliminar cover anterior
  if (movie.cover) {
    try {
      await unlink(join(process.cwd(), 'storage', movie.cover));
    } catch {}
  }

  movie.cover = req.file.filename;
  await movie.save();

  res.json({ data: movie });
};

export const getCover = async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie || !movie.cover) {
    return res.status(404).json({ message: 'Carátula no encontrada' });
  }

  res.sendFile(join(process.cwd(), 'storage', movie.cover));
};