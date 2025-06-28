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
  data: any
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
    const items = data.content?.[0]?.data?.events?.[0]?.data?.items || []
    return (
      <div className="space-y-2">
        {items.slice(0, 2).map((item: any, idx: number) => (
          <div key={idx} className="text-sm">
            <span className="font-medium">{item.name?.value}:</span>
            <span className="ml-2">
              {item.items?.[0]?.value?.magnitude} {item.items?.[0]?.value?.units}
            </span>
          </div>
        ))}
        {items.length > 2 && <div className="text-xs text-gray-500">+{items.length - 2} more items</div>}
      </div>
    )
  }

  if (type === 'diagnosis') {
    const problems = data.content || []
    return (
      <div className="space-y-2">
        {problems.slice(0, 2).map((problem: any, idx: number) => (
          <div key={idx} className="text-sm">
            <div className="font-medium">{problem.data?.items?.find((i: any) => i.name?.value === 'Problem/Diagnosis name')?.value?.value}</div>
            <div className="text-xs text-gray-600">
              Status: {problem.data?.items?.find((i: any) => i.name?.value === 'Clinical status')?.value?.value || 'Unknown'}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === 'medication') {
    const medication = data.content?.[0]
    const medicationName = medication?.activities?.[0]?.description?.items?.find((i: any) => i.name?.value === 'Medication')?.value?.value
    const dosage = medication?.activities?.[0]?.description?.items?.find((i: any) => i.archetype_node_id === 'at0152')?.items?.find((i: any) => i.name?.value === 'Dosage')?.value?.value
    
    return (
      <div className="space-y-2">
        <div className="text-sm">
          <div className="font-medium">{medicationName}</div>
          <div className="text-xs text-gray-600">Dosage: {dosage}</div>
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