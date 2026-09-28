const http = require('http');

const PORT = parseInt(process.env.PORT || '3000', 10);
const SERVICE_NAME = process.env.SERVICE_NAME || 'notes-api';
const APP_VERSION = process.env.APP_VERSION || '1.0.0';

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'UP',
      service: SERVICE_NAME,
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
    return;
  }

  if (url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'AWS CI/CD Demo Service is running successfully!',
      service: SERVICE_NAME,
      version: APP_VERSION,
      region: process.env.AWS_REGION || 'local'
    }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found', path: url }));
});

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[${SERVICE_NAME}] Service started listening on port ${PORT} (PID: ${process.pid})`);
  });

  const handleShutdown = (signal) => {
    console.log(`[${SERVICE_NAME}] Received ${signal}, starting graceful shutdown...`);
    server.close(() => {
      console.log(`[${SERVICE_NAME}] HTTP server closed cleanly.`);
      process.exit(0);
    });
    // Force close after 10 seconds if hanging
    setTimeout(() => {
      console.error(`[${SERVICE_NAME}] Forced shutdown due to timeout.`);
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

module.exports = server;
