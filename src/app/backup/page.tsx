"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Database, CloudUpload, History } from "lucide-react"

export default function BackupPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Data Backup</h1>
          <p className="text-muted-foreground mt-1">Cloud storage and disaster recovery</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 gap-2">
          <CloudUpload className="h-4 w-4" />
          Backup Now
        </Button>
      </div>

      <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-500">
          <History className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-headline font-bold">Automated Sync Active</h2>
        <p className="text-muted-foreground max-w-sm mt-2">
          Your data is being backed up to secure cloud storage every 6 hours.
        </p>
      </div>
    </div>
  )
}
