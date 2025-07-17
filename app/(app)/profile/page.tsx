"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Activity,
  Settings,
  Edit3,
  Shield,
  Award,
  TrendingUp,
  FileText,
  Database,
  Workflow,
  CheckCircle,
  AlertCircle,
  XCircle,
  BarChart3,
  Users,
  Globe,
  Star
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const router = useRouter()
  
  // Mock user data - replace with actual data from your API/context
  const userData = {
    name: "Ivo Lasić",
    email: "ivo.lasic@bild-studio.net",
    phone: "+381 60 123 4567",
    location: "Belgrade, Serbia",
    timezone: "Central European Time (CET)",
    role: "Senior Data Engineer",
    department: "Data Processing Team",
    joinDate: "March 15, 2022",
    lastLogin: "Today at 09:34 AM",
    status: "Active",
    avatar: "/placeholder.svg?width=120&height=120"
  }

  const stats = {
    totalWorkflows: 1247,
    successfulRuns: 1089,
    failedRuns: 158,
    avgProcessingTime: "2.4 mins",
    dataProcessed: "847 GB",
    uptime: 94.7
  }

  const recentActivity = [
    { action: "Workflow Completed", target: "Financial Data Processing #1234", time: "2 minutes ago", status: "success" },
    { action: "Stage Failed", target: "Marketing Analysis #5678", time: "1 hour ago", status: "error" },
    { action: "New Flux Created", target: "Customer Segmentation", time: "3 hours ago", status: "info" },
    { action: "Profile Updated", target: "Notification preferences", time: "1 day ago", status: "info" },
    { action: "Workflow Completed", target: "Sales Report #9876", time: "2 days ago", status: "success" }
  ]

  const achievements = [
    { title: "Workflow Master", description: "Completed 1000+ workflows", icon: Workflow, earned: true },
    { title: "Efficiency Expert", description: "Maintained 95%+ success rate", icon: TrendingUp, earned: true },
    { title: "Data Guardian", description: "Processed 1TB+ of data", icon: Database, earned: false },
    { title: "Team Player", description: "Collaborated on 50+ projects", icon: Users, earned: true },
    { title: "Innovation Leader", description: "Created 25+ custom workflows", icon: Award, earned: false },
    { title: "Global Contributor", description: "Active in 10+ regions", icon: Globe, earned: false }
  ]

  const permissions = [
    { name: "Workflow Management", level: "Full Access", icon: Workflow },
    { name: "Data Processing", level: "Full Access", icon: Database },
    { name: "System Administration", level: "Limited Access", icon: Settings },
    { name: "User Management", level: "View Only", icon: Users },
    { name: "Analytics & Reports", level: "Full Access", icon: BarChart3 },
    { name: "API Access", level: "Full Access", icon: Globe }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default: return <Activity className="h-4 w-4 text-blue-500" />
    }
  }

  const getPermissionColor = (level: string) => {
    switch (level) {
      case 'Full Access': return 'bg-green-100 text-green-800'
      case 'Limited Access': return 'bg-yellow-100 text-yellow-800'
      case 'View Only': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
              <p className="text-gray-600 mt-1">View and manage your profile information</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/profile/edit')}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button variant="outline" onClick={() => router.push('/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info Card */}
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={userData.avatar} alt={userData.name} />
                    <AvatarFallback className="text-2xl font-semibold">
                      {userData.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-xl">{userData.name}</CardTitle>
                <CardDescription className="text-base">{userData.role}</CardDescription>
                <Badge variant="outline" className="w-fit mx-auto mt-2">
                  <Activity className="h-3 w-3 mr-1" />
                  {userData.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{userData.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{userData.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{userData.location}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{userData.timezone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">Joined {userData.joinDate}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{userData.department}</span>
                  </div>
                </div>
                <Separator />
                <div className="text-center">
                  <p className="text-sm text-gray-600">Last Login</p>
                  <p className="text-sm font-medium">{userData.lastLogin}</p>
                </div>
              </CardContent>
            </Card>

            {/* Performance Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalWorkflows}</div>
                    <div className="text-xs text-gray-500">Total Workflows</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.successfulRuns}</div>
                    <div className="text-xs text-gray-500">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.failedRuns}</div>
                    <div className="text-xs text-gray-500">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.avgProcessingTime}</div>
                    <div className="text-xs text-gray-500">Avg Time</div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Success Rate</span>
                    <span className="font-medium">{((stats.successfulRuns / stats.totalWorkflows) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(stats.successfulRuns / stats.totalWorkflows) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>System Uptime</span>
                    <span className="font-medium">{stats.uptime}%</span>
                  </div>
                  <Progress value={stats.uptime} className="h-2" />
                </div>
                <div className="text-center pt-2">
                  <p className="text-sm text-gray-600">Data Processed</p>
                  <p className="text-lg font-semibold text-indigo-600">{stats.dataProcessed}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity & Achievements */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your latest actions and workflow activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="mt-0.5">
                        {getStatusIcon(activity.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{activity.action}</span>
                          <span className="text-xs text-gray-500">{activity.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{activity.target}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-4">
                  <Button variant="outline" size="sm">View All Activity</Button>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Achievements
                </CardTitle>
                <CardDescription>Your accomplishments and milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement, index) => {
                    const Icon = achievement.icon
                    return (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          achievement.earned
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-gray-50 border-gray-200 text-gray-500'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${
                            achievement.earned ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">{achievement.title}</h4>
                              {achievement.earned && <Star className="h-4 w-4 text-yellow-500" />}
                            </div>
                            <p className="text-xs mt-1">{achievement.description}</p>
                            {achievement.earned && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                Earned
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Permissions & Access */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Permissions & Access
                </CardTitle>
                <CardDescription>Your current access levels and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {permissions.map((permission, index) => {
                    const Icon = permission.icon
                    return (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-gray-500" />
                          <span className="font-medium text-sm">{permission.name}</span>
                        </div>
                        <Badge className={`text-xs ${getPermissionColor(permission.level)}`}>
                          {permission.level}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Security Note</p>
                      <p className="text-xs text-blue-600 mt-1">
                        To request additional permissions, contact your system administrator or team lead.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
