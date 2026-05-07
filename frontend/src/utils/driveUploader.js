function getStoredAccessToken() {
  return localStorage.getItem('google_drive_token')
}

function setStoredAccessToken(token) {
  localStorage.setItem('google_drive_token', token)
}

function clearStoredAccessToken() {
  localStorage.removeItem('google_drive_token')
}

export async function uploadToDrive(content, filename) {
  let accessToken = getStoredAccessToken()

  if (!accessToken) {
    const token = prompt(
      'Enter your Google Drive API access token:\n\n' +
      'To get a token:\n' +
      '1. Go to https://myaccount.google.com/permissions\n' +
      '2. Or authenticate via Google OAuth (requires app configuration)\n\n' +
      'Paste your access token below:'
    )

    if (!token) {
      throw new Error('Google Drive authentication cancelled')
    }

    accessToken = token
    setStoredAccessToken(accessToken)
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
    if (error.error.includes('invalid_grant') || error.error.includes('Invalid')) {
      clearStoredAccessToken()
      throw new Error('Invalid token. Please try again with a fresh token.')
    }
    throw new Error(error.error || 'Failed to upload to Google Drive')
  }

  const result = await response.json()
  return result
}
