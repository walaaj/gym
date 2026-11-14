import { WebStorageStateStore } from 'oidc-client-ts'

const authority =
  import.meta.env.VITE_COGNITO_AUTHORITY ||
  'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_OD7v6dkC1'

const clientId =
  import.meta.env.VITE_COGNITO_CLIENT_ID ||
  '4bidos6cf9frbp2si5f9jptfp1'

const redirectUri =
  import.meta.env.VITE_COGNITO_REDIRECT_URI ||
  `${window.location.origin}/`

export const oidcConfig = {
  authority,
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: 'code',
  scope: 'openid email',
  // Keep tokens in session storage rather than localStorage.
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  onSigninCallback() {
    // Remove the temporary authorization code from the address bar.
    window.history.replaceState({}, document.title, window.location.pathname)
  },
}
