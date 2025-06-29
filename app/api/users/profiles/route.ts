import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is doctor or admin
    // For now, we'll allow any authenticated user for testing
    
    const { userIds } = await request.json()
    
    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 })
    }

    // Fetch real user data from Clerk
    const userProfiles = await Promise.all(
      userIds.map(async (userId) => {
        try {
          const clerkUser = await clerkClient.users.getUser(userId)
          
          return {
            id: clerkUser.id,
            name: clerkUser.fullName || 
                  `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
                  clerkUser.username ||
                  'Unknown User',
            email: clerkUser.emailAddresses[0]?.emailAddress || 'No email',
            avatar: clerkUser.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(clerkUser.fullName || clerkUser.id)}&backgroundColor=0369a1,0891b2,0d9488,dc2626,ca8a04,9333ea`,
            firstName: clerkUser.firstName || '',
            lastName: clerkUser.lastName || ''
          }
        } catch (error) {
          console.error(`Error fetching user ${userId}:`, error)
          // Return fallback data if Clerk API fails
          return {
            id: userId,
            name: `Patient ${userId.substring(0, 8)}...`,
            email: 'Email unavailable',
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userId)}&backgroundColor=6b7280`,
            firstName: 'Unknown',
            lastName: 'User'
          }
        }
      })
    )

    return NextResponse.json({ profiles: userProfiles })
  } catch (error) {
    console.error('Error fetching user profiles:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}