"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import LoginForm from "@/components/auth/login-form"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()

  // Proveri da li je autentifikacija omogućena
  const isAuthEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "false"

  useEffect(() => {
    // Ako je autentifikacija onemogućena, automatski redirektuj na dashboard
    if (!isAuthEnabled) {
      router.replace("/dashboard")
    }
  }, [isAuthEnabled, router])

  // Ako je autentifikacija onemogućena, prikaži loading dok se redirektuje
  if (!isAuthEnabled) {
    return (
      <main
        className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4"
        style={{ backgroundColor: "#001417" }}
      >
        <div className="text-white text-center">
          <p>Redirecting to dashboard...</p>
        </div>
      </main>
    )
  }

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center overflow-hidden p-4"
      style={{ backgroundColor: "#001417" }}
    >
      <Image
        src="/images/login-background-vector.svg"
        alt="Pozadinski vektor"
        layout="fill"
        objectFit="cover"
        quality={100}
        className="absolute inset-0 z-0"
      />
      <div className="relative z-10">
        <LoginForm />
      </div>
    </main>
  )
}
