import mongoose from 'mongoose';

const dbConnect = async () => {
  const DB_URI = process.env.DB_URI;
  if (!DB_URI) { console.error('❌ DB_URI no definida'); process.exit(1); }

  try {
    await mongoose.connect(DB_URI);
    console.log('Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error MongoDB:', error.message);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => console.warn('⚠️ Desconectado de MongoDB'));
mongoose.connection.on('error', (err) => console.error('❌ Error MongoDB:', err.message));
process.on('SIGINT', async () => { await mongoose.connection.close(); process.exit(0); });

export default dbConnect;
