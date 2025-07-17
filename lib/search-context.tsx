"use client"

import type React from "react"
import { createContext, useContext, useState, useRef, useCallback, useMemo } from "react"
import { dataStore } from "@/lib/data-store"
import type { DateRange } from "react-day-picker"

interface DateFilterValue {
  preset: string
  range: DateRange | undefined
}

interface FilterState {
  status: string[]
  category: string[]
  progressRange: string
  durationRange: string
  dateRange: DateFilterValue
}

interface SearchContextType {
  searchTerm: string
  setSearchTerm: (term: string) => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
  showFilterPanel: boolean
  setShowFilterPanel: (show: boolean) => void
  filterPanelRef: React.RefObject<HTMLDivElement>
  filters: FilterState
  setFilters: (filters: FilterState) => void
  handleSearchChange: (value: string) => void
  handleSearchSelect: (suggestion: string) => void
  handleFilterChange: (filterType: keyof FilterState, value: any) => void
  clearAllFilters: () => void
  searchSuggestions: string[]
  availableCategories: string[]
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const filterPanelRef = useRef<HTMLDivElement>(null)
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    category: [],
    progressRange: "",
    durationRange: "",
    dateRange: { preset: "", range: undefined },
  })

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    setSearchOpen(value.length > 0)
  }, [])

  const handleSearchSelect = useCallback((suggestion: string) => {
    setSearchTerm(suggestion)
    setSearchOpen(false)
  }, [])

  const handleFilterChange = useCallback((filterType: keyof FilterState, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }))
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({
      status: [],
      category: [],
      progressRange: "",
      durationRange: "",
      dateRange: { preset: "", range: undefined },
    })
  }, [])

  const availableCategories = useMemo(() => {
    if (!dataStore.isLoaded) return []
    const categories = new Set<string>()
    dataStore.getData().forEach((item) => categories.add(item.category))
    return Array.from(categories)
  }, [])

  const searchSuggestions = useMemo(() => {
    if (!dataStore.isLoaded || !searchTerm.trim()) return []
    const suggestions = new Set<string>()
    const lowercaseQuery = searchTerm.toLowerCase()
    dataStore.getData().forEach((item) => {
      if (item.name.toLowerCase().includes(lowercaseQuery)) {
        suggestions.add(item.name)
      }
    })
    return Array.from(suggestions).slice(0, 10)
  }, [searchTerm])

  const value: SearchContextType = {
    searchTerm,
    setSearchTerm,
    searchOpen,
    setSearchOpen,
    showFilterPanel,
    setShowFilterPanel,
    filterPanelRef,
    filters,
    setFilters,
    handleSearchChange,
    handleSearchSelect,
    handleFilterChange,
    clearAllFilters,
    searchSuggestions,
    availableCategories,
  }

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error("useSearch must be used within a SearchProvider")
  }
  return context
}
