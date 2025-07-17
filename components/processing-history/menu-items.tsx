import { LucideIcon, Eye, Info, Edit, Pencil, FileText } from "lucide-react"
import { ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu"
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import type { ProcessingHistoryData } from "@/app/actions/processing-history"

export type ProcessingHistoryMenuAction =
  | "viewDetails"
  | "quickFlux"
  | "viewFlux"
  | "editFlux"
  | "renameFlux"
  | "viewContent"

interface BaseItem {
  type: "item"
  id: ProcessingHistoryMenuAction
  label: string
  icon: LucideIcon
  disabled?: (item: ProcessingHistoryData) => boolean
}
interface Separator { type: "separator" }
export type ProcessingHistoryMenuDefinition = BaseItem | Separator

export const processingHistoryMenu: ProcessingHistoryMenuDefinition[] = [
  { type: "item", id: "viewDetails", label: "View details", icon: Eye },
  { type: "item", id: "quickFlux", label: "Quick Flux details", icon: Info },
  { type: "separator" },
  { type: "item", id: "viewFlux", label: "View Flux", icon: Eye },
  { type: "item", id: "editFlux", label: "Edit Flux", icon: Edit },
  { type: "item", id: "renameFlux", label: "Rename", icon: Pencil },
  { type: "separator" },
  { type: "item", id: "viewContent", label: "View content", icon: FileText, disabled: (i) => i.fetchingID === null },
]

interface RenderProps {
  item: ProcessingHistoryData
  onAction: (id: ProcessingHistoryMenuAction, item: ProcessingHistoryData) => void
  components: {
    Item: typeof ContextMenuItem | typeof DropdownMenuItem
    Separator: typeof ContextMenuSeparator | typeof DropdownMenuSeparator
  }
}

export function ProcessingHistoryMenuItems({ item, onAction, components }: RenderProps) {
  const { Item, Separator } = components
  return (
    <>
      {processingHistoryMenu.map((el, idx) => {
        if (el.type === "item") {
          const disabled = el.disabled ? el.disabled(item) : false
          return (
            <Item key={el.id} onSelect={() => !disabled && onAction(el.id, item)} disabled={disabled}>
              <el.icon className="mr-2 h-4 w-4" />
              <span>{el.label}</span>
            </Item>
          )
        }
        return <Separator key={`sep-${idx}`} />
      })}
    </>
  )
}
