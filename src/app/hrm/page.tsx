"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { UserRoundCog, UserPlus, Clock } from "lucide-react"

export default function HRMPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-purple-600">Human Resources</h1>
          <p className="text-muted-foreground mt-1">Manage staff, payroll, and attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2"><Clock className="h-4 w-4" /> Attendance</Button>
          <Button className="bg-primary hover:bg-primary/90 gap-2"><UserPlus className="h-4 w-4" /> New Staff</Button>
        </div>
      </div>

      <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4 text-purple-500">
          <UserRoundCog className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-headline font-bold">Staff Directory</h2>
        <p className="text-muted-foreground max-w-sm mt-2">
          Your workforce data, payroll details, and performance reports will be centralized here.
        </p>
      </div>
    </div>
  )
}
