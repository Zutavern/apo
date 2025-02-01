'use client'

import { useState, useEffect } from 'react'
import { Tag, Plus, Trash2, Edit, X, LayoutGrid, LayoutList } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { toast } from 'sonner'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  description: string[]
  image_url: string
  price: number
  discount: number
  created_at?: string
  updated_at?: string
}

export default function OffersPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isGridView, setIsGridView] = useState(true)
  const [maxCardHeight, setMaxCardHeight] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    description: ['', '', '', '', ''],
    image: '',
    price: '',
    discount: ''
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    if (products.length > 0) {
      setTimeout(() => {
        const cards = document.querySelectorAll('.product-card-content')
        const heights = Array.from(cards).map(card => card.getBoundingClientRect().height)
        const maxHeight = Math.max(...heights)
        setMaxCardHeight(maxHeight)
      }, 100)
    }
  }, [products, isGridView])

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Fehler beim Laden der Produkte')
    } finally {
      setIsInitialLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.price) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus')
      return
    }

    setIsLoading(true)
    try {
      const productData = {
        name: formData.name,
        description: formData.description.filter(bullet => bullet.trim() !== ''),
        image_url: formData.image,
        price: parseFloat(formData.price),
        discount: parseFloat(formData.discount) || 0
      }

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) throw error
        toast.success('Produkt wurde aktualisiert')
        setIsDialogOpen(false)
      } else {
        const { error } = await supabase
          .from('products')
          .insert([productData])

        if (error) throw error
        toast.success('Produkt wurde angelegt')
        setFormData({
          name: '',
          description: ['', '', '', '', ''],
          image: '',
          price: '',
          discount: ''
        })
      }

      setEditingProduct(null)
      loadProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Fehler beim Speichern des Produkts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    const description = Array(5).fill('').map((_, index) => 
      product.description[index] || ''
    )
    setFormData({
      name: product.name,
      description: description,
      image: product.image_url,
      price: product.price.toString(),
      discount: product.discount.toString()
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      await loadProducts()
      toast.success('Produkt wurde gelöscht')
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Fehler beim Löschen des Produkts')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('product_images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('product_images')
        .getPublicUrl(filePath)

      setFormData({ ...formData, image: publicUrl })
      toast.success('Bild erfolgreich hochgeladen')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Fehler beim Hochladen des Bildes')
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="flex items-center gap-3 md:col-span-2">
          <Tag className="h-8 w-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-100">Angebotsverwaltung</h1>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Toggle
            pressed={!isGridView}
            onPressedChange={(pressed) => setIsGridView(!pressed)}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "bg-gray-900/50 border-gray-700 hover:bg-gray-800 text-white"
            )}
          >
            {isGridView ? <LayoutList className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Toggle>
        </div>
      </div>

      {isInitialLoading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
          <p className="text-gray-400 mt-4">Lade Angebote...</p>
        </div>
      ) : (
        products.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
              <Tag className="h-8 w-8 text-blue-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-100 mb-2">Keine Angebote vorhanden</h2>
            <p className="text-gray-400 mb-4">Erstellen Sie Ihr erstes Angebot</p>
            <Button 
              onClick={() => {
                setFormData({
                  name: '',
                  description: ['', '', '', '', ''],
                  image: '',
                  price: '',
                  discount: ''
                })
                setEditingProduct(null)
                setIsDialogOpen(true)
              }}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Angebot einrichten
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={cn(
              "grid gap-4",
              isGridView 
                ? "grid-cols-1 md:grid-cols-3" 
                : "grid-cols-1 md:grid-cols-2"
            )}>
              {products.map((product) => (
                <div 
                  key={product.id} 
                  className={cn(
                    "bg-gray-800 rounded-lg border border-gray-700 p-4",
                    "flex flex-col gap-4"
                  )}
                  style={isGridView ? { minHeight: maxCardHeight > 0 ? `${maxCardHeight + 32}px` : 'auto' } : {}}
                >
                  <div className="flex gap-4">
                    <div className={cn(
                      "relative rounded-lg overflow-hidden",
                      isGridView ? "w-24 h-24" : "w-32 h-32"
                    )}>
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-900/50 flex items-center justify-center">
                          <Tag className="h-6 w-6 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 product-card-content">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-100">{product.name}</h3>
                      </div>
                      <div className="space-y-1">
                        {product.description.map((desc, index) => (
                          desc && (
                            <div key={index} className="flex items-center gap-2">
                              <span className="text-blue-500 text-lg leading-none">•</span>
                              <span className="text-sm text-gray-400 leading-tight">{desc}</span>
                            </div>
                          )
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-gray-300">{product.price.toFixed(2)} €</span>
                        {product.discount > 0 && (
                          <span className="text-sm text-red-500">-{product.discount}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-auto">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(product)}
                      className="hover:bg-gray-700"
                    >
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                      className="hover:bg-gray-700"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <Button 
                onClick={() => {
                  setFormData({
                    name: '',
                    description: ['', '', '', '', ''],
                    image: '',
                    price: '',
                    discount: ''
                  })
                  setEditingProduct(null)
                  setIsDialogOpen(true)
                }}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Angebot erstellen
              </Button>
            </div>
          </div>
        )
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-800 text-gray-100 border-gray-700">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Angebot bearbeiten' : 'Neues Angebot erstellen'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">
                Produktname *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-gray-900 border-gray-700 text-gray-100"
                placeholder="z.B. Aspirin"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">
                Produktmerkmale (max. 5)
              </label>
              <div className="space-y-2">
                {formData.description.map((bullet, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-blue-500 font-bold min-w-[24px]">{index + 1}.</span>
                    <Input
                      value={bullet}
                      onChange={(e) => {
                        const newDescription = [...formData.description]
                        newDescription[index] = e.target.value
                        setFormData({ ...formData, description: newDescription })
                      }}
                      className="bg-gray-900 border-gray-700 text-gray-100"
                      placeholder={[
                        "z.B. Schmerzlinderung",
                        "z.B. Fiebersenkend",
                        "z.B. Entzündungshemmend",
                        "z.B. Schnell wirksam",
                        "z.B. Gut verträglich"
                      ][index]}
                    />
                  </div>
                ))}
                <p className="text-xs text-gray-400 mt-2">
                  Tipp: Beschreiben Sie die wichtigsten Eigenschaften des Produkts
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">
                Produktbild hochladen
              </label>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-gray-700 bg-gray-900/50 hover:bg-gray-900">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold text-blue-400">Klicken</span> oder Bild hierher ziehen
                      </p>
                      <p className="text-xs text-gray-500">Empfohlen: Quadratisches Bild, mind. 500x500px</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>
                {formData.image && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden">
                    <Image
                      src={formData.image}
                      alt="Vorschau"
                      fill
                      className="object-contain"
                    />
                    <button
                      onClick={() => setFormData({ ...formData, image: '' })}
                      className="absolute top-2 right-2 p-1 rounded-full bg-gray-900/80 hover:bg-gray-900 transition-colors"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">
                  Verkaufspreis (€) *
                </label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-gray-100"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
                <p className="text-xs text-gray-400 mt-1">Regulärer Verkaufspreis</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">
                  Rabatt in %
                </label>
                <Input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  className="bg-gray-900 border-gray-700 text-gray-100"
                  placeholder="0"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-400 mt-1">Optional: 0-100%</p>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <Button
              variant="outline"
              className="bg-gray-900/50 border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-300 transition-colors"
              onClick={() => {
                setIsDialogOpen(false)
                setEditingProduct(null)
                setFormData({
                  name: '',
                  description: ['', '', '', '', ''],
                  image: '',
                  price: '',
                  discount: ''
                })
              }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {editingProduct ? 'Aktualisieren' : 'Erstellen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 