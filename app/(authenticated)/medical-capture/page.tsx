import { Suspense } from 'react'
import MedicalDataCapture from './components/MedicalDataCapture'

export default function MedicalCapturePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Medical Data Capture
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Upload medical documents or enter text to extract structured health records using AI
        </p>
      </div>
      
      <Suspense fallback={<div className="text-center py-8">Loading capture interface...</div>}>
        <MedicalDataCapture />
      </Suspense>
    </div>
  )
}