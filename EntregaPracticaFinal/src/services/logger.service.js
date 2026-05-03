const sendToSlack = async (text) => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl || process.env.NODE_ENV === 'test') return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
  } catch (err) {
    console.error('[Slack] Error al enviar notificación:', err.message);
  }
};

export const logError = async (req, err) => {
  const message = [
    `*🚨 Error 5XX — ${new Date().toISOString()}*`,
    `*Ruta:* \`${req.method} ${req.originalUrl}\``,
    `*Mensaje:* ${err.message}`,
    `*Stack:* \`\`\`${(err.stack || '').substring(0, 500)}\`\`\``
  ].join('\n');

  await sendToSlack(message);
};

export default { logError };
