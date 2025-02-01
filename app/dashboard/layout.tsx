'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  Newspaper, 
  PhoneCall, 
  LogOut,
  Menu,
  X,
  ChevronRight,
  LayoutDashboard,
  Cloud,
  ShoppingCart,
  Monitor,
  Tv,
  Settings,
  Layout as LayoutIcon,
  Tag,
  Home,
  Stethoscope
} from 'lucide-react'

const menuItems = [
  {
    title: 'Übersicht',
    icon: LayoutDashboard,
    href: '/dashboard',
    description: 'Dashboard & Statistiken'
  },
  {
    title: 'ELAC',
    icon: Monitor,
    href: '/dashboard/elac',
    description: 'WKZ Digital'
  },
  {
    title: 'Digital Signage',
    icon: Tv,
    href: '/dashboard/digital-signage',
    description: 'Screens verwalten'
  },
  {
    title: 'News',
    icon: Newspaper,
    href: '/dashboard/news',
    description: 'Nachrichten verwalten'
  },
  {
    title: 'Notdienste',
    icon: PhoneCall,
    href: '/dashboard/emergency',
    description: 'Notdienste verwalten'
  },
  {
    title: 'Wetter',
    icon: Cloud,
    href: '/dashboard/weather',
    description: 'Wetterinformationen'
  },
  {
    title: 'Angebote',
    icon: Tag,
    href: '/dashboard/offers',
    description: 'Angebote verwalten'
  },
  {
    title: 'Homepage',
    icon: LayoutIcon,
    href: '/dashboard/homepage',
    description: 'Homepage verwalten'
  },
  {
    title: 'Einstellungen',
    icon: Settings,
    href: '/dashboard/settings',
    description: 'System Einstellungen'
  }
]

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // Sidebar automatisch schließen bei Routenwechsel auf mobilen Geräten
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false)
    }
  }, [pathname])

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 lg:flex" suppressHydrationWarning>
      {/* Header mit Mobile Menu Toggle */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-gray-800 border-b border-gray-700 flex items-center lg:hidden z-40">
        <button
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="p-2 ml-4 bg-gray-800 rounded-lg border border-gray-700"
        >
          {isSidebarOpen ? (
            <X className="h-6 w-6 text-gray-400" />
          ) : (
            <Menu className="h-6 w-6 text-gray-400" />
          )}
        </button>
        <h1 className="text-xl font-bold ml-4">Dashboard</h1>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-gray-800 border-r border-gray-700 transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 z-30`}
        suppressHydrationWarning
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <Users className="h-8 w-8 text-blue-500" />
            <h1 className="text-xl font-bold">Dashboard</h1>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-500/10 text-blue-500'
                      : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.title}</span>
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    </div>
                    <p className="text-sm opacity-50">{item.description}</p>
                  </div>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-gray-700">
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' })
              router.push('/')
            }}
            className="flex items-center gap-2 w-full p-3 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Abmelden</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 w-full min-h-screen">
        <div className="p-8 lg:pt-8 pt-20">{children}</div>
      </main>
    </div>
  )
} 