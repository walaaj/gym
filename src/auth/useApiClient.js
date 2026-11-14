import { useEffect, useMemo, useRef } from 'react'
import { useAuth } from 'react-oidc-context'
import { createApiClient } from '../lib/api.js'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://7ikru6j381.execute-api.us-east-1.amazonaws.com'

/**
 * API client bound to the signed-in user's Cognito access token.
 * An expired token is renewed silently (refresh token) before the request;
 * if renewal fails, requests reject with an ApiError of kind 'auth'.
 */
export function useApiClient() {
  const auth = useAuth()
  const authRef = useRef(auth)
  useEffect(() => {
    authRef.current = auth
  })

  return useMemo(
    () =>
      createApiClient({
        baseUrl: API_BASE_URL,
        async getAccessToken() {
          const user = authRef.current.user
          return user && !user.expired ? user.access_token : null
        },
        async refreshToken() {
          try {
            const user = await authRef.current.signinSilent()
            return user?.access_token || null
          } catch {
            return null
          }
        },
      }),
    [],
  )
}
