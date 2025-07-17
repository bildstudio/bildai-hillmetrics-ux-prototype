"use client"

import { AnimatePresence, motion } from "framer-motion"
import { GripVertical, X } from "lucide-react"
import { DragDropContext, Draggable, Droppable, DropResult } from "@hello-pangea/dnd"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"

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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 right-0 z-[1000] w-[360px] md:w-[400px] h-full bg-white shadow-lg flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b min-h-[60px]">
            <h2 className="text-lg font-semibold">Manage columns</h2>
            <button onClick={onClose} className="rounded-full p-1 text-gray-600 hover:bg-gray-100" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="columns-panel">
                {(provided) => (
                  <ul ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
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
      )}
    </AnimatePresence>
  )
}
