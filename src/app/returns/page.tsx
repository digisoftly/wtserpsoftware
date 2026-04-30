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
  ArrowDownCircle,
  ArrowUpCircle,
  X,
  CheckCircle2,
  Calculator,
  ArrowRight
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, runTransaction, increment } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"

interface ReturnLineItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  total: number;
}

export default function ReturnsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("sales");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [selectedParentId, setSelectedParentId] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [lineItems, setLineItems] = React.useState<ReturnLineItem[]>([]);

  // Queries
  const salesReturnsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "sales_returns"), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: salesReturns, isLoading: isSalesLoading } = useCollection(salesReturnsQuery);

  const purchaseReturnsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "purchase_returns"), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: purchaseReturns, isLoading: isPurchaseLoading } = useCollection(purchaseReturnsQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "sales_invoices");
  }, [db, companyId, branchId]);
  const { data: invoices } = useCollection(invoicesQuery);

  const poQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "purchase_orders");
  }, [db, companyId, branchId]);
  const { data: purchaseOrders } = useCollection(poQuery);

  // Totals
  const totalReturnAmount = lineItems.reduce((sum, item) => sum + item.total, 0);

  const stats = React.useMemo(() => ({
    salesAmount: salesReturns?.reduce((s, r) => s + (r.totalAmount || 0), 0) || 0,
    purchaseAmount: purchaseReturns?.reduce((s, r) => s + (r.totalAmount || 0), 0) || 0,
  }), [salesReturns, purchaseReturns]);

  // Handle selection of Invoice/PO to populate items
  React.useEffect(() => {
    if (!selectedParentId) {
      setLineItems([]);
      return;
    }

    if (activeTab === "sales") {
      const inv = invoices?.find(i => i.id === selectedParentId);
      if (inv?.items) {
        setLineItems(inv.items.map((item: any) => ({
          productId: item.productId,
          name: item.name,
          qty: 1, // Default return 1, user can adjust
          price: item.price || item.unitPrice || 0,
          total: item.price || item.unitPrice || 0
        })));
      }
    } else {
      const po = purchaseOrders?.find(p => p.id === selectedParentId);
      if (po?.items) {
        setLineItems(po.items.map((item: any) => ({
          productId: item.productId,
          name: item.name,
          qty: 1,
          price: item.unitCost || 0,
          total: item.unitCost || 0
        })));
      }
    }
  }, [selectedParentId, activeTab, invoices, purchaseOrders]);

  const handleUpdateQty = (idx: number, qty: number) => {
    const updated = [...lineItems];
    updated[idx].qty = Math.max(1, qty);
    updated[idx].total = updated[idx].qty * updated[idx].price;
    setLineItems(updated);
  };

  const handleProcessReturn = async () => {
    if (!selectedParentId || lineItems.length === 0) return;
    setIsSubmitting(true);

    try {
      await runTransaction(db!, async (transaction) => {
        const returnCol = activeTab === "sales" ? "sales_returns" : "purchase_returns";
        const returnRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, returnCol));
        
        const returnData = {
          id: returnRef.id,
          companyId,
          branchId,
          parentId: selectedParentId,
          parentNumber: activeTab === "sales" 
            ? invoices?.find(i => i.id === selectedParentId)?.invoiceNumber 
            : purchaseOrders?.find(p => p.id === selectedParentId)?.orderNumber,
          items: lineItems,
          totalAmount: totalReturnAmount,
          reason,
          returnDate: new Date().toISOString(),
          status: "completed",
          createdAt: serverTimestamp(),
        };

        transaction.set(returnRef, returnData);

        // ADJUST STOCK
        // Sales Return: Customer gives back -> STOCK INCREASES
        // Purchase Return: We give back to supplier -> STOCK DECREASES
        const stockAdjustment = activeTab === "sales" ? 1 : -1;

        for (const item of lineItems) {
          const productRef = doc(db!, "companies", companyId!, "branches", branchId!, "products", item.productId);
          transaction.update(productRef, {
            currentStock: increment(item.qty * stockAdjustment),
            updatedAt: serverTimestamp()
          });
        }
      });

      toast({ title: t('success'), description: t('successSub') });
      setIsAddModalOpen(false);
      resetForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedParentId("");
    setReason("");
    setLineItems([]);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-headline text-red-600 uppercase tracking-tight">{t('returns')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <Button 
          className="bg-red-600 hover:bg-red-700 gap-2 rounded-full shadow-xl shadow-red-100 h-10 px-8 text-[10px] uppercase font-black transition-all active:scale-95" 
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
        >
          <Plus className="h-4 w-4" />
          {t('addReturn')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard title={t('salesReturn')} value={`৳${stats.salesAmount.toLocaleString()}`} icon={ArrowDownCircle} colorClass="bg-red-600" />
        <KPICard title={t('purchaseReturn')} value={`৳${stats.purchaseAmount.toLocaleString()}`} icon={ArrowUpCircle} colorClass="bg-blue-600" />
      </div>

      <Tabs defaultValue="sales" onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border p-1 rounded-xl shadow-sm mb-6 flex h-11 ring-1 ring-slate-100">
          <TabsTrigger value="sales" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-black h-9 data-[state=active]:bg-red-50 data-[state=active]:text-red-600">
            <ShoppingCart className="h-3.5 w-3.5" /> {t('sales')}
          </TabsTrigger>
          <TabsTrigger value="purchase" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-black h-9 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <Package className="h-3.5 w-3.5" /> {t('purchases')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          {isSalesLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>
          ) : salesReturns && salesReturns.length > 0 ? (
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="h-12 text-[10px] uppercase font-black pl-6">{t('date')}</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black">{t('invoiceNumber')}</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black">{t('reason')}</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black text-right pr-6">{t('amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesReturns.map((r) => (
                    <TableRow key={r.id} className="h-14 hover:bg-muted/5 transition-colors">
                      <TableCell className="pl-6 text-[10px] font-bold uppercase text-slate-500">{new Date(r.returnDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-black text-xs text-red-600">{r.parentNumber}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-600">{r.reason || "---"}</TableCell>
                      <TableCell className="text-right pr-6 font-black text-xs text-slate-900">৳{r.totalAmount?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="p-24 bg-white rounded-[3rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
              <RotateCcw className="h-12 w-12 text-red-200 mb-6" />
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]">{t('noReturns')}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="purchase" className="space-y-4">
          {isPurchaseLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
          ) : purchaseReturns && purchaseReturns.length > 0 ? (
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="h-12 text-[10px] uppercase font-black pl-6">{t('date')}</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black">{t('poNumber')}</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black">{t('reason')}</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black text-right pr-6">{t('amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseReturns.map((r) => (
                    <TableRow key={r.id} className="h-14 hover:bg-muted/5 transition-colors">
                      <TableCell className="pl-6 text-[10px] font-bold uppercase text-slate-500">{new Date(r.returnDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-black text-xs text-blue-600">{r.parentNumber}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-600">{r.reason || "---"}</TableCell>
                      <TableCell className="text-right pr-6 font-black text-xs text-slate-900">৳{r.totalAmount?.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="p-24 bg-white rounded-[3rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
              <RotateCcw className="h-12 w-12 text-blue-200 mb-6" />
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]">{t('noReturns')}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ADD RETURN MODAL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-[95vw] w-[1200px] p-0 overflow-hidden border-none shadow-2xl bg-slate-50 rounded-[2rem] md:rounded-[2.5rem]">
          <DialogHeader className={cn("p-5 text-white flex-row items-center justify-between space-y-0", activeTab === "sales" ? "bg-red-600" : "bg-blue-600")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-bold font-headline uppercase tracking-tight">{t('addReturn')}</DialogTitle>
                <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em] leading-none mt-1">
                  {activeTab === "sales" ? "Sales / Customer Return" : "Purchase / Supplier Return"}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row h-[75vh] overflow-hidden">
            {/* Form Side */}
            <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    {activeTab === "sales" ? t('invoiceNumber') : t('poNumber')}
                  </Label>
                  <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                    <SelectTrigger className="h-12 rounded-2xl bg-white border-none ring-1 ring-slate-200 shadow-sm transition-all focus:ring-2">
                      <SelectValue placeholder={t('search')} />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTab === "sales" 
                        ? invoices?.map(inv => <SelectItem key={inv.id} value={inv.id} className="text-xs font-bold">{inv.invoiceNumber} - {inv.customerName}</SelectItem>)
                        : purchaseOrders?.map(po => <SelectItem key={po.id} value={po.id} className="text-xs font-bold">{po.orderNumber} - {po.supplierName}</SelectItem>)
                      }
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('reason')}</Label>
                  <Input 
                    className="h-12 rounded-2xl bg-white border-none ring-1 ring-slate-200 text-xs font-bold" 
                    value={reason} 
                    onChange={e => setReason(e.target.value)} 
                    placeholder="e.g. Damaged Goods"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="flex-1 bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1 custom-scrollbar">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="text-[10px] uppercase font-black py-4 pl-8">{t('itemDescription')}</TableHead>
                        <TableHead className="text-[10px] uppercase font-black text-center w-32">{t('qty')}</TableHead>
                        <TableHead className="text-[10px] uppercase font-black text-right w-40">{t('price')}</TableHead>
                        <TableHead className="text-[10px] uppercase font-black text-right w-40 pr-8">{t('total')}</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-64 text-center">
                            <div className="flex flex-col items-center opacity-20">
                              <Undo2 className="h-12 w-12 mb-4" />
                              <p className="text-[10px] uppercase font-black tracking-[0.3em]">{t('noItemsSelected')}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        lineItems.map((item, idx) => (
                          <TableRow key={idx} className="h-16 hover:bg-slate-50/50 transition-colors">
                            <TableCell className="pl-8">
                              <span className="text-xs font-black text-slate-900 uppercase tracking-tighter">{item.name}</span>
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                className="h-9 text-center font-black text-xs rounded-xl w-24 bg-slate-50 border-none mx-auto" 
                                value={item.qty} 
                                onChange={e => handleUpdateQty(idx, Number(e.target.value))} 
                              />
                            </TableCell>
                            <TableCell className="text-right text-xs font-bold text-slate-500">৳{item.price.toLocaleString()}</TableCell>
                            <TableCell className="text-right pr-8 text-xs font-black text-red-600">৳{item.total.toLocaleString()}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 rounded-full hover:bg-red-50" onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}>
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="w-full lg:w-[350px] bg-white border-l border-slate-100 p-8 space-y-8 flex flex-col shadow-2xl relative z-20 shrink-0">
              <div className="space-y-6">
                <div className={cn("p-8 rounded-[2.5rem] shadow-2xl space-y-4 text-center text-white", activeTab === "sales" ? "bg-red-600 shadow-red-100" : "bg-blue-600 shadow-blue-100")}>
                  <p className="text-[10px] uppercase font-black opacity-60 tracking-[0.2em]">{t('grandTotal')}</p>
                  <h2 className="text-4xl font-headline font-black tracking-tighter">৳{totalReturnAmount.toLocaleString()}</h2>
                </div>

                <div className="p-5 bg-slate-50 rounded-3xl space-y-3">
                  <div className="flex items-center gap-3">
                    <Calculator className="h-4 w-4 text-slate-400" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Return Summary</p>
                  </div>
                  <div className="pt-3 border-t border-slate-200">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <span>Total Items</span>
                      <span>{lineItems.length}</span>
                    </div>
                  </div>
                </div>

                <div className={cn("p-4 rounded-2xl flex items-center gap-3 border-2 border-dashed", activeTab === "sales" ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200")}>
                  <div className={cn("p-2 rounded-xl text-white", activeTab === "sales" ? "bg-green-600" : "bg-orange-600")}>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <p className="text-[9px] font-black uppercase tracking-tighter leading-tight">
                    {activeTab === "sales" 
                      ? "Stock will be increased automatically upon processing." 
                      : "Stock will be decreased automatically upon processing."}
                  </p>
                </div>
              </div>

              <div className="mt-auto">
                <Button 
                  className={cn("w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95", activeTab === "sales" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700")} 
                  disabled={isSubmitting || lineItems.length === 0 || !selectedParentId} 
                  onClick={handleProcessReturn}
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                  {t('save')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
