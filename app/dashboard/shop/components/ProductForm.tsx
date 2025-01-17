'use client'

import { useState, useEffect } from 'react'
import { MauveProduct } from '../../../lib/mauve-api'
import { X } from 'lucide-react'

interface ProductFormProps {
  product?: MauveProduct
  onSave: (product: Omit<MauveProduct, 'id'>) => Promise<void>
  onCancel: () => void
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState<Omit<MauveProduct, 'id'>>({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || { amount: 0, currency: 'EUR' },
    stock: product?.stock || 0,
    images: product?.images || [],
    sku: product?.sku || '',
    categories: product?.categories || []
  })
  const [newCategory, setNewCategory] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      await onSave(formData)
    } catch (error) {
      console.error('Fehler beim Speichern:', error)
      alert('Produkt konnte nicht gespeichert werden.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basis Informationen */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Beschreibung
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500 min-h-[100px]"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Preis
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.price.amount}
              onChange={(e) => setFormData({
                ...formData,
                price: { ...formData.price, amount: parseFloat(e.target.value) }
              })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Währung
            </label>
            <select
              value={formData.price.currency}
              onChange={(e) => setFormData({
                ...formData,
                price: { ...formData.price, currency: e.target.value }
              })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
            >
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Lagerbestand
          </label>
          <input
            type="number"
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            SKU
          </label>
          <input
            type="text"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        {/* Kategorien */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Kategorien
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.categories.map((category, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700 text-gray-300 rounded"
              >
                {category}
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    categories: formData.categories.filter((_, i) => i !== index)
                  })}
                  className="text-gray-400 hover:text-gray-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
              placeholder="Neue Kategorie"
            />
            <button
              type="button"
              onClick={() => {
                if (newCategory.trim()) {
                  setFormData({
                    ...formData,
                    categories: [...formData.categories, newCategory.trim()]
                  })
                  setNewCategory('')
                }
              }}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
            >
              Hinzufügen
            </button>
          </div>
        </div>

        {/* Bilder */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Bilder
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Produkt ${index + 1}`}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    images: formData.images.filter((_, i) => i !== index)
                  })}
                  className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
          </div>
          <input
            type="url"
            placeholder="Bild-URL hinzufügen"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const input = e.target as HTMLInputElement
                if (input.value.trim()) {
                  setFormData({
                    ...formData,
                    images: [...formData.images, input.value.trim()]
                  })
                  input.value = ''
                }
              }
            }}
          />
        </div>
      </div>

      {/* Aktionen */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-400 hover:text-gray-300"
          disabled={isSubmitting}
        >
          Abbrechen
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Wird gespeichert...' : 'Speichern'}
        </button>
      </div>
    </form>
  )
} 