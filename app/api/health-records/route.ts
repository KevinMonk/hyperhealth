import { NextResponse } from 'next/server'
import simpleGit from 'simple-git'
import fs from 'fs/promises'
import path from 'path'

interface OpenEHRRecord {
  id: string
  type: string
  title: string
  date: string
  data: Record<string, unknown>
}

export async function GET() {
  try {
    const repoPath = '/tmp/hhdata-clone'
    const git = simpleGit()

    // Clean up any existing clone
    try {
      await fs.rmdir(repoPath, { recursive: true })
    } catch (e) {
      // Directory doesn't exist, that's fine
    }

    // Clone the repository
    await git.clone('https://github.com/tijno/hhdata.git', repoPath)

    // Read the OpenEHR files
    const openehrPath = path.join(repoPath, 'openehr')
    const files = await fs.readdir(openehrPath)
    
    const records: OpenEHRRecord[] = []

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(openehrPath, file)
        const content = await fs.readFile(filePath, 'utf-8')
        const jsonData = JSON.parse(content)
        
        // Extract key information from OpenEHR format
        const record: OpenEHRRecord = {
          id: jsonData.uid || file.replace('.json', ''),
          type: determineRecordType(file, jsonData),
          title: jsonData.name?.value || file.replace('.json', ''),
          date: extractDate(jsonData),
          data: jsonData
        }
        
        records.push(record)
      }
    }

    // Get latest commit info
    const gitInfo = simpleGit(repoPath)
    const log = await gitInfo.log(['-1'])
    const latestCommit = log.latest

    return NextResponse.json({
      success: true,
      records,
      gitInfo: {
        hash: latestCommit?.hash,
        message: latestCommit?.message,
        date: latestCommit?.date,
        author: latestCommit?.author_name
      }
    })

  } catch (error) {
    console.error('Error fetching health records:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch health records',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function determineRecordType(filename: string, data: Record<string, unknown>): string {
  if (filename.includes('bloodcount')) return 'lab-result'
  if (filename.includes('diagnosis')) return 'diagnosis'  
  if (filename.includes('medication')) return 'medication'
  
  // Fallback to analyzing OpenEHR content
  const content = data.content as unknown[]
  if (Array.isArray(content) && content[0]) {
    const firstContent = content[0] as Record<string, unknown>
    const archetypeNodeId = firstContent.archetype_node_id as string
    if (typeof archetypeNodeId === 'string') {
      if (archetypeNodeId.includes('OBSERVATION')) return 'lab-result'
      if (archetypeNodeId.includes('EVALUATION')) return 'diagnosis'
      if (archetypeNodeId.includes('INSTRUCTION')) return 'medication'
    }
  }
  
  return 'unknown'
}

function extractDate(data: Record<string, unknown>): string {
  // Try various OpenEHR date fields
  const context = data.context as Record<string, unknown> | undefined
  if (context?.start_time && typeof context.start_time === 'object') {
    const startTime = context.start_time as Record<string, unknown>
    if (typeof startTime.value === 'string') return startTime.value
  }
  
  const content = data.content as unknown[]
  if (Array.isArray(content) && content[0]) {
    const firstContent = content[0] as Record<string, unknown>
    const contentData = firstContent.data as Record<string, unknown>
    if (contentData?.events && Array.isArray(contentData.events) && contentData.events[0]) {
      const firstEvent = contentData.events[0] as Record<string, unknown>
      const time = firstEvent.time as Record<string, unknown>
      if (time?.value && typeof time.value === 'string') return time.value
    }
  }
  
  return new Date().toISOString()
}