'use client'

import { createContext, useContext } from 'react'

type SidebarContextValue = {
  isOpen: boolean
  toggleSidebar: () => void
}

export const SidebarContext = createContext<SidebarContextValue>({
  isOpen: true,
  toggleSidebar: () => {},
})

export const useSidebar = () => useContext(SidebarContext)