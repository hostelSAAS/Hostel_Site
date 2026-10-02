export function resolveApiConfig(values, production = false) {
  const raw = values.VITE_API_URL?.trim();
  if (production && !raw) throw new Error('Set VITE_API_URL to the public HTTPS API URL ending in /api before building.');
  const api = new URL(raw || 'http://localhost:5000/api');
  const local = host => host === 'localhost' || host.endsWith('.localhost') || /^127\./.test(host) || ['[::1]', '0.0.0.0'].includes(host);
  const validate = (url, name) => {
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error(`${name} must be an HTTP(S) URL without credentials, query, or fragment.`);
    if (production && (url.protocol !== 'https:' || local(url.hostname))) throw new Error(`${name} must use a public HTTPS host in production, not localhost.`);
  };
  validate(api, 'VITE_API_URL');
  if (!api.pathname.replace(/\/$/, '').endsWith('/api')) throw new Error('VITE_API_URL must end in /api.');
  const socket = new URL(values.VITE_SOCKET_URL?.trim() || api.origin);
  validate(socket, 'VITE_SOCKET_URL');
  if (socket.pathname !== '/') throw new Error('VITE_SOCKET_URL must be the API origin without a path.');
  return { apiURL: api.href.replace(/\/$/, ''), socketURL: socket.origin };
}
