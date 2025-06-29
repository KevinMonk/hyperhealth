import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getUserProfile } from "@/actions/user-profiles"
import { PatientsList } from "../components/PatientsList"

export default async function PatientsPage() {
  const user = await currentUser()
  
  if (!user) {
    redirect("/login")
  }

  const profileResult = await getUserProfile(user.id)
  const profile = profileResult.profile

  // Check if user has access to patient records
  const hasAccess = profile?.role === 'admin' || 
                   (profile?.role === 'doctor' && profile?.verified)

  if (!hasAccess) {
    redirect("/dashboard")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Patient Records</h1>
        <p className="text-muted-foreground mt-2">
          {profile?.role === 'admin' 
            ? "Admin access to all patient health records in the system"
            : "View and manage patient health records"
          }
        </p>
      </div>

      <PatientsList />
    </div>
  )
}