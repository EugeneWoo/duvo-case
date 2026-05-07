export function getStoredAccessToken() {
  return localStorage.getItem('google_drive_token')
}

export function setStoredAccessToken(token) {
  localStorage.setItem('google_drive_token', token)
}

export function clearStoredAccessToken() {
  localStorage.removeItem('google_drive_token')
}

export function getStoredTokenExpiry() {
  return localStorage.getItem('google_drive_token_expiry')
}

export function setStoredTokenExpiry(expiresIn) {
  const expiry = Date.now() + expiresIn * 1000
  localStorage.setItem('google_drive_token_expiry', expiry)
}

export function isTokenExpired() {
  const expiry = getStoredTokenExpiry()
  if (!expiry) return true
  return Date.now() > parseInt(expiry)
}
