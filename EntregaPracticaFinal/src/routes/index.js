import { Router } from 'express';
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const routeFiles = readdirSync(__dirname).filter((f) => f.endsWith('.routes.js'));

for (const file of routeFiles) {
  const routeName = file.replace('.routes.js', '');
  const mod = await import(pathToFileURL(join(__dirname, file)).href);
  router.use(`/${routeName}`, mod.default);
  console.log(`📍 Ruta cargada: /api/${routeName}`);
}

export default router;
