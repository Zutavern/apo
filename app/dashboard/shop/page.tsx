'use client'

import { useState, useEffect } from 'react'
import { mauveApi, MauveProduct } from '@/lib/mauve-api'

function SearchBar({ onSearch }: { onSearch: (name: string, sku: string) => void }) {
  const [productName, setProductName] = useState('')
  const [sku, setSku] = useState('')

  const handleSearch = () => {
    onSearch(productName, sku)
  }

  return (
    <div className="mb-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Nach Produktname suchen..."
            className="w-full px-3 py-1.5 text-sm text-black border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="Nach SKU suchen..."
            className="w-full px-3 py-1.5 text-sm text-black border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <button 
          onClick={handleSearch}
          className="px-4 py-1.5 bg-primary text-white text-sm rounded-md hover:bg-primary/90"
        >
          Suchen
        </button>
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: MauveProduct }) {
  const [isActive, setIsActive] = useState(false)
  
  const placeholderImage = `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  `)}`

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        <div className="w-20 h-20 flex-shrink-0 bg-gray-50 rounded-md flex items-center justify-center">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-contain rounded-md"
            onError={(e) => {
              e.currentTarget.src = placeholderImage
              e.currentTarget.onerror = null
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h2 className="text-lg font-medium text-black truncate">{product.name}</h2>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              <div className="w-8 h-4 bg-gray-300 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/25 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{product.description}</p>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">SKU: {product.sku}</span>
              <span className="text-primary font-medium">{product.price.toFixed(2)} €</span>
            </div>
            <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {product.stock > 0 ? `${product.stock} verfügbar` : 'Nicht verfügbar'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Dummy-Daten für Produkte
const DUMMY_PRODUCTS = [
  {
    id: '1',
    name: 'Aspirin Plus C',
    description: 'Schmerzlinderung und Vitamin C in einem. Brausetabletten für schnelle Wirkung.',
    price: 9.99,
    stock: 150,
    sku: 'ASP-001',
    imageUrl: 'https://placehold.co/200x200/png?text=Aspirin'
  },
  {
    id: '2',
    name: 'Ibuprofen 400mg',
    description: 'Schmerzlinderung und Entzündungshemmung bei akuten Schmerzen.',
    price: 7.49,
    stock: 200,
    sku: 'IBU-400',
    imageUrl: 'https://placehold.co/200x200/png?text=Ibuprofen'
  },
  {
    id: '3',
    name: 'Vitamin D3',
    description: 'Hochdosierte Vitamin D3 Tabletten für starke Knochen und Immunsystem.',
    price: 14.99,
    stock: 75,
    sku: 'VIT-D3',
    imageUrl: 'https://placehold.co/200x200/png?text=Vitamin+D3'
  },
  {
    id: '4',
    name: 'Magnesium Citrat',
    description: 'Hochwertiges Magnesium für Muskeln und Nervensystem.',
    price: 12.99,
    stock: 100,
    sku: 'MAG-CIT',
    imageUrl: 'https://placehold.co/200x200/png?text=Magnesium'
  },
  {
    id: '5',
    name: 'Omega-3 Kapseln',
    description: 'Hochdosierte Omega-3-Fettsäuren für Herz und Gehirn.',
    price: 19.99,
    stock: 50,
    sku: 'OMG-3',
    imageUrl: 'https://placehold.co/200x200/png?text=Omega3'
  },
  {
    id: '6',
    name: 'Zinktabletten',
    description: 'Zink zur Unterstützung des Immunsystems.',
    price: 8.99,
    stock: 120,
    sku: 'ZNK-100',
    imageUrl: 'https://placehold.co/200x200/png?text=Zink'
  },
  {
    id: '7',
    name: 'Probiotikum',
    description: 'Probiotische Bakterien für eine gesunde Darmflora.',
    price: 24.99,
    stock: 30,
    sku: 'PRO-BIO',
    imageUrl: 'https://placehold.co/200x200/png?text=Probiotikum'
  },
  {
    id: '8',
    name: 'Multivitamin',
    description: 'Umfassende Versorgung mit allen wichtigen Vitaminen und Mineralstoffen.',
    price: 16.99,
    stock: 85,
    sku: 'MUL-VIT',
    imageUrl: 'https://placehold.co/200x200/png?text=Multivitamin'
  },
  {
    id: '9',
    name: 'Calcium + D3',
    description: 'Calcium und Vitamin D3 für gesunde Knochen und Zähne.',
    price: 11.99,
    stock: 95,
    sku: 'CAL-D3',
    imageUrl: 'https://placehold.co/200x200/png?text=Calcium'
  },
  {
    id: '10',
    name: 'B-Komplex Forte',
    description: 'Alle wichtigen B-Vitamine in einer Kapsel.',
    price: 18.99,
    stock: 65,
    sku: 'B-FORT',
    imageUrl: 'https://placehold.co/200x200/png?text=B-Komplex'
  },
  {
    id: '11',
    name: 'Eisen Plus',
    description: 'Hochdosiertes Eisen mit Vitamin C für bessere Aufnahme.',
    price: 15.99,
    stock: 40,
    sku: 'FE-PLUS',
    imageUrl: 'https://placehold.co/200x200/png?text=Eisen'
  },
  {
    id: '12',
    name: 'Glucosamin Complex',
    description: 'Unterstützung für Gelenke und Knorpel.',
    price: 29.99,
    stock: 25,
    sku: 'GLU-CPX',
    imageUrl: 'https://placehold.co/200x200/png?text=Glucosamin'
  },
  {
    id: '13',
    name: 'Melatonin 1mg',
    description: 'Natürliche Unterstützung für gesunden Schlaf.',
    price: 13.99,
    stock: 70,
    sku: 'MEL-001',
    imageUrl: 'https://placehold.co/200x200/png?text=Melatonin'
  },
  {
    id: '14',
    name: 'Coenzym Q10',
    description: 'Für Energiegewinnung und Zellschutz.',
    price: 27.99,
    stock: 45,
    sku: 'COQ-10',
    imageUrl: 'https://placehold.co/200x200/png?text=Q10'
  },
  {
    id: '15',
    name: 'Kollagen Hydrolysat',
    description: 'Unterstützung für Haut, Haare und Nägel.',
    price: 32.99,
    stock: 35,
    sku: 'KOL-HYD',
    imageUrl: 'https://placehold.co/200x200/png?text=Kollagen'
  }
]

function ProductDisplay() {
  const [products, setProducts] = useState(DUMMY_PRODUCTS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const productsPerPage = 10

  const handleSearch = async (name: string, sku: string) => {
    setLoading(true)
    setError(null)
    setCurrentPage(1)
    
    try {
      // Filtern der Dummy-Daten basierend auf den Suchkriterien
      const filteredProducts = DUMMY_PRODUCTS.filter(product => {
        const nameMatch = name ? product.name.toLowerCase().includes(name.toLowerCase()) : true
        const skuMatch = sku ? product.sku.toLowerCase().includes(sku.toLowerCase()) : true
        return nameMatch && skuMatch
      })
      
      setProducts(filteredProducts)
    } catch (err) {
      console.error('Fehler bei der Produktsuche:', err)
      setError('Fehler beim Suchen der Produkte. Bitte versuchen Sie es später erneut.')
    } finally {
      setLoading(false)
    }
  }

  // Calculate pagination values
  const totalPages = Math.ceil(products.length / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const endIndex = startIndex + productsPerPage
  const currentProducts = products.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="max-w-3xl mx-auto px-4">
      <SearchBar onSearch={handleSearch} />
      
      {loading ? (
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="p-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
            <p className="text-yellow-800">
              Keine Produkte gefunden. Bitte versuchen Sie eine andere Suche.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-3">
            {currentProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6 mb-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Zurück
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      currentPage === page
                        ? 'bg-primary text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm rounded-md border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Weiter
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function ShopPage() {
  return (
    <div className="container mx-auto">
      <h1 className="text-xl font-semibold mb-4 px-4">Meine Produkte in meinem Webshop</h1>
      <ProductDisplay />
    </div>
  )
} 