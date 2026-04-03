"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Plus, ShoppingCart, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function SalesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Sales Management</h1>
          <p className="text-muted-foreground mt-1">Track customer orders, invoices, and revenue</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-primary hover:bg-primary/90 gap-2">
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search invoice, customer..." className="pl-9" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-500">
          <ShoppingCart className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-headline font-bold">No Recent Sales Found</h2>
        <p className="text-muted-foreground max-w-sm mt-2">
          Your sales records will appear here once you start generating invoices or processing orders.
        </p>
        <Button className="mt-6" variant="outline">Import Previous Data</Button>
      </div>
    </div>
  )
}
