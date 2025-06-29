import { getCustomerByUserId } from "@/actions/customers"
import { getUserProfile, createUserProfile } from "@/actions/user-profiles"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import DashboardClientLayout from "./_components/layout-client"

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
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

  // Get customer info for membership display (optional)
  const customer = await getCustomerByUserId(user.id)

  const userData = {
    name:
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.firstName || user.username || "User",
    email,
    avatar: user.imageUrl,
    membership: customer?.membership || "free",
    role: profile?.role || "patient",
    verified: profile?.verified || false
  }

  return (
    <DashboardClientLayout userData={userData}>
      {children}
    </DashboardClientLayout>
  )
}
