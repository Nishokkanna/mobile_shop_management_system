'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const menuItems = [
  { name: 'Dashboard', path: '/dashboard', icon: '📊' },
  { name: 'Products', path: '/dashboard/products', icon: '📱' },
  { name: 'Repairs', path: '/dashboard/repairs', icon: '🔧' },
  { name: 'Recharge', path: '/dashboard/recharge', icon: '💳' },
  { name: 'Cash Exchange', path: '/dashboard/cash-exchange', icon: '💰' },
  { name: 'Reports', path: '/dashboard/reports', icon: '📈' },
]

export default function Sidebar({ isOpen }: { isOpen: boolean }) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    router.push('/')
  }

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-0'} bg-gradient-to-b from-ibm-gray-100 to-ibm-gray-90 text-white min-h-screen flex flex-col transition-all duration-300 overflow-hidden shadow-2xl`}>
      <div className="p-6 border-b border-ibm-gray-80 min-w-[256px] bg-gradient-to-r from-ibm-gray-100 to-ibm-gray-90">
        <div className="flex items-center gap-3 mb-2">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
          <h2 className="text-xl font-bold tracking-tight">Sri Sai Mobiles</h2>
        </div>
        <p className="text-xs text-ibm-gray-40 font-medium tracking-wide">ADMIN PORTAL</p>
      </div>
      <nav className="flex-1 p-4 min-w-[256px]">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  pathname === item.path
                    ? 'bg-gradient-to-r from-ibm-blue-600 to-ibm-blue-700 text-white shadow-lg transform scale-105'
                    : 'text-ibm-gray-30 hover:bg-ibm-gray-90 hover:text-white hover:translate-x-1'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-semibold">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-ibm-gray-80 min-w-[256px]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-ibm-gray-30 hover:bg-red-600 hover:text-white transition-all duration-200 w-full hover:shadow-lg"
        >
          <span className="text-xl">🚪</span>
          <span className="font-semibold">Logout</span>
        </button>
      </div>
    </aside>
  )
}
