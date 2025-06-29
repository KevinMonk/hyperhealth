import { NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    return NextResponse.json({
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress,
      name: user.fullName || user.firstName
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 })
  }
}