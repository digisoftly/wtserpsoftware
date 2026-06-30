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
  ArrowRight,
  Eye,
  Edit,
  Trash2,
  Download
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, runTransaction, increment, setDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { DocumentTemplate } from "@/components/documents/document-template"

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
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [activeTab, setActiveTab] = React.useState("sales");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

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
    if (!selectedParentId || isEditModalOpen) return;

    if (activeTab === "sales") {
      const inv = invoices?.find(i => i.id === selectedParentId);
      if (inv?.items) {
        setLineItems(inv.items.map((item: any) => ({
          productId: item.productId,
          name: item.name,
          qty: 1, 
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
  }, [selectedParentId, activeTab, invoices, purchaseOrders, isEditModalOpen]);

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
        const returnRef = isEditModalOpen 
          ? doc(db!, "companies", companyId!, "branches", branchId!, returnCol, selectedRecord.id)
          : doc(collection(db!, "companies", companyId!, "branches", branchId!, returnCol));
        
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
          returnDate: isEditModalOpen ? selectedRecord.returnDate : new Date().toISOString(),
          status: "completed",
          createdAt: isEditModalOpen ? selectedRecord.createdAt : serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        transaction.set(returnRef, returnData, { merge: true });

        // ADJUST STOCK only on new creation to avoid double counting in prototype
        if (!isEditModalOpen) {
          const stockAdjustment = activeTab === "sales" ? 1 : -1;
          for (const item of lineItems) {
            const productRef = doc(db!, "companies", companyId!, "branches", branchId!, "products", item.productId);
            transaction.update(productRef, {
              currentStock: increment(item.qty * stockAdjustment),
              updatedAt: serverTimestamp()
            });
          }
        }
      });

      toast({ title: t('success'), description: t('successSub') });
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
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
    setSelectedRecord(null);
  };

  const openEdit = (r: any) => {
    setSelectedRecord(r);
    setSelectedParentId(r.parentId);
    setReason(r.reason || "");
    setLineItems(r.items || []);
    setIsEditModalOpen(true);
  };

  const handleDelete = () => {
    if (!selectedRecord || !db || !companyId || !branchId) return;
    const col = activeTab === "sales" ? "sales_returns" : "purchase_returns";
    const docRef = doc(db, "companies", companyId, "branches", branchId, col, selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: t('success') });
    setIsDeleteAlertOpen(false);
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
                    <TableHead className="h-12 text-[10px] uppercase font-black text-right">{t('amount')}</TableHead>
                    <TableHead className="text-right pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesReturns.map((r) => (
                    <TableRow key={r.id} className="h-14 hover:bg-muted/5 transition-colors group">
                      <TableCell className="pl-6 text-[10px] font-bold uppercase text-slate-500">{new Date(r.returnDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-black text-xs text-red-600">{r.parentNumber}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-600">{r.reason || "---"}</TableCell>
                      <TableCell className="text-right font-black text-xs text-slate-900">৳{r.totalAmount?.toLocaleString()}</TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-red-50 text-red-600 transition-colors"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl">
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => { setSelectedRecord(r); setIsViewModalOpen(true); }}><Eye className="mr-2 h-3.5 w-3.5" /> {t('view')}</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => openEdit(r)}><Edit className="mr-2 h-3.5 w-3.5" /> {t('edit')}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-xs font-bold text-red-600" onClick={() => { setSelectedRecord(r); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
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
                    <TableHead className="h-12 text-[10px] uppercase font-black text-right">{t('amount')}</TableHead>
                    <TableHead className="text-right pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseReturns.map((r) => (
                    <TableRow key={r.id} className="h-14 hover:bg-muted/5 transition-colors group">
                      <TableCell className="pl-6 text-[10px] font-bold uppercase text-slate-500">{new Date(r.returnDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-black text-xs text-blue-600">{r.parentNumber}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-600">{r.reason || "---"}</TableCell>
                      <TableCell className="text-right font-black text-xs text-slate-900">৳{r.totalAmount?.toLocaleString()}</TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl">
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => { setSelectedRecord(r); setIsViewModalOpen(true); }}><Eye className="mr-2 h-3.5 w-3.5" /> {t('view')}</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => openEdit(r)}><Edit className="mr-2 h-3.5 w-3.5" /> {t('edit')}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-xs font-bold text-red-600" onClick={() => { setSelectedRecord(r); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
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

      {/* ADD/EDIT RETURN MODAL */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) resetForm(); setIsAddModalOpen(false); setIsEditModalOpen(false); }}>
        <DialogContent className="max-w-[95vw] w-[1200px] p-0 overflow-hidden border-none shadow-2xl bg-slate-50 rounded-[2rem] md:rounded-[2.5rem]">
          <DialogHeader className={cn("p-5 text-white flex-row items-center justify-between space-y-0", activeTab === "sales" ? "bg-red-600" : "bg-blue-600")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-bold font-headline uppercase tracking-tight">{isEditModalOpen ? t('edit') : t('addReturn')}</DialogTitle>
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
                  <Select value={selectedParentId} onValueChange={setSelectedParentId} disabled={isEditModalOpen}>
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
              </div>

              <div className="mt-auto">
                <Button 
                  className={cn("w-full h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95", activeTab === "sales" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700")} 
                  disabled={isSubmitting || lineItems.length === 0 || !selectedParentId} 
                  onClick={handleProcessReturn}
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                  {isEditModalOpen ? "Update Record" : t('save')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* VIEW DIALOG */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-[21cm] w-[95vw] p-0 border-none bg-transparent shadow-none overflow-y-auto max-h-[95vh]">
          <DialogHeader className="sr-only"><DialogTitle>Return View</DialogTitle></DialogHeader>
          <div className="flex justify-end gap-3 mb-4 no-print fixed top-4 right-4 z-[100]">
            <Button onClick={() => window.print()} className="bg-white text-red-600 hover:bg-red-50 shadow-2xl rounded-full font-black text-[10px] uppercase h-10 px-6 gap-2 border-none ring-1 ring-red-100">
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>
          {selectedRecord && (
            <div className="bg-white shadow-2xl rounded-none md:rounded-[2rem] overflow-hidden">
              <DocumentTemplate
                title={activeTab === 'sales' ? 'Sales Return' : 'Purchase Return'}
                type="agreement"
                docNumber={selectedRecord.parentNumber}
                date={selectedRecord.returnDate}
                customerName={selectedRecord.parentNumber}
                items={selectedRecord.items.map((i: any) => ({
                  name: i.name,
                  quantity: i.qty,
                  unitPrice: i.price,
                  total: i.total
                }))}
                subtotal={selectedRecord.totalAmount}
                grandTotal={selectedRecord.totalAmount}
                status={selectedRecord.status}
                notes={selectedRecord.reason}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE ALERT */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tight text-slate-900">{t('delete')}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">{t('errorSub')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest" onClick={handleDelete}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}