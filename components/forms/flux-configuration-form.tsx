"use client"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

export interface FluxConfigurationData {
  fluxType: string
  financialType: string
  fluxState: string
  allowConcurrentMultiFetching?: boolean // New field
}

interface FluxConfigurationFormProps {
  data: FluxConfigurationData
  onChange: (data: FluxConfigurationData) => void
}

export function FluxConfigurationForm({ data, onChange }: FluxConfigurationFormProps) {
  const updateData = (updates: Partial<FluxConfigurationData>) => {
    onChange({ ...data, ...updates })
  }

  const fluxTypeOptions = ["Email", "API", "HTTP Download", "SFTP", "Webhook", "Scraping", "Manual"]
  const financialTypeOptions = [
    "Fund",
    "Stock",
    "Bond",
    "ETF",
    "Cryptocurrency",
    "Derivative",
    "Commodity",
    "Forex",
    "Bench",
    "RealEstate",
    "Future",
    "PrivateEquity",
    "Spacs",
    "StructuredProduct",
    "Undefined",
  ]
  const fluxStateOptions = ["Active", "Inactive", "Draft", "Archived"]

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mt-[15px]">
          Flux Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fluxType">Flux Type *</Label>
            <Select value={data.fluxType} onValueChange={(value) => updateData({ fluxType: value })}>
              <SelectTrigger id="fluxType">
                <SelectValue placeholder="Select flux type" />
              </SelectTrigger>
              <SelectContent>
                {fluxTypeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="financialType">Financial Type *</Label>
            <Select value={data.financialType} onValueChange={(value) => updateData({ financialType: value })}>
              <SelectTrigger id="financialType">
                <SelectValue placeholder="Select financial type" />
              </SelectTrigger>
              <SelectContent>
                {financialTypeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fluxState">Flux State *</Label>
          <Select value={data.fluxState} onValueChange={(value) => updateData({ fluxState: value })}>
            <SelectTrigger id="fluxState">
              <SelectValue placeholder="Select flux state" />
            </SelectTrigger>
            <SelectContent>
              {fluxStateOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* New: Allow Concurrent Multi-Fetching Toggle */}
        <div className="flex items-center justify-between space-x-2 pt-4">
          <Label htmlFor="allowConcurrentMultiFetching" className="flex-1">
            Allow Concurrent Multi-Fetching
          </Label>
          <Switch
            id="allowConcurrentMultiFetching"
            checked={data.allowConcurrentMultiFetching || false}
            onCheckedChange={(checked) => updateData({ allowConcurrentMultiFetching: checked })}
          />
        </div>
      </div>
    </div>
  )
}
