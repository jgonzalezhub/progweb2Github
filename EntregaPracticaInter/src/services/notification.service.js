import { EventEmitter } from 'node:events';

const notificationService = new EventEmitter();

notificationService.on('user:registered', (user) => {
  console.log(`[EVENT] user:registered — ${user.email} | código: ${user.emailVerificationCode}`);
});

notificationService.on('user:verified', (user) => {
  console.log(`[EVENT] user:verified — ${user.email}`);
});

notificationService.on('user:invited', ({ email, company }) => {
  console.log(`[EVENT] user:invited — ${email} invitado a empresa ${company}`);
});

notificationService.on('user:deleted', (user) => {
  console.log(`[EVENT] user:deleted — ${user.email}`);
});

export default notificationService;
