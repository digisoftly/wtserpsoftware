
"use client"

import * as React from "react"
import { 
  RotateCcw, 
  Plus, 
  Search, 
  Loader2, 
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
  Download,
  Printer,
  ArrowLeft,
  Save,
  FileText,
  PlusCircle,
  History,
  MoreVertical
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, runTransaction, increment } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
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
  unit: string;
  price: number;
  total: number;
}

type ViewState = 'list' | 'form' | 'view';

export default function ReturnsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  
  const [view, setView] = React.useState<ViewState>('list');
  const [formMode, setFormMode] = React.useState<'add' | 'edit'>('add');
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
  const totalReturnAmount = React.useMemo(() => lineItems.reduce((sum, item) => sum + item.total, 0), [lineItems]);

  const stats = React.useMemo(() => ({
    salesAmount: salesReturns?.reduce((s, r) => s + (r.totalAmount || 0), 0) || 0,
    purchaseAmount: purchaseReturns?.reduce((s, r) => s + (r.totalAmount || 0), 0) || 0,
  }), [salesReturns, purchaseReturns]);

  // Available items from selected source document
  const availableSourceItems = React.useMemo(() => {
    if (!selectedParentId) return [];
    if (activeTab === "sales") {
      return invoices?.find(i => i.id === selectedParentId)?.items || [];
    } else {
      return purchaseOrders?.find(p => p.id === selectedParentId)?.items || [];
    }
  }, [selectedParentId, activeTab, invoices, purchaseOrders]);

  const handleAddItemToReturn = (sourceItem: any) => {
    const exists = lineItems.find(i => i.productId === sourceItem.productId);
    if (exists) {
      toast({ title: "Item Already Added", description: "You can adjust quantity in the table below." });
      return;
    }

    setLineItems([...lineItems, {
      productId: sourceItem.productId,
      name: sourceItem.name,
      qty: 1,
      unit: sourceItem.unit || "Pcs",
      price: sourceItem.price || sourceItem.unitPrice || 0,
      total: sourceItem.price || sourceItem.unitPrice || 0
    }]);
  };

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
        const returnRef = formMode === 'edit' 
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
          returnDate: formMode === 'edit' ? selectedRecord.returnDate : new Date().toISOString(),
          status: "completed",
          createdAt: formMode === 'edit' ? selectedRecord.createdAt : serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        transaction.set(returnRef, returnData, { merge: true });

        if (formMode === 'add') {
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

      toast({ title: t('success') });
      resetForm();
      setView('list');
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
    setFormMode('add');
  };

  const openAdd = () => {
    resetForm();
    setFormMode('add');
    setView('form');
  };

  const openEdit = (r: any) => {
    setSelectedRecord(r);
    setSelectedParentId(r.parentId);
    setReason(r.reason || "");
    setLineItems(r.items || []);
    setFormMode('edit');
    setView('form');
  };

  const openView = (r: any) => {
    setSelectedRecord(r);
    setView('view');
  };

  const handleDelete = () => {
    if (!selectedRecord || !db || !companyId || !branchId) return;
    const col = activeTab === "sales" ? "sales_returns" : "purchase_returns";
    const docRef = doc(db, "companies", companyId, "branches", branchId, col, selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: t('success') });
    setIsDeleteAlertOpen(false);
  };

  if (view === 'view' && selectedRecord) {
    return (
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setView('list')} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold font-headline uppercase tracking-tight text-red-600">{selectedRecord.parentNumber}</h1>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" className="rounded-full h-10 px-6 font-black text-[10px] uppercase gap-2 border-none ring-1 ring-slate-200 bg-white shadow-sm" onClick={() => window.print()}>
               <Printer className="h-4 w-4" /> {t('print')}
             </Button>
             <Button className="bg-red-600 hover:bg-red-700 text-white rounded-full h-10 px-8 font-black text-[10px] uppercase gap-2 shadow-xl shadow-red-100" onClick={() => window.print()}>
               <Download className="h-4 w-4" /> Download PDF
             </Button>
          </div>
        </div>

        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-slate-100 ring-1 ring-slate-100/50">
          <DocumentTemplate
            title={activeTab === 'sales' ? 'Sales Return' : 'Purchase Return'}
            type="agreement"
            docNumber={selectedRecord.parentNumber}
            date={selectedRecord.returnDate}
            customerName={selectedRecord.parentNumber}
            items={selectedRecord.items.map((i: any) => ({
              name: i.name,
              quantity: i.qty,
              unit: i.unit,
              unitPrice: i.price,
              total: i.total
            }))}
            subtotal={selectedRecord.totalAmount}
            grandTotal={selectedRecord.totalAmount}
            status={selectedRecord.status}
            notes={selectedRecord.reason}
          />
        </div>
      </div>
    );
  }

  if (view === 'form') {
    return (
      <div className="flex flex-col h-full bg-slate-50 min-h-screen pb-20">
        <div className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setView('list')} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-red-600">
              {formMode === 'edit' ? t('edit') : t('addReturn')}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => setView('list')}>
              {t('cancel')}
            </Button>
            <Button 
              className={cn("rounded-full px-8 h-10 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl gap-2", activeTab === "sales" ? "bg-red-600 hover:bg-red-700 shadow-red-100" : "bg-blue-600 hover:bg-blue-700 shadow-blue-100")} 
              disabled={isSubmitting || !selectedParentId || lineItems.length === 0} 
              onClick={handleProcessReturn}
            >
              {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
              {t('save')}
            </Button>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto w-full p-4 md:p-8 flex flex-col xl:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    {activeTab === "sales" ? t('invoiceNumber') : t('poNumber')}
                  </Label>
                  <Select value={selectedParentId} onValueChange={(val) => { setSelectedParentId(val); setLineItems([]); }} disabled={formMode === 'edit'}>
                    <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs">
                      <SelectValue placeholder={t('search')} />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] rounded-xl shadow-2xl">
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
                    className="h-12 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 text-xs font-bold" 
                    value={reason} 
                    onChange={e => setReason(e.target.value)} 
                    placeholder="e.g. Damaged Goods"
                  />
                </div>
              </div>

              {selectedParentId && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                   <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Available Items from Source</h3>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {availableSourceItems.map((item: any, i: number) => (
                        <div key={i} className="p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-100 flex justify-between items-center group hover:bg-white hover:ring-red-200 transition-all">
                           <div className="flex flex-col">
                              <span className="text-[11px] font-black uppercase truncate max-w-[120px]">{item.name}</span>
                              <span className="text-[9px] font-bold text-slate-400">Qty in Doc: {item.qty || item.quantity}</span>
                           </div>
                           <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 rounded-full text-red-600 hover:bg-red-50"
                            onClick={() => handleAddItemToReturn(item)}
                           >
                             <PlusCircle className="h-4 w-4" />
                           </Button>
                        </div>
                      ))}
                   </div>
                </div>
              )}

              <div className="rounded-[2rem] border shadow-sm overflow-hidden flex flex-col min-h-[300px]">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 pl-8 h-12">{t('itemDescription')}</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 text-center w-32">{t('qty')}</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right pr-8 w-40">{t('total')}</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="h-64 text-center opacity-30 italic text-xs uppercase font-bold tracking-widest">Add items from the section above to initiate return</TableCell></TableRow>
                    ) : (
                      lineItems.map((item, idx) => (
                        <TableRow key={idx} className="h-16 group hover:bg-slate-50/20">
                          <TableCell className="pl-8">
                            <span className="font-black text-xs uppercase tracking-tight text-slate-900">{item.name}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Input type="number" className="h-9 text-center font-black text-xs rounded-xl w-16 bg-slate-50 border-none" value={item.qty} onChange={e => handleUpdateQty(idx, Number(e.target.value))} />
                              <span className="text-[9px] font-black uppercase text-slate-400">{item.unit}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <span className="font-black text-xs text-red-600">৳{item.total.toLocaleString()}</span>
                          </TableCell>
                          <TableCell className="pr-4">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 rounded-full hover:bg-red-50" onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}><X className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

          <div className="w-full xl:w-[350px] space-y-6">
             <Card className={cn("p-8 rounded-[2.5rem] shadow-2xl space-y-4 text-center text-white", activeTab === "sales" ? "bg-red-600" : "bg-blue-600")}>
                <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em]">Net Return Value</p>
                <h2 className="text-4xl font-headline font-black tracking-tighter">৳{totalReturnAmount.toLocaleString()}</h2>
             </Card>

             <Card className="p-6 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6">
                <div className="p-5 bg-slate-50 rounded-3xl space-y-3">
                   <div className="flex items-center gap-3">
                     <Calculator className="h-4 w-4 text-slate-400" />
                     <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Return Summary</p>
                   </div>
                   <div className="pt-3 border-t border-slate-200">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                        <span>Items Count</span>
                        <span>{lineItems.length}</span>
                      </div>
                   </div>
                </div>
                <Button 
                  className={cn("w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 text-white", activeTab === "sales" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700")} 
                  disabled={isSubmitting || !selectedParentId || lineItems.length === 0} 
                  onClick={handleProcessReturn}
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                  {formMode === 'edit' ? "Update Record" : "Synchronize Return"}
                </Button>
             </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-headline text-red-600 uppercase tracking-tight">{t('returns')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <Button 
          className="bg-red-600 hover:bg-red-700 gap-2 rounded-full shadow-xl shadow-red-100 h-10 px-8 text-[10px] uppercase font-black transition-all active:scale-95 w-full md:w-auto" 
          onClick={openAdd}
        >
          <Plus className="h-4 w-4" />
          {t('addReturn')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard title={t('salesReturn')} value={`৳${stats.salesAmount.toLocaleString()}`} icon={ArrowDownCircle} colorClass="bg-red-600" />
        <KPICard title={t('purchaseReturn')} value={`৳${stats.purchaseAmount.toLocaleString()}`} icon={ArrowUpCircle} colorClass="bg-blue-600" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
              <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="h-12 text-[10px] uppercase font-black pl-8">{t('date')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">{t('invoiceNumber')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">{t('reason')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black text-right">{t('amount')}</TableHead>
                      <TableHead className="h-12 text-right pr-8 sticky right-0 bg-white/95 backdrop-blur-sm z-20 w-[120px]">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesReturns.map((r) => (
                      <TableRow key={r.id} className="h-16 hover:bg-muted/5 transition-colors group">
                        <TableCell className="pl-8 text-[10px] font-bold uppercase text-slate-500">{new Date(r.returnDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-black text-xs text-red-600 uppercase tracking-tighter">{r.parentNumber}</TableCell>
                        <TableCell className="text-xs font-bold text-slate-600">{r.reason || "---"}</TableCell>
                        <TableCell className="text-right font-black text-xs text-slate-900">৳{r.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell className="text-right pr-8 sticky right-0 bg-white/90 backdrop-blur-sm group-hover:bg-slate-50/90 transition-colors z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                           <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => openView(r)}><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-amber-600" onClick={() => openEdit(r)}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-600" onClick={() => { setSelectedRecord(r); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                           </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
            <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
              <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="h-12 text-[10px] uppercase font-black pl-8">{t('date')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">{t('poNumber')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">{t('reason')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black text-right">{t('amount')}</TableHead>
                      <TableHead className="h-12 text-right pr-8 sticky right-0 bg-white/95 backdrop-blur-sm z-20 w-[120px]">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseReturns.map((r) => (
                      <TableRow key={r.id} className="h-16 hover:bg-muted/5 transition-colors group">
                        <TableCell className="pl-8 text-[10px] font-bold uppercase text-slate-500">{new Date(r.returnDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-black text-xs text-blue-600 uppercase tracking-tighter">{r.parentNumber}</TableCell>
                        <TableCell className="text-xs font-bold text-slate-600">{r.reason || "---"}</TableCell>
                        <TableCell className="text-right font-black text-xs text-slate-900">৳{r.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell className="text-right pr-8 sticky right-0 bg-white/90 backdrop-blur-sm group-hover:bg-slate-50/90 transition-colors z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                           <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => openView(r)}><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-amber-600" onClick={() => openEdit(r)}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-600" onClick={() => { setSelectedRecord(r); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                           </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <div className="p-24 bg-white rounded-[3rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
              <RotateCcw className="h-12 w-12 text-red-200 mb-6" />
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]">{t('noReturns')}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase text-slate-900 tracking-tight">{t('delete')}?</AlertDialogTitle>
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
