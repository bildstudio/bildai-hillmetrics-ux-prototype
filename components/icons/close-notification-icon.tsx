"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type React from "react"

interface CloseNotificationIconProps extends React.HTMLAttributes<HTMLDivElement> {
  onClick?: () => void
}

export function CloseNotificationIcon({ onClick, className, ...props }: CloseNotificationIconProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={cn(
        "w-9 h-9 flex items-center justify-center rounded-md cursor-pointer", // PROMENA: Povećana visina i širina na h-9/w-9
        "bg-transparent text-white", // Normalno stanje: transparentna pozadina, bela ikonica
        "hover:bg-[#4D4D50] hover:text-white", // Hover stanje: pozadina #4D4D50, bela ikonica
        "focus:outline-none focus:ring-0 focus:bg-transparent", // Uklanja fokus outline i pozadinu
        "active:bg-transparent", // Uklanja pozadinu pri aktivnom stanju
        className, // Omogućava dodatne klase
      )}
      {...props}
    >
      <X className="h-4 w-4" />
    </div>
  )
}
