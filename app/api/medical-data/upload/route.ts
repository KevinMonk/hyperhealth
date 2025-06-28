import { NextRequest, NextResponse } from 'next/server'
import { AIProcessor } from '@/lib/hyperhealth/ai-processor'

export async function POST(request: NextRequest) {
  try {
    // Check for required environment variables
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Gemini API key not configured. Please set GEMINI_API_KEY environment variable.' 
        },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/avi', 'video/mov']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Unsupported file type: ${file.type}. Supported types: ${allowedTypes.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { 
          success: false, 
          error: `File too large. Maximum size is ${maxSize / 1024 / 1024}MB` 
        },
        { status: 400 }
      )
    }

    console.log(`📤 Processing uploaded file: ${file.name} (${file.type}, ${file.size} bytes)`)

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Process with AI
    const aiProcessor = new AIProcessor()
    const extractedRecords = await aiProcessor.processFile(buffer, file.type, file.name)

    console.log(`✅ Extracted ${extractedRecords.length} medical records from ${file.name}`)

    return NextResponse.json({
      success: true,
      data: {
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        extractedRecords: extractedRecords,
        summary: {
          totalRecords: extractedRecords.length,
          recordTypes: [...new Set(extractedRecords.map(r => r.type))],
          averageConfidence: extractedRecords.length > 0 
            ? extractedRecords.reduce((sum, r) => sum + r.confidence, 0) / extractedRecords.length 
            : 0,
          processedAt: new Date().toISOString()
        }
      }
    })

  } catch (error: unknown) {
    console.error('Medical data upload processing error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process medical data',
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}