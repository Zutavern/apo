'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SingleImageDropzone } from "./single-image-dropzone"
import { Trash2 } from "lucide-react"

interface NewPartnerDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (partner: {
    companyName: string
    contactPerson: string
    street: string
    zipCode: string
    city: string
    vatId: string
    landscapeImage?: string
    portraitImage?: string
    advertisingStart?: Date
    advertisingEnd?: Date
    amountPerMonth?: number
  }) => void
  partnerToEdit?: {
    id: string
    company_name: string
    contact_person: string
    street: string
    zip_code: string
    city: string
    vat_id: string
    landscape_image?: string
    portrait_image?: string
    advertising_start?: Date
    advertising_end?: Date
    amount_per_month?: number
  }
}

export function NewPartnerDialog({ isOpen, onClose, onSubmit, partnerToEdit }: NewPartnerDialogProps) {
  const [companyName, setCompanyName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [street, setStreet] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [city, setCity] = useState('')
  const [vatId, setVatId] = useState('')
  const [landscapeImage, setLandscapeImage] = useState('')
  const [portraitImage, setPortraitImage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [advertisingStart, setAdvertisingStart] = useState<Date | undefined>()
  const [advertisingEnd, setAdvertisingEnd] = useState<Date | undefined>()
  const [amountPerMonth, setAmountPerMonth] = useState<number | undefined>()
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (partnerToEdit) {
      setCompanyName(partnerToEdit.company_name)
      setContactPerson(partnerToEdit.contact_person)
      setStreet(partnerToEdit.street)
      setZipCode(partnerToEdit.zip_code)
      setCity(partnerToEdit.city)
      setVatId(partnerToEdit.vat_id)
      setLandscapeImage(partnerToEdit.landscape_image || '')
      setPortraitImage(partnerToEdit.portrait_image || '')
      setAdvertisingStart(partnerToEdit.advertising_start)
      setAdvertisingEnd(partnerToEdit.advertising_end)
      setAmountPerMonth(partnerToEdit.amount_per_month)
    } else {
      setCompanyName('')
      setContactPerson('')
      setStreet('')
      setZipCode('')
      setCity('')
      setVatId('')
      setLandscapeImage('')
      setPortraitImage('')
      setAdvertisingStart(undefined)
      setAdvertisingEnd(undefined)
      setAmountPerMonth(undefined)
    }
  }, [partnerToEdit])

  const handleImageUpload = async (file: File, orientation: 'landscape' | 'portrait') => {
    if (file) {
      setIsUploading(true)
      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        if (!fileExt || !['jpg', 'jpeg', 'png', 'webp'].includes(fileExt.toLowerCase())) {
          throw new Error('Ungültiges Dateiformat. Erlaubt sind: JPG, PNG, WEBP')
        }

        const { error: uploadError } = await supabase.storage
          .from('partner-images')
          .upload(fileName, file)

        if (uploadError) {
          throw new Error(`Upload fehlgeschlagen: ${uploadError.message}`)
        }

        const { data: { publicUrl } } = supabase.storage
          .from('partner-images')
          .getPublicUrl(fileName)

        if (!publicUrl) {
          throw new Error('Konnte keine öffentliche URL für das Bild generieren')
        }

        if (orientation === 'landscape') {
          setLandscapeImage(publicUrl)
        } else {
          setPortraitImage(publicUrl)
        }
      } catch (error) {
        console.error('Fehler beim Bildupload:', {
          error,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          orientation
        })
        alert(error instanceof Error ? error.message : 'Fehler beim Hochladen des Bildes')
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleSubmit = () => {
    try {
      onSubmit({
        companyName,
        contactPerson,
        street,
        zipCode,
        city,
        vatId,
        landscapeImage,
        portraitImage,
        advertisingStart,
        advertisingEnd,
        amountPerMonth
      })
      setCompanyName('')
      setContactPerson('')
      setStreet('')
      setZipCode('')
      setCity('')
      setVatId('')
      setLandscapeImage('')
      setPortraitImage('')
      setAdvertisingStart(undefined)
      setAdvertisingEnd(undefined)
      setAmountPerMonth(undefined)
      onClose()
    } catch (error) {
      console.error('Fehler beim Speichern des Partners:', {
        error,
        formData: {
          companyName,
          contactPerson,
          street,
          zipCode,
          city,
          hasLandscapeImage: !!landscapeImage,
          hasPortraitImage: !!portraitImage,
          advertisingStart,
          advertisingEnd,
          amountPerMonth
        }
      })
      alert('Fehler beim Speichern des Partners')
    }
  }

  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5)
    setZipCode(value)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] bg-gray-900 text-gray-100 border border-gray-800">
        <DialogHeader>
          <DialogTitle>{partnerToEdit ? 'Partner bearbeiten' : 'Neuen Partner hinzufügen'}</DialogTitle>
          <DialogDescription>
            {partnerToEdit ? 'Bearbeiten Sie die Details des Partners.' : 'Fügen Sie einen neuen Werbepartner hinzu.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="companyName" className="text-gray-100">Firmenname</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Firmenname"
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contactPerson" className="text-gray-100">Ansprechpartner</Label>
              <Input
                id="contactPerson"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Name des Ansprechpartners"
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="street" className="text-gray-100">Straße und Hausnummer</Label>
            <Input
              id="street"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              placeholder="Straße und Hausnummer"
              className="bg-gray-800 border-gray-700 text-gray-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="zipCode" className="text-gray-100">PLZ</Label>
              <Input
                id="zipCode"
                value={zipCode}
                onChange={handleZipCodeChange}
                placeholder="12345"
                maxLength={5}
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city" className="text-gray-100">Ort</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Stadt"
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="vatId" className="text-gray-100">USt-IdNr.</Label>
            <Input
              id="vatId"
              value={vatId}
              onChange={(e) => setVatId(e.target.value)}
              placeholder="DE123456789"
              className="bg-gray-800 border-gray-700 text-gray-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="grid gap-2">
              <Label className="text-gray-100">Landscape Bild</Label>
              <div className="relative">
                <SingleImageDropzone
                  value={landscapeImage}
                  onChange={async (file) => {
                    if (file) {
                      await handleImageUpload(file, 'landscape')
                    }
                  }}
                  disabled={isUploading}
                  width={300}
                  height={200}
                  className="bg-gray-800 border-gray-700"
                />
                {landscapeImage && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => {
                      setLandscapeImage('')
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-gray-100">Portrait Bild</Label>
              <div className="relative">
                <SingleImageDropzone
                  value={portraitImage}
                  onChange={async (file) => {
                    if (file) {
                      await handleImageUpload(file, 'portrait')
                    }
                  }}
                  disabled={isUploading}
                  width={200}
                  height={300}
                  className="bg-gray-800 border-gray-700"
                />
                {portraitImage && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => {
                      setPortraitImage('')
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-700 hover:text-gray-100"
          >
            Abbrechen
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!companyName || !contactPerson || !street || !zipCode || !city || isUploading}
            className="bg-blue-600 text-white hover:bg-blue-500"
          >
            {partnerToEdit ? 'Speichern' : 'Hinzufügen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 