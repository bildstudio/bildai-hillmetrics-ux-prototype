"use client"

import React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface StepData {
  id: number
  title: string
  completed: boolean
  active: boolean
}

interface StepperProps {
  steps: StepData[]
  currentStep: number
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-all duration-200",
                  step.completed // Boja kruga: ako je završen, zelena; inače, proveri da li je aktivan
                    ? "bg-[#41C460] border-[#41C460] text-white"
                    : step.active
                      ? "bg-[#2C555F] border-[#2C555F] text-white"
                      : "bg-gray-100 border-gray-300 text-gray-500",
                )}
              >
                {step.completed ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs font-medium text-center max-w-[80px]",
                  // Prioritet za boju labele: ako je završen, koristi #53C362; inače, proveri da li je aktivan
                  step.completed ? "text-[#53C362]" : step.active ? "text-[#2C555F]" : "text-gray-500",
                )}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-4 transition-all duration-200",
                  steps[index + 1].completed || steps[index + 1].active ? "bg-[#41C460]" : "bg-gray-300",
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
