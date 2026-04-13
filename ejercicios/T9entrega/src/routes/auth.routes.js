const { Router } = require("express");
const { register, login, me } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = Router();

// Rutas públicas de autenticación
router.post("/register", register); // Crear cuenta nueva
router.post("/login", login);       // Obtener token JWT
router.get("/me", authenticate, me); // Ver perfil propio (requiere token)

module.exports = router;
