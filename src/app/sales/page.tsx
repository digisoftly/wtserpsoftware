
"use client"

import * as React from "react"
import { Plus, ShoppingCart, Search, Filter, Loader2, MoreVertical, FileText, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { cn } from "@/lib/utils"

export default function SalesPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "sales_invoices"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: invoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);

  const { data: customers } = useCollection(customersQuery);

  const handleAddInvoice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!db || !companyId || !branchId) return;

    const invoiceData = {
      companyId,
      branchId,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      customerId: formData.get("customerId") as string,
      invoiceDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      totalAmount: Number(formData.get("amount")),
      paidAmount: 0,
      dueAmount: Number(formData.get("amount")),
      status: "due",
      createdByUserId: "current-user-id",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const colRef = collection(db, "companies", companyId, "branches", branchId, "sales_invoices");
    addDocumentNonBlocking(colRef, invoiceData);
    setIsAddModalOpen(false);
  };

  const filteredInvoices = invoices?.filter(inv => 
    inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-green-600">Sales Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Track customer orders, invoices, and revenue</p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="bg-green-600 hover:bg-green-700 gap-2 rounded-full w-full md:w-auto" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search invoice number..." 
            className="pl-9 bg-background border-none ring-1 ring-input" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {isInvoicesLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      ) : invoices && invoices.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices?.map((inv) => {
                  const customer = customers?.find(c => c.id === inv.customerId);
                  return (
                    <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="font-bold">{inv.invoiceNumber}</div>
                        <div className="text-[10px] text-muted-foreground uppercase font-mono">ID: {inv.id.slice(-6)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{customer ? `${customer.firstName} ${customer.lastName}` : "Loading..."}</div>
                        <div className="text-xs text-muted-foreground">{customer?.companyName || "Personal"}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : "N/A"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${inv.totalAmount?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={cn(
                            inv.status === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                          )}
                        >
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-500">
            <ShoppingCart className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-headline font-bold">No Recent Sales Found</h2>
          <p className="text-sm text-muted-foreground max-w-sm mt-2">
            Your sales records will appear here once you start generating invoices or processing orders.
          </p>
          <Button className="mt-6 bg-green-600 rounded-full" onClick={() => setIsAddModalOpen(true)}>Create Your First Invoice</Button>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">Create New Sales Invoice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddInvoice} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="customerId">Select Customer</Label>
              <Select name="customerId" required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} {c.companyName ? `(${c.companyName})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Total Invoice Amount ($)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" required placeholder="0.00" />
            </div>
            <div className="bg-muted/30 p-4 rounded-lg flex gap-3 items-start border border-dashed">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                <p className="font-bold text-foreground mb-1">Standard Terms Apply</p>
                This will generate a due invoice with a 7-day payment window. You can record payments later from the financial ledger.
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-full">Cancel</Button>
              <Button type="submit" className="bg-green-600 rounded-full">Generate Invoice</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
