import { LucideIcon, Eye, Edit, Pencil, Copy, Download, Zap, History, Clock, Bug, DollarSign, FileTextIcon, Trash2 } from "lucide-react"
import { ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu"
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import type { FluxData } from "@/lib/data-store"

export type FluxMenuAction =
  | "view"
  | "edit"
  | "rename"
  | "makeCopy"
  | "fetch"
  | "forceProcess"
  | "viewFetchingHistory"
  | "viewProcessingHistory"
  | "viewErrorLogs"
  | "viewFinancialData"
  | "viewWorkflowDetails"
  | "remove"

interface BaseItem {
  type: "item"
  id: FluxMenuAction
  label: string
  icon: LucideIcon
}
interface Separator { type: "separator" }
export type FluxMenuDefinition = BaseItem | Separator

export const fluxMenu: FluxMenuDefinition[] = [
  { type: "item", id: "view", label: "View", icon: Eye },
  { type: "item", id: "edit", label: "Edit", icon: Edit },
  { type: "item", id: "rename", label: "Rename", icon: Pencil },
  { type: "item", id: "makeCopy", label: "Make a copy", icon: Copy },
  { type: "separator" },
  { type: "item", id: "fetch", label: "Fetch", icon: Download },
  { type: "item", id: "forceProcess", label: "Force Process all fetching", icon: Zap },
  { type: "separator" },
  { type: "item", id: "viewFetchingHistory", label: "View fetching history", icon: History },
  { type: "item", id: "viewProcessingHistory", label: "View processing history", icon: Clock },
  { type: "item", id: "viewErrorLogs", label: "View error logs", icon: Bug },
  { type: "separator" },
  { type: "item", id: "viewFinancialData", label: "View financial data points", icon: DollarSign },
  { type: "item", id: "viewWorkflowDetails", label: "View workflow details", icon: FileTextIcon },
  { type: "separator" },
  { type: "item", id: "remove", label: "Remove", icon: Trash2 },
]

interface RenderProps {
  item: FluxData
  onAction: (id: FluxMenuAction, item: FluxData) => void
  components: {
    Item: typeof ContextMenuItem | typeof DropdownMenuItem
    Separator: typeof ContextMenuSeparator | typeof DropdownMenuSeparator
  }
}

export function FluxMenuItems({ item, onAction, components }: RenderProps) {
  const { Item, Separator } = components
  return (
    <>
      {fluxMenu.map((el, idx) =>
        el.type === "item" ? (
          <Item key={el.id} onSelect={() => onAction(el.id, item)}>
            <el.icon className="mr-2 h-4 w-4" />
            <span>{el.label}</span>
          </Item>
        ) : (
          <Separator key={`sep-${idx}`} />
        ),
      )}
    </>
  )
}
