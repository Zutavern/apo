'use client'

import { useState } from 'react'
import { 
  Monitor, 
  ChevronDown, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Play,
  Signal,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  ArrowLeft
} from 'lucide-react'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import Link from 'next/link'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

// Dummy-Daten für KPIs
const kpiData = {
  broadcasts: {
    current: 1247,
    previous: 1180,
    change: 5.7,
    trend: [65, 72, 68, 74, 75, 71, 70]
  },
  pageViews: {
    current: 45892,
    previous: 42156,
    change: 8.9,
    trend: [420, 450, 435, 460, 478, 455, 440]
  },
  uptime: {
    current: 99.8,
    previous: 99.5,
    change: 0.3,
    trend: [99.5, 99.6, 99.7, 99.8, 99.8, 99.7, 99.8]
  },
  playFrequency: {
    current: 284,
    previous: 265,
    change: 7.2,
    trend: [25, 28, 26, 29, 30, 28, 27]
  }
}

// Dummy-Daten für das Liniendiagramm
const chartData = {
  labels: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
  datasets: [
    {
      label: 'Ausstrahlungen',
      data: kpiData.broadcasts.trend,
      borderColor: 'rgb(59, 130, 246)',
      tension: 0.4
    }
  ]
}

const chartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false
    }
  },
  scales: {
    y: {
      beginAtZero: false,
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.7)'
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.7)'
      }
    }
  }
}

// Erweiterte Dummy-Daten für die großen Diagramme
const extendedChartData = {
  labels: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
  datasets: [
    {
      label: 'Ausstrahlungen',
      data: [1250, 1340, 1200, 1420, 1380, 1290, 1310],
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4
    },
    {
      label: 'Seitenaufrufe',
      data: [45000, 47000, 44000, 48000, 46000, 43000, 45000],
      borderColor: 'rgb(16, 185, 129)',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4
    }
  ]
}

const barChartData = {
  labels: ['06-08 Uhr', '08-12 Uhr', '12-15 Uhr', '15-18 Uhr', '18-22 Uhr'],
  datasets: [
    {
      label: 'Ausstrahlungen pro Zeitfenster',
      data: [280, 450, 380, 420, 320],
      backgroundColor: 'rgba(59, 130, 246, 0.8)'
    }
  ]
}

const donutChartData = {
  labels: ['Morgens', 'Vormittags', 'Mittags', 'Nachmittags', 'Abends'],
  datasets: [
    {
      data: [15, 25, 20, 25, 15],
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
        'rgba(139, 92, 246, 0.8)'
      ]
    }
  ]
}

const largeChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: 'rgba(255, 255, 255, 0.7)'
      }
    }
  },
  scales: {
    y: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.7)'
      }
    },
    x: {
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      ticks: {
        color: 'rgba(255, 255, 255, 0.7)'
      }
    }
  }
}

const donutOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        color: 'rgba(255, 255, 255, 0.7)'
      }
    }
  }
}

export default function KpiDashboardPage({
  searchParams,
}: {
  searchParams: { campaign?: string }
}) {
  const [timeRange, setTimeRange] = useState('week')
  const [selectedScreen, setSelectedScreen] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Link 
            href={`/dashboard/elac?campaign=${searchParams.campaign || ''}`}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Zurück zur Übersicht</span>
          </Link>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">KPI Dashboard für diese Kampagne</h1>
            <p className="text-gray-400">Echtzeitüberwachung Ihrer Kampagnenperformance</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
              <RefreshCw className="h-4 w-4" />
              <span>Aktualisieren</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
              <Download className="h-4 w-4" />
              <span>Exportieren</span>
            </button>
            <div className="relative">
              <select 
                className="appearance-none bg-gray-800 text-white px-4 py-2 pr-8 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="day">Heute</option>
                <option value="week">Diese Woche</option>
                <option value="month">Dieser Monat</option>
                <option value="year">Dieses Jahr</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Ausstrahlungen */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-400 mb-1">Ausstrahlungen</p>
                <h3 className="text-2xl font-bold">{kpiData.broadcasts.current}</h3>
              </div>
              <Signal className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center ${kpiData.broadcasts.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {kpiData.broadcasts.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="text-sm font-medium">{Math.abs(kpiData.broadcasts.change)}%</span>
              </div>
              <span className="text-sm text-gray-400">vs. letzte Periode</span>
            </div>
            <div className="mt-4 h-16">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Seitenaufrufe */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-400 mb-1">Seitenaufrufe</p>
                <h3 className="text-2xl font-bold">{kpiData.pageViews.current}</h3>
              </div>
              <Eye className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center ${kpiData.pageViews.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {kpiData.pageViews.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="text-sm font-medium">{Math.abs(kpiData.pageViews.change)}%</span>
              </div>
              <span className="text-sm text-gray-400">vs. letzte Periode</span>
            </div>
            <div className="mt-4 h-16">
              <Line data={{
                ...chartData,
                datasets: [{
                  ...chartData.datasets[0],
                  data: kpiData.pageViews.trend
                }]
              }} options={chartOptions} />
            </div>
          </div>

          {/* Uptime */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-400 mb-1">Uptime</p>
                <h3 className="text-2xl font-bold">{kpiData.uptime.current}%</h3>
              </div>
              <Signal className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center ${kpiData.uptime.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {kpiData.uptime.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="text-sm font-medium">{Math.abs(kpiData.uptime.change)}%</span>
              </div>
              <span className="text-sm text-gray-400">vs. letzte Periode</span>
            </div>
            <div className="mt-4 h-16">
              <Line data={{
                ...chartData,
                datasets: [{
                  ...chartData.datasets[0],
                  data: kpiData.uptime.trend
                }]
              }} options={chartOptions} />
            </div>
          </div>

          {/* Play Frequency */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-gray-400 mb-1">Play Frequency</p>
                <h3 className="text-2xl font-bold">{kpiData.playFrequency.current}</h3>
              </div>
              <Play className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center ${kpiData.playFrequency.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {kpiData.playFrequency.change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span className="text-sm font-medium">{Math.abs(kpiData.playFrequency.change)}%</span>
              </div>
              <span className="text-sm text-gray-400">vs. letzte Periode</span>
            </div>
            <div className="mt-4 h-16">
              <Line data={{
                ...chartData,
                datasets: [{
                  ...chartData.datasets[0],
                  data: kpiData.playFrequency.trend
                }]
              }} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Filterleiste */}
        <div className="bg-gray-800 rounded-lg p-4 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">Filter:</span>
            </div>
            <div className="flex-1 flex flex-wrap gap-4">
              <select
                className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer min-w-[200px]"
                value={selectedScreen}
                onChange={(e) => setSelectedScreen(e.target.value)}
              >
                <option value="all">Alle Bildschirme</option>
                <option value="screen1">Bildschirm 1 - Eingang</option>
                <option value="screen2">Bildschirm 2 - Wartezimmer</option>
                <option value="screen3">Bildschirm 3 - Beratung</option>
              </select>
              <select
                className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer min-w-[200px]"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
              >
                <option value="all">Alle Standorte</option>
                <option value="loc1">Standort Nord</option>
                <option value="loc2">Standort Süd</option>
                <option value="loc3">Standort West</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grafen-Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Liniendiagramm */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Performance-Übersicht</h3>
            <div className="h-[300px]">
              <Line data={extendedChartData} options={largeChartOptions} />
            </div>
          </div>

          {/* Balkendiagramm */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Ausstrahlungen nach Tageszeit</h3>
            <div className="h-[300px]">
              <Bar data={barChartData} options={largeChartOptions} />
            </div>
          </div>

          {/* Donut-Chart */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Verteilung nach Tageszeit</h3>
            <div className="h-[300px]">
              <Doughnut data={donutChartData} options={donutOptions} />
            </div>
          </div>

          {/* Kalender-Widget */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Performance-Kalender</h3>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 31 }, (_, i) => {
                const day = i + 1
                // Feste Performance-Werte statt Math.random()
                const performanceMap: Record<number, 'high' | 'low'> = {
                  1: 'high', 5: 'high', 8: 'high', 12: 'high', 15: 'high', 19: 'high', 22: 'high', 26: 'high', 29: 'high',
                  3: 'low', 7: 'low', 10: 'low', 14: 'low', 18: 'low', 21: 'low', 25: 'low', 28: 'low', 31: 'low'
                }
                let bgColor = 'bg-gray-700'
                if (performanceMap[day] === 'high') bgColor = 'bg-green-500/20'
                else if (performanceMap[day] === 'low') bgColor = 'bg-red-500/20'
                
                return (
                  <div
                    key={day}
                    className={`aspect-square ${bgColor} rounded flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity`}
                  >
                    <span className="text-sm">{day}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 