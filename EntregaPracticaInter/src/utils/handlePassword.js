import bcryptjs from 'bcryptjs';

// Hashea una contraseña con bcrypt (salt 10)
export const encrypt = (password) => bcryptjs.hash(password, 10);

// Compara una contraseña en texto plano con su hash almacenado
export const compare = (password, hash) => bcryptjs.compare(password, hash);
