"use server"

import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email("Neispravan format email adrese."),
  password: z.string().min(5, "Lozinka mora imati najmanje 5 karaktera."),
})

export async function loginAction(credentials: unknown) {
  // Simulacija kašnjenja mreže
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const parsedCredentials = loginSchema.safeParse(credentials)

  if (!parsedCredentials.success) {
    return { success: false, error: "Podaci nisu validni." }
  }

  const { email, password } = parsedCredentials.data

  // OVDE SE VRŠI PROVERA
  if (email === "admin@admin.com" && password === "admin") {
    // U stvarnoj aplikaciji, ovde biste generisali i postavili sesijski token (npr. JWT u HTTPOnly cookie)
    return { success: true }
  } else {
    return { success: false, error: "Neispravan email ili lozinka." }
  }
}
