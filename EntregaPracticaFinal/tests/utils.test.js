import AppError from '../src/utils/AppError.js';
import { encrypt, compare } from '../src/utils/handlePassword.js';
import { tokenSign, verifyToken, tokenSignRefresh, verifyRefreshToken } from '../src/utils/handleJwt.js';

describe('AppError', () => {
  it('debería crear error con statusCode y mensaje', () => {
    const err = new AppError('Test error', 400);
    expect(err.message).toBe('Test error');
    expect(err.statusCode).toBe(400);
    expect(err.isOperational).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  it('debería usar 500 como statusCode por defecto', () => {
    const err = new AppError('Error interno');
    expect(err.statusCode).toBe(500);
  });
});

describe('handlePassword', () => {
  it('debería hashear y verificar contraseña', async () => {
    const hash = await encrypt('mipassword123');
    expect(hash).not.toBe('mipassword123');

    const match = await compare('mipassword123', hash);
    expect(match).toBe(true);
  });

  it('debería rechazar contraseña incorrecta', async () => {
    const hash = await encrypt('correctpassword');
    const match = await compare('wrongpassword', hash);
    expect(match).toBe(false);
  });
});

describe('handleJwt', () => {
  const fakeUser = { _id: '507f1f77bcf86cd799439011', role: 'admin' };

  it('debería firmar y verificar access token', () => {
    const token = tokenSign(fakeUser);
    const payload = verifyToken(token);
    expect(payload._id).toBe(fakeUser._id);
    expect(payload.role).toBe(fakeUser.role);
  });

  it('debería retornar null para token inválido', () => {
    const result = verifyToken('invalid.token.here');
    expect(result).toBeNull();
  });

  it('debería firmar y verificar refresh token', () => {
    const token = tokenSignRefresh(fakeUser);
    const payload = verifyRefreshToken(token);
    expect(payload._id).toBe(fakeUser._id);
  });

  it('debería retornar null para refresh token inválido', () => {
    const result = verifyRefreshToken('bad.token');
    expect(result).toBeNull();
  });
});
