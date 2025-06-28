'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, GitBranch, Calendar, User } from 'lucide-react'

interface OpenEHRRecord {
  id: string
  type: string
  title: string
  date: string
  data: Record<string, unknown>
}

interface GitInfo {
  hash: string
  message: string
  date: string
  author: string
}

interface HealthRecordsResponse {
  success: boolean
  records: OpenEHRRecord[]
  gitInfo: GitInfo
  error?: string
}

export default function HealthRecordsContainer() {
  const [data, setData] = useState<HealthRecordsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecords = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/health-records')
      const result = await response.json()
      
      if (result.success) {
        setData(result)
      } else {
        setError(result.error || 'Failed to fetch records')
      }
    } catch (err) {
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'lab-result': return 'bg-blue-100 text-blue-800'
      case 'diagnosis': return 'bg-red-100 text-red-800'
      case 'medication': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'lab-result': return '📊'
      case 'diagnosis': return '🏥'
      case 'medication': return '💊'
      default: return '📄'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2 text-lg">Fetching records from Git repository...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">Error: {error}</div>
        <Button onClick={fetchRecords} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  if (!data || !data.records.length) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg">No health records found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Git Repository Status */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-blue-800 dark:text-blue-200">
            <GitBranch className="h-5 w-5 mr-2" />
            Repository Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-blue-600" />
              <span className="font-medium">Author:</span>
              <span className="ml-1">{data.gitInfo.author}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-blue-600" />
              <span className="font-medium">Last Commit:</span>
              <span className="ml-1">{formatDate(data.gitInfo.date)}</span>
            </div>
            <div className="flex items-center">
              <span className="font-medium">Hash:</span>
              <code className="ml-1 text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                {data.gitInfo.hash?.substring(0, 8)}
              </code>
            </div>
          </div>
          <div className="mt-3">
            <span className="font-medium">Message:</span>
            <span className="ml-1 italic">{data.gitInfo.message}</span>
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button onClick={fetchRecords} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync Repository
        </Button>
      </div>

      {/* Health Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.records.map((record) => (
          <Card key={record.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <span className="text-2xl mr-2">{getRecordTypeIcon(record.type)}</span>
                  <span className="text-lg">{record.title}</span>
                </span>
                <Badge className={getRecordTypeColor(record.type)}>
                  {record.type}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  {formatDate(record.date)}
                </div>
                
                {/* Record-specific content preview */}
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <RecordPreview record={record} />
                </div>
                
                <div className="text-xs text-gray-500">
                  ID: {record.id}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function RecordPreview({ record }: { record: OpenEHRRecord }) {
  const { type, data } = record

  if (type === 'lab-result') {
    const content = data.content as unknown[]
    const items = Array.isArray(content) && content[0] ? 
      ((content[0] as Record<string, unknown>).data as Record<string, unknown>)?.events as unknown[] : []
    const eventItems = Array.isArray(items) && items[0] ? 
      (((items[0] as Record<string, unknown>).data as Record<string, unknown>)?.items as unknown[]) || [] : []
    
    return (
      <div className="space-y-2">
        {Array.isArray(eventItems) && eventItems.slice(0, 2).map((item, idx: number) => {
          const itemData = item as Record<string, unknown>
          const name = (itemData.name as Record<string, unknown>)?.value as string
          const itemsArray = itemData.items as unknown[]
          const firstItem = Array.isArray(itemsArray) && itemsArray[0] ? itemsArray[0] as Record<string, unknown> : null
          const value = firstItem?.value as Record<string, unknown>
          
          return (
            <div key={idx} className="text-sm">
              <span className="font-medium">{name}:</span>
              <span className="ml-2">
                {String(value?.magnitude || '')} {String(value?.units || '')}
              </span>
            </div>
          )
        })}
        {Array.isArray(eventItems) && eventItems.length > 2 && <div className="text-xs text-gray-500">+{eventItems.length - 2} more items</div>}
      </div>
    )
  }

  if (type === 'diagnosis') {
    const problems = (data.content as unknown[]) || []
    return (
      <div className="space-y-2">
        {Array.isArray(problems) && problems.slice(0, 2).map((problem, idx: number) => {
          const problemData = problem as Record<string, unknown>
          const dataItems = (problemData.data as Record<string, unknown>)?.items as unknown[]
          const diagnosisItem = Array.isArray(dataItems) ? 
            dataItems.find((i) => ((i as Record<string, unknown>).name as Record<string, unknown>)?.value === 'Problem/Diagnosis name') as Record<string, unknown> : null
          const statusItem = Array.isArray(dataItems) ? 
            dataItems.find((i) => ((i as Record<string, unknown>).name as Record<string, unknown>)?.value === 'Clinical status') as Record<string, unknown> : null
          
          return (
            <div key={idx} className="text-sm">
              <div className="font-medium">{String((diagnosisItem?.value as Record<string, unknown>)?.value || '')}</div>
              <div className="text-xs text-gray-600">
                Status: {String((statusItem?.value as Record<string, unknown>)?.value || 'Unknown')}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (type === 'medication') {
    const content = data.content as unknown[]
    const medication = Array.isArray(content) && content[0] ? content[0] as Record<string, unknown> : null
    const activities = medication?.activities as unknown[]
    const activity = Array.isArray(activities) && activities[0] ? activities[0] as Record<string, unknown> : null
    const description = activity?.description as Record<string, unknown>
    const items = description?.items as unknown[]
    
    const medicationItem = Array.isArray(items) ? 
      items.find((i) => ((i as Record<string, unknown>).name as Record<string, unknown>)?.value === 'Medication') as Record<string, unknown> : null
    const dosageItem = Array.isArray(items) ? 
      items.find((i) => (i as Record<string, unknown>).archetype_node_id === 'at0152') as Record<string, unknown> : null
    const dosageItems = dosageItem?.items as unknown[]
    const dosage = Array.isArray(dosageItems) ? 
      dosageItems.find((i) => ((i as Record<string, unknown>).name as Record<string, unknown>)?.value === 'Dosage') as Record<string, unknown> : null
    
    return (
      <div className="space-y-2">
        <div className="text-sm">
          <div className="font-medium">{String((medicationItem?.value as Record<string, unknown>)?.value || '')}</div>
          <div className="text-xs text-gray-600">Dosage: {String((dosage?.value as Record<string, unknown>)?.value || '')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="text-sm text-gray-600">
      OpenEHR record data available
    </div>
  )
}