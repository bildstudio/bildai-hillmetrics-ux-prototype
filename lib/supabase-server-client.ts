import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
export async function createServerClient() {
  const cookieStore = await cookies()

  console.log("Creating Supabase server client")

  try {
    return createSupabaseServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )
  } catch (error) {
    console.error("Failed creating Supabase client:", error)
    throw error
  }
}
