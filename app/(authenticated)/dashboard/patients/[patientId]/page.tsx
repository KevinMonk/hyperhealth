import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getUserProfile } from "@/actions/user-profiles"
import { PatientDashboard } from "./components/PatientDashboard"

interface PatientPageProps {
  params: Promise<{
    patientId: string
  }>
}

export default async function PatientPage({ params }: PatientPageProps) {
  const { patientId } = await params
  const user = await currentUser()
  
  if (!user) {
    redirect("/login")
  }

  const profileResult = await getUserProfile(user.id)
  const profile = profileResult.profile

  // Check if user has access to patient records (doctors and admins only)
  const hasAccess = profile?.role === 'admin' || 
                   (profile?.role === 'doctor' && profile?.verified)

  if (!hasAccess) {
    redirect("/dashboard")
  }

  const doctorData = {
    id: user.id,
    name: user.fullName || user.firstName || "Doctor",
    email: user.emailAddresses[0]?.emailAddress || "",
    role: profile?.role || "doctor",
    verified: profile?.verified || false
  }

  return (
    <PatientDashboard 
      patientId={patientId}
      doctor={doctorData}
    />
  )
}