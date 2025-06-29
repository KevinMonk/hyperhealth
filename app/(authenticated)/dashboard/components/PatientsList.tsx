"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Search, 
  Users, 
  FileText, 
  Calendar,
  User,
  Activity,
  RefreshCw,
  Mail
} from "lucide-react"

interface PatientRecord {
  patientId: string
  recordCount: number
  lastActivity: string
  recordTypes: string[]
}

interface UserProfile {
  id: string
  name: string
  email: string
  avatar: string
  firstName: string
  lastName: string
}

interface PatientWithProfile extends PatientRecord {
  profile?: UserProfile
}

export function PatientsList() {
  const [patients, setPatients] = useState<PatientWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchPatients = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/health-records?role=doctor&getAllPatients=true')
      if (response.ok) {
        const data = await response.json()
        
        // Group records by patient ID
        const patientGroups = data.records.reduce((groups: Record<string, any[]>, record: any) => {
          const patientId = record.patientId || 'unknown'
          if (!groups[patientId]) {
            groups[patientId] = []
          }
          groups[patientId].push(record)
          return groups
        }, {})

        // Convert to patient records
        const patientRecords: PatientRecord[] = Object.entries(patientGroups).map(([patientId, records]) => {
          const recordTypes = [...new Set(records.map(r => r.type))]
          const lastActivity = records.reduce((latest, record) => {
            return new Date(record.date) > new Date(latest) ? record.date : latest
          }, records[0]?.date || new Date().toISOString())

          return {
            patientId,
            recordCount: records.length,
            lastActivity,
            recordTypes
          }
        })

        // Sort by last activity (most recent first)
        patientRecords.sort((a, b) => 
          new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
        )

        // Fetch user profiles for all patients
        const userIds = patientRecords.map(p => p.patientId).filter(id => id !== 'unknown')
        
        if (userIds.length > 0) {
          const profilesResponse = await fetch('/api/users/profiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds })
          })
          
          if (profilesResponse.ok) {
            const profilesData = await profilesResponse.json()
            const profilesMap = new Map(profilesData.profiles.map((p: UserProfile) => [p.id, p]))
            
            // Combine patient records with profiles
            const patientsWithProfiles: PatientWithProfile[] = patientRecords.map(patient => ({
              ...patient,
              profile: profilesMap.get(patient.patientId)
            }))
            
            setPatients(patientsWithProfiles)
          } else {
            setPatients(patientRecords.map(p => ({ ...p, profile: undefined })))
          }
        } else {
          setPatients(patientRecords.map(p => ({ ...p, profile: undefined })))
        }
      }
    } catch (error) {
      console.error('Failed to fetch patients:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const filteredPatients = patients.filter(patient =>
    patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.profile?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.profile?.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'lab_result': return 'bg-blue-100 text-blue-800'
      case 'diagnosis': return 'bg-red-100 text-red-800'
      case 'medication': return 'bg-green-100 text-green-800'
      case 'vital_signs': return 'bg-purple-100 text-purple-800'
      case 'clinical_note': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with search and stats */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5" />
            Patient Records
          </h3>
          <p className="text-sm text-muted-foreground">
            {patients.length} patients with health records
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchPatients}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search by name, email, or patient ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Patients List */}
      {filteredPatients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'No patients found' : 'No patient records'}
            </h3>
            <p className="text-muted-foreground text-center">
              {searchTerm 
                ? `No patients match "${searchTerm}"`
                : "No patient health records are available in the system yet."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {filteredPatients.map((patient) => (
              <Card 
                key={patient.patientId} 
                className="cursor-pointer transition-colors hover:border-muted-foreground/20"
                onClick={() => window.location.href = `/dashboard/patients/${patient.patientId}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={patient.profile?.avatar} 
                          alt={patient.profile?.name || 'Patient'} 
                        />
                        <AvatarFallback>
                          {patient.profile?.name ? 
                            patient.profile.name.split(' ').map(n => n[0]).join('').toUpperCase() :
                            'P'
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">
                          {patient.profile?.name || `Patient ${patient.patientId.substring(0, 8)}...`}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {patient.profile?.email || 'No email available'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {patient.recordCount} records
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Last activity: {new Date(patient.lastActivity).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Activity className="h-3 w-3" />
                      {patient.recordTypes.length} record types
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Record Types */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Record Types:</p>
                    <div className="flex flex-wrap gap-2">
                      {patient.recordTypes.map((type) => (
                        <Badge 
                          key={type} 
                          variant="outline" 
                          className={`text-xs ${getRecordTypeColor(type)}`}
                        >
                          {type.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Patient ID */}
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Patient ID:</span>
                        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {patient.patientId}
                        </code>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        Click to view records
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}