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
  MoreVertical,
  User,
  ChevronDown,
  ChevronRight
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
  const { t, formatCurrency } = useTranslation();
  
  const [view, setView] = React.useState<ViewState>('list');
  const [formMode, setFormMode] = React.useState<'add' | 'edit'>('add');
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [activeTab, setActiveTab] = React.useState("sales");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [expandedCustomers, setExpandedCustomers] = React.useState<Record<string, boolean>>({});

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

  const unitsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_units"), orderBy("name"));
  }, [db, companyId]);
  const { data: masterUnits } = useCollection(unitsQuery);

  // Totals
  const totalReturnAmount = React.useMemo(() => lineItems.reduce((sum, item) => sum + item.total, 0), [lineItems]);

  const stats = React.useMemo(() => ({
    salesAmount: salesReturns?.reduce((s, r) => s + (r.totalAmount || 0), 0) || 0,
    purchaseAmount: purchaseReturns?.reduce((s, r) => s + (r.totalAmount || 0), 0) || 0,
  }), [salesReturns, purchaseReturns]);

  // Grouping Logic for List View
  const groupedData = React.useMemo(() => {
    const currentData = activeTab === "sales" ? salesReturns : purchaseReturns;
    if (!currentData) return [];

    const groups: Record<string, any> = {};

    const filtered = currentData.filter(r => 
      r.parentNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.forEach(r => {
      const cId = r.parentNumber || 'unknown';
      const cName = r.parentNumber || t('unknownCustomer');

      if (!groups[cId]) {
        groups[cId] = {
          id: cId,
          name: cName,
          totalDocs: 0,
          totalAmount: 0,
          lastDate: r.returnDate,
          records: []
        };
      }

      groups[cId].records.push(r);
      groups[cId].totalDocs += 1;
      groups[cId].totalAmount += (Number(r.totalAmount) || 0);
      if (new Date(r.returnDate) > new Date(groups[cId].lastDate)) {
        groups[cId].lastDate = r.returnDate;
      }
    });

    return Object.values(groups);
  }, [activeTab, salesReturns, purchaseReturns, searchTerm, t]);

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

  const toggleCustomer = (id: string) => {
    setExpandedCustomers(prev => ({ ...prev, [id]: !prev[id] }));
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
            <Card className="p-8 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-8">
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

              <div className="rounded-[2rem] border shadow-sm overflow-hidden flex flex-col min-h-[300px]">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 pl-8 h-12">{t('itemDescription')}</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 text-center w-32">Unit</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 text-center w-32">{t('qty')}</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right pr-8 w-40">{t('total')}</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="h-64 text-center opacity-30 italic text-xs uppercase font-bold tracking-widest">Add items to initiate return</TableCell></TableRow>
                    ) : (
                      lineItems.map((item, idx) => (
                        <TableRow 
                          key={idx} 
                          className={cn(
                            "h-16 transition-all border-b border-white/50",
                            idx % 2 === 0 ? "bg-[#EAF6FF] hover:bg-[#D9EFFF]" : "bg-[#EEF9F1] hover:bg-[#E1F2E6]"
                          )}
                        >
                          <TableCell className="pl-8">
                            <span className="font-black text-xs uppercase tracking-tight text-slate-900">{item.name}</span>
                          </TableCell>
                          <TableCell>
                            <Select value={item.unit} onValueChange={(val) => handleUpdateItem(idx, 'unit', val)}>
                              <SelectTrigger className="h-8 border-none bg-slate-50 text-[10px] font-bold uppercase w-20 mx-auto">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {masterUnits?.map(u => <SelectItem key={u.id} value={u.shortName} className="text-xs font-bold">{u.shortName}</SelectItem>)}
                                {!masterUnits?.length && <SelectItem value="Pcs">Pcs</SelectItem>}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Input type="number" className="h-9 text-center font-black text-xs rounded-xl w-16 bg-slate-50 border-none" value={item.qty} onChange={e => handleUpdateItem(idx, 'qty', Number(e.target.value))} />
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
        <KPICard title="salesReturn" value={formatCurrency(stats.salesAmount)} icon={ArrowDownCircle} colorClass="bg-red-600" />
        <KPICard title="purchaseReturn" value={formatCurrency(stats.purchaseAmount)} icon={ArrowUpCircle} colorClass="bg-blue-600" />
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

        <TabsContent value={activeTab} className="space-y-4">
          <div className="flex gap-2 bg-white p-3 rounded-xl border shadow-sm ring-1 ring-slate-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input 
                placeholder={t('search')} 
                className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs focus:ring-2 focus:ring-red-500 transition-all outline-none font-bold" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          {(isSalesLoading || isPurchaseLoading) ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-red-600" /></div>
          ) : groupedData.length > 0 ? (
            <div className="space-y-4">
              {groupedData.map((customer) => (
                <Card key={customer.id} className="border-none shadow-sm overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-slate-100">
                  <div 
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50"
                    onClick={() => toggleCustomer(customer.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-black uppercase text-slate-900 leading-tight">{customer.name}</h2>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            {customer.totalDocs} {t('documents')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden md:block">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('totalAmount')}</p>
                        <p className="text-sm font-black text-red-600">{formatCurrency(customer.totalAmount)}</p>
                      </div>
                      {expandedCustomers[customer.id] ? <ChevronDown className="h-5 w-5 text-slate-300" /> : <ChevronRight className="h-5 w-5 text-slate-300" />}
                    </div>
                  </div>

                  {expandedCustomers[customer.id] && (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow className="h-10">
                            <TableHead className="h-10 text-[9px] uppercase font-black pl-8">{t('date')}</TableHead>
                            <TableHead className="h-10 text-[9px] uppercase font-black">{t('docNo')}</TableHead>
                            <TableHead className="h-10 text-[9px] uppercase font-black">{t('reason')}</TableHead>
                            <TableHead className="h-10 text-[9px] uppercase font-black text-right">{t('amount')}</TableHead>
                            <TableHead className="h-10 text-right pr-8 w-32">{t('actions')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customer.records.map((r: any, rIdx: number) => (
                            <TableRow 
                              key={r.id} 
                              className={cn(
                                "h-14 transition-all border-b border-white/50",
                                rIdx % 2 === 0 ? "bg-[#EAF6FF] hover:bg-[#D9EFFF]" : "bg-[#EEF9F1] hover:bg-[#E1F2E6]"
                              )}
                            >
                              <TableCell className="pl-8 text-[10px] font-bold uppercase text-slate-500">{new Date(r.returnDate).toLocaleDateString()}</TableCell>
                              <TableCell className="font-black text-[10px] text-red-600 uppercase tracking-tighter">{r.parentNumber}</TableCell>
                              <TableCell className="text-[10px] font-bold text-slate-600 truncate max-w-[200px]">{r.reason || "---"}</TableCell>
                              <TableCell className="text-right font-black text-[10px] text-slate-900">{formatCurrency(r.totalAmount)}</TableCell>
                              <TableCell className="text-right pr-8">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-blue-600" onClick={() => openView(r)}><Eye className="h-3.5 w-3.5" /></Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-amber-600" onClick={() => openEdit(r)}><Edit className="h-3.5 w-3.5" /></Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-red-600" onClick={() => { setSelectedRecord(r); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-24 bg-white rounded-[3rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
              <RotateCcw className="h-12 w-12 text-red-200 mb-6" />
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]">{t('noData')}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase text-slate-900 tracking-tight">{t('confirmDelete')}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">This action will permanently remove the return record.</AlertDialogDescription>
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
