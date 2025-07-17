import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { BladeStackProvider } from "@/lib/blade-stack-context"

export const metadata: Metadata = {
  title: "HillMetrics App",
  description: "Financial Workflow Management System",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <BladeStackProvider>{children}</BladeStackProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
