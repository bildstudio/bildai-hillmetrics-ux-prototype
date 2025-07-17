"use client"

import type React from "react"
import { useState, useTransition } from "react"
// Ispravan import za useRouter za App Router
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
// Ispravan import za auth-context
// import { useAuth } from "@/lib/auth-context"; // useAuth se ne koristi direktno za login logiku ovde

export default function LoginForm() {
  const router = useRouter() // useRouter se može koristiti za navigaciju nakon logina ako ne koristimo window.location.href
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState("admin@admin.com")
  const [password, setPassword] = useState("admin")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // const { login } = useAuth(); // login funkcija nije deo postojećeg AuthContext-a

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!email || !password) {
      setError("Oba polja su obavezna.") // Prilagodite poruku ako je potrebno
      return
    }

    startTransition(async () => {
      try {
        // Simulacija kašnjenja mreže
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Provera kredencijala
        if (email === "admin@admin.com" && password === "admin") {
          // Uspešan login
          const expiryTime = Date.now() + 24 * 60 * 60 * 1000 // 24 sata

          if (typeof window !== "undefined") {
            localStorage.setItem("auth_token", "authenticated")
            localStorage.setItem("auth_expiry", expiryTime.toString())
            localStorage.setItem("isLoggedIn", "true")

            // Kratka pauza da se localStorage postavi
            await new Promise((resolve) => setTimeout(resolve, 100))

            // Preusmeravanje
            window.location.href = "/dashboard"
            // Alternativno, ako AuthProvider pravilno reaguje na promene u localStorage:
            // router.push("/dashboard");
          }
        } else {
          setError("Neispravan email ili lozinka.") // Prilagodite poruku
        }
      } catch (err) {
        console.error("Login error:", err)
        setError("Došlo je do greške. Pokušajte ponovo.") // Prilagodite poruku
      }
    })
  }

  return (
    <Card className="w-[420px] rounded-2xl shadow-xl border-none">
      <CardContent className="p-10">
        <div className="mb-10 flex justify-center">
          <Image src="/logo-login.svg" alt="HillMetrics Login Logo" width={190} height={38} />
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center space-x-2 rounded-md border border-red-500 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-normal text-gray-500">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              className="h-12 rounded-lg border-gray-200 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-normal text-gray-500">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                className="h-12 rounded-lg border-gray-200 pr-10 text-base"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Sakrij lozinku" : "Prikaži lozinku"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            // Uklonjen variant="ghost" da bi se primenile bg-login-button-bg klase
            className="w-full h-14 rounded-lg bg-login-button-bg text-base font-medium text-white shadow-sm hover:bg-login-button-hover-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-teal"
          >
            {isPending ? "Logging in..." : "Log in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
