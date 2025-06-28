import { NextResponse } from 'next/server'
import simpleGit from 'simple-git'
import fs from 'fs/promises'
import path from 'path'

interface OpenEHRRecord {
  id: string
  type: string
  title: string
  date: string
  data: any
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

function determineRecordType(filename: string, data: any): string {
  if (filename.includes('bloodcount')) return 'lab-result'
  if (filename.includes('diagnosis')) return 'diagnosis'  
  if (filename.includes('medication')) return 'medication'
  
  // Fallback to analyzing OpenEHR content
  const content = data.content?.[0]
  if (content?.archetype_node_id?.includes('OBSERVATION')) return 'lab-result'
  if (content?.archetype_node_id?.includes('EVALUATION')) return 'diagnosis'
  if (content?.archetype_node_id?.includes('INSTRUCTION')) return 'medication'
  
  return 'unknown'
}

function extractDate(data: any): string {
  // Try various OpenEHR date fields
  if (data.context?.start_time?.value) return data.context.start_time.value
  if (data.content?.[0]?.data?.events?.[0]?.time?.value) return data.content[0].data.events[0].time.value
  
  return new Date().toISOString()
}