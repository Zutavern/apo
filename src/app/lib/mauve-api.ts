// Typen für die Mauve API
export interface MauveProduct {
  id: string
  name: string
  description: string
  price: {
    amount: number
    currency: string
  }
  stock: number
  images: string[]
  sku: string
  categories: string[]
}

interface MauveApiConfig {
  baseUrl: string
  username: string
  password: string
}

class MauveApiClient {
  private config: MauveApiConfig
  private authToken: string | null = null

  constructor(config: MauveApiConfig) {
    this.config = config
  }

  private async getAuthToken() {
    if (this.authToken) return this.authToken

    const response = await fetch(`${this.config.baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: this.config.username,
        password: this.config.password,
      }),
    })

    if (!response.ok) {
      throw new Error('Authentifizierung fehlgeschlagen')
    }

    const data = await response.json()
    this.authToken = data.token
    return this.authToken
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = await this.getAuthToken()
    
    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (response.status === 401) {
      // Token ist abgelaufen, neu authentifizieren
      this.authToken = null
      return this.fetchWithAuth(endpoint, options)
    }

    if (!response.ok) {
      throw new Error(`Mauve API Error: ${response.statusText}`)
    }

    return response.json()
  }

  async getProducts() {
    return this.fetchWithAuth('/products')
  }

  async getProduct(id: string) {
    return this.fetchWithAuth(`/products/${id}`)
  }

  async createProduct(product: Omit<MauveProduct, 'id'>) {
    return this.fetchWithAuth('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    })
  }

  async updateProduct(id: string, product: Partial<MauveProduct>) {
    return this.fetchWithAuth(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    })
  }

  async deleteProduct(id: string) {
    return this.fetchWithAuth(`/products/${id}`, {
      method: 'DELETE',
    })
  }
}

// Erstelle eine Instanz des API-Clients
export const mauveApi = new MauveApiClient({
  baseUrl: process.env.NEXT_PUBLIC_MAUVE_API_URL || 'https://demo.mauve.de/api',
  username: 'demo',
  password: 'demo',
}) 