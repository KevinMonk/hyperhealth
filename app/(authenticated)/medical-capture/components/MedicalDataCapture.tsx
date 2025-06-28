/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Camera, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface ExtractedRecord {
  type: string
  category: string
  data: {
    name: string
    value: string
    units?: string
    date?: string
    status?: string
    reference_range?: string
    interpretation?: string
    notes?: string
  }
  confidence: number
  source_text: string
}

interface ProcessingResult {
  success: boolean
  data?: {
    extractedRecords: ExtractedRecord[]
    summary: {
      totalRecords: number
      recordTypes: string[]
      averageConfidence: number
      processedAt: string
    }
  }
  error?: string
}

export default function MedicalDataCapture() {
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [textInput, setTextInput] = useState('')
  const [isCommitting, setIsCommitting] = useState(false)
  const [commitResult, setCommitResult] = useState<any>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setProcessingResult(null)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setProcessingResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch('/api/medical-data/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      setProcessingResult(result)
    } catch (error) {
      setProcessingResult({
        success: false,
        error: 'Failed to upload and process file'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleTextProcess = async () => {
    if (!textInput.trim()) return

    setIsProcessing(true)
    setProcessingResult(null)

    try {
      const response = await fetch('/api/medical-data/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: textInput })
      })

      const result = await response.json()
      setProcessingResult(result)
    } catch (error) {
      setProcessingResult({
        success: false,
        error: 'Failed to process text'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCommitToGit = async () => {
    if (!processingResult?.data?.extractedRecords) return

    setIsCommitting(true)
    setCommitResult(null)

    try {
      const response = await fetch('/api/medical-data/commit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          extractedRecords: processingResult.data.extractedRecords,
          commitMessage: `Add medical records extracted from ${activeTab === 'upload' ? selectedFile?.name : 'text input'}`
        })
      })

      const result = await response.json()
      setCommitResult(result)
    } catch (error) {
      setCommitResult({
        success: false,
        error: 'Failed to commit to repository'
      })
    } finally {
      setIsCommitting(false)
    }
  }

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'lab_result': return 'bg-blue-100 text-blue-800'
      case 'diagnosis': return 'bg-red-100 text-red-800'
      case 'medication': return 'bg-green-100 text-green-800'
      case 'vital_signs': return 'bg-purple-100 text-purple-800'
      case 'clinical_note': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'lab_result': return '🔬'
      case 'diagnosis': return '🏥'
      case 'medication': return '💊'
      case 'vital_signs': return '📊'
      case 'clinical_note': return '📝'
      default: return '📄'
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Selection */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === 'upload' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('upload')}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload File
        </Button>
        <Button
          variant={activeTab === 'text' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('text')}
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Enter Text
        </Button>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Upload Medical Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  Drop medical documents here or click to upload
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Supports: JPEG, PNG, GIF, WebP, MP4, AVI, MOV (max 10MB)
                </p>
              </label>
            </div>

            {selectedFile && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="font-medium">Selected file:</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              </div>
            )}

            <Button 
              onClick={handleFileUpload} 
              disabled={!selectedFile || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing with AI...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Extract Medical Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Text Tab */}
      {activeTab === 'text' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Enter Medical Text
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter medical text here (lab results, clinical notes, prescriptions, etc.)"
              className="w-full h-40 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none"
              maxLength={50000}
            />
            <div className="flex justify-between text-sm text-gray-500">
              <span>Minimum 10 characters</span>
              <span>{textInput.length}/50,000 characters</span>
            </div>

            <Button 
              onClick={handleTextProcess} 
              disabled={textInput.length < 10 || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing with AI...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Extract Medical Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Processing Results */}
      {processingResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {processingResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Processing Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {processingResult.success && processingResult.data ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                  <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Extraction Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-green-600 dark:text-green-400">Records Found:</span>
                      <div className="font-medium">{processingResult.data.summary.totalRecords}</div>
                    </div>
                    <div>
                      <span className="text-green-600 dark:text-green-400">Types:</span>
                      <div className="font-medium">{processingResult.data.summary.recordTypes.join(', ')}</div>
                    </div>
                    <div>
                      <span className="text-green-600 dark:text-green-400">Avg Confidence:</span>
                      <div className="font-medium">{(processingResult.data.summary.averageConfidence * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <span className="text-green-600 dark:text-green-400">Processed:</span>
                      <div className="font-medium">{new Date(processingResult.data.summary.processedAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                </div>

                {/* Extracted Records */}
                <div className="space-y-4">
                  <h3 className="font-medium">Extracted Medical Records</h3>
                  {processingResult.data.extractedRecords.map((record, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{getRecordTypeIcon(record.type)}</span>
                            <h4 className="font-medium">{record.data.name}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getRecordTypeColor(record.type)}>
                              {record.type.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline">
                              {(record.confidence * 100).toFixed(1)}% confidence
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {record.data.value && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Value:</span>
                              <div className="font-medium">{record.data.value} {record.data.units}</div>
                            </div>
                          )}
                          {record.data.date && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Date:</span>
                              <div className="font-medium">{record.data.date}</div>
                            </div>
                          )}
                          {record.data.status && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Status:</span>
                              <div className="font-medium">{record.data.status}</div>
                            </div>
                          )}
                          {record.data.reference_range && (
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Reference Range:</span>
                              <div className="font-medium">{record.data.reference_range}</div>
                            </div>
                          )}
                        </div>

                        {record.data.notes && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                            <span className="text-gray-600 dark:text-gray-400 text-sm">Notes:</span>
                            <div className="text-sm mt-1">{record.data.notes}</div>
                          </div>
                        )}

                        {record.source_text && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded">
                            <span className="text-blue-600 dark:text-blue-400 text-sm">Source Text:</span>
                            <div className="text-sm mt-1 italic">"{record.source_text}"</div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Commit Button */}
                <div className="border-t pt-6">
                  <Button 
                    onClick={handleCommitToGit}
                    disabled={isCommitting}
                    className="w-full"
                    size="lg"
                  >
                    {isCommitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Committing to Repository...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Save to EHR Repository
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-red-600 dark:text-red-400">
                <p className="font-medium">Error:</p>
                <p>{processingResult.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Commit Results */}
      {commitResult && (
        <Card className={commitResult.success ? 'border-green-500' : 'border-red-500'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {commitResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Repository Commit Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {commitResult.success ? (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    ✅ Successfully committed {commitResult.data.filesCreated} files to repository
                  </p>
                  <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                    Repository: {commitResult.data.repository}
                  </p>
                </div>
                
                <div className="text-sm">
                  <p className="font-medium mb-2">Committed Files:</p>
                  <ul className="space-y-1">
                    {commitResult.data.commitDetails?.map((file: any, index: number) => (
                      <li key={index} className="flex items-center justify-between">
                        <span>{file.filename}</span>
                        <Badge className={getRecordTypeColor(file.type)}>
                          {file.type}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    onClick={() => window.open('/health-records', '_blank')}
                    variant="outline"
                    className="w-full"
                  >
                    View in Health Records →
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-red-600 dark:text-red-400">
                <p className="font-medium">Error:</p>
                <p>{commitResult.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}