/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { AIProcessor } from '@/lib/hyperhealth/ai-processor'
import { DataMapper } from '@/lib/hyperhealth/data-mapper'
import { currentUser } from '@clerk/nextjs/server'

interface ProcessedRecord {
  type: string
  category: string
  confidence: number
  openEHR: Record<string, any>
  extractedData: any
  sourceText: string
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await currentUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check for required environment variables
    if (!process.env.GITHUB_TOKEN) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'GitHub token not configured. Please set GITHUB_TOKEN environment variable.' 
        },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { extractedRecords, commitMessage } = body
    
    if (!extractedRecords || !Array.isArray(extractedRecords)) {
      return NextResponse.json(
        { success: false, error: 'No extracted records provided' },
        { status: 400 }
      )
    }

    if (extractedRecords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No records to commit' },
        { status: 400 }
      )
    }

    console.log(`📤 Processing ${extractedRecords.length} records for commit by user ${user.id}`)

    // Map extracted records to OpenEHR format
    const dataMapper = new DataMapper()
    const mappedRecords = await dataMapper.mapToOpenEHR(extractedRecords)

    if (mappedRecords.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No records could be mapped to OpenEHR format' },
        { status: 400 }
      )
    }

    // Commit to GitHub
    const commitResults = await commitToGitHub(mappedRecords, user.id, commitMessage)

    console.log(`✅ Successfully committed ${commitResults.filesCreated} files to GitHub`)

    return NextResponse.json({
      success: true,
      data: {
        recordsProcessed: extractedRecords.length,
        recordsMapped: mappedRecords.length,
        filesCreated: commitResults.filesCreated,
        repository: commitResults.repository,
        commitDetails: commitResults.files,
        summary: {
          byType: groupBy(mappedRecords, 'type'),
          byCategory: groupBy(mappedRecords, 'category'),
          averageConfidence: calculateAverageConfidence(mappedRecords),
          processedAt: new Date().toISOString()
        }
      }
    })

  } catch (error: any) {
    console.error('Medical data commit error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to commit medical data',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

async function commitToGitHub(records: ProcessedRecord[], userId: string, customMessage?: string) {
  const owner = 'tijno' // This should be dynamic based on user in production
  const repo = 'hhdata'
  
  const headers = {
    'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'HyperHealth-App'
  }

  const filesCreated = []
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
  const timeComponent = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('-')[0]

  for (let i = 0; i < records.length; i++) {
    const record = records[i]
    
    // Generate filename with timestamp and type
    const filename = `${record.type}_${timestamp}_${timeComponent}_${i}.json`
    const filePath = `${userId}/${filename}`
    
    // Create comprehensive commit message
    const commitMessage = customMessage || generateCommitMessage(record, userId)
    
    // Prepare file content with metadata
    const fileContent = {
      metadata: {
        created_at: new Date().toISOString(),
        source: 'hyperhealth-nextjs',
        version: '1.0.0',
        record_type: record.type,
        category: record.category,
        confidence: record.confidence,
        user_id: userId
      },
      openehr_record: record.openEHR,
      extracted_data: record.extractedData,
      source_text: record.sourceText
    }

    try {
      // Check if file already exists
      let sha = null
      try {
        const existingFileResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
          headers
        })
        if (existingFileResponse.ok) {
          const existingFile = await existingFileResponse.json()
          sha = existingFile.sha
          console.log(`📝 Updating existing file: ${filename}`)
        }
      } catch (error) {
        console.log(`📄 Creating new file: ${filename}`)
      }
      
      // Commit to GitHub
      const commitData = {
        message: commitMessage,
        content: Buffer.from(JSON.stringify(fileContent, null, 2)).toString('base64'),
        branch: 'main',
        ...(sha && { sha })
      }
      
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(commitData)
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`GitHub API error: ${response.status} - ${errorData}`)
      }

      const responseData = await response.json()
      
      filesCreated.push({
        filename: filename,
        path: filePath,
        type: record.type,
        category: record.category,
        confidence: record.confidence,
        sha: responseData.content.sha,
        commit_sha: responseData.commit.sha,
        html_url: responseData.content.html_url
      })
      
      console.log(`✅ Committed: ${filename} (${record.type})`)
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error: any) {
      console.error(`❌ Failed to commit ${filename}:`, error.message)
      throw new Error(`GitHub commit failed for ${filename}: ${error.message}`)
    }
  }

  return {
    filesCreated: filesCreated.length,
    files: filesCreated,
    repository: `${owner}/${repo}`,
    timestamp: new Date().toISOString()
  }
}

function generateCommitMessage(record: ProcessedRecord, userId: string): string {
  const type = record.type.replace('_', ' ')
  const category = record.category || 'general'
  const confidence = Math.round((record.confidence || 0) * 100)
  
  let message = `Add ${type} record: ${category}`
  
  // Add specific details based on record type
  if (record.openEHR?.content?.[0]?.name?.value) {
    message += ` - ${record.openEHR.content[0].name.value}`
  }
  
  message += `\n\n`
  message += `- Type: ${record.type}\n`
  message += `- Category: ${category}\n`
  message += `- Confidence: ${confidence}%\n`
  message += `- Source: HyperHealth Next.js App\n`
  message += `- User: ${userId}\n`
  message += `- Timestamp: ${new Date().toISOString()}\n`
  
  return message
}

function groupBy<T>(array: T[], key: keyof T): Record<string, number> {
  return array.reduce((groups, item) => {
    const group = String(item[key]) || 'unknown'
    groups[group] = (groups[group] || 0) + 1
    return groups
  }, {} as Record<string, number>)
}

function calculateAverageConfidence(records: ProcessedRecord[]): number {
  if (records.length === 0) return 0
  const total = records.reduce((sum, record) => sum + (record.confidence || 0), 0)
  return Math.round((total / records.length) * 100) / 100
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