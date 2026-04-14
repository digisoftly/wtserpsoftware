"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { RotateCcw, Plus, Search, Loader2, MoreVertical, FileX } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"

export default function ReturnsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  const returnsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "sales_returns"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: returns, isLoading } = useCollection(returnsQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "sales_invoices");
  }, [db, companyId, branchId]);
  const { data: invoices } = useCollection(invoicesQuery);

  const handleAddReturn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) return;

    const returnData = {
      companyId,
      branchId,
      salesInvoiceId: formData.get("invoiceId") as string,
      customerId: "unknown", // Should be fetched from invoice in a real app
      returnDate: new Date().toISOString(),
      returnAmount: Number(formData.get("amount")),
      reason: formData.get("reason") as string,
      status: "pending",
      createdByUserId: "current-user",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const colRef = collection(db, "companies", companyId, "branches", branchId, "sales_returns");
    addDocumentNonBlocking(colRef, returnData);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-red-600">Returns & RMA</h1>
          <p className="text-muted-foreground mt-1">Manage product returns and credit notes</p>
        </div>
        <Button variant="destructive" className="gap-2 rounded-full" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Process Return
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>
      ) : returns && returns.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Return ID</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns?.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-bold">#RET-{r.id.slice(-6)}</TableCell>
                  <TableCell>{r.reason}</TableCell>
                  <TableCell className="font-semibold text-red-600">-${r.returnAmount?.toLocaleString()}</TableCell>
                  <TableCell><Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">{r.status}</Badge></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
            <RotateCcw className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-headline font-bold">No Returns Pending</h2>
          <p className="text-muted-foreground max-w-sm mt-2">Customer returns and supplier credit notes will appear in this section.</p>
          <Button variant="destructive" className="mt-6" onClick={() => setIsAddModalOpen(true)}>Process New Return</Button>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Sales Return</DialogTitle></DialogHeader>
          <form onSubmit={handleAddReturn} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Select Original Invoice</Label>
              <Select name="invoiceId" required>
                <SelectTrigger><SelectValue placeholder="Invoice #" /></SelectTrigger>
                <SelectContent>
                  {invoices?.map(inv => <SelectItem key={inv.id} value={inv.id}>{inv.invoiceNumber}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Return Amount ($)</Label>
              <Input name="amount" type="number" step="0.01" required />
            </div>
            <div className="space-y-2">
              <Label>Reason for Return</Label>
              <Input name="reason" required placeholder="e.g. Damaged product, wrong specification" />
            </div>
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">Submit Return Request</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
