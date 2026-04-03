"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Layers, CreditCard } from "lucide-react"

export default function ProjectBillingPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Project Billing</h1>
          <p className="text-muted-foreground mt-1">Milestone billing and expense tracking</p>
        </div>
      </div>

      <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mb-4 text-violet-500">
          <Layers className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-headline font-bold">Nothing to Bill</h2>
        <p className="text-muted-foreground max-w-sm mt-2">
          When project milestones are completed, you'll be able to generate invoices here.
        </p>
      </div>
    </div>
  )
}
