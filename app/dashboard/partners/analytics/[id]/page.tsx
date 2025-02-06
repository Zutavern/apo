'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClientComponentClient, SupabaseClient } from '@supabase/auth-helpers-nextjs'
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Line, Bar } from 'react-chartjs-2'
import { DateRangePicker } from "@/components/ui/date-range-picker"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { RealtimePostgresChangesPayload, RealtimeChannel } from '@supabase/supabase-js'
import { cn } from "@/lib/utils"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

// Chart.js Optionen für dunkles Design
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: '#e5e7eb'
      }
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          return `${context.parsed.y} Aufrufe`
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        color: '#374151'
      },
      ticks: {
        color: '#e5e7eb'
      }
    },
    y: {
      type: 'linear' as const,
      min: 0,
      grid: {
        color: '#374151'
      },
      ticks: {
        color: '#e5e7eb',
        precision: 0,
        stepSize: 1
      }
    }
  }
}

interface Partner {
  id: string
  company_name: string
  landscape_image?: string
  portrait_image?: string
}

interface AnalyticsData {
  views: number
  avgDuration: number
  totalErrors: number
  viewsByImageType: {
    landscape: number
    portrait: number
  }
  viewsByTime: {
    labels: string[]
    data: number[]
  }
  dayTimeDistribution: number[]
}

interface PartnerViewTracking {
  id: string
  partner_id: string
  view_started_at: string
  image_type: 'landscape' | 'portrait'
  view_duration_seconds: number
  had_errors: boolean
  image_loaded: boolean
  tab_was_active: boolean
}

// Neue Komponente für animierte Zahlen
function AnimatedNumber({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-3xl font-bold text-gray-100"
    >
      {value}
    </motion.span>
  )
}

// Neue Komponente für animierte Statistik-Karte
function StatisticCard({ title, value, delay }: { title: string, value: string | number, delay: number }) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay }}
    >
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-100">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.p
              key={value}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-3xl font-bold text-gray-100"
            >
              {value}
            </motion.p>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function PartnerAnalytics() {
  const router = useRouter()
  const params = useParams()
  const partnerId = params.id as string
  const [partner, setPartner] = useState<Partner | null>(null)
  const [availableDays, setAvailableDays] = useState<Date[]>([])
  const [isLoadingDays, setIsLoadingDays] = useState(true)
  const [date, setDate] = useState<DateRange | undefined>(() => {
    const today = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(today.getDate() - 30)
    return {
      from: thirtyDaysAgo,
      to: today
    }
  })
  const [timeFrame, setTimeFrame] = useState<'day' | 'week' | 'month'>('day')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const supabase = createClientComponentClient()

  // Tracking initialisieren wenn die Seite geladen wird
  useEffect(() => {
    const initializeTracking = async () => {
      if (!partnerId) return
      
      try {
        const { data: partner } = await supabase
          .from('partners')
          .select('landscape_image, portrait_image')
          .eq('id', partnerId)
          .single()

        if (!partner) return

        // Tracking-Eintrag erstellen
        const { error } = await supabase
          .from('partner_view_tracking')
          .insert([
            {
              partner_id: partnerId,
              view_started_at: new Date().toISOString(),
              image_type: 'landscape',
              view_duration_seconds: 0,
              had_errors: false
            }
          ])

        if (error) {
          console.error('❌ Fehler beim Erstellen des Tracking-Eintrags:', error)
        }
      } catch (error) {
        console.error('❌ Fehler beim Initialisieren des Trackings:', error)
      }
    }

    initializeTracking()
  }, [partnerId])

  // Laden der verfügbaren Tage
  useEffect(() => {
    async function loadAvailableDays() {
      if (!partnerId) return
      
      try {
        setIsLoadingDays(true)
        const { data, error } = await supabase
          .from('partner_view_tracking')
          .select('view_started_at')
          .eq('partner_id', partnerId)
          .order('view_started_at', { ascending: true })

        if (error) throw error

        if (data) {
          // Unique Tage extrahieren und als Date-Objekte speichern
          const uniqueDays = [...new Set(
            data.map(entry => {
              const date = new Date(entry.view_started_at)
              return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString()
            })
          )].map(dateStr => new Date(dateStr))

          console.log('📅 Verfügbare Tage geladen:', {
            anzahlTage: uniqueDays.length,
            ersterTag: uniqueDays[0]?.toISOString(),
            letzterTag: uniqueDays[uniqueDays.length - 1]?.toISOString()
          })

          setAvailableDays(uniqueDays)
        }
      } catch (error) {
        console.error('❌ Fehler beim Laden der verfügbaren Tage:', error)
      } finally {
        setIsLoadingDays(false)
      }
    }

    loadAvailableDays()
  }, [partnerId])

  // Hilfsfunktion zum Prüfen ob ein Tag Daten enthält
  const isDayDisabled = (day: Date) => {
    if (isLoadingDays) return true
    return !availableDays.some(availableDay => 
      availableDay.getFullYear() === day.getFullYear() &&
      availableDay.getMonth() === day.getMonth() &&
      availableDay.getDate() === day.getDate()
    )
  }

  useEffect(() => {
    if (!partnerId || !date?.from || !date?.to) return
    console.log('🔄 Lade Partner und Analytics...', { partnerId, date, timeFrame })
    loadPartner()
    loadAnalytics()
  }, [partnerId, date?.from?.toISOString(), date?.to?.toISOString(), timeFrame])

  async function loadPartner() {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('id, company_name, landscape_image, portrait_image')
        .eq('id', partnerId)
        .single()

      if (error) throw error
      setPartner(data)
    } catch (error) {
      console.error('Fehler beim Laden des Partners:', error)
    }
  }

  async function loadAnalytics() {
    if (!date?.from || !date?.to) return

    try {
      console.log('🔍 Lade Analytics für:', {
        partnerId,
        zeitraum: {
          von: date.from.toISOString(),
          bis: date.to.toISOString()
        },
        timeFrame
      })

      const { data, error } = await supabase
        .from('partner_view_tracking')
        .select('*')
        .eq('partner_id', partnerId)
        .gte('view_started_at', date.from.toISOString())
        .lte('view_started_at', date.to.toISOString())
        .order('view_started_at', { ascending: true })

      if (error) {
        console.error('❌ Datenbankfehler:', error)
        throw error
      }

      if (!data || data.length === 0) {
        console.log('ℹ️ Keine Daten gefunden für den Zeitraum')
        setAnalyticsData({
          views: 0,
          avgDuration: 0,
          totalErrors: 0,
          viewsByImageType: { landscape: 0, portrait: 0 },
          viewsByTime: { labels: [], data: [] },
          dayTimeDistribution: [0, 0, 0, 0]
        })
        return
      }

      console.log('📊 Rohdaten aus der Datenbank:', {
        anzahlDatensätze: data.length,
        ersterDatensatz: data[0],
        letzterDatensatz: data[data.length - 1],
        zeitraum: timeFrame,
        alleDaten: data
      })

      // Zeitreihen-Daten basierend auf timeFrame aggregieren
      const timeSeriesData = data.reduce((acc: { [key: string]: number }, curr) => {
        let timeKey: string
        const viewDate = new Date(curr.view_started_at)
        
        switch (timeFrame) {
          case 'day':
            // Tägliche Aggregation mit führender Null für einstellige Tage
            timeKey = format(viewDate, 'dd.MM.', { locale: de })
            break
          case 'week':
            // Wöchentliche Aggregation mit Jahr
            const weekNumber = format(viewDate, 'w', { locale: de })
            const year = format(viewDate, 'yyyy', { locale: de })
            timeKey = `KW ${weekNumber}/${year}`
            break
          case 'month':
            // Monatliche Aggregation mit Jahr
            timeKey = format(viewDate, 'MMM yyyy', { locale: de })
            break
        }

        acc[timeKey] = (acc[timeKey] || 0) + 1
        return acc
      }, {})

      // Sortiere die Zeitreihen-Daten chronologisch
      const sortedTimeKeys = Object.keys(timeSeriesData).sort((a, b) => {
        const parseDate = (key: string) => {
          if (key.includes('KW')) {
            // Für Wochen: Extrahiere Woche und Jahr
            const [_, week, year] = key.match(/KW (\d+)\/(\d+)/) || []
            const date = new Date(parseInt(year), 0, 1)
            date.setDate(date.getDate() + (parseInt(week) - 1) * 7)
            return date
          } else if (key.includes('.')) {
            // Für Tage: Parse dd.MM.
            const [day, month] = key.split('.')
            const currentYear = new Date().getFullYear()
            return new Date(currentYear, parseInt(month) - 1, parseInt(day))
          } else {
            // Für Monate: Parse MMM yyyy
            return new Date(key)
          }
        }
        return parseDate(a).getTime() - parseDate(b).getTime()
      })

      console.log('📈 Aufbereitete Zeitreihen-Daten:', {
        rohdaten: timeSeriesData,
        sortierteSchlüssel: sortedTimeKeys,
        sortierteDaten: sortedTimeKeys.map(key => timeSeriesData[key])
      })

      const landscapeViews = data.filter(d => d.image_type === 'landscape').length
      const portraitViews = data.filter(d => d.image_type === 'portrait').length

      console.log('📈 Aufbereitete Daten:', {
        zeitreihe: timeSeriesData,
        tageszeitVerteilung: data.reduce((acc: number[], curr) => {
          const hour = new Date(curr.view_started_at).getHours()
          if (hour >= 6 && hour < 12) acc[0] = (acc[0] || 0) + 1 // Morgen (6-12)
          else if (hour >= 12 && hour < 18) acc[1] = (acc[1] || 0) + 1 // Mittag (12-18)
          else if (hour >= 18 && hour < 22) acc[2] = (acc[2] || 0) + 1 // Abend (18-22)
          else acc[3] = (acc[3] || 0) + 1 // Nacht (22-6)
          return acc
        }, [0, 0, 0, 0]),
        bildTypen: {
          landscape: landscapeViews,
          portrait: portraitViews
        }
      })

      const analyticsData: AnalyticsData = {
        views: data.length,
        avgDuration: data.reduce((acc, curr) => acc + (curr.view_duration_seconds || 0), 0) / data.length || 0,
        totalErrors: data.filter(d => d.had_errors).length,
        viewsByImageType: {
          landscape: landscapeViews,
          portrait: portraitViews
        },
        viewsByTime: {
          labels: sortedTimeKeys,
          data: sortedTimeKeys.map(key => timeSeriesData[key])
        },
        dayTimeDistribution: data.reduce((acc: number[], curr) => {
          const hour = new Date(curr.view_started_at).getHours()
          if (hour >= 6 && hour < 12) acc[0] = (acc[0] || 0) + 1 // Morgen (6-12)
          else if (hour >= 12 && hour < 18) acc[1] = (acc[1] || 0) + 1 // Mittag (12-18)
          else if (hour >= 18 && hour < 22) acc[2] = (acc[2] || 0) + 1 // Abend (18-22)
          else acc[3] = (acc[3] || 0) + 1 // Nacht (22-6)
          return acc
        }, [0, 0, 0, 0])
      }

      console.log('✅ Analytics-Daten aktualisiert:', analyticsData)
      setAnalyticsData(analyticsData)
    } catch (error) {
      console.error('❌ Fehler beim Laden der Analytics:', error)
    }
  }

  // Realtime Channel Setup
  useEffect(() => {
    if (!partnerId || !date?.from || !date?.to) return

    // Zeitraum für Vergleiche normalisieren
    const normalizedFrom = new Date(date.from)
    normalizedFrom.setHours(0, 0, 0, 0)
    const normalizedTo = new Date(date.to)
    normalizedTo.setHours(23, 59, 59, 999)

    console.log('🔌 Initialisiere Realtime Channel...', {
      partnerId,
      zeitraum: {
        von: normalizedFrom.toISOString(),
        bis: normalizedTo.toISOString()
      }
    })

    let isSubscribed = false
    const channel = supabase
      .channel(`partner_tracking_${partnerId}`)
      .on<PartnerViewTracking>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'partner_view_tracking',
          filter: `partner_id=eq.${partnerId}`
        },
        async (payload: RealtimePostgresChangesPayload<PartnerViewTracking>) => {
          try {
            console.log('📡 Realtime Update empfangen:', {
              event: payload.eventType,
              timestamp: new Date().toISOString(),
              data: payload.new
            })
            
            if (!isSubscribed) {
              console.log('⚠️ Update ignoriert - Channel noch nicht vollständig subscribed')
              return
            }

            const newData = payload.new as PartnerViewTracking
            if (!newData?.view_started_at) {
              console.log('⚠️ Keine gültigen Daten im Payload')
              return
            }

            // Prüfen ob der neue Eintrag im ausgewählten Zeitraum liegt
            const eventDate = new Date(newData.view_started_at)
            
            console.log('🔍 Prüfe Zeitraum:', {
              event: eventDate.toISOString(),
              von: normalizedFrom.toISOString(),
              bis: normalizedTo.toISOString(),
              istImZeitraum: eventDate >= normalizedFrom && eventDate <= normalizedTo
            })
            
            if (eventDate >= normalizedFrom && eventDate <= normalizedTo) {
              console.log('🔄 Lade Analytics neu wegen Realtime Update:', {
                eventType: payload.eventType,
                dataTimestamp: newData.view_started_at,
                zeitraum: {
                  von: normalizedFrom.toISOString(),
                  bis: normalizedTo.toISOString()
                }
              })
              await loadAnalytics()
            } else {
              console.log('⏭️ Update liegt außerhalb des gewählten Zeitraums:', {
                eventDate: eventDate.toISOString(),
                selectedRange: {
                  from: normalizedFrom.toISOString(),
                  to: normalizedTo.toISOString()
                },
                differenzInTagen: {
                  zuBeginn: Math.floor((eventDate.getTime() - normalizedFrom.getTime()) / (1000 * 60 * 60 * 24)),
                  zuEnde: Math.floor((normalizedTo.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24))
                }
              })
            }
          } catch (error) {
            console.error('❌ Fehler bei der Verarbeitung des Realtime Updates:', {
              error,
              payload,
              timestamp: new Date().toISOString()
            })
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 Realtime Status:', status)
        isSubscribed = status === 'SUBSCRIBED'
      })

    // Cleanup beim Unmount
    return () => {
      console.log('🔌 Beende Realtime Channel:', {
        channelName: `partner_tracking_${partnerId}`,
        timestamp: new Date().toISOString()
      })
      supabase.removeChannel(channel)
    }
  }, [partnerId, date?.from?.toISOString(), date?.to?.toISOString(), timeFrame])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto py-8 space-y-6"
    >
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
            Analyse der Kampagne von {partner?.company_name}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">
              Zeitraum
              {isLoadingDays && (
                <motion.span 
                  className="ml-2 inline-block text-sm text-gray-400"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Lade verfügbare Tage...
                </motion.span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <DateRangePicker 
                  date={date} 
                  onDateChange={setDate}
                  disabled={isLoadingDays}
                  disabledDays={isDayDisabled}
                  fromDate={availableDays[0]}
                  toDate={availableDays[availableDays.length - 1]}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-700 hover:text-gray-100"
                  onClick={() => {
                    const yesterday = new Date()
                    yesterday.setDate(yesterday.getDate() - 1)
                    const startOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0)
                    const endOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
                    setDate({
                      from: startOfDay,
                      to: endOfDay
                    })
                  }}
                  disabled={isLoadingDays || (isDayDisabled(new Date(new Date().setDate(new Date().getDate() - 1))) && !date?.from)}
                >
                  Gestern
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-700 hover:text-gray-100"
                  onClick={() => {
                    const today = new Date()
                    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
                    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
                    setDate({
                      from: startOfDay,
                      to: endOfDay
                    })
                  }}
                  disabled={isLoadingDays || (isDayDisabled(new Date()) && !date?.from)}
                >
                  Heute
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-gray-100">Zeitliche Auflösung</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              value={timeFrame}
              onValueChange={(value: 'day' | 'week' | 'month') => setTimeFrame(value)}
            >
              <SelectTrigger className="bg-gray-900 border-gray-700 text-gray-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="day" className="text-gray-100 focus:bg-gray-800 focus:text-gray-100">Täglich</SelectItem>
                <SelectItem value="week" className="text-gray-100 focus:bg-gray-800 focus:text-gray-100">Wöchentlich</SelectItem>
                <SelectItem value="month" className="text-gray-100 focus:bg-gray-800 focus:text-gray-100">Monatlich</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="lg:col-span-2">
          <StatisticCard
            title="Gesamtaufrufe"
            value={analyticsData?.views || 0}
            delay={0.1}
          />
        </div>

        <StatisticCard
          title="Durchschnittliche Dauer"
          value={analyticsData?.avgDuration ? `${Math.round(analyticsData.avgDuration)}s` : '0s'}
          delay={0.2}
        />

        {partner?.landscape_image && partner?.portrait_image && (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-gray-100">Landscape vs. Portrait</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between text-gray-100">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`L:${analyticsData?.viewsByImageType.landscape}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    L: {analyticsData?.viewsByImageType.landscape || 0}
                  </motion.span>
                </AnimatePresence>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`P:${analyticsData?.viewsByImageType.portrait}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    P: {analyticsData?.viewsByImageType.portrait || 0}
                  </motion.span>
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        )}

        <StatisticCard
          title="Fehler"
          value={analyticsData?.totalErrors || 0}
          delay={0.4}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="h-[300px]"
        >
          <Card className="bg-gray-900 border-gray-700 h-full">
            <CardHeader>
              <CardTitle className="text-gray-100">Aufrufe über Zeit</CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {analyticsData?.viewsByTime && (
                  <motion.div
                    key={`chart-${JSON.stringify(analyticsData.viewsByTime)}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-[200px]"
                  >
                    <Line
                      data={{
                        labels: analyticsData.viewsByTime.labels,
                        datasets: [
                          {
                            label: 'Aufrufe',
                            data: analyticsData.viewsByTime.data,
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4,
                          },
                        ],
                      }}
                      options={chartOptions}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="h-[300px]"
        >
          <Card className="bg-gray-900 border-gray-700 h-full">
            <CardHeader>
              <CardTitle className="text-gray-100">Verteilung nach Tageszeit</CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`bar-${JSON.stringify(analyticsData?.dayTimeDistribution)}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-[200px]"
                >
                  <Bar
                    data={{
                      labels: ['Morgen', 'Mittag', 'Abend', 'Nacht'],
                      datasets: [
                        {
                          label: 'Aufrufe',
                          data: analyticsData?.dayTimeDistribution || [0, 0, 0, 0],
                          backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        },
                      ],
                    }}
                    options={chartOptions}
                  />
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Status-Indikator mit Animation */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-4 right-4 flex items-center gap-2 bg-gray-800 text-gray-100 px-3 py-1.5 rounded-full text-sm"
      >
        <motion.div 
          className="w-2 h-2 rounded-full bg-green-500"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
        Live-Updates aktiv
      </motion.div>
    </motion.div>
  )
} 