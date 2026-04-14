
"use client"

import * as React from "react"
import { Plus, Package, Search, Loader2, MoreVertical, Filter } from "lucide-react"
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

export default function PurchasesPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const poQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "purchase_orders"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: purchaseOrders, isLoading } = useCollection(poQuery);

  const suppliersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "suppliers");
  }, [db, companyId, branchId]);
  const { data: suppliers } = useCollection(suppliersQuery);

  const handleAddPO = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) return;

    const poData = {
      companyId,
      branchId,
      orderNumber: `PO-${Date.now().toString().slice(-6)}`,
      supplierId: formData.get("supplierId") as string,
      orderDate: new Date().toISOString(),
      totalAmount: Number(formData.get("amount")),
      paidAmount: 0,
      dueAmount: Number(formData.get("amount")),
      status: "pending",
      createdByUserId: "current-user",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const colRef = collection(db, "companies", companyId, "branches", branchId, "purchase_orders");
    addDocumentNonBlocking(colRef, poData);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-orange-600">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage supplier orders and procurement</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 gap-2 rounded-full w-full md:w-auto" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          New Purchase Order
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search PO #..." 
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
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      ) : purchaseOrders && purchaseOrders.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>PO #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders?.map((po) => {
                  const supplier = suppliers?.find(s => s.id === po.supplierId);
                  return (
                    <TableRow key={po.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-bold text-xs md:text-sm">{po.orderNumber}</TableCell>
                      <TableCell className="text-xs md:text-sm">{supplier?.name || "Loading..."}</TableCell>
                      <TableCell className="font-semibold text-xs md:text-sm">${po.totalAmount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 text-[10px] capitalize">{po.status}</Badge>
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
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 text-orange-500">
            <Package className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-headline font-bold">No Purchase Orders</h2>
          <p className="text-sm text-muted-foreground max-w-sm mt-2">Track your stock replenishment and procurement from various suppliers here.</p>
          <Button className="mt-6 bg-orange-600 rounded-full px-8" onClick={() => setIsAddModalOpen(true)}>Create First PO</Button>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">New Purchase Order</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPO} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs">Select Supplier</Label>
              <Select name="supplierId" required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose vendor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Order Total Amount ($)</Label>
              <Input name="amount" type="number" step="0.01" required className="text-sm" />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-full w-full sm:w-auto">Cancel</Button>
              <Button type="submit" className="bg-orange-600 rounded-full px-8 w-full sm:w-auto">Place Order</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
