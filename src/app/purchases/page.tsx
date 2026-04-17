"use client"

import * as React from "react"
import { Plus, Package, Search, Loader2, MoreVertical, Truck, ShoppingCart, Calendar, AlertCircle, Eye, Edit, Trash2, Printer, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
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

interface POItem {
  productId: string;
  name: string;
  quantity: number;
  unitCost: number;
  total: number;
  serials?: string[];
  requiresSerials: boolean;
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

  const [selectedSupplierId, setSelectedSupplierId] = React.useState("");
  const [lineItems, setLineItems] = React.useState<POItem[]>([]);

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

  const stats = React.useMemo(() => {
    if (!purchaseOrders) return { total: 0, monthly: 0, due: 0 };
    const thisMonth = new Date().toISOString().slice(0, 7);
    return {
      total: purchaseOrders.reduce((s, i) => s + (i.totalAmount || 0), 0),
      monthly: purchaseOrders.filter(i => i.orderDate?.startsWith(thisMonth)).reduce((s, i) => s + (i.totalAmount || 0), 0),
      due: 0 
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
        unitCost: product.costPrice || 0,
        total: product.costPrice || 0,
        requiresSerials: product.serialNumberTrackingRequired || false,
        serials: []
      }]);
    }
  };

  const handleSubmitPO = async () => {
    if (!selectedSupplierId || lineItems.length === 0) return;
    setIsSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const poRef = doc(collection(db, "companies", companyId!, "branches", branchId!, "purchase_orders"));
        transaction.set(poRef, {
          id: poRef.id,
          companyId,
          branchId,
          orderNumber: `PO-${Date.now().toString().slice(-6)}`,
          supplierId: selectedSupplierId,
          items: lineItems,
          totalAmount: totalSpend,
          status: "received", 
          orderDate: new Date().toISOString(),
          createdAt: serverTimestamp(),
        });

        for (const item of lineItems) {
          const productRef = doc(db, "companies", companyId!, "branches", branchId!, "products", item.productId);
          transaction.update(productRef, { currentStock: increment(item.quantity) });
          if (item.requiresSerials && item.serials) {
            for (const s of item.serials) {
              const serialRef = doc(collection(db, "companies", companyId!, "branches", branchId!, "serial_numbers"));
              transaction.set(serialRef, { id: serialRef.id, companyId, branchId, productId: item.productId, serialNumber: s, status: "available", purchaseOrderId: poRef.id, createdAt: serverTimestamp() });
            }
          }
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

  const handleUpdatePO = async () => {
    if (!selectedRecord) return;
    setIsSubmitting(true);
    try {
      const docRef = doc(db, "companies", companyId!, "branches", branchId!, "purchase_orders", selectedRecord.id);
      await updateDoc(docRef, { supplierId: selectedSupplierId, totalAmount: totalSpend, items: lineItems, updatedAt: serverTimestamp() });
      toast({ title: t('success'), description: t('successSub') });
      setIsEditModalOpen(false);
      resetForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDeletePO = () => {
    if (!selectedRecord || !db) return;
    const docRef = doc(db, "companies", companyId!, "branches", branchId!, "purchase_orders", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: t('success'), description: t('successSub') });
    setIsDeleteAlertOpen(false);
  };

  const resetForm = () => {
    setSelectedSupplierId("");
    setLineItems([]);
    setSelectedRecord(null);
  };

  const openEdit = (po: any) => {
    setSelectedRecord(po);
    setSelectedSupplierId(po.supplierId);
    setLineItems(po.items || []);
    setIsEditModalOpen(true);
  };

  const openView = (po: any) => {
    setSelectedRecord(po);
    setIsViewModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredPOs = purchaseOrders?.filter(po => 
    po.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <h1 className="text-xl font-bold font-headline text-orange-600">{t('purchases')}</h1>
        <Button className="bg-orange-600 hover:bg-orange-700 gap-2 rounded-full px-8 shadow-lg h-9 text-[10px] uppercase font-bold shadow-orange-100" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
          <Plus className="h-4 w-4" /> {t('receiveStock')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 no-print">
        <KPICard title={t('totalPurchase')} value={`৳${stats.total.toLocaleString()}`} icon={ShoppingCart} colorClass="bg-blue-600" />
        <KPICard title={t('monthlyPurchase')} value={`৳${stats.monthly.toLocaleString()}`} icon={Calendar} colorClass="bg-green-600" />
        <KPICard title={t('suppliersDue')} value={`৳${stats.due.toLocaleString()}`} icon={AlertCircle} colorClass="bg-red-600" />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl border shadow-sm no-print">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('search')} className="pl-9 h-10 border-none ring-1 ring-slate-200 text-xs" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 no-print"><Loader2 className="h-8 w-8 animate-spin text-orange-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden no-print">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-bold h-9">{t('poNumber')}</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9">{t('supplier')}</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9">{t('amount')}</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9">{t('status')}</TableHead>
                  <TableHead className="text-right h-9"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs?.map((po) => (
                  <TableRow key={po.id} className="h-12 hover:bg-muted/20 transition-colors">
                    <TableCell className="font-bold text-xs uppercase text-orange-600">{po.orderNumber}</TableCell>
                    <TableCell className="text-xs font-bold truncate max-w-[150px]">
                      {suppliers?.find(s => s.id === po.supplierId)?.name || t('supplier')}
                    </TableCell>
                    <TableCell className="font-bold text-xs">৳{po.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[8px] h-5 uppercase border-none px-2 font-black bg-green-50 text-green-700">
                        {t(`${po.status}_status` as any)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-orange-50 text-orange-600 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem className="text-xs" onClick={() => openView(po)}><Eye className="mr-2 h-3.5 w-3.5" /> {t('view')}</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs" onClick={() => openEdit(po)}><Edit className="mr-2 h-3.5 w-3.5" /> {t('edit')}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 text-xs" onClick={() => { setSelectedRecord(po); setIsDeleteAlertOpen(true); }}>
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}
                          </DropdownMenuItem>
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

      {/* VIEW DOCUMENT MODAL */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-[21cm] w-[95vw] p-0 border-none bg-transparent shadow-none overflow-y-auto max-h-[95vh]">
          <DialogHeader className="sr-only"><DialogTitle>{t('view')}</DialogTitle></DialogHeader>
          <div className="flex justify-end gap-2 mb-4 no-print fixed top-4 right-4 z-50">
            <Button onClick={handlePrint} size="sm" className="bg-primary shadow-lg text-[10px] uppercase font-bold rounded-full"><Printer className="mr-2 h-3.5 w-3.5" /> {t('print')}</Button>
            <Button variant="outline" size="icon" onClick={() => setIsViewModalOpen(false)} className="bg-white rounded-full h-8 w-8"><X className="h-3.5 w-3.5" /></Button>
          </div>
          {selectedRecord && (
            <div className="bg-white shadow-2xl rounded-none md:rounded-xl overflow-hidden">
              <DocumentTemplate
                title={t('purchases')}
                type="po"
                docNumber={selectedRecord.orderNumber}
                date={selectedRecord.orderDate}
                customerName={suppliers?.find(s => s.id === selectedRecord.supplierId)?.name}
                customerInfo={suppliers?.find(s => s.id === selectedRecord.supplierId)?.email + "\n" + suppliers?.find(s => s.id === selectedRecord.supplierId)?.phoneNumber}
                items={selectedRecord.items.map((i: any) => ({
                  name: i.name,
                  quantity: i.quantity,
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

      {/* NEW/EDIT PO MODAL */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-orange-600 p-6 text-white flex-row items-center gap-3">
            <Truck className="h-6 w-6" />
            <DialogTitle className="text-xl font-bold font-headline uppercase">{isEditModalOpen ? t('edit') : t('receiveStock')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 bg-slate-50">
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('supplier')}</Label>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger className="h-11 rounded-xl bg-white border-none shadow-sm ring-1 ring-slate-200"><SelectValue placeholder={t('search')} /></SelectTrigger>
                  <SelectContent>{suppliers?.map(s => <SelectItem key={s.id} value={s.id} className="text-xs font-bold">{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                {!isEditModalOpen && (
                  <div className="flex items-center justify-between"><Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('addItem')}</Label>
                    <Select onValueChange={handleAddLineItem}>
                      <SelectTrigger className="w-[250px] bg-orange-50 border-orange-200 text-[10px] font-bold uppercase rounded-lg shadow-sm"><SelectValue placeholder={t('addProduct')} /></SelectTrigger>
                      <SelectContent>{products?.map(p => <SelectItem key={p.id} value={p.id} className="text-xs font-bold">{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-3">
                  {lineItems.map((item, idx) => (
                    <Card key={idx} className="p-4 border-none shadow-sm bg-white rounded-2xl group relative">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{item.name}</p>
                          <div className="flex gap-4">
                            <div><Label className="text-[8px] uppercase opacity-50 block mb-1">{t('unitPrice')}</Label><Input type="number" value={item.unitCost} className="h-8 text-[10px] font-bold w-20 px-2" onChange={e => setLineItems(lineItems.map((li, i) => i === idx ? { ...li, unitCost: Number(e.target.value), total: Number(e.target.value) * li.quantity } : li))} /></div>
                            <div><Label className="text-[8px] uppercase opacity-50 block mb-1">{t('qty')}</Label><Input type="number" disabled={isEditModalOpen} value={item.quantity} className="h-8 text-[10px] font-bold w-16 px-2" onChange={e => setLineItems(lineItems.map((li, i) => i === idx ? { ...li, quantity: Number(e.target.value), total: item.unitCost * Number(e.target.value) } : li))} /></div>
                            <div><Label className="text-[8px] uppercase opacity-50 block mb-1">{t('total')}</Label><div className="h-8 flex items-center font-black text-xs text-orange-600">৳{item.total.toLocaleString()}</div></div>
                          </div>
                        </div>
                        {!isEditModalOpen && <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 rounded-full hover:bg-red-50 transition-colors" onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}><Trash2 className="h-3.5 w-3.5" /></Button>}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-4 bg-white p-8 rounded-[2rem] shadow-xl ring-1 ring-slate-100 flex flex-col justify-between h-fit lg:sticky lg:top-0">
              <div className="space-y-6 text-center">
                <div className="space-y-1"><p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{t('grandTotal')}</p><p className="text-4xl font-headline font-black text-orange-600">৳{totalSpend.toLocaleString()}</p></div>
              </div>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 h-14 rounded-2xl mt-10 font-black text-[10px] uppercase tracking-widest gap-2 shadow-2xl shadow-orange-100 transition-all active:scale-95" onClick={isEditModalOpen ? handleUpdatePO : handleSubmitPO} disabled={isSubmitting || lineItems.length === 0}>
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : isEditModalOpen ? <Calculator className="h-4 w-4" /> : <Package className="h-4 w-4" />} {isEditModalOpen ? t('save') : t('initializeIntake')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle className="font-headline">{t('delete')}?</AlertDialogTitle><AlertDialogDescription className="text-xs">{t('errorSub')}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="rounded-full text-[10px] uppercase font-bold h-9">{t('cancel')}</AlertDialogCancel><AlertDialogAction className="bg-red-600 rounded-full text-[10px] uppercase font-bold h-9" onClick={handleDeletePO}>{t('delete')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
