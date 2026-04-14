"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { 
  RotateCcw, 
  Plus, 
  Search, 
  Loader2, 
  MoreVertical, 
  Undo2,
  ShoppingCart,
  Package,
  Filter
} from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export default function ReturnsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("sales");

  const salesReturnsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "sales_returns"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);
  const { data: salesReturns, isLoading: isSalesLoading } = useCollection(salesReturnsQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "sales_invoices");
  }, [db, companyId, branchId]);
  const { data: invoices } = useCollection(invoicesQuery);

  const purchaseReturnsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "purchase_returns"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);
  const { data: purchaseReturns, isLoading: isPurchaseLoading } = useCollection(purchaseReturnsQuery);

  const poQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "purchase_orders");
  }, [db, companyId, branchId]);
  const { data: purchaseOrders } = useCollection(poQuery);

  const handleAddReturn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) return;

    if (activeTab === "sales") {
      const returnData = {
        companyId,
        branchId,
        salesInvoiceId: formData.get("invoiceId") as string,
        customerId: invoices?.find(i => i.id === formData.get("invoiceId"))?.customerId || "unknown",
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
    } else {
      const returnData = {
        companyId,
        branchId,
        purchaseOrderId: formData.get("poId") as string,
        supplierId: purchaseOrders?.find(p => p.id === formData.get("poId"))?.supplierId || "unknown",
        returnDate: new Date().toISOString(),
        returnAmount: Number(formData.get("amount")),
        reason: formData.get("reason") as string,
        status: "pending",
        createdByUserId: "current-user",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const colRef = collection(db, "companies", companyId, "branches", branchId, "purchase_returns");
      addDocumentNonBlocking(colRef, returnData);
    }

    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-red-600 flex items-center gap-2">
            <RotateCcw className="h-6 w-6 md:h-8 md:w-8" />
            Returns & RMA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Process customer and supplier credit notes</p>
        </div>
        <Button 
          variant="destructive" 
          className="gap-2 rounded-full shadow-lg shadow-red-100 w-full md:w-auto" 
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          {activeTab === "sales" ? "Process Sales Return" : "Process Purchase Return"}
        </Button>
      </div>

      <Tabs defaultValue="sales" onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border p-1 rounded-xl shadow-sm mb-6 flex h-auto">
          <TabsTrigger value="sales" className="rounded-lg gap-2 flex-1 py-2">
            <ShoppingCart className="h-4 w-4 hidden sm:block" /> Sales
          </TabsTrigger>
          <TabsTrigger value="purchase" className="rounded-lg gap-2 flex-1 py-2">
            <Package className="h-4 w-4 hidden sm:block" /> Purchase
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search returns..." className="pl-9 bg-background border-none ring-1 ring-input" />
            </div>
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4" /> Filters
            </Button>
          </div>

          {isSalesLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>
          ) : salesReturns && salesReturns.length > 0 ? (
            <Card className="border-none shadow-sm rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Return ID</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesReturns?.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-bold text-[10px] md:text-xs">#S-RET-{r.id.slice(-6).toUpperCase()}</TableCell>
                        <TableCell className="text-[10px] md:text-xs">
                          {invoices?.find(inv => inv.id === r.salesInvoiceId)?.invoiceNumber || "N/A"}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{r.reason}</TableCell>
                        <TableCell className="font-bold text-red-600 text-xs md:text-sm">-৳{r.returnAmount?.toLocaleString()}</TableCell>
                        <TableCell><Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 capitalize text-[10px]">{r.status}</Badge></TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <EmptyState tab="sales" onAdd={() => setIsAddModalOpen(true)} />
          )}
        </TabsContent>

        <TabsContent value="purchase" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search returns..." className="pl-9 bg-background border-none ring-1 ring-input" />
            </div>
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <Filter className="h-4 w-4" /> Filters
            </Button>
          </div>

          {isPurchaseLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>
          ) : purchaseReturns && purchaseReturns.length > 0 ? (
            <Card className="border-none shadow-sm rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Return ID</TableHead>
                      <TableHead>PO #</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseReturns?.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-bold text-[10px] md:text-xs">#P-RET-{r.id.slice(-6).toUpperCase()}</TableCell>
                        <TableCell className="text-[10px] md:text-xs">
                          {purchaseOrders?.find(po => po.id === r.purchaseOrderId)?.orderNumber || "N/A"}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{r.reason}</TableCell>
                        <TableCell className="font-bold text-red-600 text-xs md:text-sm">-৳{r.returnAmount?.toLocaleString()}</TableCell>
                        <TableCell><Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 capitalize text-[10px]">{r.status}</Badge></TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <EmptyState tab="purchase" onAdd={() => setIsAddModalOpen(true)} />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">
              {activeTab === "sales" ? "Record Sales Return" : "Record Purchase Return"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddReturn} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs">{activeTab === "sales" ? "Select Original Invoice" : "Select Original PO"}</Label>
              <Select name={activeTab === "sales" ? "invoiceId" : "poId"} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={activeTab === "sales" ? "Invoice #" : "Purchase Order #"} />
                </SelectTrigger>
                <SelectContent>
                  {activeTab === "sales" 
                    ? invoices?.map(inv => <SelectItem key={inv.id} value={inv.id}>{inv.invoiceNumber} - ৳{inv.totalAmount}</SelectItem>)
                    : purchaseOrders?.map(po => <SelectItem key={po.id} value={po.id}>{po.orderNumber} - ৳{po.totalAmount}</SelectItem>)
                  }
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Return Amount (৳)</Label>
              <Input name="amount" type="number" step="0.01" required placeholder="0.00" className="text-sm" />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Reason for Return</Label>
              <Input name="reason" required placeholder={activeTab === "sales" ? "e.g. Damaged product" : "e.g. Specification mismatch"} className="text-sm" />
            </div>

            <div className="bg-red-50 p-4 rounded-lg flex gap-3 items-start border border-red-100">
              <Undo2 className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-[10px] text-red-800 leading-relaxed">
                <p className="font-bold mb-1">Financial Impact</p>
                This will record a {activeTab === "sales" ? "negative revenue" : "negative expense"} entry. Stock adjustments must be handled manually from Inventory.
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-full w-full sm:w-auto">Cancel</Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700 rounded-full w-full sm:w-auto">Submit Return</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EmptyState({ tab, onAdd }: { tab: string, onAdd: () => void }) {
  return (
    <div className="p-10 md:p-16 bg-white rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 md:w-20 md:h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 text-red-500">
        <RotateCcw className="h-8 w-8 md:h-10 md:w-10" />
      </div>
      <h2 className="text-lg md:text-2xl font-headline font-bold">No {tab === "sales" ? "Sales" : "Purchase"} Returns</h2>
      <p className="text-xs md:text-lg text-muted-foreground max-w-sm mt-2">
        {tab === "sales" 
          ? "Keep track of customer returns, RMA requests, and refund statuses."
          : "Manage outgoing returns to suppliers and track pending credit."
        }
      </p>
      <Button variant="destructive" className="mt-8 px-8 py-6 text-sm md:text-lg rounded-full" onClick={onAdd}>
        Process First Return
      </Button>
    </div>
  )
}
