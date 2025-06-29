"use client"

import { Link, Settings2, User, Users, FileText, Camera, Shield, Crown, type LucideIcon } from "lucide-react"
import * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from "@/components/ui/sidebar"
import { NavMain } from "../_components/nav-main"
import { NavUser } from "../_components/nav-user"
import { TeamSwitcher } from "../_components/team-switcher"

export function AppSidebar({
  userData,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  userData: {
    name: string
    email: string
    avatar: string
    membership: string
    role: string
    verified: boolean
  }
}) {
  const isDoctor = userData.role === "doctor"
  const isAdmin = userData.role === "admin"
  const isVerified = userData.verified

  // Build navigation based on user role
  const navItems: Array<{
    title: string
    url: string
    icon: LucideIcon
    items?: { title: string; url: string }[]
  }> = [
    {
      title: "My Health Records",
      url: "/dashboard",
      icon: FileText
    }
  ]

  // Add patient list for verified doctors and admins
  if ((isDoctor && isVerified) || isAdmin) {
    navItems.push({
      title: "Patient Records",
      url: "/dashboard/patients",
      icon: Users
    })
  }

  // Add admin panel for admins
  if (isAdmin) {
    navItems.push({
      title: "Admin Panel",
      url: "/dashboard/admin",
      icon: Crown
    })
  }

  // Add verification for unverified doctors
  if (isDoctor && !isVerified) {
    navItems.push({
      title: "Doctor Verification",
      url: "/dashboard#verification",
      icon: Shield
    })
  }

  // Add settings (only this one has a dropdown)
  navItems.push({
    title: "Settings",
    url: "#",
    icon: Settings2,
    items: [
      {
        title: "General",
        url: "/dashboard/settings"
      }
    ]
  })

  const data = {
    user: userData,
    teams: [
      {
        name: userData.role === "admin" ? "Admin Account" : 
              userData.role === "doctor" ? "Medical Professional" : "Personal",
        logo: userData.role === "admin" ? Crown : 
              userData.role === "doctor" ? Shield : User,
        plan: userData.role === "admin" ? "Admin" :
              userData.role === "doctor" && userData.verified ? "Verified Doctor" :
              userData.role === "doctor" ? "Pending Verification" : "Patient"
      }
    ],
    navMain: navItems
  }
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
