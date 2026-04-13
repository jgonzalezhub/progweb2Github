const prisma = require("../config/prisma");
const { hashPassword, comparePassword } = require("../utils/password");
const { generateToken } = require("../utils/jwt");
const { registerSchema, loginSchema } = require("../schemas/validation");

// Registra un nuevo usuario: valida el cuerpo, hashea la contraseña y guarda en BD
async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);
    const hashed = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: { ...data, password: hashed },
      select: { id: true, email: true, name: true, role: true },
    });

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

// Autentica al usuario: compara la contraseña con el hash y devuelve un token JWT
async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Credenciales incorrectas" });

    const valid = await comparePassword(password, user.password);
    if (!valid) return res.status(401).json({ error: "Credenciales incorrectas" });

    const token = generateToken(user);
    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token,
    });
  } catch (err) {
    next(err);
  }
}

// Devuelve el perfil completo del usuario autenticado (extraído del token JWT)
async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
