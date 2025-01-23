import { createHash, randomBytes } from 'crypto'

interface CanvaAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export class CanvaService {
  private config: CanvaAuthConfig

  constructor(config: CanvaAuthConfig) {
    this.config = config
  }

  /**
   * Generiert einen zufälligen Code Verifier für PKCE
   */
  generateCodeVerifier(): string {
    return randomBytes(32)
      .toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 43)
  }

  /**
   * Generiert einen Code Challenge aus dem Code Verifier
   */
  async generateCodeChallenge(codeVerifier: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(codeVerifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  /**
   * Generiert die Autorisierungs-URL für Canva
   */
  async getAuthorizationUrl(codeVerifier: string): Promise<string> {
    const codeChallenge = await this.generateCodeChallenge(codeVerifier)
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: [
        'app:read',
        'design:content:read',
        'design:meta:read',
        'asset:read',
        'brandtemplate:meta:read',
        'brandtemplate:content:read'
      ].join(' '),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    })

    return `https://www.canva.com/api/oauth/authorize?${params.toString()}`
  }

  /**
   * Tauscht den Authorization Code gegen ein Access Token
   */
  async exchangeCodeForToken(code: string, codeVerifier: string): Promise<any> {
    const response = await fetch('https://www.canva.com/api/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code_verifier: codeVerifier,
        redirect_uri: this.config.redirectUri
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Token exchange failed: ${error}`)
    }

    return response.json()
  }

  /**
   * Prüft ob ein Access Token noch gültig ist
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch('https://www.canva.com/api/oauth/validate', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      return response.ok
    } catch {
      return false
    }
  }
} 