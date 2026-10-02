import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveApiConfig } from '../src/services/config.js'

test('development can use localhost, production cannot silently ship it', () => {
  assert.equal(resolveApiConfig({}).apiURL, 'http://localhost:5000/api')
  assert.throws(() => resolveApiConfig({}, true), /VITE_API_URL/)
  for (const url of ['http://localhost:5000/api', 'https://localhost/api', 'https://127.0.0.1/api', 'https://[::1]/api', 'http://api.example.com/api', 'https://api.example.com', 'https://user:password@api.example.com/api', 'https://api.example.com/api?secret=no']) {
    assert.throws(() => resolveApiConfig({ VITE_API_URL: url }, true), undefined, url)
  }
  assert.deepEqual(resolveApiConfig({ VITE_API_URL: 'https://api.example.com/api/' }, true), { apiURL: 'https://api.example.com/api', socketURL: 'https://api.example.com' })
  assert.throws(() => resolveApiConfig({ VITE_API_URL: 'https://api.example.com/api', VITE_SOCKET_URL: 'http://localhost:5000' }, true))
  assert.throws(() => resolveApiConfig({ VITE_API_URL: 'https://api.example.com/api', VITE_SOCKET_URL: 'https://api.example.com/api' }, true))
})
