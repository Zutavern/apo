// Typen für die Mauve API
export interface MauveProduct {
  id: string
  name: string
  description: string
  price: number
  stock: number
  sku: string
  imageUrl: string
}

// Dummy-Implementierung der Mauve API
class MauveApiClient {
  async getProducts() {
    return []
  }

  async searchProducts(query: string) {
    return []
  }
}

// Erstelle eine Instanz des API-Clients
export const mauveApi = new MauveApiClient()

export type { MauveProduct } 