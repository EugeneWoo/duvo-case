import {
  getStoredAccessToken,
  setStoredAccessToken,
  clearStoredAccessToken,
  setStoredTokenExpiry,
  isTokenExpired,
} from './tokenStorage'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'

export async function uploadToDrive(content, filename) {
  let accessToken = getStoredAccessToken()

  if (!accessToken || isTokenExpired()) {
    accessToken = await authenticateWithGoogle()
  }

  const response = await fetch('/api/upload-to-drive', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename,
      content,
      accessToken,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    if (error.error && /invalid_grant|Invalid/i.test(error.error)) {
      clearStoredAccessToken()
      throw new Error('Token expired. Please login again.')
    }
    throw new Error(error.error || 'Failed to upload to Google Drive')
  }

  const result = await response.json()
  return result
}

function authenticateWithGoogle() {
  return new Promise((resolve, reject) => {
    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
      reject(new Error('Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in .env'))
      return
    }

    const state = Math.random().toString(36).substr(2, 9)
    const redirectUri = `${window.location.origin}/oauth-callback`
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'token',
      scope: 'https://www.googleapis.com/auth/drive.file',
      state,
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
    const popup = window.open(authUrl, 'googleAuth', 'width=500,height=600')

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for this site.'))
      return
    }

    const checkToken = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(checkToken)
          reject(new Error('Authentication cancelled'))
          return
        }

        const token = getStoredAccessToken()
        if (token) {
          clearInterval(checkToken)
          popup.close()
          resolve(token)
        }
      } catch (e) {
        // Ignore errors from closed popup
      }
    }, 2000)

    setTimeout(() => {
      clearInterval(checkToken)
      if (popup && !popup.closed) {
        popup.close()
      }
      reject(new Error('Authentication timeout'))
    }, 5 * 60 * 1000)
  })
}
