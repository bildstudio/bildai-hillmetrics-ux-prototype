import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Simulacija kašnjenja mreže
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // OVDE SE VRŠI PROVERA (ista logika kao u actions.ts)
    if (email === "admin@admin.com" && password === "admin") {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: "Neispravan email ili lozinka." })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
