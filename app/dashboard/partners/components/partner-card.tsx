'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Trash2, Monitor, Smartphone, BarChart2, Presentation, Euro } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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

interface PartnerCardProps {
  partner: {
    id: string
    name: string
    landscapeImage?: string
    portraitImage?: string
  }
  onEdit: (id: string) => void
  onDelete: (id: string) => void
}

export function PartnerCard({ partner, onEdit, onDelete }: PartnerCardProps) {
  const hasLandscape = !!partner.landscapeImage
  const hasPortrait = !!partner.portraitImage
  const hasAnalytics = hasLandscape || hasPortrait
  const [showCampaignDialog, setShowCampaignDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [campaignDate, setCampaignDate] = useState<DateRange | undefined>()
  const [pricePerMonth, setPricePerMonth] = useState<string>("")
  const mwst = Number(pricePerMonth) * 0.19

  return (
    <>
      <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold text-gray-100">{partner.name}</CardTitle>
          <div className="flex gap-2">
            {hasAnalytics ? (
              <Link href={`/dashboard/partners/analytics/${partner.id}`}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                  title="Analytics anzeigen"
                >
                  <BarChart2 className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 cursor-not-allowed"
                disabled
                title="Analytics erst verfügbar wenn mindestens ein Bild hochgeladen wurde"
              >
                <BarChart2 className="h-4 w-4" />
              </Button>
            )}
            {hasAnalytics ? (
              <Button
                variant="ghost"
                size="icon"
                className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                title="Kampagne konfigurieren"
                onClick={() => setShowCampaignDialog(true)}
              >
                <Presentation className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-500 cursor-not-allowed"
                disabled
                title="Kampagne erst verfügbar wenn mindestens ein Bild hochgeladen wurde"
              >
                <Presentation className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
              onClick={() => onEdit(partner.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="flex gap-2">
            {hasLandscape ? (
              <Link href={`/public/partners/landscape?id=${partner.id}`} target="_blank">
                <Button
                  variant="default"
                  className="flex gap-2 bg-blue-600 hover:bg-blue-500"
                >
                  <Monitor className="h-4 w-4" />
                  Landscape
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                disabled
                className="flex gap-2 border-gray-700"
              >
                <Monitor className="h-4 w-4" />
                Landscape
              </Button>
            )}
            
            {hasPortrait ? (
              <Link href={`/public/partners/portrait?id=${partner.id}`} target="_blank">
                <Button
                  variant="default"
                  className="flex gap-2 bg-blue-600 hover:bg-blue-500"
                >
                  <Smartphone className="h-4 w-4" />
                  Portrait
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                disabled
                className="flex gap-2 border-gray-700"
              >
                <Smartphone className="h-4 w-4" />
                Portrait
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent className="sm:max-w-[600px] bg-gray-900 text-gray-100 border-gray-800">
          <DialogHeader>
            <DialogTitle>Kampagne konfigurieren</DialogTitle>
            <DialogDescription>
              Legen Sie den Zeitraum und die Konditionen für die Werbekampagne fest.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label>Kampagnenzeitraum</Label>
              <DateRangePicker
                date={campaignDate}
                onDateChange={setCampaignDate}
              />
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
              <Label>MwSt. (19%)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={mwst.toFixed(2)}
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
                  value={(Number(pricePerMonth) + mwst).toFixed(2)}
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
              className="border-gray-700 hover:bg-gray-800"
            >
              Abbrechen
            </Button>
            <Button
              onClick={() => {
                // Hier später die Kampagne speichern
                setShowCampaignDialog(false)
              }}
              className="bg-blue-600 text-white hover:bg-blue-500"
              disabled={!campaignDate?.from || !campaignDate?.to || !pricePerMonth}
            >
              Kampagne erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-gray-900 text-gray-100 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Partner wirklich löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Der Partner und alle zugehörigen Daten werden dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setShowDeleteDialog(false)}
              className="border-gray-700 hover:bg-gray-800"
            >
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(partner.id)
                setShowDeleteDialog(false)
              }}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 