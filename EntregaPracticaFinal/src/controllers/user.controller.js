import { randomInt, randomBytes } from 'node:crypto';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { encrypt, compare } from '../utils/handlePassword.js';
import { tokenSign, tokenSignRefresh, verifyRefreshToken } from '../utils/handleJwt.js';
import { handleHttpError } from '../utils/handleError.js';
import { sendVerificationEmail, sendInvitationEmail } from '../services/mail.service.js';
import { uploadImage } from '../services/storage.service.js';

// 1. POST /api/user/register
export const registerCtrl = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return handleHttpError(res, 'EMAIL_ALREADY_EXISTS', 409);

    const hashedPassword = await encrypt(password);
    const code = String(randomInt(100000, 1000000));

    const user = await User.create({
      email,
      password: hashedPassword,
      emailVerificationCode: code,
      emailVerificationAttempts: 0
    });

    await sendVerificationEmail(email, code).catch(() => {});

    const token = tokenSign(user);
    const refreshToken = tokenSignRefresh(user);
    await User.findByIdAndUpdate(user._id, { refreshToken });

    res.status(201).json({ token, refreshToken, user });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_REGISTER_USER');
  }
};

// 2. PUT /api/user/validation — corrección: 429 en lugar de 403
export const validateEmailCtrl = async (req, res) => {
  try {
    const { code } = req.body;

    const user = await User.findById(req.user._id).select(
      '+emailVerificationCode +emailVerificationAttempts'
    );
    if (!user) return handleHttpError(res, 'USER_NOT_FOUND', 404);

    if (user.status === 'verified')
      return handleHttpError(res, 'EMAIL_ALREADY_VERIFIED', 400);

    if (user.emailVerificationAttempts >= 3)
      return handleHttpError(res, 'MAX_ATTEMPTS_REACHED', 429); // corrección: 429

    if (user.emailVerificationCode !== code) {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { emailVerificationAttempts: 1 }
      });
      return handleHttpError(res, 'INVALID_CODE', 400);
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { status: 'verified', emailVerificationCode: null, emailVerificationAttempts: 0 },
      { new: true }
    );

    res.json({ message: 'Email verificado correctamente', user: updated });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_VALIDATE_EMAIL');
  }
};

// 3. POST /api/user/login — corrección: validar status verified antes de comparar password
export const loginCtrl = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, deletedAt: null }).select('+password');
    if (!user) return handleHttpError(res, 'USER_NOT_EXISTS', 404);

    // corrección: verificar status antes de comparar password
    if (user.status !== 'verified')
      return handleHttpError(res, 'EMAIL_NOT_VERIFIED', 403);

    const match = await compare(password, user.password);
    if (!match) return handleHttpError(res, 'INVALID_PASSWORD', 401);

    user.set('password', undefined, { strict: false });

    const token = tokenSign(user);
    const refreshToken = tokenSignRefresh(user);
    await User.findByIdAndUpdate(user._id, { refreshToken });

    res.json({ token, refreshToken, user });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_LOGIN_USER');
  }
};

// 4. PUT /api/user/register — Onboarding personal
export const onboardingPersonalCtrl = async (req, res) => {
  try {
    const { name, lastName, nif, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, lastName, nif, ...(address && { address }) },
      { new: true, runValidators: true }
    );
    res.json({ data: user });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_ONBOARDING_PERSONAL');
  }
};

// 5. PATCH /api/user/company — Onboarding empresa
export const onboardingCompanyCtrl = async (req, res) => {
  try {
    const { cif, name, isFreelance, address } = req.body;

    let company = await Company.findOne({ cif, deletedAt: null });

    if (company) {
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { company: company._id, role: 'guest' },
        { new: true }
      ).populate('company', 'name cif address logo isFreelance');
      return res.json({ message: 'Te has unido a la empresa existente', data: user });
    }

    const companyName = isFreelance
      ? `${req.user.name || req.user.email} (Autónomo)`
      : name;

    company = await Company.create({
      owner: req.user._id,
      name: companyName,
      cif,
      isFreelance: !!isFreelance,
      ...(address && { address })
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { company: company._id, role: 'admin' },
      { new: true }
    ).populate('company', 'name cif address logo isFreelance');

    res.status(201).json({ message: 'Empresa creada correctamente', data: user });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_ONBOARDING_COMPANY');
  }
};

// 6. PATCH /api/user/logo — Subir logo a Cloudinary
export const uploadLogoCtrl = async (req, res) => {
  try {
    if (!req.file) return handleHttpError(res, 'FILE_NOT_FOUND', 400);
    if (!req.user.company) return handleHttpError(res, 'NO_COMPANY_ASSOCIATED', 400);

    const result = await uploadImage(req.file.buffer, { folder: 'bildyapp/logos' });

    await Company.findByIdAndUpdate(req.user.company, { logo: result.secure_url });

    const updated = await User.findById(req.user._id).populate(
      'company',
      'name cif logo'
    );
    res.json({ message: 'Logo actualizado', data: updated });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_UPLOAD_LOGO');
  }
};

// 7. GET /api/user
export const getMeCtrl = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'company',
      'name cif address logo isFreelance'
    );
    res.json({ data: user });
  } catch (err) {
    handleHttpError(res, 'ERROR_GET_USER');
  }
};

// 8a. POST /api/user/refresh
export const refreshTokenCtrl = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return handleHttpError(res, 'NOT_REFRESH_TOKEN', 401);

    const payload = verifyRefreshToken(refreshToken);
    if (!payload?._id) return handleHttpError(res, 'INVALID_REFRESH_TOKEN', 401);

    const user = await User.findById(payload._id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken)
      return handleHttpError(res, 'INVALID_REFRESH_TOKEN', 401);

    const newToken = tokenSign(user);
    const newRefreshToken = tokenSignRefresh(user);
    await User.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (err) {
    handleHttpError(res, 'ERROR_REFRESH_TOKEN');
  }
};

// 8b. POST /api/user/logout
export const logoutCtrl = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (err) {
    handleHttpError(res, 'ERROR_LOGOUT');
  }
};

// 9. DELETE /api/user (?soft=true)
export const deleteUserCtrl = async (req, res) => {
  try {
    const { soft } = req.query;

    let user;
    if (soft === 'true') {
      user = await User.findByIdAndUpdate(
        req.user._id,
        { deletedAt: new Date() },
        { new: true }
      );
    } else {
      user = await User.findByIdAndDelete(req.user._id);
    }

    if (!user) return handleHttpError(res, 'USER_NOT_FOUND', 404);

    res.json({ message: 'Usuario eliminado correctamente', data: user });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_DELETE_USER');
  }
};

// 10. POST /api/user/invite (solo admin)
export const inviteUserCtrl = async (req, res) => {
  try {
    const { email } = req.body;

    if (!req.user.company) return handleHttpError(res, 'NO_COMPANY_ASSOCIATED', 400);

    const existing = await User.findOne({ email });
    if (existing) return handleHttpError(res, 'EMAIL_ALREADY_EXISTS', 409);

    const tempPassword = randomBytes(8).toString('hex') + 'A1!';
    const hashedPassword = await encrypt(tempPassword);
    const code = String(randomInt(100000, 1000000));

    const guest = await User.create({
      email,
      password: hashedPassword,
      role: 'guest',
      company: req.user.company,
      status: 'pending',
      emailVerificationCode: code,
      emailVerificationAttempts: 0
    });

    const company = await Company.findById(req.user.company);
    await sendInvitationEmail(email, {
      tempPassword,
      companyName: company?.name || req.user.company
    }).catch(() => {});

    res.status(201).json({ message: 'Usuario invitado correctamente', data: guest });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_INVITE_USER');
  }
};

// 11. PUT /api/user/password
export const changePasswordCtrl = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return handleHttpError(res, 'USER_NOT_FOUND', 404);

    const match = await compare(currentPassword, user.password);
    if (!match) return handleHttpError(res, 'INVALID_CURRENT_PASSWORD', 401);

    const hashedPassword = await encrypt(newPassword);
    await User.findByIdAndUpdate(req.user._id, { password: hashedPassword });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    handleHttpError(res, 'ERROR_CHANGE_PASSWORD');
  }
};
