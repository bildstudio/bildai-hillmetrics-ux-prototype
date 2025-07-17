import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center space-x-2">
        <Loader2 className="h-6 w-6 animate-spin text-[#5499a2]" />
        <span className="text-lg text-[#505050]">Loading data...</span>
      </div>
    </div>
  )
}
