'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { cn } from "@/lib/utils"
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

interface Product {
  id: string
  name: string
  description: string[]
  image_url: string
  price: number
  discount: number
  package_size: number | null
}

export default function PublicOffersLandscape() {
  const [background, setBackground] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [currentSet, setCurrentSet] = useState(0)
  const supabase = createClientComponentClient()

  const DISPLAY_TIME = 30000 // 30 Sekunden
  const PRODUCTS_PER_PAGE = 4

  useEffect(() => {
    async function loadBackground() {
      try {
        const { data, error } = await supabase
          .from('offer_backgrounds')
          .select('*')
          .eq('orientation', 'landscape')
          .eq('is_selected', true)
          .single()

        if (error) throw error

        if (data) {
          const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${data.bucket_name}/${data.storage_path}`
          setBackground(imageUrl)
        }
      } catch (error) {
        console.error('Fehler beim Laden des Hintergrunds:', error)
      }
    }

    async function loadProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setProducts(data || [])
      } catch (error) {
        console.error('Fehler beim Laden der Produkte:', error)
      }
    }

    loadBackground()
    loadProducts()
    const interval = setInterval(loadBackground, 60000)
    const productsInterval = setInterval(loadProducts, 60000)
    
    // Animation Timer
    const animationTimer = setInterval(() => {
      setCurrentSet(current => {
        const totalSets = Math.ceil(products.length / PRODUCTS_PER_PAGE)
        console.log(`Rotating to set ${current + 1} of ${totalSets}`) // Debug Info
        return current + 1 >= totalSets ? 0 : current + 1
      })
    }, DISPLAY_TIME)

    return () => {
      clearInterval(interval)
      clearInterval(productsInterval)
      clearInterval(animationTimer)
    }
  }, [products.length])

  const getCurrentProducts = () => {
    const start = currentSet * PRODUCTS_PER_PAGE
    return products.slice(start, start + PRODUCTS_PER_PAGE)
  }

  if (!background) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    )
  }

  return (
    <div 
      className="w-screen h-screen bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${background})` }}
    >
      <div className="absolute inset-0 bg-black/40" /> {/* Overlay für bessere Lesbarkeit */}
      <div className="relative z-10 w-full h-full p-8 flex items-center justify-center translate-y-12">
        <div className="grid grid-cols-2 gap-8 auto-rows-min w-[1680px]">
          <AnimatePresence mode="wait">
            {getCurrentProducts().map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  duration: 0.5,
                  delay: index * 0.2, // Verzögerung für kaskadierenden Effekt
                }}
              >
                <div 
                  className="bg-gray-800/90 rounded-lg border border-gray-700 p-4 flex flex-col gap-4"
                  style={{ height: '280px' }}
                >
                  <div className="flex gap-4 w-full h-full">
                    <div className="relative h-full aspect-square bg-white rounded-lg overflow-hidden flex items-center justify-center">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-contain p-4"
                          sizes="(max-width: 1680px) 240px"
                          priority
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0 h-full">
                      <div className="flex justify-between h-full items-center">
                        <div className="flex flex-col h-full pt-2">
                          <h3 className="text-xl font-semibold text-gray-100 mb-3">{product.name}</h3>
                          <div className="space-y-2 min-h-[96px]">
                            {product.description.map((desc, index) => (
                              desc && (
                                <div key={index} className="flex items-center gap-2">
                                  <span className="text-blue-500 text-xl leading-none">•</span>
                                  <span className="text-base text-gray-400 leading-tight">{desc}</span>
                                </div>
                              )
                            ))}
                            {/* Platzhalter für fehlende Beschreibungen */}
                            {Array.from({ length: 3 - (product.description.filter(Boolean).length) }).map((_, index) => (
                              <div key={`empty-${index}`} className="h-6" /> // Leere Zeile mit fester Höhe
                            ))}
                          </div>
                        </div>
                        <div className="flex items-end flex-col gap-2 ml-4 w-[380px] pr-6">
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
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
} 