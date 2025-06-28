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

    const body = await request.json()
    const { text } = body
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'No text provided or invalid text format' },
        { status: 400 }
      )
    }

    // Validate text length
    if (text.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Text too short. Minimum 10 characters required.' },
        { status: 400 }
      )
    }

    if (text.length > 50000) {
      return NextResponse.json(
        { success: false, error: 'Text too long. Maximum 50,000 characters allowed.' },
        { status: 400 }
      )
    }

    console.log(`📤 Processing text input: ${text.length} characters`)

    // Process with AI
    const aiProcessor = new AIProcessor()
    const extractedRecords = await aiProcessor.processText(text)

    console.log(`✅ Extracted ${extractedRecords.length} medical records from text input`)

    return NextResponse.json({
      success: true,
      data: {
        inputLength: text.length,
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
    console.error('Medical text processing error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process medical text',
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