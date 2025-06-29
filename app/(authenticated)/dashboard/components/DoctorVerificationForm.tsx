"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Stethoscope,
  Building,
  GraduationCap,
  Mail,
  FileText
} from "lucide-react"
import { requestDoctorVerification } from "@/actions/user-profiles"

interface DoctorVerificationFormProps {
  user: {
    email: string
    verified: boolean
    verificationStatus: string
  }
  onVerificationSubmitted?: () => void
}

export function DoctorVerificationForm({ user, onVerificationSubmitted }: DoctorVerificationFormProps) {
  const [formData, setFormData] = useState({
    medicalLicense: '',
    institution: '',
    specialty: '',
    yearsExperience: '',
    professionalEmail: '',
    references: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const result = await requestDoctorVerification({
        medicalLicense: formData.medicalLicense,
        institution: formData.institution,
        specialty: formData.specialty,
        yearsExperience: formData.yearsExperience ? parseInt(formData.yearsExperience) : undefined,
        professionalEmail: formData.professionalEmail,
        references: formData.references
      })

      if (result.success) {
        setSuccess(true)
        onVerificationSubmitted?.()
      } else {
        setError(result.error || 'Failed to submit verification request')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Show status if user already has verification status
  if (user.verificationStatus === 'pending' || user.verified) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Doctor Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user.verified ? (
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Verified Doctor</p>
                <p className="text-sm text-muted-foreground">
                  You have full access to doctor features including patient records.
                </p>
              </div>
              <Badge variant="default" className="ml-auto">Verified</Badge>
            </div>
          ) : user.verificationStatus === 'pending' ? (
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Verification Pending</p>
                <p className="text-sm text-muted-foreground">
                  Your doctor verification request is under review. You'll be notified when approved.
                </p>
              </div>
              <Badge variant="secondary" className="ml-auto">Pending</Badge>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Verification Required</p>
                <p className="text-sm text-muted-foreground">
                  Submit your credentials for doctor verification to access patient records.
                </p>
              </div>
              <Badge variant="destructive" className="ml-auto">Unverified</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Verification Request Submitted</h3>
              <p className="text-muted-foreground">
                Your doctor verification request has been submitted successfully. 
                You'll receive an email notification when your account is reviewed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="h-5 w-5" />
          Request Doctor Verification
        </CardTitle>
        <CardDescription>
          Submit your medical credentials to gain access to doctor features and patient records.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="medicalLicense" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Medical License Number *
              </Label>
              <Input
                id="medicalLicense"
                value={formData.medicalLicense}
                onChange={(e) => handleInputChange('medicalLicense', e.target.value)}
                placeholder="e.g., MD123456"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="institution" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Medical Institution *
              </Label>
              <Input
                id="institution"
                value={formData.institution}
                onChange={(e) => handleInputChange('institution', e.target.value)}
                placeholder="e.g., Mayo Clinic"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Medical Specialty *
              </Label>
              <Input
                id="specialty"
                value={formData.specialty}
                onChange={(e) => handleInputChange('specialty', e.target.value)}
                placeholder="e.g., Internal Medicine"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsExperience">Years of Experience</Label>
              <Input
                id="yearsExperience"
                type="number"
                value={formData.yearsExperience}
                onChange={(e) => handleInputChange('yearsExperience', e.target.value)}
                placeholder="e.g., 5"
                min="0"
                max="50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="professionalEmail" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Professional Email (if different)
            </Label>
            <Input
              id="professionalEmail"
              type="email"
              value={formData.professionalEmail}
              onChange={(e) => handleInputChange('professionalEmail', e.target.value)}
              placeholder="doctor@hospital.edu"
            />
            <p className="text-xs text-muted-foreground">
              If you have an email from a verified medical institution, it may expedite verification.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="references">Professional References</Label>
            <Textarea
              id="references"
              value={formData.references}
              onChange={(e) => handleInputChange('references', e.target.value)}
              placeholder="Please provide names and contact information for professional references..."
              rows={4}
            />
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Verification Process:</strong> Our team will review your credentials within 2-3 business days. 
              You may be contacted for additional documentation. All information is kept confidential and secure.
            </AlertDescription>
          </Alert>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Submitting Request...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Submit Verification Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}