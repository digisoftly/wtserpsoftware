"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Wallet, Landmark, TrendingDown, TrendingUp } from "lucide-react"

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-blue-600">Financial Accounts</h1>
          <p className="text-muted-foreground mt-1">Ledgers, cash flow, and banking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Statement</Button>
          <Button className="bg-primary hover:bg-primary/90">Add Journal Entry</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-xl border shadow-sm flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">Cash on Hand</span>
          <span className="text-3xl font-bold font-headline mt-2">$12,450.00</span>
        </div>
        <div className="p-6 bg-white rounded-xl border shadow-sm flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">Accounts Receivable</span>
          <span className="text-3xl font-bold font-headline mt-2 text-green-600">$45,200.00</span>
        </div>
        <div className="p-6 bg-white rounded-xl border shadow-sm flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">Accounts Payable</span>
          <span className="text-3xl font-bold font-headline mt-2 text-red-600">$18,900.00</span>
        </div>
      </div>

      <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600">
          <Landmark className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-headline font-bold">Ready for Reconciliation</h2>
        <p className="text-muted-foreground max-w-sm mt-2">
          Sync your bank statements to begin accurate financial tracking.
        </p>
      </div>
    </div>
  )
}
