/**
 * Servidor HTTP simple para servir la app
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5173;
const WWW_DIR = path.join(__dirname, '../www');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  // Quitar query string (?v=...) y hash para que los assets versionados
  // (p. ej. styles.css?v=5.3.0) resuelvan al fichero real y no caigan al
  // fallback SPA. En Capacitor el query se ignora; aquí hay que limpiarlo.
  const urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  let filePath = path.join(WWW_DIR, urlPath === '/' ? 'index.html' : urlPath);

  // Prevenir path traversal
  if (!filePath.startsWith(WWW_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fallback a index.html para rutas no encontradas (SPA)
        fs.readFile(path.join(WWW_DIR, 'index.html'), (err, content) => {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
        });
      } else {
        res.writeHead(500);
        res.end('Server error');
      }
    } else {
      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});

// Mantener vivo
process.on('SIGINT', () => {
  console.log('\n✅ Servidor detenido');
  process.exit(0);
});
