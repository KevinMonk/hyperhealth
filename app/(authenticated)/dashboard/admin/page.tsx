import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { AdminPanel } from "./components/AdminPanel"
import { getUserProfile } from "@/actions/user-profiles"

export default async function AdminPage() {
  const user = await currentUser()
  
  if (!user) {
    redirect("/login")
  }

  const profileResult = await getUserProfile(user.id)
  const profile = profileResult.profile

  // Check if user is admin
  if (!profile || profile.role !== 'admin') {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-muted-foreground mt-2">
          Manage user roles and verification requests.
        </p>
      </div>

      <AdminPanel />
    </div>
  )
}