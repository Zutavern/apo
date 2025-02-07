'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Edit, Trash2, Monitor, Smartphone, BarChart2, CalendarRange } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <>
      <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-bold text-gray-100">{partner.name}</CardTitle>
          <div className="flex gap-2">
            {hasAnalytics ? (
              <>
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
                <Link href={`/dashboard/partners/campaigns/${partner.id}`}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                    title="Kampagnenübersicht"
                  >
                    <CalendarRange className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 cursor-not-allowed"
                  disabled
                  title="Analytics erst verfügbar wenn mindestens ein Bild hochgeladen wurde"
                >
                  <BarChart2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-500 cursor-not-allowed"
                  disabled
                  title="Kampagnenübersicht erst verfügbar wenn mindestens ein Bild hochgeladen wurde"
                >
                  <CalendarRange className="h-4 w-4" />
                </Button>
              </>
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
              className="border-gray-700 hover:bg-gray-800 text-gray-400 hover:text-gray-300"
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