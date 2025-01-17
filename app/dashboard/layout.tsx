'use client'

import { useState } from 'react'
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
  Share2,
  Monitor,
  Tv
} from 'lucide-react'

const menuItems = [
  {
    title: 'Übersicht',
    icon: LayoutDashboard,
    href: '/dashboard',
    description: 'Dashboard & Statistiken'
  },
  {
    title: 'Admin',
    icon: Users,
    href: '/dashboard/admin',
    description: 'Benutzerverwaltung'
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
    title: 'Shop',
    icon: ShoppingCart,
    href: '/dashboard/shop',
    description: 'Shop verwalten'
  },
  {
    title: 'Social Media',
    icon: Share2,
    href: '/dashboard/social',
    description: 'Social Media verwalten'
  }
]

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg border border-gray-700"
      >
        {isSidebarOpen ? (
          <X className="h-6 w-6 text-gray-400" />
        ) : (
          <Menu className="h-6 w-6 text-gray-400" />
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-gray-800 border-r border-gray-700 transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
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

        <div className="absolute bottom-0 left-0 right-0 p-6">
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
      <main
        className={`transition-all duration-200 ${
          isSidebarOpen ? 'lg:ml-64' : ''
        }`}
      >
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
} 