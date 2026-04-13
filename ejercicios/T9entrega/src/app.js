require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/auth.routes");
const booksRoutes = require("./routes/books.routes");
const loansRoutes = require("./routes/loans.routes");
const reviewsRoutes = require("./routes/reviews.routes");
const { deleteReview } = require("./controllers/reviews.controller");
const { authenticate } = require("./middleware/auth.middleware");
const errorMiddleware = require("./middleware/error.middleware");

const app = express();

// Parsea el cuerpo de las peticiones como JSON
app.use(express.json());

// Monta las rutas de la API bajo el prefijo /api
app.use("/api/auth", authRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/loans", loansRoutes);

// Reseñas anidadas bajo libros: /api/books/:id/reviews
// mergeParams:true se activa en el router de reviews para que :id del libro esté disponible
app.use("/api/books/:id/reviews", reviewsRoutes);

// Eliminar reseña propia: fuera del recurso libro porque actúa sobre la reseña directamente
app.delete("/api/reviews/:id", authenticate, deleteReview);

// Manejador global de errores (siempre al final)
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}`));

module.exports = app;
