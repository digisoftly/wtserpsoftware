"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { BarChart3, Download, Calendar } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Business Intelligence</h1>
          <p className="text-muted-foreground mt-1">Analytical reports and performance tracking</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export All
        </Button>
      </div>

      <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4 text-indigo-400">
          <BarChart3 className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-headline font-bold">Generating Insights...</h2>
        <p className="text-muted-foreground max-w-sm mt-2">
          Select a date range to generate visual reports for sales, inventory, and finances.
        </p>
        <Button className="mt-6">Open Report Builder</Button>
      </div>
    </div>
  )
}
