"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Users, Plus, UserPlus } from "lucide-react"

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Customers</h1>
          <p className="text-muted-foreground mt-1">Client relationship management</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 gap-2">
          <UserPlus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center mb-4 text-cyan-500">
          <Users className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-headline font-bold">Customer Directory Empty</h2>
        <p className="text-muted-foreground max-w-sm mt-2">
          Build your client base by adding new contacts or importing your existing CRM list.
        </p>
      </div>
    </div>
  )
}
