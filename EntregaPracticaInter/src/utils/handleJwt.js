import jwt from 'jsonwebtoken';

// Genera el access token JWT con id y rol del usuario
export const tokenSign = (user) =>
  jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '2h'
  });

// Genera el refresh token JWT con mayor duración
export const tokenSignRefresh = (user) =>
  jwt.sign({ _id: user._id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh', {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });

// Verifica un access token y devuelve el payload, o null si no es válido
export const verifyToken = (token) => {
  try { return jwt.verify(token, process.env.JWT_SECRET); }
  catch { return null; }
};

// Verifica un refresh token y devuelve el payload, o null si no es válido
export const verifyRefreshToken = (token) => {
  try { return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh'); }
  catch { return null; }
};
