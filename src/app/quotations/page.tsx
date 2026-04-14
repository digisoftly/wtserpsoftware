
"use client"

import * as React from "react"
import { Plus, FileText, Search, Loader2, MoreVertical, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { cn } from "@/lib/utils"

export default function QuotationsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const quotationsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "quotations"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: quotations, isLoading } = useCollection(quotationsQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  const handleAddQuotation = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!db || !companyId || !branchId) return;

    const quotationData = {
      companyId,
      branchId,
      quotationNumber: `QT-${Date.now().toString().slice(-6)}`,
      customerId: formData.get("customerId") as string,
      quotationDate: new Date().toISOString(),
      validUntilDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      totalAmount: Number(formData.get("amount")),
      status: "draft",
      createdByUserId: "current-user",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const colRef = collection(db, "companies", companyId, "branches", branchId, "quotations");
    addDocumentNonBlocking(colRef, quotationData);
    setIsAddModalOpen(false);
  };

  const filteredQuotations = quotations?.filter(q => 
    q.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-purple-600">Quotations</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate and manage price quotes for clients</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 gap-2 rounded-full w-full md:w-auto" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          New Quotation
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search quotation #..." 
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

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : quotations && quotations.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations?.map((q) => {
                  const customer = customers?.find(c => c.id === q.customerId);
                  return (
                    <TableRow key={q.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-bold text-xs md:text-sm">{q.quotationNumber}</TableCell>
                      <TableCell className="text-xs md:text-sm">{customer ? `${customer.firstName} ${customer.lastName}` : "Loading..."}</TableCell>
                      <TableCell className="text-[10px] md:text-xs">{new Date(q.quotationDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-semibold text-xs md:text-sm">${q.totalAmount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-purple-50 text-purple-700 text-[10px] capitalize">{q.status}</Badge>
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
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4 text-purple-500">
            <FileText className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-headline font-bold">No Active Quotations</h2>
          <p className="text-sm text-muted-foreground max-w-sm mt-2">
            Create professional quotes to send to your potential leads and customers.
          </p>
          <Button className="mt-6 bg-purple-600 rounded-full px-8" onClick={() => setIsAddModalOpen(true)}>Create Quotation</Button>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">New Price Quotation</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddQuotation} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="customerId" className="text-xs">Select Customer</Label>
              <Select name="customerId" required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose client" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-xs">Estimated Total Amount ($)</Label>
              <Input name="amount" type="number" step="0.01" required placeholder="0.00" className="text-sm" />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-full w-full sm:w-auto">Cancel</Button>
              <Button type="submit" className="bg-purple-600 rounded-full w-full sm:w-auto">Save Draft Quote</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
