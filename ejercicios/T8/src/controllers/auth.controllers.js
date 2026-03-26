// src/controllers/auth.controllers.js
import User from '../models/user.model.js';
import { encrypt, compare } from '../utils/handlePassword.js';
import { generateToken } from '../utils/handleJwt.js';
import { handleHttpError } from '../utils/handleError.js';

// POST /api/auth/register
export const registerCtrl = async (req, res) => {
  try {
    const { email } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return handleHttpError(res, 'EMAIL_ALREADY_EXISTS', 400);
    }

    const password = await encrypt(req.body.password);
    const user = await User.create({ ...req.body, password });
    const token = generateToken(user);

    user.password = undefined;
    res.status(201).json({ token, user });
  } catch (err) {
    handleHttpError(res, 'ERROR_REGISTER_USER');
  }
};

// POST /api/auth/login
export const loginCtrl = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return handleHttpError(res, 'USER_NOT_EXISTS', 401);
    }

    const valid = await compare(password, user.password);
    if (!valid) {
      return handleHttpError(res, 'INVALID_PASSWORD', 401);
    }

    const token = generateToken(user);
    user.password = undefined;
    res.status(201).json({ token, user });
  } catch (err) {
    handleHttpError(res, 'ERROR_LOGIN_USER');
  }
};

// GET /api/auth/me
export const meCtrl = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    handleHttpError(res, 'ERROR_GET_ME');
  }
};
