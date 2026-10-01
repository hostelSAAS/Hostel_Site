const defaultApiURL = import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'
const baseURL = (import.meta.env.VITE_API_URL || defaultApiURL).replace(/\/$/, '')

// Cookies remain HTTP-only. Callers handle loading/error state and 401 redirects.
export async function api(path, { method = 'GET', body, signal } = {}) {
  const multipart = body instanceof FormData
  const response = await fetch(`${baseURL}${path}`, {
    method, signal, credentials: 'include',
    headers: { 'X-Requested-With': 'HostelHub', ...(!multipart && body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: body === undefined ? undefined : multipart ? body : JSON.stringify(body),
  })
  if (response.status === 204) return null
  const result = await response.json()
  if (!response.ok) {
    const error = new Error(result.error?.message || 'Request failed')
    error.status = response.status
    error.details = result.error?.details
    throw error
  }
  return result
}

export const authApi = {
  me: () => api('/auth/me'),
  login: body => api('/auth/login', { method: 'POST', body }),
  register: body => api('/auth/register', { method: 'POST', body }),
  logout: () => api('/auth/logout', { method: 'POST' }),
}
