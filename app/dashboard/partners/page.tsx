'use client'

import { useState, useEffect } from 'react'
import { Handshake, Plus, Rows, Columns, LayoutGrid } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { NewPartnerDialog } from "./components/new-partner-dialog"
import { PartnerCard } from "./components/partner-card"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Partner {
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

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [partnerToEdit, setPartnerToEdit] = useState<Partner | undefined>()
  const [layout, setLayout] = useState<'single' | 'double' | 'triple'>('single')
  const supabase = createClientComponentClient()

  // Laden der Partner beim ersten Render
  useEffect(() => {
    console.log('🔄 Initialisiere Partner-Komponente...')
    loadPartners()
  }, [])

  const loadPartners = async () => {
    console.log('📥 Starte Laden der Partner...')
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Fehler beim Laden der Partner:', {
          error: error.message,
          details: error,
          timestamp: new Date().toISOString()
        })
        throw error
      }

      console.log('✅ Partner erfolgreich geladen:', {
        anzahl: data?.length || 0,
        timestamp: new Date().toISOString()
      })
      setPartners(data || [])
    } catch (error) {
      console.error('❌ Unerwarteter Fehler beim Laden der Partner:', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      })
      alert('Fehler beim Laden der Partner')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async (id: string) => {
    console.log('✏️ Starte Bearbeitung des Partners:', {
      id,
      timestamp: new Date().toISOString()
    })
    const partner = partners.find(p => p.id === id)
    if (partner) {
      setPartnerToEdit(partner)
      setIsDialogOpen(true)
    }
  }

  const handleNewPartner = async (partner: {
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
  }) => {
    console.log('📝 Starte Speicherung des Partners:', {
      companyName: partner.companyName,
      timestamp: new Date().toISOString()
    })
    try {
      setIsLoading(true)
      
      if (partnerToEdit) {
        // Update existierenden Partner
        const { data, error } = await supabase
          .from('partners')
          .update({
            company_name: partner.companyName,
            contact_person: partner.contactPerson,
            street: partner.street,
            zip_code: partner.zipCode,
            city: partner.city,
            vat_id: partner.vatId,
            landscape_image: partner.landscapeImage,
            portrait_image: partner.portraitImage,
            advertising_start: partner.advertisingStart,
            advertising_end: partner.advertisingEnd,
            amount_per_month: partner.amountPerMonth
          })
          .eq('id', partnerToEdit.id)
          .select()
          .single()

        if (error) throw error

        console.log('✅ Partner erfolgreich aktualisiert:', {
          id: data.id,
          companyName: data.company_name,
          timestamp: new Date().toISOString()
        })

        setPartners(partners.map(p => p.id === data.id ? data : p))
      } else {
        // Erstelle neuen Partner
        const { data, error } = await supabase
          .from('partners')
          .insert([{
            company_name: partner.companyName,
            contact_person: partner.contactPerson,
            street: partner.street,
            zip_code: partner.zipCode,
            city: partner.city,
            vat_id: partner.vatId,
            landscape_image: partner.landscapeImage,
            portrait_image: partner.portraitImage,
            advertising_start: partner.advertisingStart,
            advertising_end: partner.advertisingEnd,
            amount_per_month: partner.amountPerMonth
          }])
          .select()
          .single()

        if (error) throw error

        console.log('✅ Partner erfolgreich erstellt:', {
          id: data.id,
          companyName: data.company_name,
          timestamp: new Date().toISOString()
        })

        if (data) {
          setPartners([data, ...partners])
        }
      }
    } catch (error) {
      console.error('❌ Unerwarteter Fehler beim Speichern des Partners:', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        partnerData: partner,
        timestamp: new Date().toISOString()
      })
      alert('Fehler beim Speichern des Partners')
    } finally {
      setIsLoading(false)
      setPartnerToEdit(undefined)
    }
  }

  const handleDelete = async (id: string) => {
    console.log('🗑️ Starte Löschung des Partners:', {
      id,
      timestamp: new Date().toISOString()
    })
    try {
      setIsLoading(true)

      // Zuerst die Bilder aus dem Storage löschen
      const partner = partners.find(p => p.id === id)
      console.log('📄 Partner-Daten für Löschung:', {
        id,
        gefunden: !!partner,
        hatLandscapeBild: !!partner?.landscape_image,
        hatPortraitBild: !!partner?.portrait_image,
        timestamp: new Date().toISOString()
      })

      if (partner) {
        if (partner.landscape_image) {
          const fileName = partner.landscape_image.split('/').pop()
          console.log('🖼️ Versuche Landscape-Bild zu löschen:', {
            originalUrl: partner.landscape_image,
            fileName,
            timestamp: new Date().toISOString()
          })
          if (fileName) {
            const { error: landscapeError } = await supabase.storage
              .from('partner-images')
              .remove([fileName])
            
            if (landscapeError) {
              console.error('❌ Fehler beim Löschen des Landscape-Bildes:', {
                error: landscapeError.message,
                fileName,
                timestamp: new Date().toISOString()
              })
            } else {
              console.log('✅ Landscape-Bild erfolgreich gelöscht:', {
                fileName,
                timestamp: new Date().toISOString()
              })
            }
          }
        }

        if (partner.portrait_image) {
          const fileName = partner.portrait_image.split('/').pop()
          console.log('🖼️ Versuche Portrait-Bild zu löschen:', {
            originalUrl: partner.portrait_image,
            fileName,
            timestamp: new Date().toISOString()
          })
          if (fileName) {
            const { error: portraitError } = await supabase.storage
              .from('partner-images')
              .remove([fileName])
            
            if (portraitError) {
              console.error('❌ Fehler beim Löschen des Portrait-Bildes:', {
                error: portraitError.message,
                fileName,
                timestamp: new Date().toISOString()
              })
            } else {
              console.log('✅ Portrait-Bild erfolgreich gelöscht:', {
                fileName,
                timestamp: new Date().toISOString()
              })
            }
          }
        }
      }

      // Zuerst die Tracking-Einträge löschen
      console.log('🗑️ Starte Löschung mit Transaktion:', {
        partnerId: id,
        timestamp: new Date().toISOString()
      })

      // Starte Transaktion
      const { error: transactionError } = await supabase.rpc('delete_partner_with_dependencies', {
        partner_id: id
      })

      if (transactionError) {
        console.error('❌ Fehler in der Lösch-Transaktion:', {
          error: transactionError.message,
          details: transactionError,
          partnerId: id,
          timestamp: new Date().toISOString()
        })
        throw transactionError
      }

      console.log('✅ Partner und alle abhängigen Daten erfolgreich gelöscht:', {
        id,
        timestamp: new Date().toISOString()
      })
      
      // UI aktualisieren
      setPartners(partners.filter(p => p.id !== id))
      console.log('🔄 UI wurde aktualisiert:', {
        verbleibendeParter: partners.length - 1,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('❌ Unerwarteter Fehler beim Löschen des Partners:', {
        error,
        stack: error instanceof Error ? error.stack : undefined,
        partnerId: id,
        timestamp: new Date().toISOString()
      })
      alert('Fehler beim Löschen des Partners')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLayoutToggle = () => {
    setLayout(current => {
      if (current === 'single') return 'double'
      if (current === 'double') return 'triple'
      return 'single'
    })
  }

  const getLayoutIcon = () => {
    switch (layout) {
      case 'single':
        return <Rows className="h-5 w-5 text-blue-500" />
      case 'double':
        return <Columns className="h-5 w-5 text-blue-500" />
      case 'triple':
        return <LayoutGrid className="h-5 w-5 text-blue-500" />
    }
  }

  const getLayoutText = () => {
    switch (layout) {
      case 'single':
        return '1 Spalte'
      case 'double':
        return '2 Spalten'
      case 'triple':
        return '3 Spalten'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Handshake className="h-8 w-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-100">Werbepartner</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLayoutToggle}
            className="inline-flex items-center justify-center w-10 h-10 bg-gray-800 text-gray-200 rounded-lg border border-gray-700 hover:border-yellow-500 transition-colors"
            title={`Layout ändern (${getLayoutText()})`}
          >
            {getLayoutIcon()}
          </button>
          <Button 
            onClick={() => {
              console.log('➕ Dialog zum Hinzufügen eines Partners geöffnet')
              setIsDialogOpen(true)
            }}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Partner hinzufügen
          </Button>
        </div>
      </div>

      {partners.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
            <Handshake className="h-8 w-8 text-blue-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-100 mb-2">Keine Werbepartner vorhanden</h2>
          <p className="text-gray-400 mb-4">Fügen Sie Ihren ersten Werbepartner hinzu</p>
          <Button 
            onClick={() => {
              console.log('➕ Dialog zum Hinzufügen des ersten Partners geöffnet')
              setIsDialogOpen(true)
            }}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Partner einrichten
          </Button>
        </div>
      ) : (
        <div className={`grid gap-4 ${
          layout === 'single' ? 'grid-cols-1' :
          layout === 'double' ? 'grid-cols-1 md:grid-cols-2' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {partners.map(partner => (
            <PartnerCard
              key={partner.id}
              partner={{
                id: partner.id,
                name: partner.company_name,
                landscapeImage: partner.landscape_image,
                portraitImage: partner.portrait_image
              }}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <NewPartnerDialog
        isOpen={isDialogOpen}
        onClose={() => {
          console.log('❌ Dialog zum Partner geschlossen')
          setIsDialogOpen(false)
          setPartnerToEdit(undefined)
        }}
        onSubmit={handleNewPartner}
        partnerToEdit={partnerToEdit}
      />
    </div>
  )
} 