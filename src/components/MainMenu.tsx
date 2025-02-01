import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  HomeIcon, 
  CloudIcon, 
  LayoutIcon, 
  ShoppingCartIcon,
  Settings,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"

export const menuItems = [
  {
    title: "Dashboard",
    icon: <HomeIcon className="w-6 h-6" />,
    href: "/dashboard",
  },
  {
    title: "Wetter",
    icon: <CloudIcon className="w-6 h-6" />,
    href: "/weather",
  },
  {
    title: "Homepage",
    icon: <LayoutIcon className="w-6 h-6" />,
    href: "/homepage",
  },
  {
    title: "Shop",
    icon: <ShoppingCartIcon className="w-6 h-6" />,
    href: "/shop",
  },
]

export const bottomMenuItems = [
  {
    title: "Einstellungen",
    icon: <Settings className="w-6 h-6" />,
    href: "/dashboard/settings",
  },
  {
    title: "Abmelden",
    icon: <LogOut className="w-6 h-6" />,
    href: "/logout",
  },
]

export function MainMenu() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full justify-between py-4">
      <nav className="space-y-1 px-2">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium rounded-md",
              pathname === item.href
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <span className="mr-3">{item.icon}</span>
            {item.title}
          </Link>
        ))}
      </nav>

      <nav className="space-y-1 px-2 mt-auto">
        {bottomMenuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-4 py-2 text-sm font-medium rounded-md",
              pathname === item.href
                ? "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <span className="mr-3">{item.icon}</span>
            {item.title}
          </Link>
        ))}
      </nav>
    </div>
  )
} 