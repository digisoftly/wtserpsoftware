"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Plus, Package, Search } from "lucide-react"

export default function PurchasesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">Manage supplier orders and procurement</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="h-4 w-4" />
            New Purchase Order
          </Button>
        </div>
      </div>

      <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-orange-500">
          <Package className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-headline font-bold">No Purchase Orders</h2>
        <p className="text-muted-foreground max-w-sm mt-2">
          Track your stock replenishment and procurement from various suppliers here.
        </p>
      </div>
    </div>
  )
}
