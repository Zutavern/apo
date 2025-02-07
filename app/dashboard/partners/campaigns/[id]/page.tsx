'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CalendarRange, Check, X, AlertCircle, Plus, Trash2, Filter, Euro, FileText } from "lucide-react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DateRange } from "react-day-picker"
import { pdf } from '@react-pdf/renderer'
import { InvoicePDF } from '@/app/components/invoice-pdf'

interface Campaign {
  id: string
  partner_id: string
  start_date: string
  end_date: string
  price_per_month: number
  total_price: number
  status: 'active' | 'completed' | 'cancelled'
  created_at: string
}

interface Partner {
  id: string
  company_name: string
  contact_person: string
  street: string
  zip_code: string
  city: string
  vat_id: string
}

type StatusFilter = 'all' | 'active' | 'completed' | 'cancelled'

export default function CampaignsPage() {
  const router = useRouter()
  const params = useParams()
  const partnerId = params.id as string
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([])
  const [partner, setPartner] = useState<Partner | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [showCampaignDialog, setShowCampaignDialog] = useState(false)
  const [campaignDate, setCampaignDate] = useState<DateRange | undefined>()
  const [pricePerMonth, setPricePerMonth] = useState<string>("")
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadPartnerAndCampaigns()
  }, [partnerId])

  const loadPartnerAndCampaigns = async () => {
    try {
      setIsLoading(true)
      
      // Partner laden
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('id, company_name, contact_person, street, zip_code, city, vat_id')
        .eq('id', partnerId)
        .single()

      if (partnerError) throw partnerError
      setPartner(partnerData)

      // Kampagnen laden
      const { data: campaignData, error: campaignError } = await supabase
        .from('partner_campaigns')
        .select('*')
        .eq('partner_id', partnerId)
        .order('start_date', { ascending: false })

      if (campaignError) throw campaignError
      setCampaigns(campaignData)

    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (campaignId: string, newStatus: 'active' | 'completed' | 'cancelled') => {
    try {
      const { error } = await supabase
        .from('partner_campaigns')
        .update({ status: newStatus })
        .eq('id', campaignId)

      if (error) throw error

      // Aktualisiere die lokale Liste
      setCampaigns(campaigns.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, status: newStatus }
          : campaign
      ))
    } catch (error) {
      console.error('Fehler beim Ändern des Status:', error)
      alert('Fehler beim Ändern des Status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500'
      case 'completed':
        return 'text-blue-500'
      case 'cancelled':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Check className="h-4 w-4" />
      case 'completed':
        return <CalendarRange className="h-4 w-4" />
      case 'cancelled':
        return <X className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  // Berechne die Anzahl der Tage im ausgewählten Zeitraum
  const selectedDays = useMemo(() => {
    if (!campaignDate?.from || !campaignDate?.to) return 0
    const diffTime = Math.abs(campaignDate.to.getTime() - campaignDate.from.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }, [campaignDate])

  // Berechne den anteiligen Preis basierend auf den ausgewählten Tagen
  const calculatedPrice = useMemo(() => {
    if (!pricePerMonth || !selectedDays) return 0
    const pricePerDay = Number(pricePerMonth) / 30
    return pricePerDay * selectedDays
  }, [pricePerMonth, selectedDays])

  // Berechne die MwSt. für den berechneten Preis
  const calculatedMwst = calculatedPrice * 0.19

  const handleCampaignSubmit = async () => {
    if (!campaignDate?.from || !campaignDate?.to || !pricePerMonth) return

    try {
      console.log('💾 Speichere neue Kampagne:', {
        partnerId,
        von: campaignDate.from,
        bis: campaignDate.to,
        preisProMonat: pricePerMonth,
        gesamtpreis: calculatedPrice,
        timestamp: new Date().toISOString()
      })

      const { error } = await supabase
        .from('partner_campaigns')
        .insert({
          partner_id: partnerId,
          start_date: campaignDate.from.toISOString(),
          end_date: campaignDate.to.toISOString(),
          price_per_month: Number(pricePerMonth),
          total_price: calculatedPrice,
          status: 'active'
        })

      if (error) throw error

      // Lade die Kampagnen neu
      await loadPartnerAndCampaigns()
      
      // Dialog schließen und Formular zurücksetzen
      setShowCampaignDialog(false)
      setCampaignDate(undefined)
      setPricePerMonth("")
    } catch (error) {
      console.error('❌ Fehler beim Speichern der Kampagne:', error)
      alert('Fehler beim Speichern der Kampagne')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="hover:bg-gray-800 text-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <h1 className="text-2xl font-bold text-gray-100">
            Kampagnen von {partner?.company_name}
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select
              value={statusFilter}
              onValueChange={(value: StatusFilter) => setStatusFilter(value)}
            >
              {/* ... existing select content ... */}
            </Select>
          </div>
          <Button 
            onClick={() => setShowCampaignDialog(true)}
            className="bg-blue-600 hover:bg-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Neue Kampagne
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="bg-gray-900/50 border-gray-800/50 hover:border-gray-700/50 transition-colors duration-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium text-gray-100">
                {format(new Date(campaign.start_date), 'dd. MMMM yyyy', { locale: de })} - {format(new Date(campaign.end_date), 'dd. MMMM yyyy', { locale: de })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 px-2 py-1 rounded-md bg-gray-800/50 ${getStatusColor(campaign.status)}`}>
                  {getStatusIcon(campaign.status)}
                  {campaign.status === 'active' ? 'Aktiv' : 
                   campaign.status === 'completed' ? 'Abgeschlossen' : 'Storniert'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/30 rounded-lg p-3">
                  <p className="text-sm text-gray-400">Monatlicher Preis (netto)</p>
                  <p className="text-lg font-medium text-gray-100">{campaign.price_per_month.toFixed(2)} €</p>
                </div>
                <div className="bg-gray-800/30 rounded-lg p-3">
                  <p className="text-sm text-gray-400">Gesamtpreis (netto)</p>
                  <p className="text-lg font-medium text-gray-100">{campaign.total_price.toFixed(2)} €</p>
                </div>
              </div>
              
              <div className="mt-4 flex gap-2">
                {campaign.status === 'active' && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(campaign.id, 'completed')}
                      className="flex items-center gap-2 bg-gray-800/50 text-blue-400 border-blue-500/20 hover:border-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-all duration-200"
                    >
                      <CalendarRange className="h-4 w-4" />
                      Abgeschlossen
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(campaign.id, 'cancelled')}
                      className="flex items-center gap-2 bg-gray-800/50 text-red-400 border-red-500/20 hover:border-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
                    >
                      <X className="h-4 w-4" />
                      Stornieren
                    </Button>
                  </>
                )}
                {partner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const pdfDoc = pdf(
                          <InvoicePDF
                            partner={partner}
                            campaign={campaign}
                            invoiceNumber={`RE${new Date().getFullYear()}${campaign.id.slice(0, 4)}`}
                            invoiceDate={new Date()}
                          />
                        )
                        
                        const blob = await pdfDoc.toBlob()
                        const url = URL.createObjectURL(blob)
                        const link = document.createElement('a')
                        link.href = url
                        link.download = `Rechnung_${partner.company_name.replace(/[^a-z0-9]/gi, '_')}_${format(new Date(campaign.start_date), 'yyyy-MM-dd')}.pdf`
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                        URL.revokeObjectURL(url)
                      } catch (error) {
                        console.error('Fehler beim Generieren der PDF:', error)
                        alert('Fehler beim Generieren der PDF')
                      }
                    }}
                    className="flex items-center gap-2 bg-gray-800/50 text-green-400 border-green-500/20 hover:border-green-400 hover:bg-green-500/10 hover:text-green-300 transition-all duration-200"
                  >
                    <FileText className="h-4 w-4" />
                    Rechnung
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {campaigns.length === 0 && (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <CalendarRange className="h-12 w-12 text-gray-500 mb-4" />
              <p className="text-gray-400">Keine Kampagnen vorhanden</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="sm:max-w-[800px] bg-gray-900 text-gray-100 border-gray-800">
          <DialogHeader>
            <DialogTitle>Neue Kampagne</DialogTitle>
            <DialogDescription>
              Legen Sie den Zeitraum und die Konditionen für die Werbekampagne fest.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label>Kampagnenzeitraum</Label>
              <div className="flex justify-center">
                <DateRangePicker
                  date={campaignDate}
                  onDateChange={setCampaignDate}
                />
              </div>
              {selectedDays > 0 && (
                <div className="text-sm text-gray-400 mt-1">
                  Ausgewählter Zeitraum: {selectedDays} Tage
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Preis pro Monat (netto)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={pricePerMonth}
                  onChange={(e) => setPricePerMonth(e.target.value)}
                  className="pl-8 bg-gray-800 border-gray-700 text-gray-100"
                  placeholder="0.00"
                  step="0.01"
                />
                <Euro className="h-4 w-4 absolute left-2.5 top-3 text-gray-400" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Berechneter Preis für {selectedDays} Tage (netto)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={calculatedPrice.toFixed(2)}
                  className="pl-8 bg-gray-800 border-gray-700 text-gray-100"
                  disabled
                />
                <Euro className="h-4 w-4 absolute left-2.5 top-3 text-gray-400" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>MwSt. (19%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={calculatedMwst.toFixed(2)}
                  className="pl-8 bg-gray-800 border-gray-700 text-gray-100"
                  disabled
                />
                <Euro className="h-4 w-4 absolute left-2.5 top-3 text-gray-400" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Gesamtbetrag (brutto)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={(calculatedPrice + calculatedMwst).toFixed(2)}
                  className="pl-8 bg-gray-800 border-gray-700 text-gray-100"
                  disabled
                />
                <Euro className="h-4 w-4 absolute left-2.5 top-3 text-gray-400" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCampaignDialog(false)}
              className="border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-gray-300"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleCampaignSubmit}
              className="bg-blue-600 text-white hover:bg-blue-500"
              disabled={!campaignDate?.from || !campaignDate?.to || !pricePerMonth}
            >
              Kampagne erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 