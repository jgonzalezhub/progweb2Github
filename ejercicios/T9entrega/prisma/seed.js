const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Puebla la base de datos con datos de prueba para desarrollo
async function main() {
  // Crea usuarios con distintos roles: admin, bibliotecario y usuario normal
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@biblioteca.com" },
    update: {},
    create: {
      email: "admin@biblioteca.com",
      name: "Admin Principal",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const librarianPassword = await bcrypt.hash("librarian123", 10);
  const librarian = await prisma.user.upsert({
    where: { email: "librarian@biblioteca.com" },
    update: {},
    create: {
      email: "librarian@biblioteca.com",
      name: "Bibliotecario",
      password: librarianPassword,
      role: "LIBRARIAN",
    },
  });

  const userPassword = await bcrypt.hash("user123", 10);
  const user = await prisma.user.upsert({
    where: { email: "user@biblioteca.com" },
    update: {},
    create: {
      email: "user@biblioteca.com",
      name: "Usuario Normal",
      password: userPassword,
      role: "USER",
    },
  });

  // Crea libros de muestra para el catálogo
  const books = await Promise.all([
    prisma.book.upsert({
      where: { isbn: "978-0-06-112008-4" },
      update: {},
      create: {
        isbn: "978-0-06-112008-4",
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        genre: "Fiction",
        description: "A classic of modern American literature.",
        publishedYear: 1960,
        copies: 5,
        available: 5,
      },
    }),
    prisma.book.upsert({
      where: { isbn: "978-0-7432-7356-5" },
      update: {},
      create: {
        isbn: "978-0-7432-7356-5",
        title: "1984",
        author: "George Orwell",
        genre: "Dystopia",
        description: "A dystopian social science fiction novel.",
        publishedYear: 1949,
        copies: 3,
        available: 3,
      },
    }),
    prisma.book.upsert({
      where: { isbn: "978-0-7432-7357-2" },
      update: {},
      create: {
        isbn: "978-0-7432-7357-2",
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        genre: "Fiction",
        publishedYear: 1925,
        copies: 4,
        available: 4,
      },
    }),
  ]);

  console.log("Seed completado:", { admin, librarian, user, books });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
