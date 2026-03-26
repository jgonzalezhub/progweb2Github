import { Router } from 'express';
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const router = Router();

// Forma compatible con Windows
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const routeFiles = readdirSync(__dirname)
  .filter(file => file.endsWith('.routes.js'));

for (const file of routeFiles) {
  const routeName = file.replace('.routes.js', '');
  const routeModule = await import(pathToFileURL(join(__dirname, file)).href);
  router.use(`/${routeName}`, routeModule.default);
}

export default router;