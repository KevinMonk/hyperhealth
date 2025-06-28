import { Suspense } from 'react'
import HealthRecordsContainer from './components/HealthRecordsContainer'

export default function HealthRecordsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Distributed Health Records
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          OpenEHR records from Git repository demonstrating distributed EHR concepts
        </p>
      </div>
      
      <Suspense fallback={<div className="text-center py-8">Loading health records...</div>}>
        <HealthRecordsContainer />
      </Suspense>
    </div>
  )
}