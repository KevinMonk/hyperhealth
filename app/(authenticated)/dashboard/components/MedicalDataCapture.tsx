"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  FileText, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Camera,
  FileImage,
  MessageSquare,
  GitCommit
} from "lucide-react"

interface ExtractedRecord {
  type: 'lab_result' | 'diagnosis' | 'medication' | 'vital_signs' | 'clinical_note'
  title: string
  description: string
  confidence: number
  data: any
}

interface MedicalDataCaptureProps {
  userId: string
}

export function MedicalDataCapture({ userId }: MedicalDataCaptureProps) {
  const [activeTab, setActiveTab] = useState("upload")
  const [file, setFile] = useState<File | null>(null)
  const [textInput, setTextInput] = useState("")
  const [processing, setProcessing] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [extractedRecords, setExtractedRecords] = useState<ExtractedRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB")
        return
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/avi', 'video/mov']
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("File type not supported. Please upload JPEG, PNG, GIF, WebP, MP4, AVI, or MOV files.")
        return
      }
      
      setFile(selectedFile)
      setError(null)
    }
  }

  const processFile = async () => {
    if (!file) return
    
    setProcessing(true)
    setError(null)
    setExtractedRecords([])
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId)
      
      const response = await fetch('/api/medical-data/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Failed to process file')
      }
      
      const data = await response.json()
      const records = data.data?.extractedRecords || []
      setExtractedRecords(records)
      
      if (records.length === 0) {
        setError("No medical data could be extracted from this file")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file')
    } finally {
      setProcessing(false)
    }
  }

  const processText = async () => {
    if (!textInput.trim()) return
    
    if (textInput.length < 10) {
      setError("Please enter at least 10 characters")
      return
    }
    
    if (textInput.length > 50000) {
      setError("Text input is too long (max 50,000 characters)")
      return
    }
    
    setProcessing(true)
    setError(null)
    setExtractedRecords([])
    
    try {
      const response = await fetch('/api/medical-data/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: textInput,
          userId: userId
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to process text')
      }
      
      const data = await response.json()
      const records = data.data?.extractedRecords || []
      setExtractedRecords(records)
      
      if (records.length === 0) {
        setError("No medical data could be extracted from this text")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process text')
    } finally {
      setProcessing(false)
    }
  }

  const commitRecords = async () => {
    if (extractedRecords.length === 0) return
    
    setCommitting(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await fetch('/api/medical-data/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          extractedRecords: extractedRecords,
          userId: userId
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to commit records')
      }
      
      const data = await response.json()
      setSuccess(`Successfully committed ${extractedRecords.length} record(s) to repository`)
      setExtractedRecords([])
      setFile(null)
      setTextInput("")
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement
      if (fileInput) {
        fileInput.value = ''
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to commit records')
    } finally {
      setCommitting(false)
    }
  }

  const getRecordIcon = (type: string) => {
    switch (type) {
      case 'lab_result': return '🔬'
      case 'diagnosis': return '🏥'
      case 'medication': return '💊'
      case 'vital_signs': return '📊'
      case 'clinical_note': return '📝'
      default: return '📋'
    }
  }

  const getRecordColor = (type: string) => {
    switch (type) {
      case 'lab_result': return 'bg-blue-100 text-blue-800'
      case 'diagnosis': return 'bg-red-100 text-red-800'
      case 'medication': return 'bg-green-100 text-green-800'
      case 'vital_signs': return 'bg-purple-100 text-purple-800'
      case 'clinical_note': return 'bg-gray-100 text-gray-800'
      default: return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Input Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Enter Text
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="h-5 w-5" />
                Upload Medical Document
              </CardTitle>
              <CardDescription>
                Upload medical images, documents, or videos for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Select File</Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  disabled={processing}
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPEG, PNG, GIF, WebP, MP4, AVI, MOV (max 10MB)
                </p>
              </div>

              {file && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileImage className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={processFile} 
                disabled={!file || processing}
                className="w-full"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Process File
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Enter Medical Text
              </CardTitle>
              <CardDescription>
                Enter medical notes, lab results, or any health-related text
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-input">Medical Text</Label>
                <Textarea
                  id="text-input"
                  placeholder="Enter medical notes, lab results, symptoms, medications, or any health-related information..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={processing}
                  rows={8}
                />
                <p className="text-xs text-muted-foreground">
                  {textInput.length}/50,000 characters (minimum 10 characters)
                </p>
              </div>

              <Button 
                onClick={processText} 
                disabled={textInput.length < 10 || processing}
                className="w-full"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Process Text
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Processing Status */}
      {processing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analyzing medical data with AI...</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Extracted Records */}
      {extractedRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Extracted Medical Records
            </CardTitle>
            <CardDescription>
              Review the extracted data and commit to your health records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {extractedRecords.map((record, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getRecordIcon(record.type)}</span>
                      <Badge className={getRecordColor(record.type)}>
                        {record.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <Badge variant="outline">
                      {Math.round(record.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium">{record.title}</h4>
                    <p className="text-sm text-muted-foreground">{record.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button 
              onClick={commitRecords}
              disabled={committing}
              className="w-full"
            >
              {committing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Committing to Repository...
                </>
              ) : (
                <>
                  <GitCommit className="mr-2 h-4 w-4" />
                  Commit {extractedRecords.length} Record(s) to Repository
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}