"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, AlertCircle } from "lucide-react"

export default function ReturnsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Returns & RMA</h1>
          <p className="text-muted-foreground mt-1">Manage product returns and credit notes</p>
        </div>
      </div>

      <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
          <RotateCcw className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-headline font-bold">No Returns Pending</h2>
        <p className="text-muted-foreground max-w-sm mt-2">
          Customer returns and supplier credit notes will appear in this section.
        </p>
      </div>
    </div>
  )
}
