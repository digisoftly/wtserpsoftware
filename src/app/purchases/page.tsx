"use client"

import * as React from "react"
import { Plus, Package, Search, Loader2, MoreVertical, Truck, ShoppingCart, Calendar, AlertCircle, Eye, Edit, Trash2, Printer, X, Calculator, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy, doc, increment, runTransaction, updateDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { KPICard } from "@/components/dashboard/kpi-card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { toast } from "@/hooks/use-toast"
import { DocumentTemplate } from "@/components/documents/document-template"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"

interface POItem {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  total: number;
}

export default function PurchasesPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = React.useState("");
  const [lineItems, setLineItems] = React.useState<POItem[]>([]);

  // Queries
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

  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "products");
  }, [db, companyId, branchId]);
  const { data: products } = useCollection(productsQuery);

  // Stats
  const stats = React.useMemo(() => {
    if (!purchaseOrders) return { totalAmount: 0, monthlyAmount: 0, count: 0 };
    const thisMonth = new Date().toISOString().slice(0, 7);
    return {
      totalAmount: purchaseOrders.reduce((s, i) => s + (i.totalAmount || 0), 0),
      monthlyAmount: purchaseOrders.filter(i => i.orderDate?.startsWith(thisMonth)).reduce((s, i) => s + (i.totalAmount || 0), 0),
      count: purchaseOrders.length
    };
  }, [purchaseOrders]);

  const totalSpend = lineItems.reduce((sum, item) => sum + item.total, 0);

  const handleAddLineItem = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;
    
    const existing = lineItems.find(item => item.productId === productId);
    if (existing) {
      setLineItems(lineItems.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitCost } : item
      ));
    } else {
      setLineItems([...lineItems, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unit: product.unit || "Pcs",
        unitCost: product.costPrice || 0,
        total: product.costPrice || 0
      }]);
    }
  };

  const handleUpdateLine = (idx: number, field: keyof POItem, val: any) => {
    const updated = [...lineItems];
    if (field === 'quantity' || field === 'unitCost') {
      const numVal = Number(val) || 0;
      (updated[idx] as any)[field] = numVal;
      updated[idx].total = updated[idx].quantity * updated[idx].unitCost;
    }
    setLineItems(updated);
  };

  const handleSubmitPO = async () => {
    if (!selectedSupplierId || lineItems.length === 0) return;
    setIsSubmitting(true);
    try {
      await runTransaction(db!, async (transaction) => {
        const poRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "purchase_orders"));
        const orderNumber = `PO-${Date.now().toString().slice(-6)}`;
        
        transaction.set(poRef, {
          id: poRef.id,
          companyId,
          branchId,
          orderNumber,
          supplierId: selectedSupplierId,
          supplierName: suppliers?.find(s => s.id === selectedSupplierId)?.name || "Vendor",
          items: lineItems,
          totalAmount: totalSpend,
          status: "received",
          orderDate: new Date().toISOString(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Atomic Stock Increase
        for (const item of lineItems) {
          const productRef = doc(db!, "companies", companyId!, "branches", branchId!, "products", item.productId);
          transaction.update(productRef, { 
            currentStock: increment(item.quantity),
            costPrice: item.unitCost, // Update cost price to latest
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

  const handleDeletePO = () => {
    if (!selectedRecord || !db || !companyId || !branchId) return;
    const docRef = doc(db, "companies", companyId, "branches", branchId, "purchase_orders", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: t('success'), description: t('successSub') });
    setIsDeleteAlertOpen(false);
    setSelectedRecord(null);
  };

  const resetForm = () => {
    setSelectedSupplierId("");
    setLineItems([]);
    setSelectedRecord(null);
  };

  const openView = (po: any) => {
    setSelectedRecord(po);
    setIsViewModalOpen(true);
  };

  const filteredPOs = purchaseOrders?.filter(po => 
    po.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold font-headline text-orange-600 uppercase tracking-tight">{t('purchases')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <Button className="rounded-full gap-2 h-10 px-8 bg-orange-600 hover:bg-orange-700 font-bold text-[10px] uppercase shadow-xl shadow-orange-100 transition-all active:scale-95 w-full md:w-auto" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
          <Plus className="h-4 w-4" /> {t('receiveStock')}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 no-print">
        <KPICard title={t('totalPurchase')} value={`৳${stats.totalAmount.toLocaleString()}`} icon={ShoppingCart} colorClass="bg-blue-600" />
        <KPICard title={t('monthlyPurchase')} value={`৳${stats.monthlyAmount.toLocaleString()}`} icon={Calendar} colorClass="bg-green-600" />
        <KPICard title={t('totalOrders')} value={stats.count} icon={Package} colorClass="bg-orange-600" />
      </div>

      {/* Search and Filters */}
      <div className="flex gap-2 bg-white p-3 rounded-xl border shadow-sm ring-1 ring-slate-100 no-print">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input 
            placeholder={t('search')} 
            className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs focus:ring-2 focus:ring-orange-500 transition-all outline-none" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* Purchases Table */}
      {isLoading ? (
        <div className="flex justify-center py-20 no-print"><Loader2 className="h-8 w-8 animate-spin text-orange-600" /></div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 no-print">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="h-12 text-[10px] uppercase font-black pl-6">{t('poNumber')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('supplier')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('amount')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black text-center">{t('status')}</TableHead>
                  <TableHead className="h-12 text-right pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs?.map((po) => (
                  <TableRow key={po.id} className="h-16 hover:bg-muted/5 transition-colors group">
                    <TableCell className="pl-6">
                      <span className="font-black text-xs uppercase text-orange-600">{po.orderNumber}</span>
                      <p className="text-[8px] text-muted-foreground font-bold mt-0.5">{new Date(po.orderDate).toLocaleDateString()}</p>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-700">{po.supplierName}</TableCell>
                    <TableCell className="font-black text-xs text-slate-900">৳{po.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[8px] h-5 uppercase border-none px-2 font-black bg-green-50 text-green-700">
                        {t(`${po.status}_status` as any)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-orange-50 text-orange-600 transition-colors"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl">
                          <DropdownMenuItem className="text-xs font-bold" onClick={() => openView(po)}><Eye className="mr-2 h-3.5 w-3.5" /> {t('view')}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-xs font-bold text-red-600" onClick={() => { setSelectedRecord(po); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* PURCHASE BUILDER MODAL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-[95vw] w-[1200px] p-0 overflow-hidden border-none shadow-2xl bg-slate-50 rounded-[2rem] md:rounded-[2.5rem]">
          <DialogHeader className="bg-orange-600 p-5 text-white flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-bold font-headline uppercase tracking-tight">{t('receiveStock')}</DialogTitle>
                <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em] leading-none mt-1 hidden md:block">Inventory Procurement Terminal</p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row h-[80vh] overflow-hidden">
            {/* Main Form Side */}
            <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t('supplier')}</Label>
                  <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                    <SelectTrigger className="h-12 rounded-2xl bg-white border-none ring-1 ring-slate-200 shadow-sm transition-all focus:ring-2 focus:ring-orange-500">
                      <SelectValue placeholder={t('search')} />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map(s => <SelectItem key={s.id} value={s.id} className="text-xs font-bold">{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Select Product to Add</Label>
                  <Select onValueChange={handleAddLineItem}>
                    <SelectTrigger className="h-12 rounded-2xl bg-white border-none ring-1 ring-slate-200 shadow-sm transition-all focus:ring-2 focus:ring-orange-500">
                      <SelectValue placeholder={t('addProduct')} />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map(p => <SelectItem key={p.id} value={p.id} className="text-xs font-bold">{p.name} (Stock: {p.currentStock} {p.unit})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Items Table */}
              <div className="flex-1 bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden flex flex-col border border-slate-50 min-h-0">
                <div className="overflow-auto flex-1 custom-scrollbar">
                  <Table>
                    <TableHeader className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
                      <TableRow>
                        <TableHead className="text-[10px] uppercase font-black py-4 pl-8">{t('itemDescription')}</TableHead>
                        <TableHead className="text-[10px] uppercase font-black text-center w-40">{t('qty')} / Unit</TableHead>
                        <TableHead className="text-[10px] uppercase font-black text-right w-40">{t('unitPrice')}</TableHead>
                        <TableHead className="text-[10px] uppercase font-black text-right w-40 pr-8">{t('total')}</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-64 text-center">
                            <div className="flex flex-col items-center opacity-20">
                              <Package className="h-12 w-12 mb-4" />
                              <p className="text-[10px] uppercase font-black tracking-[0.3em]">{t('noItemsSelected')}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        lineItems.map((item, idx) => (
                          <TableRow key={idx} className="h-16 md:h-20 hover:bg-slate-50/50 transition-colors group">
                            <TableCell className="pl-8">
                              <span className="text-[11px] md:text-sm font-black text-slate-900 uppercase tracking-tighter truncate">{item.name}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 justify-center">
                                <Input 
                                  type="number" 
                                  className="h-10 text-center font-black text-sm rounded-xl w-20 bg-slate-50 border-none" 
                                  value={item.quantity} 
                                  onChange={e => handleUpdateLine(idx, 'quantity', e.target.value)} 
                                />
                                <span className="text-[10px] font-black uppercase text-muted-foreground w-8 text-left">{item.unit || 'Pcs'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Input 
                                type="number" 
                                className="h-10 text-right font-black text-sm rounded-xl w-32 bg-slate-50 border-none ml-auto" 
                                value={item.unitCost} 
                                onChange={e => handleUpdateLine(idx, 'unitCost', e.target.value)} 
                              />
                            </TableCell>
                            <TableCell className="text-right pr-8 text-sm font-black text-orange-600">
                              ৳{item.total.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100" onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}>
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

            {/* Summary Sidebar */}
            <div className="w-full lg:w-[350px] bg-white border-l border-slate-100 p-8 space-y-8 flex flex-col shadow-2xl relative z-20 shrink-0">
              <div className="space-y-6">
                <div className="p-8 rounded-[2.5rem] bg-orange-600 text-white shadow-2xl shadow-orange-100 space-y-4 text-center">
                  <p className="text-[10px] uppercase font-black opacity-60 tracking-[0.2em]">{t('grandTotal')}</p>
                  <h2 className="text-4xl font-headline font-black tracking-tighter">৳{totalSpend.toLocaleString()}</h2>
                </div>

                <div className="p-5 bg-slate-50 rounded-3xl space-y-3">
                  <div className="flex items-center gap-3">
                    <Calculator className="h-4 w-4 text-orange-600" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Order Summary</p>
                  </div>
                  <div className="space-y-1.5 border-t border-slate-200 pt-3">
                    <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                      <span>Total Items</span>
                      <span>{lineItems.length}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                      <span>Total Qty</span>
                      <span>{lineItems.reduce((s, i) => s + i.quantity, 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <Button 
                  className="w-full h-16 bg-orange-600 hover:bg-orange-700 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-orange-100 transition-all active:scale-95" 
                  disabled={isSubmitting || lineItems.length === 0 || !selectedSupplierId} 
                  onClick={handleSubmitPO}
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                  {t('initializeIntake')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* VIEW DOCUMENT MODAL */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-[21cm] w-[95vw] p-0 border-none bg-transparent shadow-none overflow-y-auto max-h-[95vh] rounded-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Purchase Order View</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-3 mb-4 no-print fixed top-4 right-4 md:top-6 md:right-6 z-[100]">
            <Button onClick={() => window.print()} className="bg-white text-orange-600 hover:bg-orange-50 shadow-2xl rounded-full font-black text-[10px] uppercase h-10 px-6 gap-2 border-none ring-1 ring-orange-100">
              <Printer className="h-4 w-4" /> {t('print')}
            </Button>
          </div>
          {selectedRecord && (
            <div className="bg-white shadow-2xl rounded-none md:rounded-[2rem] overflow-hidden">
              <DocumentTemplate
                title={t('purchases')}
                type="po"
                docNumber={selectedRecord.orderNumber}
                date={selectedRecord.orderDate}
                customerName={selectedRecord.supplierName}
                items={selectedRecord.items.map((i: any) => ({
                  name: i.name,
                  quantity: i.quantity,
                  unit: i.unit,
                  unitPrice: i.unitCost,
                  total: i.total
                }))}
                subtotal={selectedRecord.totalAmount}
                grandTotal={selectedRecord.totalAmount}
                status={selectedRecord.status}
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
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest" onClick={handleDeletePO}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
