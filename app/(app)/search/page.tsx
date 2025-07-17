"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Search, ArrowLeft, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { generateRealSearchSuggestions } from "@/lib/real-search-suggestions"
import { SearchSuggestion } from "@/components/search/unified-search"
import { useBladeStack } from "@/lib/blade-stack-context"
import AdvancedFilterPanel, { FilterCondition } from "@/components/search/advanced-filter-panel"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  const [searchTerm, setSearchTerm] = useState(query)
  const [results, setResults] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<FilterCondition[]>([])
  const { openBlade, closeTopBlade } = useBladeStack()

  useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [query])

  const performSearch = async (term: string) => {
    if (!term.trim()) return
    
    setIsLoading(true)
    try {
      const suggestions = await generateRealSearchSuggestions(term)
      // Filter out filter suggestions and only show actual data results
      const dataResults = suggestions.filter(s => s.type === 'navigation')
      setResults(dataResults)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    }
    setIsLoading(false)
  }

  const handleSearch = () => {
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
    }
  }

  const handleResultClick = (result: SearchSuggestion) => {
    // Open appropriate blade based on data type
    switch (result.category) {
      case 'flux':
        openBlade(
          () => import("@/components/view-flux-blade/ViewFluxBlade"),
          {
            reportId: String(result.data.fluxId || result.data.id),
          },
          result.title
        )
        break
      
      case 'fetching':
        openBlade(
          () => import("@/components/fetching-history/fetching-history-details-blade"),
          {
            fetchingId: result.data.fetchingID,
            fluxName: result.title,
            onClose: closeTopBlade,
          },
          `Fetching ${result.data.fetchingID}`
        )
        break
      
      case 'processing':
        openBlade(
          () => import("@/components/processing-history/processing-history-details-blade"),
          {
            processingId: result.data.processingID,
            fluxName: result.title,
            fluxId: String(result.data.flux_id || ""),
            onClose: closeTopBlade,
          },
          `Processing ${result.data.processingID}`
        )
        break
      
      case 'content':
        openBlade(
          () => import("@/components/view-flux-blade/FilePreviewBlade"),
          {
            file: {
              id: result.data.contentID,
              name: result.title,
              fluxId: result.data.flux_id || result.data.fluxId,
              fluxName: result.data.flux_name
            },
            onClose: closeTopBlade,
          },
          result.title
        )
        break
      
      case 'workflow':
        openBlade(
          () => import("@/components/workflow-execution-log/workflow-item-details-blade"),
          {
            item: result.data,
            onClose: closeTopBlade,
          },
          `Workflow ${result.data.workflowID || result.data.id}`
        )
        break
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels = {
      flux: "Flux Data",
      fetching: "Fetching History", 
      processing: "Processing History",
      content: "Content Files",
      workflow: "Workflow Execution"
    }
    return labels[category as keyof typeof labels] || category
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      flux: "bg-blue-100 text-blue-800",
      fetching: "bg-green-100 text-green-800",
      processing: "bg-orange-100 text-orange-800", 
      content: "bg-purple-100 text-purple-800",
      workflow: "bg-pink-100 text-pink-800"
    }
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1 max-w-2xl">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-4 py-3 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <Button onClick={handleSearch} disabled={!searchTerm.trim()}>
                Search
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(true)}
                className="ml-2"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {appliedFilters.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {appliedFilters.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Applied Filters Bar */}
      {appliedFilters.length > 0 && (
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600 mr-2">Filters:</span>
              {appliedFilters.map((filter) => (
                <Badge
                  key={filter.id}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {filter.field}: {filter.value}
                  <button
                    onClick={() => setAppliedFilters(prev => prev.filter(f => f.id !== filter.id))}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAppliedFilters([])}
                className="text-gray-500 hover:text-gray-700"
              >
                Clear all
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {query && (
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Search results for "{query}"
            </h1>
            <p className="text-gray-600">
              {isLoading ? 'Searching...' : `${results.length} results found`}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <span className="text-gray-600">Searching...</span>
            </div>
          </div>
        )}

        {!isLoading && results.length === 0 && query && (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-medium text-gray-900 mb-2">No results found</h2>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or use different keywords
            </p>
            <Button variant="outline" onClick={() => setShowAdvancedFilters(true)}>
              <Filter className="h-4 w-4 mr-2" />
              Try advanced filters
            </Button>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="space-y-4">
            {results.map((result) => {
              const IconComponent = result.icon
              return (
                <div
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <IconComponent className="h-5 w-5 text-gray-500 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {result.title}
                        </h3>
                        <Badge className={getCategoryColor(result.category)}>
                          {getCategoryLabel(result.category)}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm">
                        {result.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Advanced Filter Panel */}
      <AdvancedFilterPanel
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApply={(filters) => {
          setAppliedFilters(filters)
          setShowAdvancedFilters(false)
          // Re-run search with filters applied
          if (query) {
            performSearch(query)
          }
        }}
        onClear={() => {
          setAppliedFilters([])
          setShowAdvancedFilters(false)
          // Re-run search without filters
          if (query) {
            performSearch(query)
          }
        }}
        initialFilters={appliedFilters}
      />
    </div>
  )
}
