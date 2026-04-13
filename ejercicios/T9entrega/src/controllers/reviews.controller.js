const prisma = require("../config/prisma");
const { createReviewSchema } = require("../schemas/validation");

// Devuelve todas las reseñas de un libro con el nombre del usuario que las escribió
async function getReviews(req, res, next) {
  try {
    const bookId = Number(req.params.id);
    const reviews = await prisma.review.findMany({
      where: { bookId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews);
  } catch (err) {
    next(err);
  }
}

// Crea una reseña: el usuario debe haber devuelto el libro y no haber reseñado antes
async function createReview(req, res, next) {
  try {
    const bookId = Number(req.params.id);
    const userId = req.user.id;
    const { rating, comment } = createReviewSchema.parse(req.body);

    // Regla: solo puede reseñar si ha devuelto el libro (tiene préstamo con estado RETURNED)
    const hasReturned = await prisma.loan.findFirst({
      where: { userId, bookId, status: "RETURNED" },
    });
    if (!hasReturned) {
      return res
        .status(403)
        .json({ error: "Solo puedes reseñar libros que hayas devuelto" });
    }

    // La constraint @@unique en el schema impedirá reseñas duplicadas (devuelve P2002)
    const review = await prisma.review.create({
      data: { userId, bookId, rating, comment },
      include: { user: { select: { name: true } } },
    });

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

// Elimina la reseña del usuario autenticado (no puede eliminar las de otros)
async function deleteReview(req, res, next) {
  try {
    const reviewId = Number(req.params.id);
    const userId = req.user.id;

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) return res.status(404).json({ error: "Reseña no encontrada" });
    if (review.userId !== userId) {
      return res.status(403).json({ error: "No puedes eliminar reseñas de otros usuarios" });
    }

    await prisma.review.delete({ where: { id: reviewId } });
    res.json({ message: "Reseña eliminada" });
  } catch (err) {
    next(err);
  }
}

module.exports = { getReviews, createReview, deleteReview };
