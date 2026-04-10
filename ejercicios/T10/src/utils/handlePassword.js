import bcryptjs from 'bcryptjs';

export const encrypt = (password) => bcryptjs.hash(password, 10);
export const compare = (password, hash) => bcryptjs.compare(password, hash);
