import { NextResponse } from "next/server"
import { currentUser } from "@clerk/nextjs/server"

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ recordId: string }> }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { recordId } = await params
    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get('userId')

    if (!requestedUserId || requestedUserId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get base URL for the main health records API
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}/api/health-records?userId=${requestedUserId}&role=patient`
    
    // Fetch all records first using the existing API logic
    const allRecordsResponse = await fetch(baseUrl, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || ''
      }
    })
    
    if (!allRecordsResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 })
    }

    const allRecordsData = await allRecordsResponse.json()
    
    if (!allRecordsData.records || allRecordsData.records.length === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    // Find the specific record
    const record = allRecordsData.records.find((r: OpenEHRRecord) => r.id === recordId)
    
    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    // For patients, only show their own records
    if (record.patientId && record.patientId !== user.id) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    // Enhance the record with additional details for the details view
    const enhancedRecord = {
      ...record,
      details: extractDetailedInfo(record.data),
      rawData: record.data
    }

    return NextResponse.json({ record: enhancedRecord })
  } catch (error) {
    console.error('Failed to fetch health record details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function extractDetailedInfo(data: Record<string, unknown>): Record<string, unknown> {
  const details: Record<string, unknown> = {}

  // Extract OpenEHR composition details
  if (data.name && typeof data.name === 'object') {
    const name = data.name as Record<string, unknown>
    if (name.value) details.composition_name = name.value
  }

  if (data.language && typeof data.language === 'object') {
    const language = data.language as Record<string, unknown>
    if (language.code_string) details.language = language.code_string
  }

  if (data.territory && typeof data.territory === 'object') {
    const territory = data.territory as Record<string, unknown>
    if (territory.code_string) details.territory = territory.code_string
  }

  // Extract context information
  if (data.context && typeof data.context === 'object') {
    const context = data.context as Record<string, unknown>
    if (context.start_time) {
      const startTime = context.start_time as Record<string, unknown>
      if (startTime.value) details.start_time = startTime.value
    }
    if (context.setting) {
      const setting = context.setting as Record<string, unknown>
      if (setting.value) details.setting = setting.value
    }
  }

  // Extract content details (observations, evaluations, etc.)
  if (data.content && Array.isArray(data.content)) {
    data.content.forEach((item, index) => {
      if (typeof item === 'object' && item !== null) {
        const contentItem = item as Record<string, unknown>
        const prefix = `content_${index + 1}`
        
        if (contentItem.name && typeof contentItem.name === 'object') {
          const name = contentItem.name as Record<string, unknown>
          if (name.value) details[`${prefix}_name`] = name.value
        }

        if (contentItem.archetype_node_id) {
          details[`${prefix}_archetype`] = contentItem.archetype_node_id
        }

        // Extract data from observations
        if (contentItem.data && typeof contentItem.data === 'object') {
          const contentData = contentItem.data as Record<string, unknown>
          
          if (contentData.events && Array.isArray(contentData.events)) {
            contentData.events.forEach((event, eventIndex) => {
              if (typeof event === 'object' && event !== null) {
                const eventData = event as Record<string, unknown>
                const eventPrefix = `${prefix}_event_${eventIndex + 1}`
                
                if (eventData.time && typeof eventData.time === 'object') {
                  const time = eventData.time as Record<string, unknown>
                  if (time.value) details[`${eventPrefix}_time`] = time.value
                }

                if (eventData.data && typeof eventData.data === 'object') {
                  const data = eventData.data as Record<string, unknown>
                  if (data.items && Array.isArray(data.items)) {
                    data.items.forEach((dataItem, itemIndex) => {
                      if (typeof dataItem === 'object' && dataItem !== null) {
                        const item = dataItem as Record<string, unknown>
                        const itemPrefix = `${eventPrefix}_item_${itemIndex + 1}`
                        
                        if (item.name && typeof item.name === 'object') {
                          const itemName = item.name as Record<string, unknown>
                          if (itemName.value) details[`${itemPrefix}_name`] = itemName.value
                        }

                        if (item.value && typeof item.value === 'object') {
                          const value = item.value as Record<string, unknown>
                          if (value.magnitude !== undefined && value.units) {
                            details[`${itemPrefix}_value`] = `${value.magnitude} ${value.units}`
                          } else if (value.value) {
                            details[`${itemPrefix}_value`] = value.value
                          }
                        }
                      }
                    })
                  }
                }
              }
            })
          }
        }
      }
    })
  }

  // Extract composer information
  if (data.composer && typeof data.composer === 'object') {
    const composer = data.composer as Record<string, unknown>
    if (composer.name) details.composer = composer.name
    if (composer.external_ref && typeof composer.external_ref === 'object') {
      const externalRef = composer.external_ref as Record<string, unknown>
      if (externalRef.id) details.composer_id = externalRef.id
    }
  }

  return details
}