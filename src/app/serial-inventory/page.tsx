"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Scan, Search, Barcode } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function SerialInventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Serial Inventory</h1>
          <p className="text-muted-foreground mt-1">Track individual items by serial number/IMEI</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 gap-2">
          <Scan className="h-4 w-4" />
          Bulk Scan
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Scan or enter Serial Number..." className="pl-9" />
        </div>
      </div>

      <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-400">
          <Scan className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-headline font-bold">No Tracked Items</h2>
        <p className="text-muted-foreground max-w-sm mt-2">
          Start scanning serial numbers to track high-value items individually.
        </p>
      </div>
    </div>
  )
}
