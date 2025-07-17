import { Suspense } from "react"
import ReportsGrid from "@/components/reports/reports-grid"
import Loading from "./loading"

export default function ReportsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ReportsGrid />
    </Suspense>
  )
}
