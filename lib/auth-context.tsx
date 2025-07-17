"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

interface AuthContextType {
  isAuthenticated: boolean
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Proveri da li je autentifikacija omogućena
  const isAuthEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "false"

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      // Ako je autentifikacija onemogućena, automatski postavi kao autentifikovano
      if (!isAuthEnabled) {
        setIsAuthenticated(true)
        setIsLoading(false)
        return
      }

      const authToken = localStorage.getItem("auth_token")
      const authExpiry = localStorage.getItem("auth_expiry")
      const isLoggedIn = localStorage.getItem("isLoggedIn")

      if (authToken && authExpiry && isLoggedIn) {
        const expiryTime = Number.parseInt(authExpiry)
        const currentTime = Date.now()

        if (currentTime < expiryTime) {
          setIsAuthenticated(true)
        } else {
          // Token expired, clear storage
          localStorage.removeItem("auth_token")
          localStorage.removeItem("auth_expiry")
          localStorage.removeItem("isLoggedIn")
          setIsAuthenticated(false)
        }
      } else {
        setIsAuthenticated(false)
      }

      setIsLoading(false)
    }

    if (typeof window !== "undefined") {
      checkAuth()
    }
  }, [isAuthEnabled])

  // Handle routing based on authentication
  useEffect(() => {
    if (!isLoading && typeof window !== "undefined") {
      // Ako je autentifikacija onemogućena, ne radi redirekcije
      if (!isAuthEnabled) {
        return
      }

      if (!isAuthenticated && pathname !== "/login") {
        router.replace("/login")
      } else if (isAuthenticated && pathname === "/login") {
        router.replace("/dashboard")
      }
    }
  }, [isAuthenticated, isLoading, pathname, router, isAuthEnabled])

  const logout = () => {
    // Ako je autentifikacija onemogućena, ne radi ništa
    if (!isAuthEnabled) {
      return
    }

    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("auth_expiry")
      localStorage.removeItem("isLoggedIn")
    }
    setIsAuthenticated(false)
    router.replace("/login")
  }

  return <AuthContext.Provider value={{ isAuthenticated, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
