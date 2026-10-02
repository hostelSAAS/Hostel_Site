import axios from 'axios'
import { resolveApiConfig } from './config'

export const { apiURL, socketURL } = resolveApiConfig(import.meta.env, import.meta.env.PROD)
const client = axios.create({ baseURL: apiURL, withCredentials: true, timeout: 30000, headers: { 'X-Requested-With': 'HostelHub' } })

export async function api(path, { method = 'GET', body, signal } = {}) {
  try {
    const response = await client.request({ url: path, method, data: body, signal })
    if (response.status === 204) return null
    if (!response.data || typeof response.data !== 'object' || !('data' in response.data)) throw new Error('The service returned an unexpected response. Please try again later.')
    return response.data
  } catch (cause) {
    if (axios.isCancel(cause)) throw cause
    const status = cause.response?.status
    if (status === 401 && !['/auth/login', '/auth/register'].includes(path)) window.dispatchEvent(new Event('session-expired'))
    const details = cause.response?.data?.error?.details
    const validation = details && [...(details.formErrors || []), ...Object.values(details.fieldErrors || {}).flat()].join(' ')
    const error = new Error(validation || cause.response?.data?.error?.message || (cause.isAxiosError ? 'Unable to reach HostelHub. Please try again.' : cause.message))
    error.status = status
    error.details = details
    throw error
  }
}

export const authApi = {
  me: options => api('/auth/me', options),
  login: body => api('/auth/login', { method: 'POST', body }),
  register: body => api('/auth/register', { method: 'POST', body }),
  logout: () => api('/auth/logout', { method: 'POST' }),
}
