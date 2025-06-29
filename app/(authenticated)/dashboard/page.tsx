import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { HealthDashboard } from "./components/HealthDashboard"
import { getUserProfile, createUserProfile } from "@/actions/user-profiles"

export default async function DashboardPage() {
  const user = await currentUser()
  
  if (!user) {
    redirect("/login")
  }

  const email = user.emailAddresses[0]?.emailAddress || ""
  
  // Get or create user profile from database
  let profileResult = await getUserProfile(user.id)
  
  // If no profile exists, create one
  if (!profileResult.profile) {
    profileResult = await createUserProfile(user.id, email)
  }
  
  const profile = profileResult.profile
  
  const userData = {
    id: user.id,
    name: user.fullName || user.firstName || "User",
    email,
    avatar: user.imageUrl || "",
    role: profile?.role || "patient",
    verified: profile?.verified || false,
    verificationStatus: profile?.verificationStatus || "pending"
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Health Records</h1>
        <p className="text-muted-foreground mt-2">
          View your health records timeline and capture new medical data.
        </p>
      </div>

      <Suspense fallback={
        <div className="space-y-4">
          <div className="h-32 bg-muted rounded-lg animate-pulse" />
          <div className="h-64 bg-muted rounded-lg animate-pulse" />
        </div>
      }>
        <HealthDashboard user={userData} />
      </Suspense>
    </div>
  )
}