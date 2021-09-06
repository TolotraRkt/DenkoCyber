/**
 * Minimal API client for the DenkoCyber backend.
 * The backend runs locally (FastAPI, to be bundled as an .exe).
 */

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'

const TOKEN_KEY = 'denkocyber_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

async function request(path, { method = 'GET', body, auth = false, form = false } = {}) {
  const headers = {}
  if (form) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
  } else if (body) {
    headers['Content-Type'] = 'application/json'
  }
  if (auth) {
    const token = getToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: form ? body : body ? JSON.stringify(body) : undefined,
  })

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json() : null

  if (!response.ok) {
    const message = data?.detail ?? `Request failed (${response.status})`
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
  }
  return data
}

export const authApi = {
  register: (payload) => request('/api/auth/register', { method: 'POST', body: payload }),
  login: (username, password) => {
    const form = new URLSearchParams({ username, password }).toString()
    return request('/api/auth/login', { method: 'POST', body: form, form: true })
  },
  me: () => request('/api/auth/me', { auth: true }),
  health: () => request('/api/health'),
}
