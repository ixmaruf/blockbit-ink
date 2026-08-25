const http = require('http');
const fs = require('fs');
const p = require('path');

const ROOT = __dirname;
const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0] || '/';
  if (urlPath === '/') urlPath = 'index.html';
  let fp = p.join(ROOT, urlPath);
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end(); return; }
    const ext = p.extname(fp);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(data);
  });
}).listen(3456, () => console.log('Server running on http://localhost:3456'));
