const { verifyToken } = require("../utils/jwt");

// Verifica que la petición incluya un token JWT válido en el header Authorization
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token requerido" });
  }

  try {
    const token = authHeader.split(" ")[1];
    req.user = verifyToken(token); // Adjunta el payload decodificado a req.user
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
}

// Genera un middleware que permite el acceso solo a los roles especificados
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Acceso denegado" });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
