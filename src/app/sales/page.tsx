"use client"

import * as React from "react"
import { 
  Plus, 
  Search, 
  Loader2, 
  MoreVertical, 
  Eye, 
  Trash2, 
  ShoppingCart, 
  TrendingUp, 
  Calendar, 
  ShoppingBag, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  Calculator, 
  CreditCard,
  Scan,
  User,
  PackagePlus,
  Download,
  Edit,
  ArrowRight,
  Printer
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, runTransaction, serverTimestamp, increment, where, limit, deleteDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { DocumentTemplate } from "@/components/documents/document-template"
import { useBulkSelection } from "@/hooks/use-bulk-selection"
import { BulkActionToolbar } from "@/components/layout/bulk-action-toolbar"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

interface InvoiceItem {
  productId: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  total: number;
  serials: string[];
  isSerialized: boolean;
  isCustom?: boolean;
}

export default function SalesPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const deferredSearch = React.useDeferredValue(searchTerm);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // POS Scanner State
  const [scannerInput, setScannerInput] = React.useState("");

  // Form State
  const [isManualCustomer, setIsManualCustomer] = React.useState(false);
  const [manualCustomerName, setManualCustomerName] = React.useState("");
  const [manualCustomerPhone, setManualCustomerPhone] = React.useState("");
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [invoiceDate, setInvoiceDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [lineItems, setLineItems] = React.useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = React.useState(0);
  const [vatPercent, setVatPercent] = React.useState(15);
  const [paidAmount, setPaidAmount] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState("cash");

  // Queries
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "sales_invoices"), 
      orderBy("createdAt", "desc"),
      limit(100)
    );
  }, [db, companyId, branchId]);
  const { data: invoices, isLoading } = useCollection(invoicesQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "products");
  }, [db, companyId, branchId]);
  const { data: products } = useCollection(productsQuery);

  const serialsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "serial_numbers"), 
      where("status", "==", "available"),
      limit(200)
    );
  }, [db, companyId, branchId]);
  const { data: availableSerials } = useCollection(serialsQuery);

  // Bulk Selection
  const { 
    selectedIds, 
    isAllSelected, 
    isSomeSelected, 
    toggleSelect, 
    toggleSelectAll, 
    clearSelection, 
    selectedCount 
  } = useBulkSelection(invoices);

  // Calculations
  const subtotal = React.useMemo(() => lineItems.reduce((sum, item) => sum + item.total, 0), [lineItems]);
  const vatAmount = React.useMemo(() => (subtotal - discount) * (vatPercent / 100), [subtotal, discount, vatPercent]);
  const totalAmount = React.useMemo(() => subtotal - discount + vatAmount, [subtotal, discount, vatAmount]);
  const balanceDue = React.useMemo(() => totalAmount - paidAmount, [totalAmount, paidAmount]);

  const stats = React.useMemo(() => {
    if (!invoices) return { today: 0, monthly: 0, total: 0, due: 0 };
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);
    
    return {
      today: invoices.filter(i => i.invoiceDate?.startsWith(today)).reduce((s, i) => s + (i.totalAmount || 0), 0),
      monthly: invoices.filter(i => i.invoiceDate?.startsWith(thisMonth)).reduce((s, i) => s + (i.totalAmount || 0), 0),
      total: invoices.length,
      due: invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.balanceDue || 0), 0)
    };
  }, [invoices]);

  const handleAddProduct = React.useCallback((productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    setLineItems(prev => {
      const existingIdx = prev.findIndex(item => item.productId === productId);
      if (existingIdx > -1 && !product.serialNumberTrackingRequired && !prev[existingIdx].isCustom) {
        const updated = [...prev];
        updated[existingIdx].qty += 1;
        updated[existingIdx].total = updated[existingIdx].qty * updated[existingIdx].price;
        return updated;
      } else {
        return [...prev, {
          productId: product.id,
          name: product.name,
          qty: 1,
          unit: product.unit || "Pcs",
          price: product.unitPrice || 0,
          total: product.unitPrice || 0,
          isSerialized: product.serialNumberTrackingRequired || false,
          serials: [],
          isCustom: false
        }];
      }
    });
  }, [products]);

  const handleAddCustomItem = React.useCallback(() => {
    setLineItems(prev => [...prev, {
      productId: `custom-${Date.now()}`,
      name: "",
      qty: 1,
      unit: "Pcs",
      price: 0,
      total: 0,
      isSerialized: false,
      serials: [],
      isCustom: true
    }]);
  }, []);

  const handleScannerInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerInput || isSubmitting) return;

    const foundSerial = availableSerials?.find(s => s.serialNumber.toLowerCase() === scannerInput.toLowerCase());
    if (foundSerial) {
      const product = products?.find(p => p.id === foundSerial.productId);
      if (product) {
        setLineItems(prev => {
          const existingIdx = prev.findIndex(item => item.productId === product.id);
          if (existingIdx > -1) {
            const updated = [...prev];
            if (!updated[existingIdx].serials.includes(foundSerial.serialNumber)) {
              updated[existingIdx].serials.push(foundSerial.serialNumber);
              updated[existingIdx].qty = updated[existingIdx].serials.length;
              updated[existingIdx].total = updated[existingIdx].qty * updated[existingIdx].price;
              return updated;
            }
            return prev;
          } else {
            return [...prev, {
              productId: product.id,
              name: product.name,
              qty: 1,
              unit: product.unit || "Pcs",
              price: product.unitPrice || 0,
              total: product.unitPrice || 0,
              isSerialized: true,
              serials: [foundSerial.serialNumber],
              isCustom: false
            }];
          }
        });
        toast({ title: t('addItem'), description: `${foundSerial.serialNumber} added.` });
        setScannerInput("");
        return;
      }
    }

    const foundProduct = products?.find(p => p.sku?.toLowerCase() === scannerInput.toLowerCase());
    if (foundProduct) {
      handleAddProduct(foundProduct.id);
      setScannerInput("");
      return;
    }

    toast({ variant: "destructive", title: t('error'), description: "Item or Serial not found." });
    setScannerInput("");
  };

  const handleUpdateItem = (idx: number, field: keyof InvoiceItem, val: any) => {
    setLineItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: val };
      if (field === 'qty') updated.qty = Math.max(1, Number(val) || 0);
      if (field === 'price') updated.price = Math.max(0, Number(val) || 0);
      if (field === 'qty' || field === 'price') updated.total = updated.qty * updated.price;
      return updated;
    }));
  };

  const handleRemoveItem = React.useCallback((idx: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSaveInvoice = async () => {
    if (isSubmitting) return;
    if (!isManualCustomer && !selectedCustomerId) {
      toast({ variant: "destructive", title: t('error'), description: "Please select a customer." });
      return;
    }
    if (lineItems.length === 0) {
      toast({ variant: "destructive", title: t('error'), description: t('noItemsSelected') });
      return;
    }

    setIsSubmitting(true);
    try {
      await runTransaction(db!, async (transaction) => {
        const invoiceRef = isEditModalOpen 
          ? doc(db!, "companies", companyId!, "branches", branchId!, "sales_invoices", selectedRecord.id)
          : doc(collection(db!, "companies", companyId!, "branches", branchId!, "sales_invoices"));
        
        let customerName = manualCustomerName;
        let finalCustomerId = selectedCustomerId;

        if (!isManualCustomer) {
          const customer = customers?.find(c => c.id === selectedCustomerId);
          customerName = customer ? `${customer.firstName} ${customer.lastName}` : "Client";
        } else {
          finalCustomerId = "manual";
        }

        const invoiceData = {
          id: invoiceRef.id,
          companyId,
          branchId,
          invoiceNumber: isEditModalOpen ? selectedRecord.invoiceNumber : `INV-${Date.now().toString().slice(-6)}`,
          customerId: finalCustomerId,
          customerName,
          invoiceDate,
          items: lineItems,
          subtotal,
          discount,
          vatPercent,
          vatAmount,
          totalAmount,
          paidAmount,
          balanceDue,
          paymentMethod,
          status: balanceDue <= 0 ? "paid" : paidAmount > 0 ? "partial" : "due",
          createdAt: isEditModalOpen ? selectedRecord.createdAt : serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        transaction.set(invoiceRef, invoiceData, { merge: true });

        if (!isEditModalOpen) {
          for (const item of lineItems) {
            if (!item.isCustom) {
              const productRef = doc(db!, "companies", companyId!, "branches", branchId!, "products", item.productId);
              transaction.update(productRef, { 
                currentStock: increment(-item.qty),
                updatedAt: serverTimestamp()
              });

              if (item.isSerialized) {
                for (const sn of item.serials) {
                  const snRef = availableSerials?.find(s => s.serialNumber === sn);
                  if (snRef) {
                    const docRef = doc(db!, "companies", companyId!, "branches", branchId!, "serial_numbers", snRef.id);
                    transaction.update(docRef, { status: "sold", salesInvoiceId: invoiceRef.id });
                  }
                }
              }
            }
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

  const handleBulkAction = async (action: string) => {
    if (!db || !companyId || !branchId || selectedIds.length === 0) return;

    if (action === 'delete') {
      if (confirm(`Delete ${selectedIds.length} items?`)) {
        setIsSubmitting(true);
        
        // Execute deletions in parallel with settled promise for O(N) stability
        const promises = selectedIds.map(id => {
          const docRef = doc(db, "companies", companyId, "branches", branchId, "sales_invoices", id);
          return deleteDoc(docRef);
        });

        const results = await Promise.allSettled(promises);
        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        if (failed > 0) {
          toast({ 
            variant: "destructive", 
            title: "Partial Success", 
            description: `${succeeded} deleted, ${failed} failed. Check permissions.` 
          });
          
          // Emit error if any fail
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `companies/${companyId}/branches/${branchId}/sales_invoices/...`,
            operation: 'delete'
          }));
        } else {
          toast({ title: t('success'), description: `${succeeded} items removed.` });
        }
        
        clearSelection();
        setIsSubmitting(false);
      }
    } else if (action === 'print') {
      window.print();
    } else {
      toast({ title: "Bulk Action", description: `${action} triggered for ${selectedIds.length} items.` });
    }
  };

  const resetForm = () => {
    setSelectedCustomerId("");
    setIsManualCustomer(false);
    setManualCustomerName("");
    setManualCustomerPhone("");
    setLineItems([]);
    setDiscount(0);
    setPaidAmount(0);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
  };

  const openEdit = (inv: any) => {
    setSelectedRecord(inv);
    setIsManualCustomer(inv.customerId === 'manual');
    setManualCustomerName(inv.customerId === 'manual' ? inv.customerName : "");
    setSelectedCustomerId(inv.customerId === 'manual' ? "" : inv.customerId);
    setLineItems(inv.items || []);
    setDiscount(inv.discount || 0);
    setVatPercent(inv.vatPercent || 15);
    setPaidAmount(inv.paidAmount || 0);
    setInvoiceDate(inv.invoiceDate || new Date().toISOString().split('T')[0]);
    setIsEditModalOpen(true);
  };

  const filteredInvoices = React.useMemo(() => {
    return invoices?.filter(inv => 
      inv.invoiceNumber?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      inv.customerName?.toLowerCase().includes(deferredSearch.toLowerCase())
    );
  }, [invoices, deferredSearch]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-headline text-blue-600 uppercase tracking-tight">{t('sales')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('lastActiveSales')}</p>
        </div>
        <Button className="rounded-full gap-2 h-10 px-8 bg-blue-600 hover:bg-blue-700 font-bold text-[10px] uppercase shadow-xl shadow-blue-100 transition-all active:scale-95 w-full md:w-auto" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
          <Plus className="h-4 w-4" /> {t('newInvoice')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('todaySales')} value={`৳${stats.today.toLocaleString()}`} icon={TrendingUp} colorClass="bg-blue-600" />
        <KPICard title={t('thisMonth')} value={`৳${stats.monthly.toLocaleString()}`} icon={Calendar} colorClass="bg-green-600" />
        <KPICard title={t('totalOrders')} value={stats.total} icon={ShoppingBag} colorClass="bg-purple-600" />
        <KPICard title={t('pendingInvoices')} value={`৳${stats.due.toLocaleString()}`} icon={AlertCircle} colorClass="bg-red-600" />
      </div>

      <div className="flex gap-2 bg-white p-3 rounded-xl border shadow-sm ring-1 ring-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input 
            placeholder={t('search')} 
            className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="w-12 pl-6">
                    <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead className="h-10 text-[10px] uppercase font-black">{t('invoiceNumber')}</TableHead>
                  <TableHead className="h-10 text-[10px] uppercase font-black">{t('customer')}</TableHead>
                  <TableHead className="h-10 text-[10px] uppercase font-black">{t('amount')}</TableHead>
                  <TableHead className="h-10 text-[10px] uppercase font-black">{t('status')}</TableHead>
                  <TableHead className="h-10 text-right pr-6 sticky right-0 bg-white/95 backdrop-blur-sm z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] w-[180px]">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices?.map((inv) => (
                  <TableRow key={inv.id} className={cn("h-14 hover:bg-muted/5 transition-colors group", selectedIds.includes(inv.id) && "bg-blue-50/30")}>
                    <TableCell className="pl-6">
                      <Checkbox checked={selectedIds.includes(inv.id)} onCheckedChange={() => toggleSelect(inv.id)} />
                    </TableCell>
                    <TableCell className="font-bold text-xs uppercase text-blue-600">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-xs font-bold text-slate-700">{inv.customerName}</TableCell>
                    <TableCell className="font-black text-xs">৳{inv.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[8px] h-5 uppercase border-none px-2 font-black", 
                        inv.status === 'paid' ? "bg-green-50 text-green-700" : 
                        inv.status === 'partial' ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700")}>
                        {t(`${inv.status}_status` as any)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 sticky right-0 bg-white/90 backdrop-blur-sm group-hover:bg-slate-50/90 transition-colors z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-end items-center gap-1">
                        <div className="hidden md:flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => { setSelectedRecord(inv); setIsViewModalOpen(true); }} title={t('view')}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-amber-600 hover:bg-amber-50" onClick={() => openEdit(inv)} title={t('edit')}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-slate-600 hover:bg-slate-100" onClick={() => { setSelectedRecord(inv); setIsViewModalOpen(true); }} title={t('print')}><Printer className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-red-600 hover:bg-red-50" onClick={() => { setSelectedRecord(inv); setIsDeleteAlertOpen(true); }} title={t('delete')}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden rounded-full hover:bg-blue-50 text-blue-600 transition-colors"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl">
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => { setSelectedRecord(inv); setIsViewModalOpen(true); }}><Eye className="mr-2 h-3.5 w-3.5" /> {t('view')}</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => openEdit(inv)}><Edit className="mr-2 h-3.5 w-3.5" /> {t('edit')}</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => { setSelectedRecord(inv); setIsViewModalOpen(true); }}><Download className="mr-2 h-3.5 w-3.5" /> {t('export')}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-xs font-bold text-red-600" onClick={() => { setSelectedRecord(inv); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* POS INVOICE BUILDER */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) resetForm(); setIsAddModalOpen(false); setIsEditModalOpen(false); }}>
        <DialogContent className="max-w-[95vw] w-[1400px] p-0 overflow-hidden border-none shadow-2xl bg-slate-50 rounded-[2rem] md:rounded-[2.5rem]">
          <DialogHeader className={cn("p-5 text-white flex-row items-center justify-between space-y-0", isEditModalOpen ? "bg-indigo-600" : "bg-blue-600")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-bold font-headline uppercase tracking-tight">{isEditModalOpen ? t('edit') : t('newInvoice')}</DialogTitle>
                <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em] leading-none mt-1 hidden md:block">Point of Sale Terminal</p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row h-[85vh] lg:h-[80vh] overflow-hidden">
            {/* Main POS Interface */}
            <div className="flex-1 flex flex-col p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto lg:overflow-hidden custom-scrollbar">
              <div className="bg-white p-4 md:p-6 rounded-3xl ring-1 ring-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-50">
                  <h3 className="text-[10px] font-black uppercase text-slate-900 flex items-center gap-2 tracking-widest">
                    <User className="h-4 w-4 text-blue-600" /> {t('customer')} Identification
                  </h3>
                  <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full">
                    <Label className="text-[9px] font-black uppercase text-muted-foreground cursor-pointer" htmlFor="manual-cust-entry">{t('individual')}</Label>
                    <Switch id="manual-cust-entry" checked={isManualCustomer} onCheckedChange={setIsManualCustomer} className="data-[state=checked]:bg-blue-600 scale-75" />
                  </div>
                </div>

                {isManualCustomer ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Full Name</Label>
                      <Input className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 text-xs font-bold" value={manualCustomerName} onChange={e => setManualCustomerName(e.target.value)} placeholder="e.g. John Doe" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Phone Number</Label>
                      <Input className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 text-xs font-bold" value={manualCustomerPhone} onChange={e => setManualCustomerPhone(e.target.value)} placeholder="+880..." />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t('customer')}</Label>
                      <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                        <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 shadow-sm font-bold text-xs">
                          <SelectValue placeholder={t('search')} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[250px] rounded-xl">
                          {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold">{c.firstName} {c.lastName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t('date')}</Label>
                      <Input type="date" className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 text-xs font-black" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white p-4 rounded-3xl ring-1 ring-slate-100 shadow-sm border border-blue-50 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Catalog Search</Label>
                    <Select onValueChange={handleAddProduct}>
                      <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 shadow-sm transition-all focus:ring-2 focus:ring-blue-500 font-bold text-xs">
                        <SelectValue placeholder={t('addProduct')} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] rounded-xl">
                        {products?.map(p => (
                          <SelectItem key={p.id} value={p.id} className="text-xs font-bold">
                            {p.name} <span className="text-[9px] opacity-60 ml-2 font-mono">(STOCK: {p.currentStock} {p.unit || 'Pcs'})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" className="h-12 rounded-2xl gap-2 border-blue-200 text-blue-700 font-black text-[10px] uppercase bg-blue-50/50 transition-all hover:bg-blue-100 shadow-sm" onClick={handleAddCustomItem}>
                    <PackagePlus className="h-4 w-4" /> {t('addCustomItem')}
                  </Button>
                </div>

                <form onSubmit={handleScannerInput} className="relative group shrink-0">
                  <Scan className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 animate-pulse" />
                  <Input 
                    placeholder={t('scanPrompt')}
                    className="h-12 pl-12 rounded-2xl bg-slate-50/50 border-none ring-1 ring-slate-100 shadow-sm text-xs font-bold focus:ring-2 focus:ring-blue-600 transition-all"
                    value={scannerInput}
                    onChange={e => setScannerInput(e.target.value)}
                  />
                </form>
              </div>

              <div className="flex-1 bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden flex flex-col border border-slate-50 min-h-[400px]">
                <div className="overflow-x-auto flex-1 custom-scrollbar">
                  <div className="min-w-[800px]">
                    <Table>
                      <TableHeader className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
                        <TableRow>
                          <TableHead className="text-[10px] uppercase font-black py-4 pl-4 md:pl-8">{t('itemDescription')}</TableHead>
                          <TableHead className="text-[10px] uppercase font-black text-center w-32 md:w-40">{t('qty')} / Unit</TableHead>
                          <TableHead className="text-[10px] uppercase font-black text-right w-24 md:w-40">{t('unitPrice')}</TableHead>
                          <TableHead className="text-[10px] uppercase font-black text-right w-24 md:w-40 pr-4 md:pr-8">{t('total')}</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="h-48 md:h-64 text-center">
                              <div className="flex flex-col items-center opacity-20">
                                <ShoppingBag className="h-12 w-12 md:h-16 md:w-16 mb-4" />
                                <p className="text-[10px] md:text-xs uppercase font-black tracking-[0.3em]">{t('noItemsSelected')}</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          lineItems.map((item, idx) => (
                            <TableRow key={idx} className="group hover:bg-slate-50/50 transition-colors h-16 md:h-20">
                              <TableCell className="pl-4 md:pl-8">
                                <div className="flex flex-col min-w-0">
                                  {item.isCustom ? (
                                    <Input 
                                      className="h-10 text-[11px] font-black uppercase border-none ring-1 ring-slate-100 bg-slate-50/30 w-full rounded-xl" 
                                      value={item.name} 
                                      onChange={e => handleUpdateItem(idx, 'name', e.target.value)} 
                                      placeholder="Type product name..."
                                    />
                                  ) : (
                                    <span className="text-[11px] md:text-sm font-black text-slate-900 uppercase tracking-tighter truncate">{item.name}</span>
                                  )}
                                  {item.isSerialized && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {item.serials.map((s, si) => (
                                        <Badge key={si} variant="secondary" className="text-[7px] md:text-[8px] h-3.5 md:h-4 bg-blue-50 text-blue-700 border-none font-mono">
                                          {s}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center gap-2 justify-center">
                                  <Input 
                                    type="number" 
                                    className="h-10 text-center font-black text-sm rounded-xl w-16 md:w-20 bg-slate-50 border-none" 
                                    value={item.qty} 
                                    disabled={item.isSerialized}
                                    onChange={e => handleUpdateItem(idx, 'qty', e.target.value)} 
                                  />
                                  <span className="text-[10px] font-black uppercase text-muted-foreground w-8 text-left">{item.unit || 'Pcs'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Input 
                                  type="number" 
                                  className="h-10 text-right font-black text-xs rounded-xl w-24 md:w-32 bg-slate-50 border-none ml-auto" 
                                  value={item.price} 
                                  disabled={!item.isCustom}
                                  onChange={e => handleUpdateItem(idx, 'price', e.target.value)} 
                                />
                              </TableCell>
                              <TableCell className="text-right pr-4 md:pr-8">
                                <span className="font-black text-xs md:text-sm text-blue-600">৳{item.total.toLocaleString()}</span>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:bg-red-50 rounded-full" onClick={() => handleRemoveItem(idx)}>
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
            </div>

            <div className="w-full lg:w-[400px] bg-white border-l border-slate-100 p-4 md:p-8 space-y-4 md:space-y-6 flex flex-col shadow-2xl relative z-20 shrink-0 overflow-y-auto custom-scrollbar">
              <div className="space-y-4 md:space-y-6">
                <div className={cn("p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl space-y-4 relative overflow-hidden group shrink-0 text-white", isEditModalOpen ? "bg-indigo-600" : "bg-blue-600")}>
                  <Calculator className="absolute -bottom-6 -right-6 h-24 w-24 md:h-32 md:w-32 opacity-10 group-hover:scale-125 transition-transform duration-700" />
                  <div className="space-y-1 text-center relative z-10">
                    <p className="text-[9px] md:text-[10px] uppercase font-black opacity-60 tracking-[0.2em]">{t('netFinalAmount')}</p>
                    <h2 className="text-3xl md:text-5xl font-headline font-black tracking-tighter">৳{totalAmount.toLocaleString()}</h2>
                  </div>
                  <div className="pt-4 md:pt-6 space-y-2 md:space-y-3 border-t border-white/10 text-[10px] md:text-[11px] font-bold uppercase tracking-wider relative z-10">
                    <div className="flex justify-between opacity-70"><span>{t('subtotal')}</span><span>৳{subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between text-red-200"><span>{t('discount')}</span><span>- ৳{discount.toLocaleString()}</span></div>
                    <div className="flex justify-between opacity-70"><span>{t('vat')} ({vatPercent}%)</span><span>+ ৳{vatAmount.toLocaleString()}</span></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('discount')}</Label>
                      <Input type="number" className="h-11 rounded-2xl bg-slate-50 border-none font-bold text-xs" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('vat')} %</Label>
                      <Input type="number" className="h-11 rounded-2xl bg-slate-50 border-none font-bold text-xs" value={vatPercent || ''} onChange={e => setVatPercent(Number(e.target.value))} />
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-50">
                    <Label className="text-[9px] md:text-[10px] font-black uppercase text-blue-600 tracking-[0.2em]">{t('paid')}</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600" />
                      <Input type="number" placeholder="0.00" className="h-14 md:h-16 pl-12 text-xl md:text-2xl font-black text-blue-600 rounded-2xl bg-blue-50/30 border-2 border-blue-50 transition-all focus:bg-blue-50 focus:border-blue-200 shadow-inner" value={paidAmount || ''} onChange={e => setPaidAmount(Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 md:pt-6">
                <Button 
                  className={cn("w-full h-16 md:h-20 rounded-[1.5rem] md:rounded-[2rem] font-black text-[11px] md:text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 group overflow-hidden text-white", isEditModalOpen ? "bg-indigo-600 hover:bg-indigo-700" : "bg-blue-600 hover:bg-blue-700")} 
                  disabled={isSubmitting || lineItems.length === 0} 
                  onClick={handleSaveInvoice}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                    {isEditModalOpen ? "Update Transaction" : t('postTransaction')}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Toolbar */}
      <BulkActionToolbar 
        selectedCount={selectedCount} 
        onClear={clearSelection} 
        onAction={handleBulkAction}
        isLoading={isSubmitting}
      />
    </div>
  )
}
