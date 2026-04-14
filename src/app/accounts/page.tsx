"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Wallet, Landmark, TrendingDown, TrendingUp, Loader2, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function AccountsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();

  const txQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "transactions"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: transactions, isLoading } = useCollection(txQuery);

  const totalIncome = transactions?.filter(t => t.transactionType === 'income').reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
  const totalExpense = transactions?.filter(t => t.transactionType === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-blue-600">Financial Accounts</h1>
          <p className="text-muted-foreground mt-1">Ledgers, cash flow, and banking</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Statement</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-full">Add Journal Entry</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-xl border shadow-sm flex flex-col">
          <span className="text-sm font-medium text-muted-foreground">Main Balance</span>
          <span className="text-3xl font-bold font-headline mt-2 text-primary">${(totalIncome - totalExpense).toLocaleString()}</span>
        </div>
        <div className="p-6 bg-white rounded-xl border shadow-sm flex flex-col">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3 text-green-500" /> Income</span>
          <span className="text-3xl font-bold font-headline mt-2 text-green-600">${totalIncome.toLocaleString()}</span>
        </div>
        <div className="p-6 bg-white rounded-xl border shadow-sm flex flex-col">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1"><TrendingDown className="h-3 w-3 text-red-500" /> Expense</span>
          <span className="text-3xl font-bold font-headline mt-2 text-red-600">${totalExpense.toLocaleString()}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : transactions && transactions.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs">{new Date(t.transactionDate).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{t.description}</TableCell>
                  <TableCell className="text-xs uppercase text-muted-foreground">{t.category || "General"}</TableCell>
                  <TableCell className="text-right">
                    <span className={cn("font-bold flex items-center justify-end gap-1", t.transactionType === 'income' ? 'text-green-600' : 'text-red-600')}>
                      {t.transactionType === 'income' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                      ${t.amount?.toLocaleString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600">
            <Landmark className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-headline font-bold">No Transactions Recorded</h2>
          <p className="text-muted-foreground max-w-sm mt-2">Sync your bank statements or add manual entries to begin accurate financial tracking.</p>
        </div>
      )}
    </div>
  )
}
