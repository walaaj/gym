// API client for API Gateway HTTP API + Lambda + DynamoDB.
//
// The API accepts Cognito access tokens as Bearer tokens. The Lambda derives
// the user identity from the verified JWT `sub` claim.
//
// Supported routes:
//   GET /progress       today's progress
//   PUT /progress       save today's progress
//   GET /settings       the signed-in user's settings
//   PUT /settings       save the signed-in user's settings

const TIMEOUT_MS = 15000

export class ApiError extends Error {
  constructor(message, { status = 0, kind = 'server', body } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.kind = kind
    this.body = body
  }
}

export const isSessionExpired = (err) => err instanceof ApiError && err.kind === 'auth'

async function readBody(res) {
  if (res.status === 204) return null
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function messageFrom(body, status) {
  if (body && typeof body === 'object') {
    return body.message || body.error || `Request failed (${status})`
  }
  if (typeof body === 'string' && body.length < 200) return body
  return `Request failed (${status})`
}

function unwrap(body, key) {
  if (body && typeof body === 'object' && !Array.isArray(body) && body[key] && typeof body[key] === 'object') {
    return body[key]
  }
  return body
}

export function createApiClient({ baseUrl, getAccessToken, refreshToken, fetchImpl }) {
  if (!baseUrl) throw new Error('Missing API base URL (VITE_API_BASE_URL)')
  const root = baseUrl.replace(/\/+$/, '')
  const doFetch = fetchImpl || ((...args) => fetch(...args))

  async function send(method, path, token, body) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      return await doFetch(`${root}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })
    } catch (err) {
      const timedOut = err?.name === 'AbortError'
      throw new ApiError(
        timedOut ? 'The server took too long to respond.' : 'Could not reach the server. Check your connection.',
        { kind: 'network' },
      )
    } finally {
      clearTimeout(timer)
    }
  }

  async function request(method, path, body) {
    let token = await getAccessToken()
    if (!token) token = await refreshToken()
    if (!token) {
      throw new ApiError('Your session has expired. Please sign in again.', { status: 401, kind: 'auth' })
    }

    let res = await send(method, path, token, body)
    if (res.status === 401) {
      const fresh = await refreshToken()
      if (!fresh) {
        throw new ApiError('Your session has expired. Please sign in again.', { status: 401, kind: 'auth' })
      }
      res = await send(method, path, fresh, body)
    }

    const data = await readBody(res)
    if (res.ok) return data

    if (res.status === 401) {
      throw new ApiError('Your session has expired. Please sign in again.', { status: 401, kind: 'auth', body: data })
    }
    if (res.status === 403) {
      throw new ApiError("You don't have access to this.", { status: 403, kind: 'auth', body: data })
    }
    if (res.status === 404) {
      throw new ApiError(messageFrom(data, 404), { status: 404, kind: 'notFound', body: data })
    }
    throw new ApiError(messageFrom(data, res.status), { status: res.status, kind: 'server', body: data })
  }

  return {
    async getProgress() {
      try {
        return unwrap(await request('GET', '/progress'), 'progress')
      } catch (err) {
        if (err instanceof ApiError && err.kind === 'notFound') return null
        throw err
      }
    },
    async saveProgress(progress) {
      const saved = unwrap(await request('PUT', '/progress', progress), 'progress')
      return saved && typeof saved === 'object' ? { ...progress, ...saved } : progress
    },
    async getSettings() {
      try {
        const result = await request('GET', '/settings')
        const value = unwrap(result, 'settings')
        return value && typeof value === 'object' ? value : {}
      } catch (err) {
        if (err instanceof ApiError && err.kind === 'notFound') return {}
        throw err
      }
    },
    async saveSettings(settings) {
      const result = await request('PUT', '/settings', { settings })
      const saved = unwrap(result, 'settings')
      return saved && typeof saved === 'object' ? saved : settings
    },
  }
}
