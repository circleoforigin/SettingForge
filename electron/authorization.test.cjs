const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const {
  ApplicationAuthorizationService,
} = require('./authorization.cjs');

function createDirectory() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'settingforge-auth-'));
}

function createResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

test('creates one persistent random installation ID', () => {
  const directory = createDirectory();
  const options = {
    userDataPath: directory,
    baseUrl: 'http://127.0.0.1:3020/',
    fetch: async () => createResponse(500, {}),
  };
  const first = new ApplicationAuthorizationService(options);
  const second = new ApplicationAuthorizationService(options);

  assert.match(first.getStatus().deviceId, /^[0-9a-f-]{36}$/);
  assert.equal(first.getStatus().deviceId, second.getStatus().deviceId);
  fs.rmSync(directory, { recursive: true, force: true });
});

test('registers and subsequently validates stored authorization', async () => {
  const directory = createDirectory();
  const requests = [];
  const fetch = async (url, options) => {
    requests.push({ url: String(url), body: JSON.parse(options.body) });
    return createResponse(200, {
      authorized: true,
      deviceId: JSON.parse(options.body).deviceId,
      lastSeenAt: new Date().toISOString(),
    });
  };
  const service = new ApplicationAuthorizationService({
    userDataPath: directory,
    baseUrl: 'http://127.0.0.1:3020/',
    fetch,
  });

  const registered = await service.register({
    email: 'Tester@Example.com',
    deviceName: 'Test computer',
  });
  assert.equal(registered.state, 'authorized');

  const reopened = new ApplicationAuthorizationService({
    userDataPath: directory,
    baseUrl: 'http://127.0.0.1:3020/',
    fetch,
  });
  assert.equal((await reopened.validate()).state, 'authorized');
  assert.equal(requests[0].url.endsWith('/activation/register'), true);
  assert.equal(requests[1].url.endsWith('/activation/validate'), true);
  assert.equal(requests[1].body.deviceId, requests[0].body.deviceId);
  fs.rmSync(directory, { recursive: true, force: true });
});

test('distinguishes denial from an unavailable server', async () => {
  const deniedDirectory = createDirectory();
  const denied = new ApplicationAuthorizationService({
    userDataPath: deniedDirectory,
    baseUrl: 'http://127.0.0.1:3020/',
    fetch: async () => createResponse(403, {
      error: 'This tester or device is not authorized.',
    }),
  });
  const deniedStatus = await denied.register({
    email: 'tester@example.com',
    deviceName: 'Test computer',
  });
  assert.equal(deniedStatus.state, 'denied');

  const offlineDirectory = createDirectory();
  const offline = new ApplicationAuthorizationService({
    userDataPath: offlineDirectory,
    baseUrl: 'http://127.0.0.1:3020/',
    fetch: async () => {
      throw new Error('connection refused');
    },
  });
  const offlineStatus = await offline.register({
    email: 'tester@example.com',
    deviceName: 'Test computer',
  });
  assert.equal(offlineStatus.state, 'offline');
  fs.rmSync(deniedDirectory, { recursive: true, force: true });
  fs.rmSync(offlineDirectory, { recursive: true, force: true });
});

test('does not authorize an invalid successful response', async () => {
  const directory = createDirectory();
  const service = new ApplicationAuthorizationService({
    userDataPath: directory,
    baseUrl: 'http://127.0.0.1:3020/',
    fetch: async () => createResponse(200, { authorized: true }),
  });
  const status = await service.register({
    email: 'tester@example.com',
    deviceName: 'Test computer',
  });

  assert.equal(status.state, 'error');
  assert.equal(status.previouslyAuthorized, false);
  fs.rmSync(directory, { recursive: true, force: true });
});
