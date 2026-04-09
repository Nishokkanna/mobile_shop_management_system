'use client'
import { useEffect, useState, createContext, useContext } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

const SidebarContext = createContext({
  isOpen: true,
  toggleSidebar: () => {},
})

export const useSidebar = () => useContext(SidebarContext)

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    const isAuth = localStorage.getItem('isAuthenticated')
    if (!isAuth) {
      router.push('/')
    }
  }, [router])

  const toggleSidebar = () => setIsOpen(!isOpen)

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
      <div className="flex min-h-screen">
        <Sidebar isOpen={isOpen} />
        <main className="flex-1 bg-ibm-gray-10">{children}</main>
      </div>
    </SidebarContext.Provider>
  )
}
