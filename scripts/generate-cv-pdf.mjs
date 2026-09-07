import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';

const distDir = path.resolve(import.meta.dirname, '..', 'dist');
const port = 4321 + Math.floor(Math.random() * 1000);

const contentTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  let filePath = path.join(distDir, decodeURIComponent(req.url.split('?')[0]));
  if (filePath.endsWith('/')) filePath = path.join(filePath, 'index.html');
  if (!existsSync(filePath) && existsSync(`${filePath}.html`)) filePath = `${filePath}.html`;

  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': contentTypes[ext] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

await new Promise((resolve) => server.listen(port, resolve));

const browser = await puppeteer.launch();
try {
  const page = await browser.newPage();
  await page.goto(`http://localhost:${port}/cv/`, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: path.join(distDir, 'cv.pdf'),
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
  });
  console.log('Generated dist/cv.pdf');
} finally {
  await browser.close();
  server.close();
}
