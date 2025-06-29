import { notFound } from "next/navigation"
import { HealthRecordDetails } from "./components/HealthRecordDetails"

interface HealthRecordPageProps {
  params: Promise<{ recordId: string }>
}

export default async function HealthRecordPage({ params }: HealthRecordPageProps) {
  const { recordId } = await params
  
  if (!recordId) {
    notFound()
  }

  return <HealthRecordDetails recordId={recordId} />
}