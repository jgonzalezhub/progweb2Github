const { Prisma } = require("@prisma/client");

// Manejador global de errores: intercepta errores de Prisma y errores generales de la aplicación
function errorMiddleware(err, req, res, next) {
  console.error(err);

  // Error de violación de unicidad (ej: email o ISBN duplicado)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "El recurso ya existe (campo único duplicado)" });
    }
    // Error de registro no encontrado al actualizar o eliminar
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Registro no encontrado" });
    }
  }

  // Error de validación de Zod
  if (err.name === "ZodError") {
    return res.status(400).json({ error: "Datos inválidos", details: err.errors });
  }

  // Error genérico del servidor
  res.status(err.status || 500).json({ error: err.message || "Error interno del servidor" });
}

module.exports = errorMiddleware;
