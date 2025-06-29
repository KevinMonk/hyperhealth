import { pgTable, text, boolean, timestamp, integer } from 'drizzle-orm/pg-core'

export const userProfiles = pgTable('user_profiles', {
  id: text('id').primaryKey(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull(),
  role: text('role', { enum: ['patient', 'doctor', 'admin'] }).default('patient').notNull(),
  verified: boolean('verified').default(false).notNull(),
  verificationStatus: text('verification_status', { 
    enum: ['pending', 'approved', 'rejected'] 
  }).default('pending'),
  
  // Doctor-specific fields
  medicalLicense: text('medical_license'),
  institution: text('institution'),
  specialty: text('specialty'),
  yearsExperience: integer('years_experience'),
  
  // Verification tracking
  verifiedAt: timestamp('verified_at'),
  verifiedBy: text('verified_by'),
  rejectionReason: text('rejection_reason'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export const invitationCodes = pgTable('invitation_codes', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  institution: text('institution').notNull(),
  role: text('role', { enum: ['doctor', 'admin'] }).notNull(),
  maxUses: integer('max_uses').default(1).notNull(),
  usedCount: integer('used_count').default(0).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  active: boolean('active').default(true).notNull()
})

export const verificationRequests = pgTable('verification_requests', {
  id: text('id').primaryKey(),
  clerkId: text('clerk_id').notNull(),
  requestedRole: text('requested_role', { enum: ['doctor'] }).notNull(),
  
  // Submitted information
  medicalLicense: text('medical_license').notNull(),
  institution: text('institution').notNull(),
  specialty: text('specialty').notNull(),
  yearsExperience: integer('years_experience'),
  professionalEmail: text('professional_email'),
  references: text('references'), // JSON string of references
  
  // Supporting documents (file paths/URLs)
  licenseDocument: text('license_document'),
  institutionVerification: text('institution_verification'),
  
  // Status tracking
  status: text('status', { 
    enum: ['pending', 'under_review', 'approved', 'rejected'] 
  }).default('pending').notNull(),
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})

export type SelectUserProfile = typeof userProfiles.$inferSelect
export type InsertUserProfile = typeof userProfiles.$inferInsert
export type SelectInvitationCode = typeof invitationCodes.$inferSelect
export type InsertInvitationCode = typeof invitationCodes.$inferInsert
export type SelectVerificationRequest = typeof verificationRequests.$inferSelect
export type InsertVerificationRequest = typeof verificationRequests.$inferInsert