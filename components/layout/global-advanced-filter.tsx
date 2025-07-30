"use client"

import { useRouter } from "next/navigation"
import { useAdvancedFilter } from "@/lib/advanced-filter-context"
import AdvancedFilterPanel, { FilterCondition } from "@/components/search/advanced-filter-panel"
import { useNavigation } from "@/lib/navigation-context"

export default function GlobalAdvancedFilter() {
  const router = useRouter()
  const { isOpen, setIsOpen, filters, setFilters } = useAdvancedFilter()
  const { setIsNavigating } = useNavigation()

  const handleApply = (appliedFilters: FilterCondition[]) => {
    console.log('GlobalAdvancedFilter: Applying filters:', appliedFilters)
    setFilters(appliedFilters)
    setIsOpen(false)
    
    // Navigate to search page with filters
    setIsNavigating(true)
    
    // Create a special URL param to indicate filters should be applied
    const params = new URLSearchParams()
    params.set('applyFilters', 'true')
    
    router.push(`/search?${params.toString()}`)
  }

  const handleClear = () => {
    setFilters([])
    setIsOpen(false)
  }

  return (
    <AdvancedFilterPanel
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onApply={handleApply}
      onClear={handleClear}
      initialFilters={filters}
    />
  )
}