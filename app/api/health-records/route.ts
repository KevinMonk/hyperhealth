import { NextResponse } from 'next/server'

interface OpenEHRRecord {
  id: string
  type: string
  title: string
  date: string
  data: Record<string, unknown>
}

interface GitHubFile {
  name: string
  download_url: string
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

export async function GET() {
  try {
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
    
    // Fetch file list from GitHub API
    const filesResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/openehr`, {
      headers
    })
    if (!filesResponse.ok) {
      throw new Error(`GitHub API error: ${filesResponse.status}`)
    }
    
    const files: GitHubFile[] = await filesResponse.json()
    const records: OpenEHRRecord[] = []

    // Fetch each JSON file
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
          title: jsonData.name?.value || file.name.replace('.json', ''),
          date: extractDate(jsonData),
          data: jsonData
        }
        
        records.push(record)
      }
    }

    // Get latest commit info from GitHub API
    const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`, {
      headers
    })
    const commits: GitHubCommit[] = await commitsResponse.json()
    const latestCommit = commits[0]

    return NextResponse.json({
      success: true,
      records,
      gitInfo: {
        hash: latestCommit.sha,
        message: latestCommit.commit.message,
        date: latestCommit.commit.author.date,
        author: latestCommit.commit.author.name
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