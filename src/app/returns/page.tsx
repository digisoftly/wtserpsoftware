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
  Filter,
  ArrowDownCircle,
  ArrowUpCircle
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
import { KPICard } from "@/components/dashboard/kpi-card"

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

  const stats = React.useMemo(() => ({
    salesAmount: salesReturns?.reduce((s, r) => s + (r.returnAmount || 0), 0) || 0,
    purchaseAmount: purchaseReturns?.reduce((s, r) => s + (r.returnAmount || 0), 0) || 0,
  }), [salesReturns, purchaseReturns]);

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
        <h1 className="text-xl font-bold font-headline">Returns & RMA</h1>
        <Button 
          variant="destructive" 
          className="gap-2 rounded-full shadow-lg shadow-red-100 h-9 text-[10px] uppercase font-bold px-6" 
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          New {activeTab === "sales" ? "Sales" : "Purchase"} Return
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard title="Sales Return Total" value={`৳${stats.salesAmount.toLocaleString()}`} icon={ArrowDownCircle} colorClass="bg-red-600" subtext="Customer Credits" />
        <KPICard title="Purchase Return Total" value={`৳${stats.purchaseAmount.toLocaleString()}`} icon={ArrowUpCircle} colorClass="bg-blue-600" subtext="Supplier Credits" />
      </div>

      <Tabs defaultValue="sales" onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border p-1 rounded-xl shadow-sm mb-6 flex h-10 ring-1 ring-slate-100">
          <TabsTrigger value="sales" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-bold h-8">
            <ShoppingCart className="h-3.5 w-3.5" /> Sales
          </TabsTrigger>
          <TabsTrigger value="purchase" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-bold h-8">
            <Package className="h-3.5 w-3.5" /> Purchase
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl border shadow-sm ring-1 ring-slate-50">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search returns..." className="pl-9 h-9 border-none bg-background text-xs ring-1 ring-slate-200" />
            </div>
          </div>

          {isSalesLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>
          ) : salesReturns && salesReturns.length > 0 ? (
            <Card className="border-none shadow-sm rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-bold h-9">ID</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold h-9">Invoice</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold h-9">Reason</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold h-9">Amount</TableHead>
                      <TableHead className="text-right h-9"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesReturns?.map((r) => (
                      <TableRow key={r.id} className="h-12 hover:bg-muted/10 transition-colors">
                        <TableCell className="font-bold text-[10px] uppercase">#SR-{r.id.slice(-4)}</TableCell>
                        <TableCell className="text-xs font-bold">
                          {invoices?.find(inv => inv.id === r.salesInvoiceId)?.invoiceNumber || "---"}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground">{r.reason}</TableCell>
                        <TableCell className="font-black text-red-600 text-xs">-৳{r.returnAmount?.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-red-50 text-red-600 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <div className="p-16 bg-white rounded-3xl border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
              <RotateCcw className="h-10 w-10 text-red-200 mb-4" />
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">No Sales Returns</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="purchase" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl border shadow-sm">
            <div className="relative flex-1 w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search returns..." className="pl-9 h-9 border-none bg-background text-xs ring-1 ring-slate-200" />
            </div>
          </div>

          {isPurchaseLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>
          ) : purchaseReturns && purchaseReturns.length > 0 ? (
            <Card className="border-none shadow-sm rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/20">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-bold h-9">ID</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold h-9">PO #</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold h-9">Reason</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold h-9">Amount</TableHead>
                      <TableHead className="text-right h-9"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseReturns?.map((r) => (
                      <TableRow key={r.id} className="h-12 hover:bg-muted/10 transition-colors">
                        <TableCell className="font-bold text-[10px] uppercase">#PR-{r.id.slice(-4)}</TableCell>
                        <TableCell className="text-xs font-bold">
                          {purchaseOrders?.find(po => po.id === r.purchaseOrderId)?.orderNumber || "---"}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground">{r.reason}</TableCell>
                        <TableCell className="font-black text-red-600 text-xs">-৳{r.returnAmount?.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <div className="p-16 bg-white rounded-3xl border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
              <RotateCcw className="h-10 w-10 text-blue-200 mb-4" />
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">No Purchase Returns</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-red-600 p-6 text-white flex-row items-center gap-3">
            <Undo2 className="h-6 w-6" />
            <DialogTitle className="text-xl font-bold font-headline uppercase">New Return</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddReturn} className="p-6 space-y-4 bg-slate-50">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">{activeTab === "sales" ? "Select Invoice" : "Select PO"}</Label>
              <Select name={activeTab === "sales" ? "invoiceId" : "poId"} required>
                <SelectTrigger className="h-11 rounded-xl bg-white ring-1 ring-slate-200 border-none shadow-sm">
                  <SelectValue placeholder="Identify source..." />
                </SelectTrigger>
                <SelectContent>
                  {activeTab === "sales" 
                    ? invoices?.map(inv => <SelectItem key={inv.id} value={inv.id} className="text-xs">{inv.invoiceNumber} (৳{inv.totalAmount})</SelectItem>)
                    : purchaseOrders?.map(po => <SelectItem key={po.id} value={po.id} className="text-xs">{po.orderNumber} (৳{po.totalAmount})</SelectItem>)
                  }
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Return Value (৳)</Label>
              <Input name="amount" type="number" step="0.01" required placeholder="0.00" className="h-11 rounded-xl text-xs ring-1 ring-slate-200 border-none" />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Reason</Label>
              <Input name="reason" required placeholder="Describe logic..." className="h-11 rounded-xl text-xs ring-1 ring-slate-200 border-none" />
            </div>

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest mt-4 shadow-xl shadow-red-100 active:scale-95 transition-all">Submit Entry</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
