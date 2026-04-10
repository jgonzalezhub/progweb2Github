import { usersModel } from '../models/index.js';
import { encrypt, compare } from '../utils/password.js';
import { tokenSign } from '../utils/jwt.js';
import { handleHttpError } from '../utils/handleError.js';

export const registerCtrl = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await usersModel.findOne({ email });
    if (exists) return handleHttpError(res, 'EMAIL_ALREADY_EXISTS', 409);

    const hashed = await encrypt(password);
    const user = await usersModel.create({ name, email, password: hashed });
    const token = tokenSign(user);

    res.status(201).json({ token, user });
  } catch (err) { handleHttpError(res, 'ERROR_REGISTER'); }
};

export const loginCtrl = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await usersModel.findOne({ email }).select('+password');
    if (!user) return handleHttpError(res, 'USER_NOT_FOUND', 404);

    const valid = await compare(password, user.password);
    if (!valid) return handleHttpError(res, 'INVALID_PASSWORD', 401);

    const token = tokenSign(user);
    user.set('password', undefined, { strict: false });

    res.json({ token, user });
  } catch (err) { handleHttpError(res, 'ERROR_LOGIN'); }
};

export const getMeCtrl = async (req, res) => {
  try {
    res.json({ data: req.user });
  } catch (err) { handleHttpError(res, 'ERROR_GET_ME'); }
};
