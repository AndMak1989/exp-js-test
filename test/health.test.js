const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const server = require('../index.js');

test('Health check and root endpoints verification', async (t) => {
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });

  const port = server.address().port;
  t.after(() => {
    return new Promise((resolve) => server.close(resolve));
  });

  await t.test('GET /health returns 200 OK with UP status', async () => {
    const res = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/health`, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
      }).on('error', reject);
    });

    assert.equal(res.statusCode, 200);
    assert.match(res.headers['content-type'], /application\/json/);
    const data = JSON.parse(res.body);
    assert.equal(data.status, 'UP');
    assert.ok(data.timestamp);
    assert.ok(typeof data.uptime === 'number');
  });

  await t.test('GET / returns 200 OK with welcome message', async () => {
    const res = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/`, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
      }).on('error', reject);
    });

    assert.equal(res.statusCode, 200);
    const data = JSON.parse(res.body);
    assert.match(data.message, /AWS CI\/CD Demo Service/);
  });

  await t.test('GET /unknown-path returns 404 Not Found', async () => {
    const res = await new Promise((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/unknown-path`, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
      }).on('error', reject);
    });

    assert.equal(res.statusCode, 404);
    const data = JSON.parse(res.body);
    assert.equal(data.error, 'Not Found');
  });
});
