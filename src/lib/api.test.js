import { describe, expect, it, vi } from 'vitest'
import { ApiError, createApiClient, isSessionExpired } from './api.js'

const BASE = 'https://api.example.com/'

function response(status, body) {
  const text = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body)
  return { status, ok: status >= 200 && status < 300, text: async () => text }
}

function setup({ token = 'tok-1', refreshed = 'tok-2', responses = [] } = {}) {
  const fetchImpl = vi.fn()
  for (const r of responses) fetchImpl.mockResolvedValueOnce(r)
  const getAccessToken = vi.fn(async () => token)
  const refreshToken = vi.fn(async () => refreshed)
  const api = createApiClient({ baseUrl: BASE, getAccessToken, refreshToken, fetchImpl })
  return { api, fetchImpl, getAccessToken, refreshToken }
}

describe('createApiClient', () => {
  it('requires a base URL', () => {
    expect(() => createApiClient({ baseUrl: '' })).toThrow(/VITE_API_BASE_URL/)
  })

  it('sends the Cognito access token on each request', async () => {
    const { api, fetchImpl } = setup({ responses: [response(200, { progress: null })] })
    await api.getProgress()
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://api.example.com/progress')
    expect(init.method).toBe('GET')
    expect(init.headers.Authorization).toBe('Bearer tok-1')
  })

  it("loads today's progress", async () => {
    const progress = { planId: 'fri', planVersion: '1', currentStep: 3, completedSteps: [0, 1, 2] }
    const { api } = setup({ responses: [response(200, progress)] })
    expect(await api.getProgress()).toEqual(progress)
  })

  it('saves progress to PUT /progress', async () => {
    const progress = { planId: 'fri', planVersion: '1', currentStep: 3, completedSteps: [0, 1, 2] }
    const { api, fetchImpl } = setup({ responses: [response(200, progress)] })
    await api.saveProgress(progress)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://api.example.com/progress')
    expect(init.method).toBe('PUT')
    expect(JSON.parse(init.body)).toEqual(progress)
  })

  it('loads account settings', async () => {
    const settings = { restSec: 90, warmRest: 30, sound: false }
    const { api } = setup({ responses: [response(200, { settings })] })
    expect(await api.getSettings()).toEqual(settings)
  })

  it('saves settings in the settings object', async () => {
    const settings = { restSec: 105, warmRest: 45, sound: true }
    const { api, fetchImpl } = setup({ responses: [response(200, { settings })] })
    await api.saveSettings(settings)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('https://api.example.com/settings')
    expect(init.method).toBe('PUT')
    expect(JSON.parse(init.body)).toEqual({ settings })
  })

  it('renews the token once on 401 and retries', async () => {
    const { api, fetchImpl, refreshToken } = setup({ responses: [response(401), response(200, null)] })
    await api.getProgress()
    expect(refreshToken).toHaveBeenCalledTimes(1)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(fetchImpl.mock.calls[1][1].headers.Authorization).toBe('Bearer tok-2')
  })

  it('renews before the request when the token is unavailable', async () => {
    const { api, fetchImpl } = setup({ token: null, responses: [response(200, null)] })
    await api.getProgress()
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe('Bearer tok-2')
  })

  it('reports an expired session when renewal fails', async () => {
    const { api, fetchImpl } = setup({ token: null, refreshed: null })
    const err = await api.getProgress().catch((e) => e)
    expect(isSessionExpired(err)).toBe(true)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('surfaces server error messages', async () => {
    const { api } = setup({ responses: [response(500, { message: 'DynamoDB unavailable' })] })
    const err = await api.getProgress().catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.kind).toBe('server')
    expect(err.status).toBe(500)
    expect(err.message).toBe('DynamoDB unavailable')
  })

  it('turns fetch failures into network errors', async () => {
    const { api, fetchImpl } = setup()
    fetchImpl.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const err = await api.getProgress().catch((e) => e)
    expect(err.kind).toBe('network')
  })
})
