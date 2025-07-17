"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  GripVertical,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  Filter as FilterIcon,
  Pin,
  PinOff,
  EyeOff,
  Columns3,
} from "lucide-react"
import React from "react"

interface ColumnHeaderProps {
  label: string
  columnKey: string
  sortable?: boolean
  draggable?: boolean
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>
  getSortIcon: (key: string) => React.ReactNode
  onSort: (key: string) => void
  onSortAsc?: (key: string) => void
  onSortDesc?: (key: string) => void
  onFilter?: (key: string) => void
  showFilter?: boolean
  filterDisabled?: boolean
  pinned?: "left" | "right" | null
  onPinColumn?: (key: string, side: "left" | "right") => void
  onUnpinColumn?: (key: string) => void
  onHideColumn?: (key: string) => void
  onManageColumns?: () => void
}

export default function TableColumnHeader({
  label,
  columnKey,
  sortable,
  draggable,
  dragHandleProps,
  getSortIcon,
  onSort,
  onSortAsc,
  onSortDesc,
  onFilter,
  showFilter,
  filterDisabled,
  pinned,
  onPinColumn,
  onUnpinColumn,
  onHideColumn,
  onManageColumns,
}: ColumnHeaderProps) {
  return (
    <div className="flex items-center space-x-1 group group/header">
      {draggable && (
        <div {...dragHandleProps} className="cursor-move">
          <GripVertical className="h-4 w-4 text-[#9b9b9b]" />
        </div>
      )}
      <span className="truncate max-w-[100px]">{label}</span>
      {sortable && (
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 hover:bg-transparent"
          onClick={() => onSort(columnKey)}
        >
          {getSortIcon(columnKey)}
        </Button>
      )}
      {(onSortAsc || onFilter || onPinColumn || onUnpinColumn || onHideColumn || onManageColumns) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 hover:bg-transparent opacity-0 group-hover/header:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onSortAsc && (
              <DropdownMenuItem onSelect={() => onSortAsc(columnKey)}>
                <ArrowUp className="mr-2 h-4 w-4" /> Sort by ASC
              </DropdownMenuItem>
            )}
            {onSortDesc && (
              <DropdownMenuItem onSelect={() => onSortDesc(columnKey)}>
                <ArrowDown className="mr-2 h-4 w-4" /> Sort by DESC
              </DropdownMenuItem>
            )}
            {onFilter && showFilter && (
              <>
                {(onSortAsc || onSortDesc) && <DropdownMenuSeparator />}
                <DropdownMenuItem onSelect={() => onFilter(columnKey)} disabled={filterDisabled}>
                  <FilterIcon className="mr-2 h-4 w-4" /> Filter
                </DropdownMenuItem>
              </>
            )}
            {(onPinColumn || onUnpinColumn || onHideColumn || onManageColumns) && (
              <>
                {(onSortAsc || onSortDesc || (onFilter && showFilter)) && <DropdownMenuSeparator />}
                {pinned ? (
                  onUnpinColumn && (
                    <DropdownMenuItem onSelect={() => onUnpinColumn(columnKey)}>
                      <PinOff className="mr-2 h-4 w-4" /> Unpin
                    </DropdownMenuItem>
                  )
                ) : (
                  <>
                    {onPinColumn && (
                      <DropdownMenuItem onSelect={() => onPinColumn(columnKey, "left")}> 
                        <Pin className="mr-2 h-4 w-4" /> Pin to left
                      </DropdownMenuItem>
                    )}
                    {onPinColumn && (
                      <DropdownMenuItem onSelect={() => onPinColumn(columnKey, "right")}> 
                        <Pin className="mr-2 h-4 w-4" /> Pin to right
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                {(onHideColumn || onManageColumns) && <DropdownMenuSeparator />}
                {onHideColumn && (
                  <DropdownMenuItem onSelect={() => onHideColumn(columnKey)}>
                    <EyeOff className="mr-2 h-4 w-4" /> Hide column
                  </DropdownMenuItem>
                )}
                {onManageColumns && (
                  <DropdownMenuItem onSelect={onManageColumns}>
                    <Columns3 className="mr-2 h-4 w-4" /> Manage columns
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
