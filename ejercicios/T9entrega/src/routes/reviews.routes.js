const { Router } = require("express");
const { getReviews, createReview, deleteReview } = require("../controllers/reviews.controller");
const { authenticate } = require("../middleware/auth.middleware");

// mergeParams:true permite acceder a req.params.id (el bookId) definido en app.js
const router = Router({ mergeParams: true });

// Ver reseñas de un libro: público
// Nota: estas rutas se montan bajo /api/books/:id/reviews en app.js
router.get("/", getReviews);                       // Listar reseñas del libro
router.post("/", authenticate, createReview);      // Publicar una reseña (usuario autenticado)

module.exports = router;
