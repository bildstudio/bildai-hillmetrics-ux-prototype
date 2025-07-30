"use client"

import { AnimatePresence, motion } from "framer-motion"
import { GripVertical, X } from "lucide-react"
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

type Column = {
  key: string
  label: string
  hidden?: boolean
}

interface ColumnsPanelProps {
  open: boolean
  columns: Column[]
  onClose: () => void
  onChange: (cols: Column[]) => void
}

export default function ColumnsPanel({ open, columns, onClose, onChange }: ColumnsPanelProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const items = Array.from(columns)
    const [reordered] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reordered)
    onChange(items)
  }

  const toggleColumn = (key: string) => {
    const updated = columns.map((c) => (c.key === key ? { ...c, hidden: !c.hidden } : c))
    onChange(updated)
  }

  if (!mounted) return null

  const panelContent = (
    <AnimatePresence>
      {open && (
        <>
          {/* Mobile: Add overlay */}
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={onClose}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100vw',
                height: '100vh',
                margin: 0,
                padding: 0,
                zIndex: 999,
                backgroundColor: 'rgba(0, 0, 0, 0.5)'
              }}
            />
          )}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3 }}
            style={isMobile ? {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              maxWidth: '100vw',
              maxHeight: '100vh',
              margin: 0,
              padding: 0,
              zIndex: 1001,
              backgroundColor: 'white',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              border: 'none',
              borderRadius: 0,
              transform: 'translateX(0)',
              overflow: 'hidden',
              boxSizing: 'border-box'
            } : {
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '400px',
              zIndex: 1001,
              backgroundColor: 'white',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div 
              className="flex items-center justify-between border-b min-h-[60px]"
              style={isMobile ? {
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 16,
                paddingBottom: 16,
                margin: 0,
                borderLeft: 'none',
                borderRight: 'none',
                borderTop: 'none'
              } : {
                paddingLeft: 16,
                paddingRight: 16,
                paddingTop: 16,
                paddingBottom: 16
              }}
            >
              <h2 className="text-lg font-semibold">Manage columns</h2>
              <button onClick={onClose} className="rounded-full p-1 text-gray-600 hover:bg-gray-100" aria-label="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div 
              className="flex-1 overflow-y-auto"
              style={{
                padding: 16,
                margin: 0
              }}
            >
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="columns-panel">
                  {(provided) => (
                    <ul 
                      ref={provided.innerRef} 
                      {...provided.droppableProps} 
                      className="space-y-2"
                      style={{ margin: 0 }}
                    >
                      {columns.map((col, index) => (
                        <Draggable key={col.key} draggableId={col.key} index={index}>
                          {(prov) => (
                            <li
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              className="flex items-center justify-between border rounded px-2 py-1 bg-white"
                            >
                              <div className="flex items-center space-x-2">
                                <div {...prov.dragHandleProps} className="cursor-move">
                                  <GripVertical className="h-4 w-4 text-gray-500" />
                                </div>
                                <span>{col.label}</span>
                              </div>
                              <Checkbox checked={!col.hidden} onCheckedChange={() => toggleColumn(col.key)} />
                            </li>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </ul>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  // Render in portal for both mobile and desktop to escape any parent constraints
  return createPortal(panelContent, document.body)
}