"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Clock, 
  Camera, 
  ArrowLeft, 
  User, 
  FileText,
  Activity,
  Calendar
} from "lucide-react"
import Link from "next/link"
import { HealthRecordsTimeline } from "../../../components/HealthRecordsTimeline"
import { MedicalDataCapture } from "../../../components/MedicalDataCapture"

interface Doctor {
  id: string
  name: string
  email: string
  role: string
  verified: boolean
}

interface PatientDashboardProps {
  patientId: string
  doctor: Doctor
}

export function PatientDashboard({ patientId, doctor }: PatientDashboardProps) {
  const [activeTab, setActiveTab] = useState("timeline")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/patients">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Patients
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Patient Records</h1>
            <p className="text-muted-foreground mt-1">
              Managing health records for patient {patientId.substring(0, 8)}...
            </p>
          </div>
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patient ID</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono text-muted-foreground">
              {patientId}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viewing As</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge variant={doctor.role === "admin" ? "destructive" : "default"}>
                {doctor.role === "admin" ? "Admin" : "Doctor"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {doctor.name}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Fetching...
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Health Timeline
          </TabsTrigger>
          <TabsTrigger value="capture" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Add Records
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient Health Timeline</CardTitle>
              <CardDescription>
                Complete medical history and health records for this patient
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HealthRecordsTimeline 
                userId={patientId} 
                userRole="doctor"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Medical Records</CardTitle>
              <CardDescription>
                Upload documents or enter medical data for this patient
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MedicalDataCapture 
                userId={patientId}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}