const http = require('http');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, 'www');
const port = process.env.PORT || 8100;

function contentType(file){
  if(file.endsWith('.html')) return 'text/html';
  if(file.endsWith('.js')) return 'application/javascript';
  if(file.endsWith('.css')) return 'text/css';
  if(file.endsWith('.png')) return 'image/png';
  if(file.endsWith('.jpg')||file.endsWith('.jpeg')) return 'image/jpeg';
  if(file.endsWith('.svg')) return 'image/svg+xml';
  if(file.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
}

const server = http.createServer((req, res) => {
  try {
    let reqPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if(reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(root, reqPath);
    if(!filePath.startsWith(root)) { res.statusCode = 403; res.end('Forbidden'); return; }
    fs.stat(filePath, (err, stat) => {
      if(err) {
        // Fallback to index.html for SPA routes
        const indexPath = path.join(root, 'index.html');
        fs.stat(indexPath, (ie, istat) => {
          if(ie) { res.statusCode = 404; res.end('Not found'); return; }
          res.setHeader('Content-Type', 'text/html');
          fs.createReadStream(indexPath).pipe(res);
        });
        return;
      }
      res.setHeader('Content-Type', contentType(filePath));
      fs.createReadStream(filePath).pipe(res);
    });
  } catch(e){ res.statusCode=500; res.end('Server error'); }
});

server.listen(port, () => console.log(`Static server serving ${root} on http://localhost:${port}`));

module.exports = server;
