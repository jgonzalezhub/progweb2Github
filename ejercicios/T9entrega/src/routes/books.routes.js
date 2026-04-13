const { Router } = require("express");
const { listBooks, getBook, createBook, updateBook, deleteBook } = require("../controllers/books.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = Router();

// Rutas públicas (lectura del catálogo sin autenticación)
router.get("/", listBooks);      // Listar libros con filtros opcionales
router.get("/:id", getBook);     // Ver detalle de un libro con sus reseñas

// Rutas restringidas: crear y editar solo para LIBRARIAN y ADMIN
router.post("/", authenticate, authorize("LIBRARIAN", "ADMIN"), createBook);
router.put("/:id", authenticate, authorize("LIBRARIAN", "ADMIN"), updateBook);

// Eliminar libro: solo ADMIN
router.delete("/:id", authenticate, authorize("ADMIN"), deleteBook);

module.exports = router;
