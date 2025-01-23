import axios from 'axios'
import queryString from 'query-string'

const CANVA_API_URL = 'https://api.canva.com'
const CANVA_CLIENT_ID = process.env.NEXT_PUBLIC_CANVA_CLIENT_ID
const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET

interface CanvaAsset {
  id: string
  name: string
  type: string
  url: string
  thumbnailUrl: string
  createdAt: string
  updatedAt: string
}

class CanvaClient {
  private accessToken: string | null = null

  constructor() {
    this.accessToken = null
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken

    try {
      const response = await axios.post(
        'https://api.canva.com/oauth2/token',
        queryString.stringify({
          grant_type: 'client_credentials',
          client_id: CANVA_CLIENT_ID,
          client_secret: CANVA_CLIENT_SECRET,
          scope: 'assets:read'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      this.accessToken = response.data.access_token
      return this.accessToken
    } catch (error) {
      console.error('Fehler beim Abrufen des Access Tokens:', error)
      throw error
    }
  }

  async getFolderAssets(folderId: string): Promise<CanvaAsset[]> {
    try {
      const token = await this.getAccessToken()
      const response = await axios.get(
        `${CANVA_API_URL}/v1/folders/${folderId}/assets`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      return response.data.assets
    } catch (error) {
      console.error('Fehler beim Abrufen der Assets:', error)
      throw error
    }
  }

  async searchAssets(query: string): Promise<CanvaAsset[]> {
    try {
      const token = await this.getAccessToken()
      const response = await axios.get(
        `${CANVA_API_URL}/v1/assets/search`,
        {
          params: { query },
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      return response.data.assets
    } catch (error) {
      console.error('Fehler beim Suchen von Assets:', error)
      throw error
    }
  }
}

export const canvaClient = new CanvaClient()
export type { CanvaAsset } 