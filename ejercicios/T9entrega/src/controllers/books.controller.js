const prisma = require("../config/prisma");
const { createBookSchema, updateBookSchema } = require("../schemas/validation");

// Lista todos los libros con filtros opcionales por género, autor y disponibilidad
async function listBooks(req, res, next) {
  try {
    const { genre, author, available } = req.query;

    const where = {};
    if (genre) where.genre = { contains: genre, mode: "insensitive" };
    if (author) where.author = { contains: author, mode: "insensitive" };
    if (available === "true") where.available = { gt: 0 }; // Solo libros con stock

    const books = await prisma.book.findMany({ where });
    res.json(books);
  } catch (err) {
    next(err);
  }
}

// Devuelve un libro por su ID incluyendo las reseñas asociadas
async function getBook(req, res, next) {
  try {
    const book = await prisma.book.findUnique({
      where: { id: Number(req.params.id) },
      include: { reviews: { include: { user: { select: { name: true } } } } },
    });
    if (!book) return res.status(404).json({ error: "Libro no encontrado" });
    res.json(book);
  } catch (err) {
    next(err);
  }
}

// Crea un nuevo libro; si no se indica 'available', se inicializa igual que 'copies'
async function createBook(req, res, next) {
  try {
    const data = createBookSchema.parse(req.body);
    if (data.available === undefined) data.available = data.copies;

    const book = await prisma.book.create({ data });
    res.status(201).json(book);
  } catch (err) {
    next(err);
  }
}

// Actualiza los campos indicados de un libro existente (actualización parcial)
async function updateBook(req, res, next) {
  try {
    const data = updateBookSchema.parse(req.body);
    const book = await prisma.book.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json(book);
  } catch (err) {
    next(err);
  }
}

// Elimina un libro solo si no tiene préstamos activos asociados
async function deleteBook(req, res, next) {
  try {
    const id = Number(req.params.id);

    const activeLoans = await prisma.loan.count({
      where: { bookId: id, status: "ACTIVE" },
    });
    if (activeLoans > 0) {
      return res.status(409).json({ error: "No se puede eliminar: hay préstamos activos" });
    }

    await prisma.book.delete({ where: { id } });
    res.json({ message: "Libro eliminado" });
  } catch (err) {
    next(err);
  }
}

module.exports = { listBooks, getBook, createBook, updateBook, deleteBook };
