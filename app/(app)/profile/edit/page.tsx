"use client"

import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { generateAvatarProps } from "@/lib/avatar-utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  X,
  Shield,
  Bell,
  Key,
  Globe,
  Clock,
  Eye,
  EyeOff,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  ChevronDown,
  Settings
} from "lucide-react"
import { useRouter } from "next/navigation"

const TABS = [
  { id: "personal", label: "Personal", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "privacy", label: "Privacy", icon: Eye },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "Preferences", icon: Settings },
]

const ResponsiveTabs = ({
  activeTab,
  onTabChange,
}: {
  activeTab: string
  onTabChange: (tabId: string) => void
}) => {
  const [visibleTabs, setVisibleTabs] = useState(TABS)
  const [hiddenTabs, setHiddenTabs] = useState<typeof TABS>([])
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const measurementRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const calculateTabs = () => {
      const container = tabsContainerRef.current
      if (!container) return

      const containerWidth = container.offsetWidth
      const moreButtonWidth = 120
      let totalWidth = 0
      let visibleCount = 0

      for (let i = 0; i < TABS.length; i++) {
        const measurementEl = measurementRefs.current[i]
        if (!measurementEl) continue

        const tabWidth = measurementEl.offsetWidth + 8

        if (
          totalWidth + tabWidth >
          containerWidth - (hiddenTabs.length > 0 || i < TABS.length - 1 ? moreButtonWidth : 0)
        ) {
          break
        }

        totalWidth += tabWidth
        visibleCount++
      }

      if (visibleCount === 0) visibleCount = 1

      const newVisibleTabs = TABS.slice(0, visibleCount)
      const newHiddenTabs = TABS.slice(visibleCount)

      setVisibleTabs(newVisibleTabs)
      setHiddenTabs(newHiddenTabs)
    }

    const timeoutId = setTimeout(calculateTabs, 100)

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(calculateTabs, 100)
    })

    if (tabsContainerRef.current) {
      resizeObserver.observe(tabsContainerRef.current)
    }

    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
    }
  }, [])

  const handleDropdownSelect = (tabId: string) => {
    onTabChange(tabId)
    setIsMoreOpen(false)
  }

  return (
    <>
      <TabsList
        ref={tabsContainerRef}
        className="relative flex items-center justify-start bg-transparent p-0 h-auto w-full overflow-hidden"
      >
        {visibleTabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent text-gray-600 data-[state=active]:text-gray-900 font-medium py-3 px-4 transition-colors duration-200 hover:text-gray-900 hover:border-gray-400 whitespace-nowrap flex-shrink-0"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </TabsTrigger>
        ))}
        {hiddenTabs.length > 0 && (
          <DropdownMenu 
            open={isMoreOpen} 
            onOpenChange={setIsMoreOpen}
            modal={false}
          >
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-1 ml-auto px-4 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                More ({hiddenTabs.length}) <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              forceMount 
              className="z-[10050]" 
              style={{ zIndex: 10050 }}
              onCloseAutoFocus={(e) => e.preventDefault()}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              {hiddenTabs.map((tab) => (
                <DropdownMenuItem key={tab.id} onSelect={() => handleDropdownSelect(tab.id)}>
                  <tab.icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TabsList>
      <div className="absolute top-0 left-0 opacity-0 pointer-events-none -z-10">
        <div className="flex">
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => {
                measurementRefs.current[index] = el
              }}
              className="flex items-center gap-2 whitespace-nowrap px-4 py-3 font-medium"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

export default function ProfileEditPage() {
  const router = useRouter()
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [activeTab, setActiveTab] = useState("personal")
  const [isUploading, setIsUploading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form data state
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "Ivo",
    lastName: "Lasić",
    email: "ivo.lasic@bild-studio.net",
    phone: "+381 60 123 4567",
    location: "Belgrade, Serbia",
    timezone: "Europe/Belgrade",
    language: "en",
    jobTitle: "Senior Data Engineer",
    department: "Data Processing Team",
    bio: "Experienced data engineer specializing in workflow automation and large-scale data processing systems.",
    
    // Security
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
    
    // Privacy
    profileVisibility: "team",
    showEmail: true,
    showPhone: false,
    showLocation: true,
    allowDataSharing: false,
    
    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    workflowAlerts: true,
    securityAlerts: true,
    marketingEmails: false
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setUnsavedChanges(true)
  }

  const handleSave = async () => {
    // Simulate API call
    console.log('Saving profile data:', formData)
    
    // Reset unsaved changes
    setUnsavedChanges(false)
    
    // Show success message (you can implement toast notification here)
    alert('Profile updated successfully!')
  }

  const handleCancel = () => {
    if (unsavedChanges && !confirm('You have unsaved changes. Are you sure you want to leave?')) {
      return
    }
    router.push('/profile')
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsUploading(true)
      // Simulate upload
      setTimeout(() => {
        setIsUploading(false)
        setUnsavedChanges(true)
      }, 2000)
    }
  }
  
  // Generiši avatar props
  const fullName = `${formData.firstName} ${formData.lastName}`
  const avatarProps = generateAvatarProps(fullName, formData.email)

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/profile')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
              <p className="text-gray-600 mt-1">Update your personal information and preferences</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!unsavedChanges}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
          {unsavedChanges && (
            <div className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">You have unsaved changes</span>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="border-b">
            <ResponsiveTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Personal Information */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>Upload and manage your profile picture</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={null} alt={fullName} />
                      <AvatarFallback 
                        className="text-2xl"
                        style={{ 
                          backgroundColor: avatarProps.backgroundColor,
                          color: avatarProps.textColor
                        }}
                      >
                        {avatarProps.initials}
                      </AvatarFallback>
                    </Avatar>
                    {isUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild disabled={isUploading}>
                        <label htmlFor="avatar-upload" className="cursor-pointer">
                          <Camera className="h-4 w-4 mr-2" />
                          {isUploading ? 'Uploading...' : 'Change Photo'}
                        </label>
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      JPG, PNG or GIF. Max size 5MB. Recommended: 200x200px
                    </p>
                    <input
                      id="avatar-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell others about yourself..."
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={formData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button className="w-full">
                  <Key className="h-4 w-4 mr-2" />
                  Update Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Two-Factor Authentication</Label>
                    <div className="text-sm text-gray-500">
                      Secure your account with SMS or authenticator app
                    </div>
                  </div>
                  <Switch
                    checked={formData.twoFactorEnabled}
                    onCheckedChange={(checked) => handleInputChange('twoFactorEnabled', checked)}
                  />
                </div>
                {formData.twoFactorEnabled && (
                  <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Two-Factor Authentication Enabled</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Your account is protected with two-factor authentication.
                    </p>
                    <Button variant="outline" size="sm">
                      Manage 2FA Settings
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy */}
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Visibility</CardTitle>
                <CardDescription>Control who can see your profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Profile Visibility</Label>
                  <Select
                    value={formData.profileVisibility}
                    onValueChange={(value) => handleInputChange('profileVisibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Anyone can see</SelectItem>
                      <SelectItem value="company">Company - Only company members</SelectItem>
                      <SelectItem value="team">Team - Only team members</SelectItem>
                      <SelectItem value="private">Private - Only you</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="space-y-4">
                  <h4 className="font-medium">Visible Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Email Address</Label>
                      <Switch
                        checked={formData.showEmail}
                        onCheckedChange={(checked) => handleInputChange('showEmail', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Phone Number</Label>
                      <Switch
                        checked={formData.showPhone}
                        onCheckedChange={(checked) => handleInputChange('showPhone', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Location</Label>
                      <Switch
                        checked={formData.showLocation}
                        onCheckedChange={(checked) => handleInputChange('showLocation', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data & Privacy</CardTitle>
                <CardDescription>Manage your data sharing preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow Data Sharing for Analytics</Label>
                    <div className="text-sm text-gray-500">
                      Help improve our services by sharing anonymized usage data
                    </div>
                  </div>
                  <Switch
                    checked={formData.allowDataSharing}
                    onCheckedChange={(checked) => handleInputChange('allowDataSharing', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <div className="text-sm text-gray-500">Receive notifications via email</div>
                    </div>
                    <Switch
                      checked={formData.emailNotifications}
                      onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <div className="text-sm text-gray-500">Receive browser push notifications</div>
                    </div>
                    <Switch
                      checked={formData.pushNotifications}
                      onCheckedChange={(checked) => handleInputChange('pushNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Workflow Alerts</Label>
                      <div className="text-sm text-gray-500">Get notified about workflow status changes</div>
                    </div>
                    <Switch
                      checked={formData.workflowAlerts}
                      onCheckedChange={(checked) => handleInputChange('workflowAlerts', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Security Alerts</Label>
                      <div className="text-sm text-gray-500">Important security notifications</div>
                    </div>
                    <Switch
                      checked={formData.securityAlerts}
                      onCheckedChange={(checked) => handleInputChange('securityAlerts', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing Emails</Label>
                      <div className="text-sm text-gray-500">Product updates and promotional emails</div>
                    </div>
                    <Switch
                      checked={formData.marketingEmails}
                      onCheckedChange={(checked) => handleInputChange('marketingEmails', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Regional & Language</CardTitle>
                <CardDescription>Set your timezone and language preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => handleInputChange('language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="sr">Serbian</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select
                      value={formData.timezone}
                      onValueChange={(value) => handleInputChange('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Belgrade">Belgrade (CET)</SelectItem>
                        <SelectItem value="Europe/Berlin">Berlin (CET)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">New York (EST)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Los Angeles (PST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
