import { EventEmitter } from 'node:events';

const notificationService = new EventEmitter();

notificationService.on('user:registered', (user) => {
  console.log(`[EVENT] user:registered — ${user.email} | código: ${user.emailVerificationCode}`);
});

notificationService.on('user:verified', (user) => {
  console.log(`[EVENT] user:verified — ${user.email}`);
});

notificationService.on('user:invited', ({ email, tempPassword, company }) => {
  // En producción: enviar email con tempPassword al usuario invitado
  console.log(`[EVENT] user:invited — ${email} invitado a empresa ${company} | temp: ${tempPassword}`);
});

notificationService.on('user:deleted', (user) => {
  console.log(`[EVENT] user:deleted — ${user.email}`);
});

export default notificationService;
