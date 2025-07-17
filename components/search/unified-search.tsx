"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Search, Clock, FileText, Workflow, Database, TrendingUp, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export interface SearchSuggestion {
  id: string
  title: string
  description: string
  category: 'recent' | 'flux' | 'fetching' | 'processing' | 'content' | 'workflow'
  icon: React.ComponentType<{ className?: string }>
  value: string
  data: any
  type: 'quick_search' | 'filter' | 'navigation'
}

interface UnifiedSearchProps {
  searchTerm: string
  onSearchChange: (term: string) => void
  suggestions: SearchSuggestion[]
  isLoading?: boolean
  onSuggestionSelect: (suggestion: SearchSuggestion) => void
  onShowAdvancedFilters: () => void
  onEnterKey?: () => void
  recentSearches?: string[]
  className?: string
}

const categoryIcons = {
  recent: Clock,
  flux: TrendingUp,
  fetching: Database,
  processing: Workflow,
  content: FileText,
  workflow: Workflow
}

const categoryLabels = {
  recent: "Recent searches",
  flux: "Flux data",
  fetching: "Fetching history",
  processing: "Processing history", 
  content: "Content files",
  workflow: "Workflow execution"
}

export default function UnifiedSearch({
  searchTerm,
  onSearchChange,
  suggestions = [],
  isLoading = false,
  onSuggestionSelect,
  onShowAdvancedFilters,
  onEnterKey,
  recentSearches = [],
  className
}: UnifiedSearchProps) {

  const groupedSuggestions = useMemo(() => {
    const groups: Record<string, SearchSuggestion[]> = {}
    
    // Add recent searches if no search term
    if (!searchTerm && recentSearches.length > 0) {
      groups.recent = recentSearches.slice(0, 3).map((search, index) => ({
        id: `recent-${index}`,
        title: search,
        description: 'Recent search',
        category: 'recent' as const,
        icon: Clock,
        value: search,
        data: { searchTerm: search },
        type: 'quick_search' as const
      }))
    }
    
    // Separate navigation items (concrete items) from filter items
    const navigationItems: SearchSuggestion[] = []
    const filterItems: SearchSuggestion[] = []
    
    suggestions.forEach(suggestion => {
      if (suggestion.type === 'navigation') {
        navigationItems.push(suggestion)
      } else if (suggestion.type === 'filter') {
        filterItems.push(suggestion)
      } else {
        // quick_search items
        if (!groups[suggestion.category]) {
          groups[suggestion.category] = []
        }
        groups[suggestion.category].push(suggestion)
      }
    })
    
    // Group navigation items by category (concrete items first)
    navigationItems.forEach(suggestion => {
      if (!groups[suggestion.category]) {
        groups[suggestion.category] = []
      }
      groups[suggestion.category].push(suggestion)
    })
    
    // Add filter items only if there are no navigation items or if searchTerm is empty
    if (navigationItems.length === 0 || !searchTerm) {
      filterItems.forEach(suggestion => {
        if (!groups[suggestion.category]) {
          groups[suggestion.category] = []
        }
        groups[suggestion.category].push(suggestion)
      })
    }
    
    return groups
  }, [suggestions, searchTerm, recentSearches])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchTerm) {
      if (onEnterKey) {
        onEnterKey()
      } else {
        // Fallback: select first suggestion
        const firstSuggestion = suggestions[0]
        if (firstSuggestion) {
          onSuggestionSelect(firstSuggestion)
        }
      }
    }
  }, [searchTerm, suggestions, onSuggestionSelect, onEnterKey])

  return (
    <div className={className}>
      <div className="overflow-visible bg-transparent">
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                Searching...
              </div>
            </div>
          )}
          
          {!isLoading && suggestions.length === 0 && searchTerm && (
            <div className="text-center py-6">
              <Search className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No results found for "{searchTerm}"</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={onShowAdvancedFilters}
              >
                <Filter className="h-4 w-4 mr-2" />
                Try advanced filters
              </Button>
            </div>
          )}

          {Object.entries(groupedSuggestions).map(([category, items]) => {
            if (items.length === 0) return null
            
            const CategoryIcon = categoryIcons[category as keyof typeof categoryIcons] || Search
            
            return (
              <div key={category} className="py-2">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground px-3 py-1">
                  <CategoryIcon className="h-3 w-3" />
                  {categoryLabels[category as keyof typeof categoryLabels] || category}
                </div>
                {items.map((suggestion) => {
                  const SuggestionIcon = suggestion.icon
                  
                  return (
                    <div
                      key={suggestion.id}
                      onClick={() => {
                        console.log('Selected suggestion:', suggestion)
                        onSuggestionSelect(suggestion)
                      }}
                      className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <SuggestionIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">
                            {suggestion.title}
                          </span>
                          {suggestion.type === 'filter' && (
                            <Badge variant="secondary" className="text-xs">
                              Filter
                            </Badge>
                          )}
                        </div>
                        {suggestion.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {suggestion.description}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}

          {/* All search results and Advanced filters suggestion */}
          {searchTerm && !isLoading && (
            <>
              <Separator className="my-2" />
              <div className="py-2">
                <div
                  onClick={onEnterKey}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">All search results for "{searchTerm}"</span>
                    <p className="text-xs text-muted-foreground">
                      Press ENTER
                    </p>
                  </div>
                </div>
                <div
                  onClick={onShowAdvancedFilters}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <span className="text-sm font-medium">Advanced search</span>
                    <p className="text-xs text-muted-foreground">
                      Use filters to refine your search
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
