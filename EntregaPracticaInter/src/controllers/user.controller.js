import { randomInt, randomBytes } from 'node:crypto';
import { usersModel, companiesModel } from '../models/index.js';
import { encrypt, compare } from '../utils/handlePassword.js';
import { tokenSign, tokenSignRefresh, verifyRefreshToken } from '../utils/handleJwt.js';
import { handleHttpError } from '../utils/handleError.js';
import notificationService from '../services/notification.service.js';

// 1. POST /api/user/register — Registro inicial (email + password)
export const registerCtrl = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existing = await usersModel.findOne({ email });
    if (existing) return handleHttpError(res, 'EMAIL_ALREADY_EXISTS', 409);

    const hashedPassword = await encrypt(password);
    const code = String(randomInt(100000, 1000000));

    const user = await usersModel.create({
      email,
      password: hashedPassword,
      emailVerificationCode: code,
      emailVerificationAttempts: 0
    });

    notificationService.emit('user:registered', { email: user.email, emailVerificationCode: code });

    const token = tokenSign(user);
    const refreshToken = tokenSignRefresh(user);

    await usersModel.findByIdAndUpdate(user._id, { refreshToken });

    res.status(201).json({ token, refreshToken, user });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_REGISTER_USER');
  }
};

// 2. PUT /api/user/validation — Validar código de email
export const validateEmailCtrl = async (req, res) => {
  try {
    const { code } = req.body;
    const userId = req.user._id;

    const user = await usersModel.findById(userId).select('+emailVerificationCode');
    if (!user) return handleHttpError(res, 'USER_NOT_FOUND', 404);

    if (user.status === 'verified')
      return handleHttpError(res, 'EMAIL_ALREADY_VERIFIED', 400);

    if (user.emailVerificationAttempts >= 3)
      return handleHttpError(res, 'MAX_ATTEMPTS_REACHED', 403);

    if (user.emailVerificationCode !== code) {
      await usersModel.findByIdAndUpdate(userId, {
        $inc: { emailVerificationAttempts: 1 }
      });
      return handleHttpError(res, 'INVALID_CODE', 400);
    }

    const updated = await usersModel.findByIdAndUpdate(
      userId,
      { status: 'verified', emailVerificationCode: null, emailVerificationAttempts: 0 },
      { new: true }
    );

    notificationService.emit('user:verified', { email: updated.email });

    res.json({ message: 'Email verificado correctamente', user: updated });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_VALIDATE_EMAIL');
  }
};

// 3. POST /api/user/login
export const loginCtrl = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await usersModel.findOne({ email, deletedAt: null }).select('+password');
    if (!user) return handleHttpError(res, 'USER_NOT_EXISTS', 404);

    const match = await compare(password, user.password);
    if (!match) return handleHttpError(res, 'INVALID_PASSWORD', 401);

    user.set('password', undefined, { strict: false });

    const token = tokenSign(user);
    const refreshToken = tokenSignRefresh(user);
    await usersModel.findByIdAndUpdate(user._id, { refreshToken });

    res.json({ token, refreshToken, user });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_LOGIN_USER');
  }
};

// 4. PUT /api/user/register — Onboarding personal (nombre, apellidos, NIF)
export const onboardingPersonalCtrl = async (req, res) => {
  try {
    const { name, lastName, nif, address } = req.body;

    const user = await usersModel.findByIdAndUpdate(
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

    // Buscar si ya existe empresa con ese CIF
    let company = await companiesModel.findOne({ cif, deletedAt: null });

    if (company) {
      // Unirse a la empresa existente como guest
      const user = await usersModel.findByIdAndUpdate(
        req.user._id,
        { company: company._id, role: 'guest' },
        { new: true }
      ).populate('company', 'name cif address logo isFreelance');

      return res.json({ message: 'Te has unido a la empresa existente', data: user });
    }

    // Crear nueva empresa
    const companyName = isFreelance
      ? `${req.user.name || req.user.email} (Autónomo)`
      : name;

    company = await companiesModel.create({
      owner: req.user._id,
      name: companyName,
      cif,
      isFreelance: !!isFreelance,
      ...(address && { address })
    });

    const user = await usersModel.findByIdAndUpdate(
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

// 6. PATCH /api/user/logo — Subir logo de empresa
export const uploadLogoCtrl = async (req, res) => {
  try {
    if (!req.file) return handleHttpError(res, 'FILE_NOT_FOUND', 400);

    if (!req.user.company) return handleHttpError(res, 'NO_COMPANY_ASSOCIATED', 400);

    const logoUrl = `/uploads/${req.file.filename}`;

    await companiesModel.findByIdAndUpdate(req.user.company, { logo: logoUrl });

    const updated = await usersModel.findById(req.user._id).populate('company', 'name cif logo');
    res.json({ message: 'Logo actualizado', data: updated });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_UPLOAD_LOGO');
  }
};

// 7. GET /api/user — Obtener usuario actual con populate
export const getMeCtrl = async (req, res) => {
  try {
    const user = await usersModel
      .findById(req.user._id)
      .populate('company', 'name cif address logo isFreelance');

    res.json({ data: user });
  } catch (err) {
    handleHttpError(res, 'ERROR_GET_USER');
  }
};

// 8a. POST /api/user/refresh — Refresh token
export const refreshTokenCtrl = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return handleHttpError(res, 'NOT_REFRESH_TOKEN', 401);

    const payload = verifyRefreshToken(refreshToken);
    if (!payload?._id) return handleHttpError(res, 'INVALID_REFRESH_TOKEN', 401);

    const user = await usersModel.findById(payload._id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken)
      return handleHttpError(res, 'INVALID_REFRESH_TOKEN', 401);

    const newToken = tokenSign(user);
    const newRefreshToken = tokenSignRefresh(user);
    await usersModel.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (err) {
    handleHttpError(res, 'ERROR_REFRESH_TOKEN');
  }
};

// 8b. POST /api/user/logout — Logout
export const logoutCtrl = async (req, res) => {
  try {
    await usersModel.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (err) {
    handleHttpError(res, 'ERROR_LOGOUT');
  }
};

// 9. DELETE /api/user — Eliminar usuario (?soft=true)
export const deleteUserCtrl = async (req, res) => {
  try {
    const { soft } = req.query;
    const userId = req.user._id;

    let user;
    if (soft === 'true') {
      user = await usersModel.findByIdAndUpdate(
        userId,
        { deletedAt: new Date() },
        { new: true }
      );
    } else {
      user = await usersModel.findByIdAndDelete(userId);
    }

    if (!user) return handleHttpError(res, 'USER_NOT_FOUND', 404);

    notificationService.emit('user:deleted', { email: user.email });

    res.json({ message: 'Usuario eliminado correctamente', data: user });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_DELETE_USER');
  }
};

// 10. POST /api/user/invite — Invitar compañero (solo admins)
export const inviteUserCtrl = async (req, res) => {
  try {
    const { email } = req.body;
    const adminUser = req.user;

    if (!adminUser.company)
      return handleHttpError(res, 'NO_COMPANY_ASSOCIATED', 400);

    const existing = await usersModel.findOne({ email });
    if (existing) return handleHttpError(res, 'EMAIL_ALREADY_EXISTS', 409);

    // Generar contraseña temporal aleatoria (CSPRNG)
    const tempPassword = randomBytes(8).toString('hex') + 'A1!';
    const hashedPassword = await encrypt(tempPassword);
    const code = String(randomInt(100000, 1000000));

    const guest = await usersModel.create({
      email,
      password: hashedPassword,
      role: 'guest',
      company: adminUser.company,
      status: 'pending',
      emailVerificationCode: code,
      emailVerificationAttempts: 0
    });

    const company = await companiesModel.findById(adminUser.company);
    notificationService.emit('user:invited', {
      email: guest.email,
      tempPassword,
      company: company?.name || adminUser.company
    });

    res.status(201).json({
      message: 'Usuario invitado correctamente',
      data: guest
    });
  } catch (err) {
    console.error(err);
    handleHttpError(res, 'ERROR_INVITE_USER');
  }
};

// ============================================================
// BONUS: PUT /api/user/password — Cambiar contraseña
// ============================================================
export const changePasswordCtrl = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await usersModel.findById(req.user._id).select('+password');
    if (!user) return handleHttpError(res, 'USER_NOT_FOUND', 404);

    const match = await compare(currentPassword, user.password);
    if (!match) return handleHttpError(res, 'INVALID_CURRENT_PASSWORD', 401);

    const hashedPassword = await encrypt(newPassword);
    await usersModel.findByIdAndUpdate(req.user._id, { password: hashedPassword });

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    handleHttpError(res, 'ERROR_CHANGE_PASSWORD');
  }
};
