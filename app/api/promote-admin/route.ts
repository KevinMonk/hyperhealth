import { NextRequest, NextResponse } from 'next/server'
import { promoteToAdmin } from '@/actions/admin'

export async function POST(request: NextRequest) {
  try {
    const { clerkId } = await request.json()
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Clerk ID required' }, { status: 400 })
    }

    const result = await promoteToAdmin(clerkId)
    
    if (result.success) {
      return NextResponse.json({ success: true, profile: result.profile })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('Error promoting to admin:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}