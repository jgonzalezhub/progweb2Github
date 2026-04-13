const bcrypt = require("bcryptjs");

// Hashea una contraseña en texto plano con factor de coste 10
async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

// Compara una contraseña en texto plano con su hash almacenado; devuelve true si coinciden
async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

module.exports = { hashPassword, comparePassword };
