
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Wallet, Landmark, TrendingDown, TrendingUp, Loader2, ArrowUpRight, ArrowDownLeft, Plus, Filter, CreditCard, DollarSign } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { KPICard } from "@/components/dashboard/kpi-card"

export default function AccountsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

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
  const balance = totalIncome - totalExpense;

  const handleAddTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) return;

    const txData = {
      companyId,
      branchId,
      description: formData.get("description") as string,
      amount: Number(formData.get("amount")),
      transactionType: formData.get("type") as string,
      category: formData.get("category") as string,
      transactionDate: new Date().toISOString(),
      accountId: "main-ledger",
      createdByUserId: "current-user",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const colRef = collection(db, "companies", companyId, "branches", branchId, "transactions");
    addDocumentNonBlocking(colRef, txData);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-blue-600">Financial Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Ledgers, cash flow, and banking</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button variant="outline" className="rounded-full shrink-0">Statement</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-full gap-2 shadow-lg shrink-0 px-6" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add Journal Entry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Net Balance" value={`$${balance.toLocaleString()}`} icon={Wallet} colorClass="bg-blue-600" />
        <KPICard title="Total Income" value={`$${totalIncome.toLocaleString()}`} icon={TrendingUp} colorClass="bg-green-600" />
        <KPICard title="Total Expense" value={`$${totalExpense.toLocaleString()}`} icon={TrendingDown} colorClass="bg-red-600" />
        <KPICard title="Transactions" value={transactions?.length || 0} icon={Landmark} colorClass="bg-purple-600" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : transactions && transactions.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
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
                  <TableRow key={t.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="text-[10px] md:text-xs">{new Date(t.transactionDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium text-xs md:text-sm">{t.description}</TableCell>
                    <TableCell className="text-[10px] uppercase text-muted-foreground">{t.category || "General"}</TableCell>
                    <TableCell className="text-right">
                      <span className={cn("font-bold text-xs md:text-sm flex items-center justify-end gap-1", t.transactionType === 'income' ? 'text-green-600' : 'text-red-600')}>
                        {t.transactionType === 'income' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                        ${t.amount?.toLocaleString()}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600">
            <Landmark className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-headline font-bold">No Transactions Recorded</h2>
          <p className="text-sm text-muted-foreground max-w-sm mt-2">Sync your bank statements or add manual entries to begin accurate financial tracking.</p>
          <Button className="mt-6 bg-blue-600 rounded-full px-8" onClick={() => setIsAddModalOpen(true)}>Add Transaction</Button>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">New Journal Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTransaction} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Input name="description" required placeholder="e.g. Office Rent Payment" className="text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Amount ($)</Label>
                <Input name="amount" type="number" step="0.01" required className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Type</Label>
                <Select name="type" defaultValue="expense">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income (+)</SelectItem>
                    <SelectItem value="expense">Expense (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Category</Label>
              <Input name="category" placeholder="e.g. Utilities, Sales, Salary" className="text-sm" />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-full w-full sm:w-auto">Cancel</Button>
              <Button type="submit" className="bg-blue-600 rounded-full w-full sm:w-auto">Post Transaction</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
