"use server"

import { db } from "@/db"
import { userProfiles, verificationRequests, type InsertUserProfile, type InsertVerificationRequest } from "@/db/schema/user-profiles"
import { currentUser } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

const medicalDomains = [
  'mayo.edu',
  'stanford.edu', 
  'harvard.edu',
  'ucsf.edu',
  'hopkinsmedicine.org',
  'clevelandclinic.org',
  'mountsinai.org',
  'nyp.org',
  'brighamandwomens.org',
  'massgeneral.org'
]

export async function createUserProfile(clerkId: string, email: string) {
  try {
    // Check if profile already exists
    const existingProfile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.clerkId, clerkId))
      .limit(1)
    
    if (existingProfile.length > 0) {
      return { success: true, profile: existingProfile[0] }
    }
    
    // Determine initial role based on email domain
    const domain = email.split('@')[1]?.toLowerCase()
    const isMedicalDomain = medicalDomains.includes(domain || '')
    
    const newProfile: InsertUserProfile = {
      id: crypto.randomUUID(),
      clerkId,
      email,
      role: isMedicalDomain ? 'doctor' : 'patient',
      verified: isMedicalDomain, // Auto-verify if from trusted medical domain
      verificationStatus: isMedicalDomain ? 'approved' : 'pending'
    }
    
    if (isMedicalDomain) {
      newProfile.verifiedAt = new Date()
      newProfile.verifiedBy = 'system_auto_verification'
    }
    
    const [profile] = await db
      .insert(userProfiles)
      .values(newProfile)
      .returning()
    
    return { success: true, profile }
  } catch (error) {
    console.error('Error creating user profile:', error)
    return { success: false, error: 'Failed to create user profile' }
  }
}

export async function getUserProfile(clerkId: string) {
  try {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.clerkId, clerkId))
      .limit(1)
    
    return { success: true, profile: profile || null }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return { success: false, error: 'Failed to fetch user profile' }
  }
}

export async function requestDoctorVerification(data: {
  medicalLicense: string
  institution: string
  specialty: string
  yearsExperience?: number
  professionalEmail?: string
  references?: string
}) {
  try {
    const user = await currentUser()
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }
    
    // Check if user already has pending request
    const existingRequest = await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.clerkId, user.id))
      .limit(1)
    
    if (existingRequest.length > 0 && existingRequest[0].status === 'pending') {
      return { success: false, error: 'Verification request already pending' }
    }
    
    const verificationRequest: InsertVerificationRequest = {
      id: crypto.randomUUID(),
      clerkId: user.id,
      requestedRole: 'doctor',
      medicalLicense: data.medicalLicense,
      institution: data.institution,
      specialty: data.specialty,
      yearsExperience: data.yearsExperience,
      professionalEmail: data.professionalEmail,
      references: data.references
    }
    
    const [request] = await db
      .insert(verificationRequests)
      .values(verificationRequest)
      .returning()
    
    revalidatePath('/dashboard/verification')
    
    return { success: true, request }
  } catch (error) {
    console.error('Error requesting doctor verification:', error)
    return { success: false, error: 'Failed to submit verification request' }
  }
}

export async function updateUserRole(clerkId: string, role: 'patient' | 'doctor', verifiedBy?: string) {
  try {
    const [updatedProfile] = await db
      .update(userProfiles)
      .set({
        role,
        verified: role === 'doctor',
        verificationStatus: 'approved',
        verifiedAt: new Date(),
        verifiedBy: verifiedBy || 'admin',
        updatedAt: new Date()
      })
      .where(eq(userProfiles.clerkId, clerkId))
      .returning()
    
    revalidatePath('/dashboard')
    
    return { success: true, profile: updatedProfile }
  } catch (error) {
    console.error('Error updating user role:', error)
    return { success: false, error: 'Failed to update user role' }
  }
}

export async function getVerificationStatus(clerkId: string) {
  try {
    const [request] = await db
      .select()
      .from(verificationRequests)
      .where(eq(verificationRequests.clerkId, clerkId))
      .limit(1)
    
    return { success: true, request: request || null }
  } catch (error) {
    console.error('Error fetching verification status:', error)
    return { success: false, error: 'Failed to fetch verification status' }
  }
}

export async function isVerifiedMedicalDomain(email: string): Promise<boolean> {
  const domain = email.split('@')[1]?.toLowerCase()
  return medicalDomains.includes(domain || '')
}