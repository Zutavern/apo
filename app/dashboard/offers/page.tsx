'use client'

import { useState, useEffect } from 'react'
import { Tag, Plus, Trash2, Edit, X, Columns, Rows, Image as ImageIcon, Smartphone, Monitor, Settings } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { toast } from 'sonner'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { cn } from "@/lib/utils"
import Link from 'next/link'

interface Product {
  id: string
  name: string
  description: string[]
  image_url: string
  price: number
  discount: number
  package_size: number | null
  created_at?: string
  updated_at?: string
}

export default function OffersPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isGridView, setIsGridView] = useState(true)
  const [maxCardHeight, setMaxCardHeight] = useState(0)
  const [formData, setFormData] = useState({
    name: '',
    description: ['', '', ''],
    image: '',
    price: '',
    discount: '',
    package_size: ''
  })
  const [showBackground, setShowBackground] = useState(false)
  const [isPortrait, setIsPortrait] = useState(true)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isColorDialogOpen, setIsColorDialogOpen] = useState(false)
  const [backgroundColor, setBackgroundColor] = useState('#1f2937')
  const [displayDuration, setDisplayDuration] = useState(30)

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
        discount: parseFloat(formData.discount) || 0,
        package_size: formData.package_size ? parseInt(formData.package_size) : null
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
          description: ['', '', ''],
          image: '',
          price: '',
          discount: '',
          package_size: ''
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
    const description = Array(3).fill('').map((_, index) => 
      product.description[index] || ''
    )
    setFormData({
      name: product.name,
      description: description,
      image: product.image_url,
      price: product.price.toString(),
      discount: product.discount.toString(),
      package_size: product.package_size ? product.package_size.toString() : ''
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

  const getItemsPerPage = () => {
    return isGridView ? 4 : 2
  }

  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * getItemsPerPage()
    return products.slice(startIndex, startIndex + getItemsPerPage())
  }

  const totalPages = Math.ceil(products.length / getItemsPerPage())

  const resetColor = () => {
    setBackgroundColor('#1f2937')
  }

  const handleSaveSettings = async () => {
    try {
      // Prüfe ob bereits ein Eintrag existiert
      const { data: existingSettings, error: fetchError } = await supabase
        .from('offer_settings')
        .select('*')
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError
      }

      if (existingSettings) {
        // Update existierenden Eintrag
        const { error } = await supabase
          .from('offer_settings')
          .update({
            background_color: backgroundColor,
            display_duration: displayDuration
          })
          .eq('id', existingSettings.id)

        if (error) throw error
      } else {
        // Erstelle neuen Eintrag
        const { error } = await supabase
          .from('offer_settings')
          .insert({
            background_color: backgroundColor,
            display_duration: displayDuration
          })

        if (error) throw error
      }

      toast.success('Einstellungen wurden gespeichert')
      setIsColorDialogOpen(false)
    } catch (error) {
      console.error('Fehler beim Speichern der Einstellungen:', error)
      toast.error('Fehler beim Speichern der Einstellungen')
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
          <button
            onClick={() => setIsColorDialogOpen(true)}
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
            title="Farbeinstellungen"
          >
            <Settings className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIsGridView(!isGridView)}
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-yellow-500 transition-colors"
          >
            {isGridView ? <Rows className="h-5 w-5" /> : <Columns className="h-5 w-5" />}
          </button>
          <Link href="/dashboard/offers/backgrounds">
            <button className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors">
              <ImageIcon className="h-5 w-5 text-purple-500" />
            </button>
          </Link>
          <Link href="/public/offers/portrait">
            <button className="inline-flex items-center justify-center gap-2 px-4 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-green-500 transition-colors">
              <Monitor className="h-5 w-5 text-green-500" />
              <span>Portrait</span>
            </button>
          </Link>
          <Link href="/public/offers/landscape">
            <button className="inline-flex items-center justify-center gap-2 px-4 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-green-500 transition-colors">
              <Monitor className="h-5 w-5 text-green-500" />
              <span>Landscape</span>
            </button>
          </Link>
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
                  description: ['', '', ''],
                  image: '',
                  price: '',
                  discount: '',
                  package_size: ''
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
                ? "grid-cols-1 lg:grid-cols-2" 
                : "grid-cols-1"
            )}>
              {getCurrentPageItems().map((product) => (
                <div 
                  key={product.id} 
                  className={cn(
                    "bg-gray-800 rounded-lg border border-gray-700 p-4",
                    "flex flex-col gap-4 relative group",
                    "transition-all duration-200"
                  )}
                  style={isGridView ? { minHeight: maxCardHeight > 0 ? `${maxCardHeight + 32}px` : 'auto' } : {}}
                >
                  <div className={cn(
                    "absolute inset-0 bg-black/0 group-hover:bg-gray-950/95 backdrop-blur-sm",
                    "opacity-0 invisible lg:group-hover:opacity-100 lg:group-hover:visible",
                    "transition-all duration-300 ease-in-out rounded-lg z-10",
                    "flex items-center justify-center gap-4"
                  )}>
                    <Button
                      variant="outline"
                      onClick={() => handleEdit(product)}
                      className="bg-blue-500/80 hover:bg-blue-500 border-white/10 text-white backdrop-blur-sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Angebot ändern
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setDeleteConfirmId(product.id)}
                      className="bg-red-500/80 hover:bg-red-500 border-white/10 text-white backdrop-blur-sm"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Angebot löschen
                    </Button>
                  </div>
                  <div className={cn(
                    "absolute top-4 right-4 flex gap-2",
                    "lg:hidden"
                  )}>
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
                  <div className="flex gap-4">
                    <div className={cn(
                      "relative rounded-lg overflow-hidden",
                      isGridView ? "w-24 h-24" : "w-32 h-32",
                      "bg-white flex items-center justify-center"
                    )}>
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-contain p-3 hover:scale-110 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tag className="h-6 w-6 text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className={cn(
                      "flex-1 min-w-0 product-card-content"
                    )}>
                      <div className="flex justify-between h-full items-center">
                        <div className="flex flex-col">
                          <h3 className="text-lg font-semibold text-gray-100 mb-2">{product.name}</h3>
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
                        </div>
                        <div className={cn(
                          "flex items-end flex-col gap-2",
                          "ml-4 w-[380px] pr-6"
                        )}>
                          <div className="flex flex-col w-full">
                            <div className="flex items-center justify-end gap-2 text-sm w-full">
                              {product.discount > 0 && (
                                <span className="text-xs font-medium text-white bg-red-500 px-1.5 py-0.5 rounded">
                                  -{product.discount}%
                                </span>
                              )}
                              <span className={cn(
                                "text-xs text-gray-300 whitespace-nowrap",
                                product.discount > 0 && "text-gray-500 line-through"
                              )}>
                                {product.price.toFixed(2).replace('.', ',')} €
                                <span className="align-super text-[1.1em]">*</span>
                              </span>
                            </div>
                            {product.discount > 0 && (
                              <div className="flex justify-end items-baseline mt-1 w-full">
                                <span className="text-5xl font-bold text-white tabular-nums">
                                  {Math.floor(product.price * (1 - product.discount / 100))},
                                  <span className="text-2xl align-top">
                                    {((product.price * (1 - product.discount / 100) % 1) * 100).toFixed(0).padStart(2, '0')}€
                                  </span>
                                </span>
                              </div>
                            )}
                            {product.discount > 0 && (
                              <div className="flex justify-end w-full -mt-4">
                                <span className={cn(
                                  "text-xs text-gray-400 whitespace-nowrap translate-x-8"
                                )}>
                                  ({((product.price * (1 - product.discount / 100)) / (product.package_size || 1)).toFixed(2).replace('.', ',')}€/St)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "px-4 py-2 rounded-lg",
                  currentPage === 1
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                )}
              >
                Zurück
              </button>
              <span className="px-4 py-2 bg-gray-800 rounded-lg">
                Seite {currentPage} von {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  "px-4 py-2 rounded-lg",
                  currentPage === totalPages
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-gray-700 text-gray-200 hover:bg-gray-600"
                )}
              >
                Weiter
              </button>
            </div>
            <div className="flex justify-end mt-6">
              <Button 
                onClick={() => {
                  setFormData({
                    name: '',
                    description: ['', '', ''],
                    image: '',
                    price: '',
                    discount: '',
                    package_size: ''
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
            <DialogDescription className="text-gray-400">
              {editingProduct 
                ? 'Bearbeiten Sie die Details des ausgewählten Angebots' 
                : 'Fügen Sie ein neues Angebot hinzu'}
            </DialogDescription>
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
                Produktmerkmale (max. 3)
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
                        "z.B. Entzündungshemmend"
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
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1 block">
                Packungsgröße
              </label>
              <Input
                type="number"
                value={formData.package_size}
                onChange={(e) => setFormData({ ...formData, package_size: e.target.value })}
                className="bg-gray-900 border-gray-700 text-gray-100"
                placeholder="z.B. 20"
                min="1"
              />
              <p className="text-xs text-gray-400 mt-1">Optional: Anzahl der Stück pro Packung</p>
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
                  description: ['', '', ''],
                  image: '',
                  price: '',
                  discount: '',
                  package_size: ''
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

      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="bg-gray-800 text-gray-100 border-gray-700">
          <DialogHeader>
            <DialogTitle>Angebot löschen</DialogTitle>
            <DialogDescription className="text-gray-400">
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>Sind Sie sicher, dass Sie dieses Angebot löschen möchten?</p>
          </div>
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              className="bg-gray-900/50 border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
            >
              Abbrechen
            </Button>
            <Button
              onClick={() => {
                if (deleteConfirmId) {
                  handleDelete(deleteConfirmId)
                  setDeleteConfirmId(null)
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isColorDialogOpen} onOpenChange={setIsColorDialogOpen}>
        <DialogContent className="bg-gray-800 text-gray-100 border-gray-700">
          <DialogHeader>
            <DialogTitle>Einstellungen</DialogTitle>
            <DialogDescription className="text-gray-400">
              Passen Sie die Darstellung der Angebote an
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h3 className="font-medium text-lg text-gray-100">Farbeinstellungen</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Hintergrundfarbe
                </label>
                <div className="flex gap-4 items-center">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-20 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-gray-100 rounded-lg px-3 py-2 w-28"
                  />
                  <Button
                    variant="outline"
                    onClick={resetColor}
                    className="bg-gray-900/50 border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                  >
                    Standard
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg">
              <div 
                className="rounded-lg border border-gray-700 p-4"
                style={{ backgroundColor }}
              >
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center">
                    <Tag className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold text-gray-100 mb-2">Beispielprodukt</h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500 text-lg leading-none">•</span>
                        <span className="text-sm text-gray-400">Produktmerkmal 1</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-lg text-gray-100">Anzeigedauer</h3>
              <div className="flex items-center gap-2">
                <select
                  value={displayDuration}
                  onChange={(e) => setDisplayDuration(Number(e.target.value))}
                  className="bg-gray-900 border-gray-700 text-gray-100 rounded-lg px-3 py-2 w-full"
                >
                  {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120].map((seconds) => (
                    <option key={seconds} value={seconds}>
                      {seconds} Sekunden
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-400">
                Zeit bis zum Laden der nächsten Angebote in der öffentlichen Ansicht
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsColorDialogOpen(false)}
              className="bg-gray-900/50 border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSaveSettings}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Speichern
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 