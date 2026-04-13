const { Router } = require("express");
const { myLoans, allLoans, createLoan, returnLoan } = require("../controllers/loans.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = Router();

// Todos los endpoints de préstamos requieren autenticación
router.get("/", authenticate, myLoans);                                       // Mis préstamos
router.get("/all", authenticate, authorize("LIBRARIAN", "ADMIN"), allLoans); // Todos los préstamos (personal de biblioteca)
router.post("/", authenticate, createLoan);                                   // Solicitar un préstamo
router.put("/:id/return", authenticate, returnLoan);                          // Devolver un libro

module.exports = router;
