import { LucideIcon, Eye, Info, FileTextIcon, Edit, FileText, Download, Zap, History } from "lucide-react"
import { ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu"
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import type { FetchedContentData } from "@/app/actions/fetched-contents"

export type FetchedContentMenuAction =
  | "preview"
  | "quickFlux"
  | "viewFlux"
  | "editFlux"
  | "showMeta"
  | "viewWorkflow"
  | "downloadRaw"
  | "process"
  | "simulateProcess"
  | "createMapping"
  | "viewProcessing"

interface BaseItem {
  type: "item"
  id: FetchedContentMenuAction
  label: string
  icon: LucideIcon
  disabled?: (item: FetchedContentData) => boolean
}
interface Separator { type: "separator" }
export type FetchedContentMenuDefinition = BaseItem | Separator

export const fetchedContentMenu: FetchedContentMenuDefinition[] = [
  { type: "item", id: "preview", label: "Preview file", icon: Eye },
  { type: "item", id: "quickFlux", label: "Quick Flux details", icon: Info },
  { type: "separator" },
  { type: "item", id: "viewFlux", label: "View Flux", icon: FileTextIcon },
  { type: "separator" },
  { type: "item", id: "editFlux", label: "Edit Flux", icon: Edit },
  { type: "item", id: "showMeta", label: "Show meta data", icon: FileText, disabled: () => true },
  { type: "item", id: "viewWorkflow", label: "View workflow", icon: FileText, disabled: () => true },
  { type: "item", id: "downloadRaw", label: "Download Raw Content", icon: Download, disabled: () => true },
  { type: "item", id: "process", label: "Process", icon: Zap, disabled: () => true },
  { type: "item", id: "simulateProcess", label: "Simulate process", icon: Zap, disabled: () => true },
  { type: "item", id: "createMapping", label: "Create mapping", icon: FileText, disabled: () => true },
  { type: "separator" },
  { type: "item", id: "viewProcessing", label: "View processing", icon: History, disabled: (i) => !i.processingID },
]

interface RenderProps {
  item: FetchedContentData
  onAction: (id: FetchedContentMenuAction, item: FetchedContentData) => void
  components: {
    Item: typeof ContextMenuItem | typeof DropdownMenuItem
    Separator: typeof ContextMenuSeparator | typeof DropdownMenuSeparator
  }
}

export function FetchedContentMenuItems({ item, onAction, components }: RenderProps) {
  const { Item, Separator } = components
  return (
    <>
      {fetchedContentMenu.map((el, idx) => {
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
