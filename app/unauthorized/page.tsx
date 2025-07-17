import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { AppWindow, UserCircle2 } from "lucide-react" // Koristimo Lucide ikonice

export default function UnauthorizedPage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-[#ffffff]">
      {/* Pozadinski vektor */}
      <Image
        src="/images/login-background-vector.svg" // Koristimo isti vektor kao za login
        alt="Background vector"
        layout="fill"
        objectFit="cover"
        quality={100}
        className="absolute inset-0 z-0 opacity-50" // Smanjena transparentnost za suptilniji efekat
      />

      {/* Header */}
      <header className="relative z-10 w-full border-b border-[#d9d9d9]">
        <div className="container mx-auto flex h-16 items-center justify-end px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            <AppWindow className="h-5 w-5 text-[#505050]" />
            <UserCircle2 className="h-6 w-6 text-[#505050]" />
          </div>
        </div>
      </header>

      {/* Glavni sadržaj */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md">
          <h1 className="text-4xl font-bold text-[#0d3034] sm:text-5xl">Unauthorized access</h1>
          <p className="mt-4 text-base text-[#505050] sm:text-lg">
            You are not logged in or do not have the necessary permissions to access this page.
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 bg-[#5499a2] px-10 py-3 text-base font-medium text-white hover:bg-[#5499a2]/90"
          >
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
