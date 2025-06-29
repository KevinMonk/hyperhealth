import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

interface OpenEHRRecord {
  id: string
  type: string
  title: string
  date: string
  description: string
  patientId?: string
  confidence?: number
  commit?: {
    hash: string
    author: string
    date: string
    message: string
  }
  data: Record<string, unknown>
}

interface GitHubFile {
  name: string
  download_url: string
  type?: string
}

interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      date: string
    }
  }
}

export async function GET(request: Request) {
  try {
    const user = await currentUser()
    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get('userId')
    const userRole = searchParams.get('role') || 'patient'
    const getAllPatients = searchParams.get('getAllPatients') === 'true'
    
    if (!user && !getAllPatients) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const owner = 'tijno'
    const repo = 'hhdata'
    const token = process.env.GITHUB_TOKEN
    
    if (!token) {
      throw new Error('GitHub token not configured')
    }
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'HyperHealth-App'
    }
    
    // Fetch file list from GitHub API - look in user-specific directory
    let filesResponse
    
    if (requestedUserId && userRole === 'patient') {
      // For patients, look only in their specific directory
      filesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${requestedUserId}`, {
        headers
      })
    } else if (userRole === 'doctor' && getAllPatients) {
      // For doctors viewing all patients, we need to get all directories
      filesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`, {
        headers
      })
    } else if (userRole === 'doctor' && requestedUserId) {
      // For doctors viewing specific patient
      filesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${requestedUserId}`, {
        headers
      })
    } else {
      // Fallback to openehr directory for backwards compatibility
      filesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/openehr`, {
        headers
      })
    }
    
    // If user directory doesn't exist, try fallback
    if (!filesResponse.ok && filesResponse.status === 404) {
      filesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/openehr`, {
        headers
      })
    }
    
    if (!filesResponse.ok) {
      throw new Error(`GitHub API error: ${filesResponse.status}`)
    }
    
    // Get latest commit info from GitHub API first
    const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, {
      headers
    })
    const commits: GitHubCommit[] = await commitsResponse.json()
    const latestCommit = commits[0]

    const records: OpenEHRRecord[] = []

    if (userRole === 'doctor' && getAllPatients) {
      // For doctors viewing all patients, iterate through user directories
      const contents = await filesResponse.json()
      
      for (const item of contents) {
        if (item.type === 'dir' && item.name.startsWith('user_')) {
          // Fetch files from this user directory
          const userDirResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${item.name}`, {
            headers
          })
          
          if (userDirResponse.ok) {
            const userFiles = await userDirResponse.json()
            await processFiles(userFiles, headers, records, latestCommit, item.name)
          }
        }
      }
      
      // Also check openehr directory for backwards compatibility
      const openehrResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/openehr`, {
        headers
      })
      if (openehrResponse.ok) {
        const openehrFiles = await openehrResponse.json()
        await processFiles(openehrFiles, headers, records, latestCommit)
      }
    } else {
      // For single user or directory
      const files: GitHubFile[] = await filesResponse.json()
      await processFiles(files, headers, records, latestCommit, requestedUserId || undefined)
    }

    // Filter records based on user role and requested user
    let filteredRecords = records
    if (userRole === 'patient' && requestedUserId) {
      // Patients can only see their own records
      filteredRecords = records.filter(record => 
        record.patientId === requestedUserId || !record.patientId
      )
    } else if (userRole === 'doctor' && !getAllPatients && requestedUserId) {
      // Doctors can see specific patient records
      filteredRecords = records.filter(record => 
        record.patientId === requestedUserId || !record.patientId
      )
    }
    // If getAllPatients is true and user is doctor, return all records

    return NextResponse.json({
      success: true,
      records: filteredRecords,
      gitInfo: {
        hash: latestCommit.sha,
        message: latestCommit.commit.message,
        date: latestCommit.commit.author.date,
        author: latestCommit.commit.author.name
      }
    })

  } catch (error) {
    console.error('Error fetching health records:', error)
    
    // If it's a GitHub API error, provide more specific guidance
    if (error instanceof Error && error.message.includes('GitHub API error: 404')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'GitHub repository not found or not accessible',
          details: 'The health records repository may not exist or the access token may be invalid',
          records: []
        },
        { status: 200 } // Return 200 with empty records instead of 500
      )
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch health records',
        details: error instanceof Error ? error.message : 'Unknown error',
        records: []
      },
      { status: 500 }
    )
  }
}

async function processFiles(
  files: GitHubFile[], 
  headers: Record<string, string>, 
  records: OpenEHRRecord[], 
  latestCommit: GitHubCommit,
  patientId?: string
) {
  for (const file of files) {
    if (file.name.endsWith('.json')) {
      const fileResponse = await fetch(file.download_url, { headers })
      if (!fileResponse.ok) continue
      
      const content = await fileResponse.text()
      const jsonData = JSON.parse(content)
      
      // Extract key information from OpenEHR format
      const record: OpenEHRRecord = {
        id: jsonData.uid || file.name.replace('.json', ''),
        type: determineRecordType(file.name, jsonData),
        title: jsonData.name?.value || jsonData.metadata?.record_type || file.name.replace('.json', ''),
        description: extractDescription(jsonData) || 'No description available',
        date: extractDate(jsonData),
        patientId: patientId || extractPatientId(jsonData, file.name),
        confidence: jsonData.metadata?.confidence || jsonData.confidence || 0.95,
        commit: {
          hash: latestCommit?.sha || '',
          author: latestCommit?.commit.author.name || 'Unknown',
          date: latestCommit?.commit.author.date || new Date().toISOString(),
          message: latestCommit?.commit.message || 'Health record update'
        },
        data: jsonData
      }
      
      records.push(record)
    }
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

function extractDescription(data: Record<string, unknown>): string {
  // Try to extract meaningful description from OpenEHR data
  const content = data.content as unknown[]
  if (Array.isArray(content) && content[0]) {
    const firstContent = content[0] as Record<string, unknown>
    const contentData = firstContent.data as Record<string, unknown>
    
    // Look for description or summary fields
    if (contentData?.description && typeof contentData.description === 'string') {
      return contentData.description
    }
    
    if (contentData?.summary && typeof contentData.summary === 'string') {
      return contentData.summary
    }
    
    // For lab results, try to extract key values
    if (contentData?.events && Array.isArray(contentData.events)) {
      const firstEvent = contentData.events[0] as Record<string, unknown>
      const eventData = firstEvent.data as Record<string, unknown>
      if (eventData?.items && Array.isArray(eventData.items)) {
        const items = eventData.items as Record<string, unknown>[]
        const values = items.map(item => {
          const value = item.value as Record<string, unknown>
          if (value?.magnitude && value?.units) {
            return `${value.magnitude} ${value.units}`
          }
          return null
        }).filter(Boolean)
        
        if (values.length > 0) {
          return `Lab results: ${values.join(', ')}`
        }
      }
    }
  }
  
  return data.description as string || 'Health record entry'
}

function extractPatientId(data: Record<string, unknown>, filename: string): string | undefined {
  // Try to extract patient ID from the data or filename
  
  // Check if there's a patient ID in the data
  if (data.patientId && typeof data.patientId === 'string') {
    return data.patientId
  }
  
  // Check subject/patient fields in OpenEHR format
  const composer = data.composer as Record<string, unknown> | undefined
  if (composer?.external_ref && typeof composer.external_ref === 'object') {
    const externalRef = composer.external_ref as Record<string, unknown>
    if (externalRef.id && typeof externalRef.id === 'string') {
      return externalRef.id
    }
  }
  
  // Try to extract from filename pattern (e.g., patient_12345_bloodcount.json)
  const patientMatch = filename.match(/patient[_-]([a-zA-Z0-9]+)/i)
  if (patientMatch) {
    return patientMatch[1]
  }
  
  // Check for user_ pattern (e.g., user_12345_record.json)
  const userMatch = filename.match(/user[_-]([a-zA-Z0-9]+)/i)
  if (userMatch) {
    return userMatch[1]
  }
  
  return undefined
}