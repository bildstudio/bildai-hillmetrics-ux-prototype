import Link from "next/link"
import Image from "next/image"

export default function NotFound() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center bg-[#ffffff] p-6 text-center">
      {/* Pozadinski vektor */}
      <Image
        src="/images/login-background-vector.svg" // Koristimo isti vektor
        alt="Background vector"
        layout="fill"
        objectFit="cover"
        quality={100}
        className="absolute inset-0 z-0 opacity-50" // Suptilniji efekat
      />

      {/* Glavni sadržaj 404 stranice */}
      <div className="relative z-10 flex flex-col items-center">
        <h1 className="text-8xl font-extrabold text-[#0d3034] sm:text-9xl">404</h1>
        <p className="mt-4 max-w-md text-lg text-[#505050] sm:text-xl">
          You broke the flow and now we're both lost. Let's pretend this never happened!
        </p>
        <Link
          href="/dashboard"
          className="mt-8 text-lg font-medium text-[#41a1ac] hover:text-[#337b82] hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Ilustracija praseta */}
      <div className="absolute bottom-10 right-10 z-10 hidden md:block">
        <Image src="/placeholder.svg?width=200&height=180" alt="Oops illustration" width={200} height={180} />
      </div>
    </div>
  )
}
