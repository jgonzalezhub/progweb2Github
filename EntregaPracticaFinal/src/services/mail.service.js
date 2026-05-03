import nodemailer from 'nodemailer';

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });

export const sendVerificationEmail = async (to, code) => {
  if (process.env.NODE_ENV === 'test') return;
  if (!process.env.SMTP_USER) return;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: 'Verifica tu cuenta en BildyApp',
    html: `
      <h2>Bienvenido a BildyApp</h2>
      <p>Tu código de verificación es: <strong style="font-size:1.5em">${code}</strong></p>
      <p>Introduce este código en la aplicación para activar tu cuenta.</p>
    `
  });
};

export const sendInvitationEmail = async (to, { tempPassword, companyName }) => {
  if (process.env.NODE_ENV === 'test') return;
  if (!process.env.SMTP_USER) return;

  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `Has sido invitado a ${companyName} en BildyApp`,
    html: `
      <h2>Bienvenido a ${companyName}</h2>
      <p>Tu contraseña temporal es: <strong>${tempPassword}</strong></p>
      <p>Cambia tu contraseña después de iniciar sesión.</p>
    `
  });
};

export default { sendVerificationEmail, sendInvitationEmail };
