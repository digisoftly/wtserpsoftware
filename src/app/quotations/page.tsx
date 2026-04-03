"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function QuotationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Quotations</h1>
          <p className="text-muted-foreground mt-1">Generate and manage price quotes for clients</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="h-4 w-4" />
            New Quotation
          </Button>
        </div>
      </div>

      <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4 text-purple-500">
          <FileText className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-headline font-bold">No Active Quotations</h2>
        <p className="text-muted-foreground max-w-sm mt-2">
          Create professional quotes to send to your potential leads and customers.
        </p>
      </div>
    </div>
  )
}
