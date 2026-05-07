import { useEffect } from 'react'
import { setStoredAccessToken, setStoredTokenExpiry } from '../utils/tokenStorage'

export default function OAuthCallback() {
  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const expiresIn = params.get('expires_in')

    if (accessToken) {
      setStoredAccessToken(accessToken)
      if (expiresIn) {
        setStoredTokenExpiry(parseInt(expiresIn))
      }
      window.close()
    } else {
      document.body.innerHTML = '<p>Authentication failed. Please close this window and try again.</p>'
    }
  }, [])

  return <div>Processing Google authentication...</div>
}
