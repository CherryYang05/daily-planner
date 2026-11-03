import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 4173);
const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8'
};
const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return;
  }
  try {
    const rawPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const target = resolve(root, '.' + (rawPath === '/' ? '/index.html' : rawPath));
    if (target !== root && !target.startsWith(root + sep)) {
      res.writeHead(403).end(); return;
    }
    if (target.includes(`${sep}.git${sep}`) || /\/(?:\.env|package-lock\.json)$/.test(target)) {
      res.writeHead(403).end(); return;
    }
    const info = await stat(target);
    if (!info.isFile()) { res.writeHead(404).end(); return; }
    const data = await readFile(target);
    res.writeHead(200, { 'Content-Type': contentTypes[extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('未找到页面'); }
});
server.listen(port, '0.0.0.0', () => console.log(`Daily Planner: http://localhost:${port}`));
