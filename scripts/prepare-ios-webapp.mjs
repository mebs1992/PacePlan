import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const webAppDir = path.resolve('PacePlan/PacePlan/WebApp');
const indexPath = path.join(webAppDir, 'index.html');

const html = await readFile(indexPath, 'utf8');
const rewritten = html.replaceAll('./assets/', './');

if (rewritten !== html) {
  await writeFile(indexPath, rewritten);
}
