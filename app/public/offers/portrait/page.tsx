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

export default function PublicOffersPortrait() {
  const [background, setBackground] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [currentSet, setCurrentSet] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const supabase = createClientComponentClient()

  const DISPLAY_TIME = 35000
  const PRODUCTS_PER_PAGE = 4

  useEffect(() => {
    loadBackground()
    loadProducts()
    const interval = setInterval(loadBackground, 60000)
    const productsInterval = setInterval(loadProducts, 60000)

    return () => {
      clearInterval(interval)
      clearInterval(productsInterval)
    }
  }, [])

  async function loadBackground() {
    try {
      const { data, error } = await supabase
        .from('offer_backgrounds')
        .select('*')
        .eq('orientation', 'portrait')
        .eq('is_selected', true)
        .single()

      if (error) throw error
      if (data) {
        const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${data.bucket_name}/${data.storage_path}`
        setBackground(imageUrl)
      }
    } catch (error) {
      console.error('Fehler beim Laden des Hintergrunds:', error)
      setImageError(true)
    } finally {
      setIsLoading(false)
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

  const getCurrentProducts = () => {
    const start = currentSet * PRODUCTS_PER_PAGE
    return products.slice(start, start + PRODUCTS_PER_PAGE)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-200"></div>
      </div>
    )
  }

  if (!background || imageError) {
    return <div className="min-h-screen bg-black" />
  }

  return (
    <div className="relative min-h-screen bg-black">
      <Image
        src={background}
        alt="Background"
        fill
        className="object-contain"
        onError={() => setImageError(true)}
        priority
        quality={100}
        sizes="100vw"
        unoptimized
      />
      
      <div className="absolute inset-0 flex flex-col justify-center p-4">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <AnimatePresence mode="sync">
            {getCurrentProducts().map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  duration: 1.2,
                  delay: index * 0.4,
                  ease: "easeOut"
                }}
              >
                <div className="bg-gray-800/90 rounded-lg border border-gray-700 p-4 flex flex-col gap-4">
                  <div className="flex gap-4 w-full">
                    <div className="relative h-[70%] aspect-square bg-white rounded-lg overflow-hidden flex items-center justify-center">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-contain p-4"
                          sizes="(max-width: 768px) 96px, (max-width: 1920px) 128px, 160px"
                          priority
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0 h-full">
                      <div className="flex justify-between h-full items-center">
                        <div className="flex flex-col h-full pt-2">
                          <h3 className="text-base font-semibold text-gray-100 mb-2">{product.name}</h3>
                          <div className="space-y-2 min-h-[96px]">
                            {product.description.map((desc, index) => (
                              desc && (
                                <div key={index} className="flex items-center gap-2">
                                  <span className="text-blue-500 text-sm leading-none">•</span>
                                  <span className="text-sm text-gray-400 leading-tight">{desc}</span>
                                </div>
                              )
                            ))}
                            {Array.from({ length: 3 - (product.description.filter(Boolean).length) }).map((_, index) => (
                              <div key={`empty-${index}`} className="h-4" />
                            ))}
                          </div>
                        </div>
                        <div className={cn(
                          "flex items-end flex-col gap-2",
                          "ml-4 w-[266px] pr-4"
                        )}>
                          <div className="flex flex-col w-full">
                            <div className="flex items-center justify-end gap-2 text-sm w-full">
                              {product.discount > 0 && (
                                <span className="text-[0.7rem] font-medium text-white bg-red-500 px-1 py-0.5 rounded">
                                  -{product.discount}%
                                </span>
                              )}
                              <span className={cn(
                                "text-[0.7rem] text-gray-300 whitespace-nowrap",
                                product.discount > 0 && "text-gray-500 line-through"
                              )}>
                                {product.price.toFixed(2).replace('.', ',')} €
                                <span className="align-super text-[1.1em]">*</span>
                              </span>
                            </div>
                            {product.discount > 0 && (
                              <div className="flex justify-end items-baseline mt-1 w-full">
                                <span className="text-4xl font-bold text-white tabular-nums">
                                  {Math.floor(product.price * (1 - product.discount / 100))},
                                  <span className="text-xl align-top">
                                    {((product.price * (1 - product.discount / 100) % 1) * 100).toFixed(0).padStart(2, '0')}€
                                  </span>
                                </span>
                              </div>
                            )}
                            {product.discount > 0 && (
                              <div className="flex justify-end w-full -mt-4">
                                <span className={cn(
                                  "text-[0.7rem] text-gray-400 whitespace-nowrap translate-x-6"
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