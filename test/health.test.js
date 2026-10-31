import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';

test('GET /api/health returns 200 and project status', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = address.port;

  try {
    const res = await fetch(`http://localhost:${port}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.equal(data.project, 'InspireUp API');
  } finally {
    server.close();
  }
});

test('GET /api/assistant/health returns initialized state and Tamil language support', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = address.port;

  try {
    const res = await fetch(`http://localhost:${port}/api/assistant/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'initialized');
    assert.ok(data.languages.some(l => l.includes('Tamil')));
  } finally {
    server.close();
  }
});

test('GET /api/system/status protects DB credentials', async () => {
  const server = app.listen(0);
  const address = server.address();
  const port = address.port;

  try {
    const res = await fetch(`http://localhost:${port}/api/system/status`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.database);
    assert.equal(data.database.password, undefined); // Password must never be leaked
  } finally {
    server.close();
  }
});
