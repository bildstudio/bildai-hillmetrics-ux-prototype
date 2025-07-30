"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Search, ArrowLeft, Filter, Activity, X, ChevronLeft, ChevronRight, ChevronDown, AlertCircle, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateRealSearchSuggestions } from "@/lib/real-search-suggestions"
import { SearchSuggestion } from "@/components/search/unified-search"
import { useBladeStack } from "@/lib/blade-stack-context"
import { useViewBlade } from "@/lib/view-blade-context"
import AdvancedFilterPanel, { FilterCondition } from "@/components/search/advanced-filter-panel"
import { useSidebarContext } from "@/lib/sidebar-context"
import { useAdvancedFilter } from "@/lib/advanced-filter-context"
import { useNavigation } from "@/lib/navigation-context"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<SearchSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<FilterCondition[]>([])
  // Track if we're in the middle of processing filters to avoid loops
  const [processingFilters, setProcessingFilters] = useState(false)
  // Track the source of current filters to prevent inappropriate clearing
  const [filtersSource, setFiltersSource] = useState<'query' | 'advanced' | 'none'>('none')
  // Track if we're in the middle of clearing filters
  const [isClearing, setIsClearing] = useState(false)
  
  // Pagination and sorting state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(20) // Fixed page size
  const [sortBy, setSortBy] = useState<'relevance' | 'recent'>('relevance')

  // Monitor appliedFilters changes
  useEffect(() => {
    console.log('appliedFilters state changed:', appliedFilters)
  }, [appliedFilters])
  
  // Reset page to 1 when filters or sort changes (except when currentPage itself changed)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [appliedFilters, sortBy]) // eslint-disable-line react-hooks/exhaustive-deps
  const { openBlade: openStackBlade, closeTopBlade } = useBladeStack()
  const { openBlade: openViewBladeCtx } = useViewBlade()
  const { isCollapsed } = useSidebarContext()
  const { filters: globalFilters, setFilters: setGlobalFilters, setIsOpen: setAdvancedFilterOpen } = useAdvancedFilter()
  const { setIsNavigating } = useNavigation()

  // Reset navigation state when component mounts and when search completes
  useEffect(() => {
    setIsNavigating(false)
  }, [setIsNavigating])

  // Reset navigation state when search completes
  useEffect(() => {
    if (!isLoading) {
      setIsNavigating(false)
    }
  }, [isLoading, setIsNavigating])

  useEffect(() => {
    console.log('Query effect triggered:', { query, filtersSource })
    
    // Skip if we're processing filters or clearing to avoid conflicts
    if (processingFilters || isClearing) {
      console.log('Skipping query effect - processing filters or clearing')
      return
    }
    
    if (query) {
      performSearch(query)
    } else {
      // Only clear filters if they came from query parsing, not from advanced filter panel
      if (filtersSource === 'query') {
        console.log('No query found, clearing query-based applied filters')
        setAppliedFilters([])
        setFiltersSource('none')
      } else {
        console.log('No query but filters are from advanced panel or none, keeping them')
      }
    }
  }, [query, processingFilters, filtersSource, isClearing]) // eslint-disable-line react-hooks/exhaustive-deps

  // Separate effect for global filters
  useEffect(() => {
    // Don't apply filters if currently clearing
    if (isClearing) {
      return
    }
    
    // Check if we should apply filters from global context
    const applyFilters = searchParams.get('applyFilters')
    if (applyFilters === 'true' && globalFilters.length > 0) {
      console.log('Applying global filters:', globalFilters)
      setAppliedFilters(globalFilters)
      setFiltersSource('advanced') // Mark as coming from advanced panel
      
      // Remove the param from URL to avoid reapplying on refresh
      const newParams = new URLSearchParams(searchParams.toString())
      newParams.delete('applyFilters')
      const newUrl = newParams.toString() ? `${pathname}?${newParams.toString()}` : pathname
      window.history.replaceState({}, '', newUrl)
      
      // Clear global filters after applying
      setGlobalFilters([])
      
      // Perform search with filters
      performSearch('', globalFilters)
    }
  }, [searchParams, pathname, globalFilters, setGlobalFilters, isClearing]) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for advanced filter events from header (only for search page)
  useEffect(() => {
    const handleOpenAdvancedFilters = () => {
      console.log('Search page: Received openAdvancedFilters event from header')
      setShowAdvancedFilters(true)
    }

    window.addEventListener('openAdvancedFilters', handleOpenAdvancedFilters)
    
    return () => {
      window.removeEventListener('openAdvancedFilters', handleOpenAdvancedFilters)
    }
  }, [])


  // Separate effect for applied filters to avoid infinite loops
  useEffect(() => {
    console.log('Applied filters effect triggered:', appliedFilters.length, appliedFilters, 'isLoading:', isLoading, 'processingFilters:', processingFilters)
    
    // Don't trigger search if already processing, loading, or clearing
    if (isLoading || processingFilters || isClearing) {
      console.log('Search already in progress, processing filters, or clearing - skipping filter effect')
      return
    }
    
    setProcessingFilters(true)
    
    const processFilters = async () => {
      try {
        if (appliedFilters.length > 0) {
          console.log('Calling performSearch with filters:', appliedFilters)
          await performSearch('', appliedFilters)
        } else if (appliedFilters.length === 0 && !query) {
          console.log('Clearing results - no filters and no query')
          setResults([])
        } else if (appliedFilters.length === 0 && query && filtersSource !== 'none') {
          console.log('No filters but have query, re-run search')
          await performSearch(query)
        }
      } finally {
        setProcessingFilters(false)
      }
    }
    
    processFilters()
  }, [appliedFilters, currentPage, sortBy]) // eslint-disable-line react-hooks/exhaustive-deps

  // Separate effect for filter synchronization
  useEffect(() => {
    // Sinhronizuj lokalne filtere sa URL parametrima za header
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('searchFiltersChanged', { 
        detail: { filters: appliedFilters } 
      });
      window.dispatchEvent(event);
    }
  }, [appliedFilters])

  useEffect(() => {
    // Sluša clear filtere event iz header-a
    const handleClearFilters = () => {
      setIsClearing(true)
      setAppliedFilters([])
      setFiltersSource('none') // Reset source
      setResults([]) // Clear results
      setCurrentPage(1) // Reset pagination
      setTotalPages(1)
      setTotalCount(0)
      setSortBy('relevance') // Reset sort
      // Don't re-run search - let URL change handle it
      setTimeout(() => setIsClearing(false), 100)
    }

    window.addEventListener('clearSearchFilters', handleClearFilters)
    
    return () => {
      window.removeEventListener('clearSearchFilters', handleClearFilters)
    }
  }, [query])

  const performSearch = async (term: string, filterConditions?: FilterCondition[]) => {
    // Don't perform search if currently clearing filters
    if (isClearing) {
      console.log('Skipping search - currently clearing filters')
      return
    }
    
    if (!term.trim() && (!filterConditions || filterConditions.length === 0)) {
      setResults([])
      return
    }
    
    console.log('Starting search for:', term, 'with filters:', filterConditions)
    setIsLoading(true)
    // Don't clear results immediately - wait until we have new results
    
    try {
      // If we have applied filter conditions (from advanced search), process them
      if (filterConditions && filterConditions.length > 0) {
        console.log('Applying advanced filters via API:', filterConditions)
        
        // For flux data filters, call the API directly with filters
        const fluxFilters = filterConditions.filter(f => f.category === 'flux')
        if (fluxFilters.length > 0) {
          try {
            // Convert FilterCondition objects to API format
            const apiFilters = fluxFilters.map(filter => {
              console.log('Converting flux filter to API format:', filter)
              return {
                field: filter.field,
                operator: filter.operator,
                value: filter.value
              }
            })
            
            console.log('Calling flux API with filters:', apiFilters)
            
            // Determine sort parameters based on sortBy
            const sortColumn = sortBy === 'recent' ? 'createdAt' : 'name'
            const sortDirection = sortBy === 'recent' ? 'desc' : 'asc'
            
            const apiUrl = `/api/reports?${new URLSearchParams({
              q: term || '',
              page: currentPage.toString(),
              pageSize: pageSize.toString(),
              sortColumn,
              sortDirection,
              filters: JSON.stringify(apiFilters)
            })}`
            console.log('Full API URL:', apiUrl)
            const response = await fetch(apiUrl)
            
            if (!response.ok) {
              throw new Error(`API response: ${response.status}`)
            }
            
            const data = await response.json()
            console.log('Flux API returned:', data)
            
            if (!data.error && data.data) {
              const searchResults = data.data.map((flux: any) => ({
                id: `flux-${flux.id}`,
                title: flux.name,
                description: `Flux ${flux.id} • Status: ${flux.status}${flux.financialType ? ` • ${flux.financialType}` : ''}`,
                category: 'flux' as const,
                icon: Activity,
                value: flux.name,
                data: { fluxId: flux.id, ...flux },
                type: 'navigation' as const
              }))
              
              setResults(searchResults)
              setTotalCount(data.totalCount || 0)
              setTotalPages(Math.ceil((data.totalCount || 0) / pageSize))
              console.log('Set flux results:', searchResults.length, 'Total:', data.totalCount, 'Pages:', Math.ceil((data.totalCount || 0) / pageSize))
              return
            }
          } catch (error) {
            console.error('Failed to fetch filtered flux data:', error)
            // Don't set empty results on error - leave loading state
            return
          }
        }
        
        // For fetching history filters, call the fetching API directly with filters
        const fetchingFilters = filterConditions.filter(f => f.category === 'fetching')
        if (fetchingFilters.length > 0) {
          try {
            // Convert FilterCondition objects to API format
            const apiFilters = fetchingFilters.map(filter => {
              console.log('Converting fetching filter to API format:', filter)
              
              // Handle date_range filters specially
              if (filter.operator === 'date_range') {
                const now = new Date()
                let fromDate: Date
                let toDate: Date = now
                
                switch (filter.value) {
                  case 'today':
                    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                    toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
                    break
                  case 'week':
                    fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                    break
                  case 'hour':
                    fromDate = new Date(now.getTime() - 60 * 60 * 1000)
                    break
                  default:
                    fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // Default to last 24h
                }
                
                return {
                  field: filter.field,
                  operator: 'between',
                  value: `${fromDate.toISOString()},${toDate.toISOString()}`
                }
              }
              
              return {
                field: filter.field,
                operator: filter.operator,
                value: filter.value
              }
            })
            
            console.log('Calling fetching API with filters:', apiFilters)
            
            // Determine sort parameters based on sortBy
            const sortColumn = sortBy === 'recent' ? 'timestamp' : 'fetchingID'
            const sortDirection = sortBy === 'recent' ? 'desc' : 'asc'
            
            const response = await fetch('/api/fetching-history/query', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fluxId: '', // Empty string to search all flux
                page: currentPage,
                pageSize: pageSize,
                sortColumn,
                sortDirection,
                filters: apiFilters,
                showFluxId: true
              })
            })
            
            if (!response.ok) {
              throw new Error(`API response: ${response.status}`)
            }
            
            const data = await response.json()
            console.log('Fetching API returned:', data)
            
            if (!data.error && data.data) {
              const searchResults = data.data.map((fetching: any) => ({
                id: `fetching-${fetching.fetchingID}`,
                title: `Fetching ${fetching.fetchingID}`,
                description: `${fetching.fluxName || `Flux ${fetching.fluxID}`} • Status: ${fetching.status} • ${new Date(fetching.timestamp).toLocaleString()}`,
                category: 'fetching' as const,
                icon: Activity,
                value: `Fetching ${fetching.fetchingID}`,
                data: { fetchingID: fetching.fetchingID, fluxId: fetching.fluxID, ...fetching },
                type: 'navigation' as const
              }))
              
              setResults(searchResults)
              setTotalCount(data.totalCount || 0)
              setTotalPages(Math.ceil((data.totalCount || 0) / pageSize))
              console.log('Set fetching results:', searchResults.length, 'Total:', data.totalCount)
              return
            }
          } catch (error) {
            console.error('Failed to fetch filtered fetching data:', error)
            // Don't set empty results on error - leave loading state
            return
          }
        }
        
        // For processing history filters, call the processing API directly with filters
        const processingFilters = filterConditions.filter(f => f.category === 'processing')
        if (processingFilters.length > 0) {
          try {
            // Convert FilterCondition objects to API format
            const apiFilters = processingFilters.map(filter => {
              console.log('Converting processing filter to API format:', filter)
              
              // Handle date_range filters specially
              if (filter.operator === 'date_range') {
                const now = new Date()
                let fromDate: Date
                let toDate: Date = now
                
                switch (filter.value) {
                  case 'today':
                    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                    toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
                    break
                  case 'week':
                    fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                    break
                  case 'hour':
                    fromDate = new Date(now.getTime() - 60 * 60 * 1000)
                    break
                  default:
                    fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // Default to last 24h
                }
                
                return {
                  field: filter.field,
                  operator: 'between',
                  value: `${fromDate.toISOString()},${toDate.toISOString()}`
                }
              }
              
              return {
                field: filter.field,
                operator: filter.operator,
                value: filter.value
              }
            })
            
            console.log('Calling processing API with filters:', apiFilters)
            
            // Determine sort parameters based on sortBy
            const sortColumn = sortBy === 'recent' ? 'timestamp' : 'processingID'
            const sortDirection = sortBy === 'recent' ? 'desc' : 'asc'
            
            const apiUrl = `/api/processing-history?${new URLSearchParams({
              fluxId: 'all',
              page: currentPage.toString(),
              pageSize: pageSize.toString(),
              sortColumn,
              sortDirection,
              filters: JSON.stringify(apiFilters)
            })}`
            console.log('Full processing API URL:', apiUrl)
            const response = await fetch(apiUrl)
            
            if (!response.ok) {
              throw new Error(`API response: ${response.status}`)
            }
            
            const data = await response.json()
            console.log('Processing API returned:', data)
            
            if (!data.error && data.data) {
              const searchResults = data.data.map((processing: any) => ({
                id: `processing-${processing.processingID}`,
                title: `Processing ${processing.processingID}`,
                description: `Flux ${processing.fluxID} • Status: ${processing.status} • ${new Date(processing.timestamp).toLocaleString()}`,
                category: 'processing' as const,
                icon: Activity,
                value: `Processing ${processing.processingID}`,
                data: { processingID: processing.processingID, flux_id: processing.fluxID, fluxId: processing.fluxID, fluxName: processing.fluxName, ...processing },
                type: 'navigation' as const
              }))
              
              setResults(searchResults)
              setTotalCount(data.totalCount || 0)
              setTotalPages(Math.ceil((data.totalCount || 0) / pageSize))
              console.log('Set processing results:', searchResults.length, 'Total:', data.totalCount)
              return
            }
          } catch (error) {
            console.error('Failed to fetch filtered processing data:', error)
            // Don't set empty results on error - leave loading state
            return
          }
        }
        
        // For content filters, call the content API directly with filters
        const contentFilters = filterConditions.filter(f => f.category === 'content')
        if (contentFilters.length > 0) {
          try {
            // Convert FilterCondition objects to API format
            const apiFilters = contentFilters.map(filter => {
              console.log('Converting content filter to API format:', filter)
              
              // Handle date_range filters specially
              if (filter.operator === 'date_range') {
                const now = new Date()
                let fromDate: Date
                let toDate: Date = now
                
                switch (filter.value) {
                  case 'today':
                    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                    toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
                    break
                  case 'week':
                    fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                    break
                  case 'hour':
                    fromDate = new Date(now.getTime() - 60 * 60 * 1000)
                    break
                  default:
                    fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // Default to last 24h
                }
                
                return {
                  field: filter.field,
                  operator: 'between',
                  value: `${fromDate.toISOString()},${toDate.toISOString()}`
                }
              }
              
              return {
                field: filter.field,
                operator: filter.operator,
                value: filter.value
              }
            })
            
            console.log('Calling content API with filters:', apiFilters)
            
            // Determine sort parameters based on sortBy
            const sortColumn = sortBy === 'recent' ? 'createdAt' : 'contentName'
            const sortDirection = sortBy === 'recent' ? 'desc' : 'asc'
            
            const apiUrl = `/api/fetched-contents?${new URLSearchParams({
              fluxId: 'all',
              page: currentPage.toString(),
              pageSize: pageSize.toString(),
              sortColumn,
              sortDirection,
              filters: JSON.stringify(apiFilters)
            })}`
            console.log('Full content API URL:', apiUrl)
            const response = await fetch(apiUrl)
            
            if (!response.ok) {
              throw new Error(`API response: ${response.status}`)
            }
            
            const data = await response.json()
            console.log('Content API returned:', data)
            
            if (!data.error && data.data) {
              const searchResults = data.data.map((content: any) => ({
                id: `content-${content.contentID}`,
                title: content.contentName || `Content ${content.contentID}`,
                description: `Flux ${content.fluxID} • ${content.fileType} • ${new Date(content.createdAt).toLocaleString()}`,
                category: 'content' as const,
                icon: Activity,
                value: content.contentName || `Content ${content.contentID}`,
                data: { contentID: content.contentID, flux_id: content.fluxID, fluxId: content.fluxID, fetchingID: content.fetchingID, fluxName: content.fluxName, ...content },
                type: 'navigation' as const
              }))
              
              setResults(searchResults)
              setTotalCount(data.totalCount || 0)
              setTotalPages(Math.ceil((data.totalCount || 0) / pageSize))
              console.log('Set content results:', searchResults.length, 'Total:', data.totalCount)
              return
            }
          } catch (error) {
            console.error('Failed to fetch filtered content data:', error)
            // Don't set empty results on error - leave loading state
            return
          }
        }
        
        // For workflow execution filters, call the workflow API directly with filters
        const workflowFilters = filterConditions.filter(f => f.category === 'workflow')
        if (workflowFilters.length > 0) {
          try {
            // Convert FilterCondition objects to API format
            const apiFilters = workflowFilters.map(filter => {
              console.log('Converting workflow filter to API format:', filter)
              
              // Handle date_range filters specially
              if (filter.operator === 'date_range') {
                const now = new Date()
                let fromDate: Date
                let toDate: Date = now
                
                switch (filter.value) {
                  case 'today':
                    fromDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                    toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
                    break
                  case 'week':
                    fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                    break
                  case 'hour':
                    fromDate = new Date(now.getTime() - 60 * 60 * 1000)
                    break
                  default:
                    fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000) // Default to last 24h
                }
                
                return {
                  field: filter.field,
                  operator: 'between',
                  value: `${fromDate.toISOString()},${toDate.toISOString()}`
                }
              }
              
              return {
                field: filter.field,
                operator: filter.operator,
                value: filter.value
              }
            })
            
            console.log('Calling workflow API with filters:', apiFilters)
            
            // Determine sort parameters based on sortBy
            const sortColumn = sortBy === 'recent' ? 'started_at' : 'run_number'
            const sortDirection = sortBy === 'recent' ? 'desc' : 'asc'
            
            const apiUrl = `/api/workflow-execution-log?${new URLSearchParams({
              fluxId: 'all',
              page: currentPage.toString(),
              pageSize: pageSize.toString(),
              sortColumn,
              sortDirection,
              filters: JSON.stringify(apiFilters)
            })}`
            console.log('Full workflow API URL:', apiUrl)
            const response = await fetch(apiUrl)
            
            if (!response.ok) {
              throw new Error(`API response: ${response.status}`)
            }
            
            const data = await response.json()
            console.log('Workflow API returned:', data)
            
            if (!data.error && data.data) {
              const searchResults = data.data.map((workflow: any) => ({
                id: `workflow-${workflow.id}`,
                title: `Workflow ${workflow.run_number || workflow.id}`,
                description: `${workflow.flux_name || `Flux ${workflow.flux_id}`} • Status: ${workflow.status} • Run ${workflow.run_number}`,
                category: 'workflow' as const,
                icon: Activity,
                value: `Workflow ${workflow.run_number || workflow.id}`,
                data: { workflowID: workflow.id, flux_id: workflow.flux_id, ...workflow },
                type: 'navigation' as const
              }))
              
              setResults(searchResults)
              setTotalCount(data.totalCount || 0)
              setTotalPages(Math.ceil((data.totalCount || 0) / pageSize))
              console.log('Set workflow results:', searchResults.length, 'Total:', data.totalCount)
              return
            }
          } catch (error) {
            console.error('Failed to fetch filtered workflow data:', error)
            // Don't set empty results on error - leave loading state
            return
          }
        }
        
        // For other categories, keep the existing client-side filtering logic
        const suggestions = await generateRealSearchSuggestions('').catch(err => {
          console.error('Error generating search suggestions:', err)
          return []
        })
        let dataResults = suggestions.filter(s => s.type === 'navigation')
        
        // Apply non-flux filters client-side
        const nonFluxFilters = filterConditions.filter(f => f.category !== 'flux')
        nonFluxFilters.forEach(filter => {
          console.log('Applying client-side filter:', filter)
          if (filter.field === 'status' && filter.operator === 'equals') {
            dataResults = dataResults.filter(item => {
              return item.data?.status === filter.value
            })
          }
          // Add more filter field handling here as needed
        })
        
        setResults(dataResults)
        return
      }
      
      // Check if this is a filter query (e.g., "status:Failed")
      if (term.includes(':')) {
        const [field, value] = term.split(':')
        if (field && value) {
          // Map field to appropriate category and data type
          let category = 'flux'
          let dataType: 'text' | 'number' | 'date' | 'select' | 'boolean' = 'select'
          
          if (field === 'status') {
            // Status filters should target fetching history by default (most common use case)
            category = 'fetching'
            dataType = 'select'
          } else if (field === 'date') {
            // Date filters should target fetching history
            category = 'fetching'
            dataType = 'date'
          }
          
          // Apply as filter
          let actualField = field.trim()
          let actualValue: any = value.trim()
          let actualOperator: string = 'equals'
          
          // Special handling for date:today
          if (field === 'date' && value === 'today') {
            actualField = 'timestamp' // Use timestamp field for fetching/processing history
            actualOperator = 'date_range'
            actualValue = 'today' // Use simple string value that gets processed later
          }
          
          // Check if we already have this exact filter
          const hasMatchingFilter = appliedFilters.some(f => 
            f.field === actualField && 
            f.operator === actualOperator && 
            JSON.stringify(f.value) === JSON.stringify(actualValue)
          )
          
          if (!hasMatchingFilter) {
            const filterCondition = {
              id: `filter-${Date.now()}-${actualField}`,
              field: actualField,
              operator: actualOperator as any,
              value: actualValue,
              dataType,
              category
            }
            console.log('Creating new filter from query:', filterCondition)
            setAppliedFilters([filterCondition])
            setFiltersSource('query') // Mark as coming from query parsing
            // Search will be triggered by the appliedFilters useEffect
            return // Exit early to avoid the normal search
          } else {
            console.log('Filter already exists, just running search with existing filters')
            // Filter already exists, just run search with current filters
            performSearch('', appliedFilters)
            return
          }
        }
      } else {
        // Normal search
        const suggestions = await generateRealSearchSuggestions(term).catch(err => {
          console.error('Error generating search suggestions:', err)
          return []
        })
        // Filter out filter suggestions and only show actual data results
        const dataResults = suggestions.filter(s => s.type === 'navigation')
        setResults(dataResults)
      }
    } catch (error) {
      console.error('Search failed:', error)
      setResults([]) // Set empty results only on actual error
    } finally {
      console.log('Search completed for:', term)
      setIsLoading(false)
      setIsNavigating(false) // Reset navigation state immediately
    }
  }


  const handleResultClick = (result: SearchSuggestion) => {
    // Open appropriate blade based on data type
    switch (result.category) {
      case 'flux':
        const fluxId = String(result.data.fluxId || result.data.id)
        openViewBladeCtx(fluxId, result.title, { stackControlled: true })
        openStackBlade(
          () => import("@/components/view-flux-blade/ViewFluxBlade"),
          {
            reportId: fluxId,
          },
          result.title
        )
        break
      
      case 'fetching':
        openStackBlade(
          () => import("@/components/fetching-history/fetching-history-details-blade"),
          {
            fetchingId: result.data.fetchingID,
            fluxName: result.data.fluxName || `Flux ${result.data.fluxId}`,
            fluxId: String(result.data.fluxId),
            onClose: closeTopBlade,
          },
          `Fetching ${result.data.fetchingID}`
        )
        break
      
      case 'processing':
        openStackBlade(
          () => import("@/components/processing-history/processing-history-details-blade"),
          {
            processingId: result.data.processingID,
            fluxName: result.data.fluxName || `Flux ${result.data.fluxId}`,
            fluxId: String(result.data.fluxId || ""),
            onClose: closeTopBlade,
          },
          `Processing ${result.data.processingID}`
        )
        break
      
      case 'content':
        openStackBlade(
          () => import("@/components/view-flux-blade/FilePreviewBlade"),
          {
            file: {
              id: result.data.contentID,
              name: result.title,
              fluxId: result.data.fluxId,
              fluxName: result.data.fluxName
            },
            onClose: closeTopBlade,
          },
          result.title
        )
        break
      
      case 'workflow':
        openStackBlade(
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

  const getStatusIndicator = (description: string) => {
    const lowerDesc = description.toLowerCase()
    
    if (lowerDesc.includes('failed') || lowerDesc.includes('error')) {
      return {
        icon: AlertCircle,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Failed',
        labelColor: 'text-red-700 bg-red-100'
      }
    }
    
    if (lowerDesc.includes('success') || lowerDesc.includes('completed')) {
      return {
        icon: CheckCircle,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'Success',
        labelColor: 'text-green-700 bg-green-100'
      }
    }
    
    if (lowerDesc.includes('processing') || lowerDesc.includes('progress') || lowerDesc.includes('running')) {
      return {
        icon: Clock,
        color: 'text-amber-500',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        label: 'Processing',
        labelColor: 'text-amber-700 bg-amber-100'
      }
    }
    
    return null
  }

  const getFieldLabel = (field: string) => {
    const labels = {
      id: "Flux ID",
      name: "Flux Name",
      fluxState: "Status",
      financialType: "Financial Type",
      fluxType: "Flux Type",
      source: "Source",
      fetchingStatus: "Fetching Status",
      processingStatus: "Processing Status",
      numberOfFetchingTimes: "Fetching Times",
      numberOfSuccessFetching: "Successful Fetches",
      numberOfErrorFetching: "Error Fetches",
      createdAt: "Created Date",
      lastFetchingDate: "Last Fetching Date",
      lastProcessingDate: "Last Processing Date"
    }
    return labels[field as keyof typeof labels] || field
  }

  const getFilterValueDisplay = (filter: FilterCondition): string => {
    // Special handling for date ranges
    if (filter.operator === 'date_range' && typeof filter.value === 'object' && filter.value.from) {
      // Check if it's today's date
      const fromDate = new Date(filter.value.from)
      const today = new Date()
      if (fromDate.toDateString() === today.toDateString()) {
        return "Today"
      }
      // Otherwise format the date range
      return `${new Date(filter.value.from).toLocaleDateString()}`
    }
    
    // For other values, convert to string
    return String(filter.value)
  }

  return (
    <>
      {/* Applied Filters Bar */}
      {console.log('Filter bar render check:', appliedFilters.length, appliedFilters)}
      <div className={`fixed top-16 left-0 ${isCollapsed ? 'md:left-20' : 'md:left-64'} right-0 z-10 bg-gray-50 border-b border-gray-200 transition-all duration-300 ease-in-out overflow-hidden ${
        (appliedFilters.length > 0 || results.length > 0 || query) 
          ? 'max-h-32 opacity-100' 
          : 'max-h-0 opacity-0'
      }`}>
          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              {appliedFilters.length > 0 && (
                <>
                  <span className="text-sm text-gray-600 mr-2">Filters:</span>
            {appliedFilters.map((filter) => (
              <div
                key={filter.id}
                className="h-9 text-sm px-3 py-2 bg-blue-100 border border-blue-300 text-blue-700 hover:bg-blue-200 flex-shrink-0 group rounded-md flex items-center"
              >
                <span className="mr-1.5 whitespace-nowrap">
                  {getFieldLabel(filter.field)}: {getFilterValueDisplay(filter)}
                </span>
                <button
                  type="button"
                  className="h-5 w-5 p-0 ml-1 -mr-1 text-blue-700 hover:text-blue-900 hover:bg-blue-100/50 rounded-sm opacity-80 hover:opacity-100 transition-opacity flex items-center justify-center"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('=== X BUTTON CLICKED ===')
                    console.log('Filter to remove:', filter)
                    console.log('Filter ID:', filter.id)
                    console.log('Current appliedFilters:', appliedFilters)
                    
                    // Set clearing flag IMMEDIATELY to block all search operations
                    setIsClearing(true)
                    
                    const newFilters = appliedFilters.filter(f => {
                      const shouldKeep = f.id !== filter.id
                      console.log(`Filter ${f.id} ${shouldKeep ? 'KEPT' : 'REMOVED'}`)
                      return shouldKeep
                    })
                    console.log('New filters after removal:', newFilters)
                    
                    // Update filters immediately
                    setAppliedFilters(newFilters)
                    if (newFilters.length === 0) {
                      setFiltersSource('none') // Reset source when no filters left
                      setResults([]) // Clear results when no filters left
                      setCurrentPage(1) // Reset pagination
                      setTotalPages(1)
                      setTotalCount(0)
                      setSortBy('relevance') // Reset sort
                      
                      // Clear URL query parameter only when all filters removed
                      console.log('Clearing URL query parameter')
                      const newParams = new URLSearchParams(searchParams.toString())
                      newParams.delete('q')
                      const newUrl = newParams.toString() ? `${pathname}?${newParams.toString()}` : pathname
                      console.log('New URL:', newUrl)
                      router.replace(newUrl)
                    }
                    
                    // Reset clearing flag after a short delay
                    setTimeout(() => {
                      setIsClearing(false)
                    }, 100)
                    
                    console.log('=== X BUTTON DONE ===')
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('=== CLEARING ALL FILTERS ===')
                
                // Set clearing flag IMMEDIATELY to block all search operations
                setIsClearing(true)
                
                // Clear everything immediately
                setAppliedFilters([])
                setFiltersSource('none') // Reset source
                setResults([]) // Clear results when clearing filters
                setCurrentPage(1) // Reset pagination
                setTotalPages(1)
                setTotalCount(0)
                setSortBy('relevance') // Reset sort
                
                // Clear URL query parameter
                const newParams = new URLSearchParams(searchParams.toString())
                newParams.delete('q')
                const newUrl = newParams.toString() ? `${pathname}?${newParams.toString()}` : pathname
                router.replace(newUrl)
                
                // Reset clearing flag after a short delay
                setTimeout(() => {
                  setIsClearing(false)
                }, 100)
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear all
            </Button>
                </>
              )}
            </div>
            
            {/* Sort Dropdown and Pagination */}
            {results.length > 0 && (
              <div className="flex items-center gap-4">
                {console.log('Sort/Pagination render:', {resultsLength: results.length, totalCount, currentPage, totalPages})}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <Select value={sortBy} onValueChange={(value: 'relevance' | 'recent') => setSortBy(value)}>
                    <SelectTrigger className="w-40 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Most relevant</SelectItem>
                      <SelectItem value="recent">Most recent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Pagination */}
                {totalCount > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-[#505050]">
                    {console.log('Pagination rendering with:', {totalCount, currentPage, pageSize})}
                    <span>
                      {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-[#f0f9fa] hover:text-[#3d7a82] transition-all duration-200"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-[#f0f9fa] hover:text-[#3d7a82] transition-all duration-200"
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Mobile Layout - Horizontal Scroll */}
          <div className="sm:hidden">
            {/* Filters Section */}
            {appliedFilters.length > 0 && (
              <div className="px-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-600 flex-shrink-0">Filters:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      console.log('=== CLEARING ALL FILTERS ===')
                      
                      // Set clearing flag IMMEDIATELY to block all search operations
                      setIsClearing(true)
                      
                      // Clear everything immediately
                      setAppliedFilters([])
                      setFiltersSource('none') // Reset source
                      setResults([]) // Clear results when clearing filters
                      setCurrentPage(1) // Reset pagination
                      setTotalPages(1)
                      setTotalCount(0)
                      setSortBy('relevance') // Reset sort
                      
                      // Clear URL query parameter
                      const newParams = new URLSearchParams(searchParams.toString())
                      newParams.delete('q')
                      const newUrl = newParams.toString() ? `${pathname}?${newParams.toString()}` : pathname
                      router.replace(newUrl)
                      
                      // Reset clearing flag after a short delay
                      setTimeout(() => {
                        setIsClearing(false)
                      }, 100)
                    }}
                    className="text-gray-500 hover:text-gray-700 text-xs px-2 py-1 h-auto"
                  >
                    Clear all
                  </Button>
                </div>
                
                {/* Horizontal Scrollable Filter Pills */}
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-2 pb-2">
                    {appliedFilters.map((filter) => (
                      <div
                        key={filter.id}
                        className="h-8 text-sm px-3 py-1 bg-blue-100 border border-blue-300 text-blue-700 hover:bg-blue-200 flex-shrink-0 group rounded-full flex items-center whitespace-nowrap"
                      >
                        <span className="mr-1.5">
                          {getFieldLabel(filter.field)}: {getFilterValueDisplay(filter)}
                        </span>
                        <button
                          type="button"
                          className="h-4 w-4 p-0 ml-1 -mr-1 text-blue-700 hover:text-blue-900 hover:bg-blue-100/50 rounded-full opacity-80 hover:opacity-100 transition-opacity flex items-center justify-center"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            console.log('=== X BUTTON CLICKED ===')
                            console.log('Filter to remove:', filter)
                            console.log('Filter ID:', filter.id)
                            console.log('Current appliedFilters:', appliedFilters)
                            
                            // Set clearing flag IMMEDIATELY to block all search operations
                            setIsClearing(true)
                            
                            const newFilters = appliedFilters.filter(f => {
                              const shouldKeep = f.id !== filter.id
                              console.log(`Filter ${f.id} ${shouldKeep ? 'KEPT' : 'REMOVED'}`)
                              return shouldKeep
                            })
                            console.log('New filters after removal:', newFilters)
                            
                            // Update filters immediately
                            setAppliedFilters(newFilters)
                            if (newFilters.length === 0) {
                              setFiltersSource('none') // Reset source when no filters left
                              setResults([]) // Clear results when no filters left
                              setCurrentPage(1) // Reset pagination
                              setTotalPages(1)
                              setTotalCount(0)
                              setSortBy('relevance') // Reset sort
                              
                              // Clear URL query parameter only when all filters removed
                              console.log('Clearing URL query parameter')
                              const newParams = new URLSearchParams(searchParams.toString())
                              newParams.delete('q')
                              const newUrl = newParams.toString() ? `${pathname}?${newParams.toString()}` : pathname
                              console.log('New URL:', newUrl)
                              router.replace(newUrl)
                            }
                            
                            // Reset clearing flag after a short delay
                            setTimeout(() => {
                              setIsClearing(false)
                            }, 100)
                            
                            console.log('=== X BUTTON DONE ===')
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Controls Section */}
            {results.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200">
                <div className="flex items-center justify-between gap-4">
                  {/* Sort */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm text-gray-600">Sort:</span>
                    <Select value={sortBy} onValueChange={(value: 'relevance' | 'recent') => setSortBy(value)}>
                      <SelectTrigger className="w-32 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevant</SelectItem>
                        <SelectItem value="recent">Recent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Pagination */}
                  {totalCount > 0 && (
                    <div className="flex items-center gap-2 text-sm text-[#505050]">
                      <span className="text-xs">
                        {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)} of {totalCount}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-[#f0f9fa] hover:text-[#3d7a82] transition-all duration-200"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-[#f0f9fa] hover:text-[#3d7a82] transition-all duration-200"
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage((p) => p + 1)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      
      <div className={`min-h-screen ${(appliedFilters.length > 0 || results.length > 0) ? 'pt-14' : ''}`}>

      {/* Results */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {!isLoading && results.length > 0 && (
          <div className="mb-4">
            <p className="text-gray-600">
              {results.length} results found
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

        {/* Empty state - no query and no filters */}
        {!isLoading && results.length === 0 && !query && appliedFilters.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">Start your search</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Use the search bar above to find flux data, fetching history, processing history, and more
            </p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-sm text-gray-500">
                Or try
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowAdvancedFilters(true)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Advanced filters
              </Button>
            </div>
            <div className="mt-8 text-sm text-gray-500">
              <p>Popular searches:</p>
              <div className="mt-2 flex flex-wrap gap-2 justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  onClick={() => {
                    setIsNavigating(true)
                    router.push('/search?q=status:active')
                  }}
                >
                  Active fluxes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  onClick={() => {
                    setIsNavigating(true)
                    router.push('/search?q=date:today')
                  }}
                >
                  Today's activity
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  onClick={() => {
                    setIsNavigating(true)
                    router.push('/search?q=status:Failed')
                  }}
                >
                  Failed operations
                </Button>
              </div>
            </div>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <>
            <div className="space-y-4">
              {results.map((result) => {
                const IconComponent = result.icon
                const statusIndicator = getStatusIndicator(result.description)
                
                return (
                  <div
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className={`
                      bg-white rounded-xl border-2 p-6 cursor-pointer transition-all duration-200 
                      hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5
                      ${statusIndicator ? `${statusIndicator.bgColor} ${statusIndicator.borderColor}` : 'border-gray-200 hover:border-gray-300'}
                    `}
                  >
                    <div className="flex items-start gap-4">
                      {/* Status Icon - prominently displayed for failed items */}
                      {statusIndicator ? (
                        <div className={`
                          p-2 rounded-full ${statusIndicator.bgColor} ${statusIndicator.borderColor} border
                          ${statusIndicator.label === 'Failed' ? 'ring-2 ring-red-100' : ''}
                        `}>
                          <statusIndicator.icon className={`h-5 w-5 ${statusIndicator.color}`} />
                        </div>
                      ) : (
                        <div className="p-2 rounded-full bg-gray-50 border border-gray-200">
                          <IconComponent className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {result.title}
                          </h3>
                          
                          {/* Status Badge - more prominent for failed items */}
                          {statusIndicator && (
                            <Badge className={`
                              ${statusIndicator.labelColor} border font-medium
                              ${statusIndicator.label === 'Failed' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'}
                            `}>
                              {statusIndicator.label}
                            </Badge>
                          )}
                          
                          {/* Category Badge */}
                          <Badge variant="outline" className={`${getCategoryColor(result.category)} text-xs`}>
                            {getCategoryLabel(result.category)}
                          </Badge>
                        </div>
                        
                        <p className={`text-sm leading-relaxed ${
                          statusIndicator?.label === 'Failed' ? 'text-red-700' : 'text-gray-600'
                        }`}>
                          {result.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </div>
      
      {/* Advanced Filter Panel - lokalni za search stranicu */}
      <AdvancedFilterPanel
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApply={(filters) => {
          console.log('Search page: Received filters from AdvancedFilterPanel:', filters)
          console.log('Search page: Setting appliedFilters to:', filters)
          setAppliedFilters(filters)
          setFiltersSource('advanced') // Mark as coming from advanced panel
          setShowAdvancedFilters(false)
          // Don't call performSearch here - let useEffect handle it
          // performSearch(query || '', filters)
        }}
        onClear={() => {
          setIsClearing(true)
          setAppliedFilters([])
          setFiltersSource('none') // Reset source
          setShowAdvancedFilters(false)
          setResults([]) // Clear results
          setCurrentPage(1) // Reset pagination
          setTotalPages(1)
          setTotalCount(0)
          setSortBy('relevance') // Reset sort
          // Don't re-run search - let URL change handle it
          setTimeout(() => setIsClearing(false), 100)
        }}
        initialFilters={appliedFilters}
      />
    </>
  )
}
