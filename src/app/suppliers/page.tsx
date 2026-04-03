"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Truck, Plus } from "lucide-react"

export default function SuppliersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Suppliers</h1>
          <p className="text-muted-foreground mt-1">Manage vendor relations and contacts</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 gap-2">
          <Plus className="h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-700">
          <Truck className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-headline font-bold">No Suppliers Registered</h2>
        <p className="text-muted-foreground max-w-sm mt-2">
          Add your hardware vendors and service providers to manage procurement.
        </p>
      </div>
    </div>
  )
}
