"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { FilterCondition } from "@/components/search/advanced-filter-panel"

interface AdvancedFilterContextType {
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  filters: FilterCondition[]
  setFilters: (filters: FilterCondition[]) => void
}

const AdvancedFilterContext = createContext<AdvancedFilterContextType | undefined>(undefined)

export function AdvancedFilterProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<FilterCondition[]>([])

  return (
    <AdvancedFilterContext.Provider value={{ isOpen, setIsOpen, filters, setFilters }}>
      {children}
    </AdvancedFilterContext.Provider>
  )
}

export function useAdvancedFilter() {
  const context = useContext(AdvancedFilterContext)
  if (context === undefined) {
    throw new Error("useAdvancedFilter must be used within an AdvancedFilterProvider")
  }
  return context
}