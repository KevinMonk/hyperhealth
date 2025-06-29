"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  ArrowLeft,
  FileText, 
  TestTube, 
  Heart, 
  Pill, 
  Stethoscope,
  Calendar,
  GitBranch,
  User,
  Activity,
  Clock,
  Shield,
  Info
} from "lucide-react"
import { format } from "date-fns"
import { useUser } from "@clerk/nextjs"

interface HealthRecord {
  id: string
  type: 'lab_result' | 'diagnosis' | 'medication' | 'vital_signs' | 'clinical_note'
  title: string
  description: string
  date: string
  confidence?: number
  patientId?: string
  commit?: {
    hash: string
    author: string
    date: string
    message: string
  }
  details?: Record<string, unknown>
  rawData?: Record<string, unknown>
}

interface HealthRecordDetailsProps {
  recordId: string
}

const getRecordIcon = (type: string) => {
  switch (type) {
    case 'lab_result': return TestTube
    case 'diagnosis': return Heart
    case 'medication': return Pill
    case 'vital_signs': return Activity
    case 'clinical_note': return FileText
    default: return Stethoscope
  }
}

const getRecordColor = (type: string) => {
  switch (type) {
    case 'lab_result': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'diagnosis': return 'bg-red-100 text-red-800 border-red-200'
    case 'medication': return 'bg-green-100 text-green-800 border-green-200'
    case 'vital_signs': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'clinical_note': return 'bg-gray-100 text-gray-800 border-gray-200'
    default: return 'bg-blue-100 text-blue-800 border-blue-200'
  }
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.9) return 'bg-green-100 text-green-800 border-green-200'
  if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

export function HealthRecordDetails({ recordId }: HealthRecordDetailsProps) {
  const [record, setRecord] = useState<HealthRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useUser()

  useEffect(() => {
    const fetchRecordDetails = async () => {
      if (!user?.id) return
      
      setLoading(true)
      setError(null)
      
      try {
        const response = await fetch(`/api/health-records/${recordId}?userId=${user.id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Health record not found")
          } else {
            setError("Failed to fetch health record details")
          }
          return
        }
        
        const data = await response.json()
        setRecord(data.record)
      } catch (err) {
        console.error('Failed to fetch record details:', err)
        setError("Failed to load health record")
      } finally {
        setLoading(false)
      }
    }

    fetchRecordDetails()
  }, [recordId, user?.id])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
        <div className="h-32 bg-muted rounded animate-pulse" />
      </div>
    )
  }

  if (error || !record) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Info className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Record Not Found</h3>
            <p className="text-muted-foreground text-center">
              {error || "The requested health record could not be found."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const IconComponent = getRecordIcon(record.type)
  const colorClass = getRecordColor(record.type)

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Timeline
      </Button>

      {/* Main Record Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${colorClass} border`}>
              <IconComponent className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{record.title}</CardTitle>
                <div className="flex items-center gap-2">
                  {record.confidence && (
                    <Badge 
                      variant="outline" 
                      className={getConfidenceColor(record.confidence)}
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {Math.round(record.confidence * 100)}% confidence
                    </Badge>
                  )}
                  <Badge variant="outline" className="capitalize">
                    {record.type.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-base">
                {record.description}
              </CardDescription>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(record.date), 'MMMM d, yyyy')}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(record.date), 'h:mm a')}
                </div>
                {record.patientId && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Patient: {record.patientId.substring(0, 8)}...
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Git Information */}
      {record.commit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Version Control Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commit Hash</p>
                <p className="font-mono text-sm">{record.commit.hash}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Author</p>
                <p className="text-sm">{record.commit.author}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commit Date</p>
                <p className="text-sm">{format(new Date(record.commit.date), 'PPpp')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Message</p>
                <p className="text-sm">{record.commit.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Information */}
      {record.details && Object.keys(record.details).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detailed Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {Object.entries(record.details).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-sm font-medium text-muted-foreground capitalize">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm mt-1">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    </p>
                    <Separator className="mt-2" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Raw Data (for debugging/technical users) */}
      {record.rawData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Raw Data</CardTitle>
            <CardDescription>
              Technical details from the OpenEHR record
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
                {JSON.stringify(record.rawData, null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}