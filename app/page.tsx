"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined") {
      const authToken = localStorage.getItem("auth_token")
      const authExpiry = localStorage.getItem("auth_expiry")
      const isLoggedIn = localStorage.getItem("isLoggedIn")

      if (authToken && authExpiry && isLoggedIn) {
        const expiryTime = Number.parseInt(authExpiry)
        const currentTime = Date.now()

        if (currentTime < expiryTime) {
          router.replace("/dashboard")
        } else {
          localStorage.removeItem("auth_token")
          localStorage.removeItem("auth_expiry")
          localStorage.removeItem("isLoggedIn")
          router.replace("/login")
        }
      } else {
        router.replace("/login")
      }
    }
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Preusmeravanje...</p>
      </div>
    </div>
  )
}
