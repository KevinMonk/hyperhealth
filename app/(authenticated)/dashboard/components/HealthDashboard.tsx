"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, FileText, Camera, Activity, Shield, CheckCircle } from "lucide-react"
import { HealthRecordsTimeline } from "./HealthRecordsTimeline"
import { MedicalDataCapture } from "./MedicalDataCapture"
import { PatientsList } from "./PatientsList"
import { DoctorVerificationForm } from "./DoctorVerificationForm"

interface User {
  id: string
  name: string
  email: string
  avatar: string
  role: string
  verified: boolean
  verificationStatus: string
}

interface HealthDashboardProps {
  user: User
}

export function HealthDashboard({ user }: HealthDashboardProps) {
  const [activeTab, setActiveTab] = useState("timeline")
  const isDoctor = user.role === "doctor"
  const isAdmin = user.role === "admin"
  const isVerified = user.verified
  const needsVerification = user.role === "patient" && user.verificationStatus === "pending"

  // Main dashboard now has 3 tabs (timeline, capture, verification) - patients moved to sidebar
  const tabCount = 3

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Role</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Badge variant={isAdmin ? "destructive" : isDoctor ? "default" : "secondary"}>
              {isAdmin ? "Admin" : isDoctor ? "Doctor" : "Patient"}
            </Badge>
            {((isDoctor && isVerified) || isAdmin) && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={
              isVerified ? "default" : 
              user.verificationStatus === "pending" ? "secondary" : "outline"
            }>
              {isVerified ? "Verified" : 
               user.verificationStatus === "pending" ? "Pending" : "Unverified"}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile ID</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono text-muted-foreground">
              {user.id.substring(0, 8)}...
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Access Level</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {isAdmin ? "Admin Access" :
               isDoctor && isVerified ? "Full Access" : 
               isDoctor && !isVerified ? "Limited Access" : "Personal Records"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Health Timeline
          </TabsTrigger>
          <TabsTrigger value="capture" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Capture Data
          </TabsTrigger>
          <TabsTrigger value="verification" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            {isAdmin ? "Admin Panel" : isDoctor ? "Verification" : "Become Doctor"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Records Timeline</CardTitle>
              <CardDescription>
                {isDoctor 
                  ? "Your medical records and patient data" 
                  : "Your personal health records from the distributed EHR system"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HealthRecordsTimeline userId={user.id} userRole={user.role} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Capture Medical Data</CardTitle>
              <CardDescription>
                Upload medical documents or enter text to extract structured health records using AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MedicalDataCapture userId={user.id} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verification" className="space-y-4">
          {isAdmin ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Panel</CardTitle>
                  <CardDescription>
                    Manage users and system settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Visit the dedicated admin panel for full management capabilities
                    </p>
                    <Button asChild>
                      <a href="/dashboard/admin">Open Admin Panel</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <DoctorVerificationForm 
              user={{
                email: user.email,
                verified: user.verified,
                verificationStatus: user.verificationStatus
              }}
              onVerificationSubmitted={() => {
                // Optionally refresh the page or update state
                window.location.reload()
              }}
            />
          )}
        </TabsContent>

      </Tabs>
    </div>
  )
}