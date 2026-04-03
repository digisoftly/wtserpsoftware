"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Wrench, Plus, ShieldCheck } from "lucide-react"

export default function ContractsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Service Contracts</h1>
          <p className="text-muted-foreground mt-1">Manage AMC and service agreements</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="h-4 w-4" />
          Add Contract
        </Button>
      </div>

      <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-emerald-500">
          <Wrench className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-headline font-bold">No Service Contracts</h2>
        <p className="text-muted-foreground max-w-sm mt-2">
          Keep track of Annual Maintenance Contracts (AMC) and warranty periods.
        </p>
      </div>
    </div>
  )
}
