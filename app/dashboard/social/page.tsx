'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Settings, Palette, LayoutGrid, Columns, Rows } from "lucide-react"
import Link from "next/link"

type LayoutType = 'single' | 'double' | 'triple'

export default function SocialDashboard() {
  const [layoutType, setLayoutType] = useState<LayoutType>('double')

  const handleLayoutToggle = () => {
    setLayoutType(current => {
      if (current === 'single') return 'double'
      if (current === 'double') return 'triple'
      return 'single'
    })
  }

  const getLayoutIcon = () => {
    switch (layoutType) {
      case 'single':
        return <Rows className="w-5 h-5" />
      case 'double':
        return <Columns className="w-5 h-5" />
      case 'triple':
        return <LayoutGrid className="w-5 h-5" />
    }
  }

  const getLayoutText = () => {
    switch (layoutType) {
      case 'single':
        return '1 Spalte'
      case 'double':
        return '2 Spalten'
      case 'triple':
        return '3 Spalten'
    }
  }

  const getGridClass = () => {
    switch (layoutType) {
      case 'single':
        return 'grid grid-cols-1 gap-6'
      case 'double':
        return 'grid grid-cols-1 md:grid-cols-2 gap-6'
      case 'triple':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Social Media Dashboard</h1>
        <button
          onClick={handleLayoutToggle}
          className="inline-flex items-center justify-center gap-2 rounded-md h-10 px-4 py-2 bg-gray-900/50 border border-white/10 hover:bg-gray-900/70 transition-colors text-gray-300"
          title={`Layout ändern (${getLayoutText()})`}
        >
          {getLayoutIcon()}
          <span className="hidden sm:inline">{getLayoutText()}</span>
        </button>
      </div>

      <div className={getGridClass()}>
        <Card className="bg-card border-border hover:border-border/80 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Settings className="w-8 h-8" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Verbinde Deine Accounts</h3>
                  <p className="text-sm text-muted-foreground">
                    Verwalte deine Social Media und Canva Verbindungen
                  </p>
                </div>
              </div>
              <Button className="bg-gray-900 text-white hover:bg-gray-900/90" asChild>
                <Link href="/dashboard/social/settings">Öffnen</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border hover:border-border/80 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Palette className="w-8 h-8" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Canva Assets</h3>
                  <p className="text-sm text-muted-foreground">
                    Durchsuche und verwende deine Canva Assets für Social Media Posts
                  </p>
                </div>
              </div>
              <Button className="bg-gray-900 text-white hover:bg-gray-900/90" asChild>
                <Link href="/dashboard/social/canva">Öffnen</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 