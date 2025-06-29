"use server"

import { db } from "@/db"
import { userProfiles } from "@/db/schema/user-profiles"
import { currentUser } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"

export async function promoteToAdmin(clerkId: string) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    // For now, allow any user to promote themselves to admin for testing
    // In production, this should be restricted to existing admins
    
    const [updatedProfile] = await db
      .update(userProfiles)
      .set({
        role: 'admin',
        verified: true,
        verificationStatus: 'approved',
        verifiedAt: new Date(),
        verifiedBy: `promoted_by_${user.id}`,
        updatedAt: new Date()
      })
      .where(eq(userProfiles.clerkId, clerkId))
      .returning()

    if (!updatedProfile) {
      return { success: false, error: 'User not found' }
    }

    return { success: true, profile: updatedProfile }
  } catch (error) {
    console.error('Error promoting to admin:', error)
    return { success: false, error: 'Failed to promote user to admin' }
  }
}

export async function demoteFromAdmin(clerkId: string) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const [updatedProfile] = await db
      .update(userProfiles)
      .set({
        role: 'patient',
        verified: false,
        verificationStatus: 'pending',
        verifiedAt: null,
        verifiedBy: null,
        updatedAt: new Date()
      })
      .where(eq(userProfiles.clerkId, clerkId))
      .returning()

    if (!updatedProfile) {
      return { success: false, error: 'User not found' }
    }

    return { success: true, profile: updatedProfile }
  } catch (error) {
    console.error('Error demoting from admin:', error)
    return { success: false, error: 'Failed to demote user from admin' }
  }
}