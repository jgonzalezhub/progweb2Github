const { PrismaClient } = require("@prisma/client");

// Instancia única del cliente Prisma compartida en toda la aplicación (patrón singleton)
const prisma = new PrismaClient();

module.exports = prisma;
