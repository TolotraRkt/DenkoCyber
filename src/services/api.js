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

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: form ? body : body ? JSON.stringify(body) : undefined,
    })
  } catch {
    // Network-level failure (server unreachable, CORS, offline…).
    throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion.")
  }

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await response.json().catch(() => null) : null

  if (!response.ok) {
    const message = data?.detail ?? `Échec de la requête (${response.status})`
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

export const sessionsApi = {
  create: (payload) => request('/api/sessions', { method: 'POST', body: payload, auth: true }),
  list: () => request('/api/sessions', { auth: true }),
  get: (code) => request(`/api/sessions/${encodeURIComponent(code)}`, { auth: true }),
  start: (code) =>
    request(`/api/sessions/${encodeURIComponent(code)}/start`, { method: 'POST', auth: true }),
  stop: (code) =>
    request(`/api/sessions/${encodeURIComponent(code)}/stop`, { method: 'POST', auth: true }),
  extend: (code, extraMinutes) =>
    request(`/api/sessions/${encodeURIComponent(code)}/extend`, {
      method: 'POST',
      body: { extra_minutes: extraMinutes },
      auth: true,
    }),
  // Called by the client app running on a station to start a session with a code.
  claim: (code, stationId) =>
    request('/api/sessions/claim', {
      method: 'POST',
      body: { code, station_id: stationId },
      auth: true,
    }),
  live: (code) => request(`/api/sessions/${encodeURIComponent(code)}/live`, { auth: true }),
  stats: () => request('/api/sessions/stats', { auth: true }),
  history: ({ status, date, limit = 50, offset = 0 } = {}) => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (date) params.set('date', date)
    params.set('limit', String(limit))
    params.set('offset', String(offset))
    return request(`/api/sessions/history?${params.toString()}`, { auth: true })
  },
}

export const stationsApi = {
  list: () => request('/api/stations', { auth: true }),
  create: (payload) => request('/api/stations', { method: 'POST', body: payload, auth: true }),
  get: (id) => request(`/api/stations/${encodeURIComponent(id)}`, { auth: true }),
  update: (id, payload) =>
    request(`/api/stations/${encodeURIComponent(id)}`, { method: 'PATCH', body: payload, auth: true }),
  remove: (id) =>
    request(`/api/stations/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
  seed: () => request('/api/stations/seed', { method: 'POST', auth: true }),
  // Live state (status, active code, remaining seconds) for a station by its code.
  live: (code) => request(`/api/stations/by-code/${encodeURIComponent(code)}/live`, { auth: true }),
  // Live state of every station in a single request.
  liveAll: () => request('/api/stations/live', { auth: true }),
}
