const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getAuthorizationBaseUrl() {
  const prefix = '--authorization-base-url=';
  const argument = process.argv.find((value) => value.startsWith(prefix));
  const productionUrl =
    'https://sacscape-server.tail7d5063.ts.net/settingforge/';
  const configured = argument?.slice(prefix.length) ||
    process.env.SETTINGFORGE_AUTHORIZATION_BASE_URL || productionUrl;
  const url = new URL(configured);

  if (url.username || url.password) {
    throw new Error('Authorization server must not contain credentials.');
  }
  const isLoopback = url.hostname === '127.0.0.1' ||
    url.hostname === 'localhost';
  if (url.protocol !== 'https:' && !isLoopback) {
    throw new Error('Authorization server must use HTTPS or loopback HTTP.');
  }
  return url.toString().endsWith('/') ? url.toString() : `${url}/`;
}

function describeError(error) {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isStoredState(value) {
  if (!value || typeof value !== 'object') return false;
  if (value.version !== 1 || !uuidPattern.test(value.deviceId)) return false;
  if (typeof value.deviceName !== 'string') return false;
  return value.email === undefined || typeof value.email === 'string';
}

class ApplicationAuthorizationService {
  constructor(options) {
    this.filePath = path.join(options.userDataPath, 'authorization.json');
    this.fetch = options.fetch;
    this.baseUrl = options.baseUrl;
    this.validationPromise = null;
    this.state = this.loadOrCreateState();
    this.status = {
      state: this.state.email ? 'unchecked' : 'unregistered',
      deviceId: this.state.deviceId,
      deviceName: this.state.deviceName,
      email: this.state.email,
      previouslyAuthorized: Boolean(this.state.authorizedAt),
    };
  }

  getStatus() {
    return { ...this.status };
  }

  async register(input) {
    const email = typeof input?.email === 'string' ? input.email.trim() : '';
    const deviceName = typeof input?.deviceName === 'string'
      ? input.deviceName.trim()
      : '';
    if (!email || !deviceName) {
      return this.setFailure(
        'invalid-request',
        'Email and device name are required.'
      );
    }

    const result = await this.request('activation/register', {
      email,
      deviceId: this.state.deviceId,
      deviceName,
    });
    if (!result.ok) return result.status;

    this.state = {
      ...this.state,
      email: email.toLowerCase(),
      deviceName,
      authorizedAt: new Date().toISOString(),
      lastValidatedAt: result.body.lastSeenAt,
    };
    this.saveState();
    return this.setAuthorized();
  }

  async validate() {
    if (this.validationPromise) return this.validationPromise;
    this.validationPromise = this.performValidation();
    try {
      return await this.validationPromise;
    } finally {
      this.validationPromise = null;
    }
  }

  async performValidation() {
    if (!this.state.email) {
      this.status = {
        ...this.status,
        state: 'unregistered',
        message: undefined,
      };
      return this.getStatus();
    }

    const result = await this.request('activation/validate', {
      email: this.state.email,
      deviceId: this.state.deviceId,
      deviceName: this.state.deviceName,
    });
    if (!result.ok) return result.status;

    this.state = {
      ...this.state,
      authorizedAt: this.state.authorizedAt ?? new Date().toISOString(),
      lastValidatedAt: result.body.lastSeenAt,
    };
    this.saveState();
    return this.setAuthorized();
  }

  loadOrCreateState() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      if (isStoredState(parsed)) return parsed;
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        console.error('Unable to read authorization state.', error);
      }
    }

    const state = {
      version: 1,
      deviceId: crypto.randomUUID(),
      deviceName: os.hostname() || 'SettingForge computer',
    };
    this.state = state;
    this.saveState();
    return state;
  }

  saveState() {
    const directory = path.dirname(this.filePath);
    const temporaryPath = `${this.filePath}.tmp`;
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(temporaryPath, JSON.stringify(this.state, null, 2), {
      encoding: 'utf8',
      mode: 0o600,
    });
    fs.renameSync(temporaryPath, this.filePath);
  }

  setAuthorized() {
    this.status = {
      state: 'authorized',
      deviceId: this.state.deviceId,
      deviceName: this.state.deviceName,
      email: this.state.email,
      previouslyAuthorized: true,
      lastValidatedAt: this.state.lastValidatedAt,
    };
    return this.getStatus();
  }

  setFailure(state, message) {
    this.status = {
      state,
      deviceId: this.state.deviceId,
      deviceName: this.state.deviceName,
      email: this.state.email,
      previouslyAuthorized: Boolean(this.state.authorizedAt),
      message,
    };
    return this.getStatus();
  }

  async request(endpoint, body) {
    let response;
    try {
      response = await this.fetch(new URL(endpoint, this.baseUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8_000),
      });
    } catch (error) {
      return {
        ok: false,
        status: this.setFailure(
          'offline',
          `Authorization server unavailable: ${describeError(error)}`
        ),
      };
    }

    let responseBody = {};
    try {
      responseBody = await response.json();
    } catch {}

    if (!response.ok) {
      const denied = response.status === 403;
      const message = typeof responseBody.error === 'string'
        ? responseBody.error
        : denied
          ? 'This installation is not authorized.'
          : 'The authorization request failed.';
      return {
        ok: false,
        status: this.setFailure(denied ? 'denied' : 'error', message),
      };
    }
    if (
      responseBody.authorized !== true ||
      responseBody.deviceId !== this.state.deviceId
    ) {
      return {
        ok: false,
        status: this.setFailure(
          'error',
          'The authorization server returned an invalid response.'
        ),
      };
    }
    return { ok: true, body: responseBody };
  }
}

module.exports = {
  ApplicationAuthorizationService,
  getAuthorizationBaseUrl,
};
