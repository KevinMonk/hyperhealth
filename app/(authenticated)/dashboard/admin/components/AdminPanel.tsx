"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  Users, 
  UserCheck, 
  UserX,
  Crown,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { promoteToAdmin, demoteFromAdmin } from "@/actions/admin"

export function AdminPanel() {
  const [clerkId, setClerkId] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handlePromoteToAdmin = async () => {
    if (!clerkId.trim()) {
      setMessage({ type: 'error', text: 'Please enter a Clerk ID' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const result = await promoteToAdmin(clerkId.trim())
      
      if (result.success) {
        setMessage({ type: 'success', text: `Successfully promoted user ${clerkId} to admin` })
        setClerkId("")
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to promote user' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  const handleDemoteFromAdmin = async () => {
    if (!clerkId.trim()) {
      setMessage({ type: 'error', text: 'Please enter a Clerk ID' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const result = await demoteFromAdmin(clerkId.trim())
      
      if (result.success) {
        setMessage({ type: 'success', text: `Successfully demoted user ${clerkId} to patient` })
        setClerkId("")
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to demote user' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Actions</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="default">Full Access</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Management</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Promote/demote users
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Manage doctor verification
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Role Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            User Role Management
          </CardTitle>
          <CardDescription>
            Promote users to admin or demote them to patient status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              {message.type === 'error' ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="clerkId">Clerk User ID</Label>
            <Input
              id="clerkId"
              value={clerkId}
              onChange={(e) => setClerkId(e.target.value)}
              placeholder="user_2z8v4EV8Nyo9siDo5x7g44AOu0p"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Enter the full Clerk ID of the user you want to promote/demote
            </p>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handlePromoteToAdmin}
              disabled={loading || !clerkId.trim()}
              className="flex items-center gap-2"
            >
              <Crown className="h-4 w-4" />
              Promote to Admin
            </Button>

            <Button 
              variant="outline"
              onClick={handleDemoteFromAdmin}
              disabled={loading || !clerkId.trim()}
              className="flex items-center gap-2"
            >
              <UserX className="h-4 w-4" />
              Demote to Patient
            </Button>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Admin Powers:</strong> Admins can manage all user roles, access all patient records, 
              and approve doctor verification requests. Use these powers responsibly.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Quick Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Find Clerk User IDs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            1. Go to your dashboard and check the "Profile ID" card - it shows the first 8 characters
          </p>
          <p className="text-sm text-muted-foreground">
            2. Check the browser's developer tools → Network tab → Look for API calls with full Clerk IDs
          </p>
          <p className="text-sm text-muted-foreground">
            3. Check the database directly using Drizzle Studio: <code>npx drizzle-kit studio</code>
          </p>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Your Clerk ID:</strong> Check your Profile ID card on the dashboard to get your own ID for promotion.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}