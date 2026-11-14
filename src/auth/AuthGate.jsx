import { useCallback, useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import App from '../App.jsx'
import { useApiClient } from './useApiClient.js'

function AuthMessage({ title, message, children }) {
  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <p className="auth-eyebrow">EVENING GYM TRACKER</p>
        <h1>{title}</h1>
        {message && <p className="auth-message">{message}</p>}
        {children}
      </section>
    </main>
  )
}

export default function AuthGate() {
  const auth = useAuth()
  const api = useApiClient()
  const [expired, setExpired] = useState(false)

  // The refresh token itself can expire or be revoked; then silent renew fails
  // and the user has to sign in again.
  useEffect(
    () => auth.events.addSilentRenewError(() => setExpired(true)),
    [auth.events],
  )

  const onSessionExpired = useCallback(() => setExpired(true), [])

  const signInAgain = useCallback(async () => {
    await auth.removeUser()
    auth.signinRedirect()
  }, [auth])

  if (auth.isLoading) {
    return <AuthMessage title="Loading your account…" message="Checking your secure sign-in session." />
  }

  if (auth.error && !auth.isAuthenticated) {
    return (
      <AuthMessage title="Sign-in problem" message={auth.error.message}>
        <button className="auth-primary" onClick={() => auth.signinRedirect()}>
          Try signing in again
        </button>
      </AuthMessage>
    )
  }

  if (expired) {
    return (
      <AuthMessage
        title="Session expired"
        message="For your security you've been signed out. Sign in again to keep saving your workouts. Progress already saved is kept."
      >
        <button className="auth-primary" onClick={signInAgain}>
          Sign in again
        </button>
      </AuthMessage>
    )
  }

  if (!auth.isAuthenticated) {
    return (
      <AuthMessage
        title="Your training, your account."
        message="Sign in or create an account to open your personal workout tracker."
      >
        <button className="auth-primary" onClick={() => auth.signinRedirect()}>
          Sign in / Register
        </button>
        <p className="auth-note">
          You'll be redirected to Amazon Cognito's secure sign-in page.
        </p>
      </AuthMessage>
    )
  }

  return (
    <App
      user={auth.user}
      api={api}
      onSignOut={() => auth.signoutRedirect()}
      onSessionExpired={onSessionExpired}
    />
  )
}
