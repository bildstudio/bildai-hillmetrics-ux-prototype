"use client"

import React, { createContext, useContext, ReactNode } from 'react'

interface SidebarContextType {
  isSidebarOpen: boolean
  isCollapsed: boolean
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ 
  children, 
  isSidebarOpen, 
  isCollapsed 
}: { 
  children: ReactNode
  isSidebarOpen: boolean
  isCollapsed: boolean
}) {
  return (
    <SidebarContext.Provider value={{ isSidebarOpen, isCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebarContext() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebarContext must be used within a SidebarProvider')
  }
  return context
}