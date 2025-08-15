import '@testing-library/jest-dom'

// Set up Next.js server environment for testing
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Next.js server environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch for server components
global.fetch = jest.fn();

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Minimal Web API polyfills for Next.js testing
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || 'OK';
      this.headers = new Map(Object.entries(init.headers || {}));
    }
    
    static redirect(url, status = 302) {
      return new global.Response(null, { status, headers: { location: url } });
    }
    
    static json(data, init = {}) {
      return new global.Response(JSON.stringify(data), {
        ...init,
        headers: { 'content-type': 'application/json', ...init.headers }
      });
    }
    
    json() {
      return Promise.resolve(JSON.parse(this.body || '{}'));
    }
  };
}

if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init.method || 'GET';
      this.headers = new Map();
    }
  };
}