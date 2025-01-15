'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

type Apotheke = {
  id: string
  apothekenname: string
  strasse: string
  plz: string
  ort: string
  telefon: string
  notdiensttext: string
  entfernung: string
}

export default function EditEmergencyPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [apotheke, setApotheke] = useState<Apotheke | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function fetchApotheke() {
      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('apotheken_notdienst')
          .select('*')
          .eq('id', resolvedParams.id)
          .single()

        if (error) throw error
        setApotheke(data)
      } catch (error: any) {
        console.error('Error:', error)
        setMessage(`Fehler beim Laden der Apotheke: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchApotheke()
  }, [resolvedParams.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!apotheke) return

    try {
      setIsSaving(true)
      setMessage('')

      const { error } = await supabase
        .from('apotheken_notdienst')
        .update({
          apothekenname: apotheke.apothekenname,
          strasse: apotheke.strasse,
          plz: apotheke.plz,
          ort: apotheke.ort,
          telefon: apotheke.telefon,
          notdiensttext: apotheke.notdiensttext,
          entfernung: apotheke.entfernung
        })
        .eq('id', apotheke.id)

      if (error) throw error

      router.push('/dashboard/emergency')
      router.refresh()
    } catch (error: any) {
      console.error('Error:', error)
      setMessage(`Fehler beim Speichern: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-[200px] bg-gray-800" />
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="space-y-6">
              <Skeleton className="h-10 bg-gray-800" />
              <Skeleton className="h-10 bg-gray-800" />
              <Skeleton className="h-10 bg-gray-800" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!apotheke) {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-lg text-gray-400">
            Apotheke nicht gefunden
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Apotheke bearbeiten</h2>
        </div>

        {message && (
          <div className="p-4 bg-red-500/10 text-red-500 rounded-lg border border-red-500/20">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="apothekenname" className="text-gray-400">Name der Apotheke</Label>
                <Input
                  id="apothekenname"
                  value={apotheke.apothekenname}
                  onChange={(e) => setApotheke({ ...apotheke, apothekenname: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="strasse" className="text-gray-400">Straße</Label>
                <Input
                  id="strasse"
                  value={apotheke.strasse}
                  onChange={(e) => setApotheke({ ...apotheke, strasse: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="plz" className="text-gray-400">PLZ</Label>
                  <Input
                    id="plz"
                    value={apotheke.plz}
                    onChange={(e) => setApotheke({ ...apotheke, plz: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ort" className="text-gray-400">Ort</Label>
                  <Input
                    id="ort"
                    value={apotheke.ort}
                    onChange={(e) => setApotheke({ ...apotheke, ort: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefon" className="text-gray-400">Telefon</Label>
                <Input
                  id="telefon"
                  value={apotheke.telefon}
                  onChange={(e) => setApotheke({ ...apotheke, telefon: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notdiensttext" className="text-gray-400">Notdiensttext</Label>
                <Textarea
                  id="notdiensttext"
                  value={apotheke.notdiensttext}
                  onChange={(e) => setApotheke({ ...apotheke, notdiensttext: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entfernung" className="text-gray-400">Entfernung</Label>
                <Input
                  id="entfernung"
                  value={apotheke.entfernung}
                  onChange={(e) => setApotheke({ ...apotheke, entfernung: e.target.value })}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700"
                >
                  Abbrechen
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  {isSaving ? 'Wird gespeichert...' : 'Speichern'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
} 