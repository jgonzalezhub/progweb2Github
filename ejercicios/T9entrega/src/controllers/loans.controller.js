const prisma = require("../config/prisma");
const { createLoanSchema } = require("../schemas/validation");

// Devuelve los préstamos del usuario autenticado con datos del libro
async function myLoans(req, res, next) {
  try {
    const loans = await prisma.loan.findMany({
      where: { userId: req.user.id },
      include: { book: { select: { title: true, author: true } } },
      orderBy: { loanDate: "desc" },
    });
    res.json(loans);
  } catch (err) {
    next(err);
  }
}

// Devuelve todos los préstamos del sistema (solo para LIBRARIAN y ADMIN)
async function allLoans(req, res, next) {
  try {
    const loans = await prisma.loan.findMany({
      include: {
        user: { select: { name: true, email: true } },
        book: { select: { title: true, author: true } },
      },
      orderBy: { loanDate: "desc" },
    });
    res.json(loans);
  } catch (err) {
    next(err);
  }
}

// Crea un préstamo nuevo: valida límite de 3 activos, no duplicados y stock disponible
async function createLoan(req, res, next) {
  try {
    const { bookId } = createLoanSchema.parse(req.body);
    const userId = req.user.id;

    // Regla: máximo 3 préstamos activos simultáneos
    const activeCount = await prisma.loan.count({
      where: { userId, status: "ACTIVE" },
    });
    if (activeCount >= 3) {
      return res.status(400).json({ error: "Ya tienes 3 préstamos activos (límite alcanzado)" });
    }

    // Regla: no puede pedir prestado el mismo libro dos veces si ya lo tiene activo
    const duplicate = await prisma.loan.findFirst({
      where: { userId, bookId, status: "ACTIVE" },
    });
    if (duplicate) {
      return res.status(400).json({ error: "Ya tienes este libro en préstamo" });
    }

    // Regla: debe haber ejemplares disponibles
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return res.status(404).json({ error: "Libro no encontrado" });
    if (book.available <= 0) {
      return res.status(400).json({ error: "No hay ejemplares disponibles" });
    }

    // Calcula la fecha límite (hoy + 14 días) y crea el préstamo descontando stock
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const [loan] = await prisma.$transaction([
      prisma.loan.create({
        data: { userId, bookId, dueDate },
        include: { book: { select: { title: true } } },
      }),
      prisma.book.update({
        where: { id: bookId },
        data: { available: { decrement: 1 } },
      }),
    ]);

    res.status(201).json(loan);
  } catch (err) {
    next(err);
  }
}

// Marca un préstamo como devuelto y restaura el stock del libro (solo el propietario)
async function returnLoan(req, res, next) {
  try {
    const loanId = Number(req.params.id);
    const userId = req.user.id;

    const loan = await prisma.loan.findUnique({ where: { id: loanId } });
    if (!loan) return res.status(404).json({ error: "Préstamo no encontrado" });
    if (loan.userId !== userId) return res.status(403).json({ error: "No es tu préstamo" });
    if (loan.status === "RETURNED") {
      return res.status(400).json({ error: "El libro ya fue devuelto" });
    }

    // Actualiza el préstamo y repone el ejemplar en la misma transacción
    const [updated] = await prisma.$transaction([
      prisma.loan.update({
        where: { id: loanId },
        data: { status: "RETURNED", returnDate: new Date() },
      }),
      prisma.book.update({
        where: { id: loan.bookId },
        data: { available: { increment: 1 } },
      }),
    ]);

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { myLoans, allLoans, createLoan, returnLoan };
