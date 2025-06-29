"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  RefreshCw, 
  FileText, 
  TestTube, 
  Heart, 
  Pill, 
  Stethoscope,
  Calendar,
  GitBranch,
  User,
  Activity
} from "lucide-react"
import { format } from "date-fns"

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
}

interface HealthRecordsTimelineProps {
  userId: string
  userRole: string
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

export function HealthRecordsTimeline({ userId, userRole }: HealthRecordsTimelineProps) {
  const [records, setRecords] = useState<HealthRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState<Date | null>(null)

  const fetchRecords = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/health-records?userId=${userId}&role=${userRole}`)
      if (response.ok) {
        const data = await response.json()
        
        // Handle case where repository doesn't exist yet
        if (!data.records || data.records.length === 0) {
          setRecords([])
          setLastSync(new Date())
          return
        }
        
        // Filter records by userId for patients, show all for doctors
        const filteredRecords = userRole === 'doctor' ? data.records : 
          data.records.filter((record: HealthRecord) => 
            record.patientId === userId || !record.patientId
          )
        
        // Sort records by date (newest first)
        const sortedRecords = filteredRecords.sort((a: HealthRecord, b: HealthRecord) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        )
        
        setRecords(sortedRecords)
        setLastSync(new Date())
      } else {
        console.error('Failed to fetch health records:', response.status)
        setRecords([])
        setLastSync(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch health records:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [userId, userRole])

  const groupedRecords = records.reduce((groups, record) => {
    const date = format(new Date(record.date), 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(record)
    return groups
  }, {} as Record<string, HealthRecord[]>)

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with sync info */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {records.length} records found
          </p>
          {lastSync && (
            <p className="text-xs text-muted-foreground">
              Last synced: {format(lastSync, 'PPpp')}
            </p>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchRecords}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Sync Repository
        </Button>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No health records found</h3>
            <p className="text-muted-foreground text-center">
              {userRole === 'doctor' 
                ? "No patient records are available in the system yet."
                : "Start by capturing some medical data to build your health timeline."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-6">
            {Object.entries(groupedRecords).map(([date, dayRecords]) => (
              <div key={date} className="relative">
                {/* Date header */}
                <div className="flex items-center gap-4 mb-4">
                  <Badge variant="outline" className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(date), 'MMMM d, yyyy')}
                  </Badge>
                  <Separator className="flex-1" />
                </div>

                {/* Records for this date */}
                <div className="space-y-3 ml-4">
                  {dayRecords.map((record, index) => {
                    const IconComponent = getRecordIcon(record.type)
                    const colorClass = getRecordColor(record.type)
                    
                    return (
                      <Card key={record.id} className="relative">
                        {/* Timeline connector */}
                        {index < dayRecords.length - 1 && (
                          <div className="absolute left-6 top-16 w-px h-8 bg-border" />
                        )}
                        
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${colorClass} border`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{record.title}</CardTitle>
                                <div className="flex items-center gap-2">
                                  {record.confidence && (
                                    <Badge variant="secondary" className="text-xs">
                                      {Math.round(record.confidence * 100)}% confidence
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {record.type.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>
                              <CardDescription>
                                {record.description}
                              </CardDescription>
                              {userRole === 'doctor' && record.patientId && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <User className="h-3 w-3" />
                                  Patient ID: {record.patientId.substring(0, 8)}...
                                </div>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        
                        {record.commit && (
                          <CardContent className="pt-0">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <GitBranch className="h-3 w-3" />
                              <span>Commit {record.commit.hash.substring(0, 7)}</span>
                              <span>by {record.commit.author}</span>
                              <span>on {format(new Date(record.commit.date), 'MMM d, h:mm a')}</span>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}