"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Receipt, Plus, Search, Loader2, MoreVertical, Filter, ArrowDownCircle, Landmark, CreditCard, Tag } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KPICard } from "@/components/dashboard/kpi-card"

export default function ExpensesPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const expensesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "expenses"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: expenses, isLoading } = useCollection(expensesQuery);

  const totalExpense = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) return;

    const expenseData = {
      companyId,
      branchId,
      description: formData.get("description") as string,
      amount: Number(formData.get("amount")),
      category: formData.get("category") as string,
      paymentMethod: formData.get("paymentMethod") as string,
      expenseDate: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const colRef = collection(db, "companies", companyId, "branches", branchId, "expenses");
    addDocumentNonBlocking(colRef, expenseData);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-red-500">Operating Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage office costs, utilities, and minor spending</p>
        </div>
        <Button className="bg-red-500 hover:bg-red-600 gap-2 rounded-full px-8 shadow-lg" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Record Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Spending" value={`৳${totalExpense.toLocaleString()}`} icon={ArrowDownCircle} colorClass="bg-red-500" />
        <KPICard title="Monthly Budget" value="৳50,000" icon={Landmark} colorClass="bg-blue-500" />
        <KPICard title="Major Category" value="Rent" icon={Tag} colorClass="bg-orange-500" />
        <KPICard title="Transactions" value={expenses?.length || 0} icon={CreditCard} colorClass="bg-purple-500" />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search expenses..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto"><Filter className="h-4 w-4" /> Filters</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-red-500" /></div>
      ) : expenses && expenses.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses?.map((exp) => (
                  <TableRow key={exp.id} className="hover:bg-muted/30">
                    <TableCell className="text-xs">{new Date(exp.expenseDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium text-xs md:text-sm">{exp.description}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px] uppercase">{exp.category}</Badge></TableCell>
                    <TableCell className="text-[10px] text-muted-foreground uppercase">{exp.paymentMethod}</TableCell>
                    <TableCell className="text-right font-bold text-red-600">৳{exp.amount?.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="p-16 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
          <Receipt className="h-12 w-12 text-red-200 mb-4" />
          <h2 className="text-xl font-headline font-bold">No Expenses Recorded</h2>
          <p className="text-muted-foreground max-w-sm mt-2">Track your daily business expenditures here for accurate profit reports.</p>
          <Button className="mt-6 bg-red-500 rounded-full px-8" onClick={() => setIsAddModalOpen(true)}>Add Expense</Button>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Expense Entry</DialogTitle></DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs">Description</Label>
              <Input name="description" required placeholder="e.g. Monthly Electricity Bill" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs">Amount (৳)</Label><Input name="amount" type="number" step="0.01" required /></div>
              <div className="space-y-2">
                <Label className="text-xs">Category</Label>
                <Select name="category" defaultValue="utility">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utility">Utilities</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="office">Office Supplies</SelectItem>
                    <SelectItem value="salary">HR / Salary</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Payment Method</Label>
              <Select name="paymentMethod" defaultValue="cash">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash in Hand</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="bkash">bKash / Mobile Banking</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-red-500 rounded-full w-full">Post Expense</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
