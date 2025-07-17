"use client"

import { useState, useCallback } from "react"
import { X, Bookmark, Star, Trash2, Edit, Search, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"

export interface AppliedFilter {
  id: string
  field: string
  operator: string
  value: any
  label: string
}

export interface SavedFilter {
  id: string
  name: string
  filters: AppliedFilter[]
  createdAt: string
  isFavorite?: boolean
}

interface SavedFiltersPanelProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilter: (filters: AppliedFilter[]) => void
  currentFilters: AppliedFilter[]
  gridType: 'normalization' | 'refinement' | 'calculation'
}

// Mock saved filters for demonstration
const getMockSavedFilters = (gridType: string): SavedFilter[] => [
  {
    id: "1",
    name: `Failed ${gridType} processes`,
    filters: [
      { id: "f1", field: "status", operator: "equals", value: "Failed", label: "Status is exactly Failed" }
    ],
    createdAt: new Date().toISOString(),
    isFavorite: true
  },
  {
    id: "2", 
    name: `High progress ${gridType}`,
    filters: [
      { id: "f2", field: "progress", operator: "range", value: "76-100%", label: "Progress in range 76-100%" }
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "3",
    name: `Recent ${gridType} runs`,
    filters: [
      { id: "f3", field: "started_at", operator: "after", value: "7 days ago", label: "Started Date after 7 days ago" }
    ],
    createdAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: "4",
    name: `Large ${gridType} content`,
    filters: [
      { id: "f4", field: "content_count", operator: "greaterThan", value: "1000", label: "Content Count greater than 1000" }
    ],
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    isFavorite: true
  }
]

export default function SavedFiltersPanel({
  isOpen,
  onClose,
  onApplyFilter,
  currentFilters,
  gridType
}: SavedFiltersPanelProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(getMockSavedFilters(gridType))
  const [searchTerm, setSearchTerm] = useState("")
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newFilterName, setNewFilterName] = useState("")

  const filteredSavedFilters = savedFilters.filter(filter =>
    filter.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleApplyFilter = useCallback((filter: SavedFilter) => {
    onApplyFilter(filter.filters)
    onClose()
  }, [onApplyFilter, onClose])

  const handleSaveCurrentFilter = useCallback(() => {
    if (!newFilterName.trim() || currentFilters.length === 0) return

    const newFilter: SavedFilter = {
      id: `filter-${Date.now()}`,
      name: newFilterName.trim(),
      filters: currentFilters,
      createdAt: new Date().toISOString()
    }

    setSavedFilters(prev => [newFilter, ...prev])
    setNewFilterName("")
    setShowSaveDialog(false)
  }, [newFilterName, currentFilters])

  const handleDeleteFilter = useCallback((filterId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSavedFilters(prev => prev.filter(f => f.id !== filterId))
  }, [])

  const handleToggleFavorite = useCallback((filterId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSavedFilters(prev => prev.map(f => 
      f.id === filterId ? { ...f, isFavorite: !f.isFavorite } : f
    ))
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Bookmark className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Saved Filters</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Save Current Filter */}
          {currentFilters.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-blue-600" />
                  <Label className="text-sm font-medium text-blue-900">Save Current Filter</Label>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {currentFilters.length} filter{currentFilters.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              
              {!showSaveDialog ? (
                <div className="space-y-2">
                  <p className="text-sm text-blue-700">
                    You have active filters that can be saved for future use.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSaveDialog(true)}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Save Current Filters
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    value={newFilterName}
                    onChange={(e) => setNewFilterName(e.target.value)}
                    placeholder="Enter filter name..."
                    className="border-blue-300"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveCurrentFilter}
                      disabled={!newFilterName.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowSaveDialog(false)
                        setNewFilterName("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Search Filters</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search saved filters..."
                className="pl-10"
              />
            </div>
          </div>

          <Separator />

          {/* Saved Filters List */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Saved Filters ({filteredSavedFilters.length})
            </Label>

            {filteredSavedFilters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {searchTerm ? 'No filters match your search' : 'No saved filters yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSavedFilters.map(filter => (
                  <div
                    key={filter.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleApplyFilter(filter)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm font-medium truncate">{filter.name}</h3>
                          {filter.isFavorite && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-2">
                          {filter.filters.map(f => (
                            <Badge key={f.id} variant="secondary" className="text-xs">
                              {f.label}
                            </Badge>
                          ))}
                        </div>
                        
                        <p className="text-xs text-gray-500">
                          Created {format(new Date(filter.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => handleToggleFavorite(filter.id, e)}
                        >
                          <Star className={`h-4 w-4 ${filter.isFavorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => handleDeleteFilter(filter.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
