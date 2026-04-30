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
  FileText,
  Clock,
  ChevronRight,
  Upload,
  Scan,
  Printer,
  Barcode
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, runTransaction, serverTimestamp, increment, where } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { DocumentTemplate } from "@/components/documents/document-template"

interface InvoiceItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  total: number;
  serials: string[];
  isSerialized: boolean;
}

export default function SalesPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // POS Scanner State
  const [scannerInput, setScannerInput] = React.useState("");

  // Form State
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
    return query(collection(db, "companies", companyId, "branches", branchId, "sales_invoices"), orderBy("createdAt", "desc"));
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
    return query(collection(db, "companies", companyId, "branches", branchId, "serial_numbers"), where("status", "==", "available"));
  }, [db, companyId, branchId]);
  const { data: availableSerials } = useCollection(serialsQuery);

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const vatAmount = (subtotal - discount) * (vatPercent / 100);
  const totalAmount = subtotal - discount + vatAmount;
  const balanceDue = totalAmount - paidAmount;

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

  const handleAddProduct = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    const existingIdx = lineItems.findIndex(item => item.productId === productId);
    if (existingIdx > -1 && !product.serialNumberTrackingRequired) {
      const updated = [...lineItems];
      updated[existingIdx].qty += 1;
      updated[existingIdx].total = updated[existingIdx].qty * updated[existingIdx].price;
      setLineItems(updated);
    } else {
      setLineItems([...lineItems, {
        productId: product.id,
        name: product.name,
        qty: 1,
        price: product.unitPrice || 0,
        total: product.unitPrice || 0,
        isSerialized: product.serialNumberTrackingRequired || false,
        serials: []
      }]);
    }
  };

  const handleScannerInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannerInput) return;

    // 1. Try to find by Serial Number
    const foundSerial = availableSerials?.find(s => s.serialNumber.toLowerCase() === scannerInput.toLowerCase());
    if (foundSerial) {
      const product = products?.find(p => p.id === foundSerial.productId);
      if (product) {
        const existingIdx = lineItems.findIndex(item => item.productId === product.id);
        if (existingIdx > -1) {
          const updated = [...lineItems];
          if (!updated[existingIdx].serials.includes(foundSerial.serialNumber)) {
            updated[existingIdx].serials.push(foundSerial.serialNumber);
            updated[existingIdx].qty = updated[existingIdx].serials.length;
            updated[existingIdx].total = updated[existingIdx].qty * updated[existingIdx].price;
            setLineItems(updated);
            toast({ title: t('addItem'), description: `${foundSerial.serialNumber} added.` });
          }
        } else {
          setLineItems([...lineItems, {
            productId: product.id,
            name: product.name,
            qty: 1,
            price: product.unitPrice || 0,
            total: product.unitPrice || 0,
            isSerialized: true,
            serials: [foundSerial.serialNumber]
          }]);
          toast({ title: t('addItem'), description: `${product.name} added.` });
        }
        setScannerInput("");
        return;
      }
    }

    // 2. Try to find by SKU/Barcode
    const foundProduct = products?.find(p => p.sku?.toLowerCase() === scannerInput.toLowerCase());
    if (foundProduct) {
      handleAddProduct(foundProduct.id);
      setScannerInput("");
      return;
    }

    toast({ variant: "destructive", title: t('error'), description: "Item or Serial not found." });
    setScannerInput("");
  };

  const handleUpdateQty = (idx: number, newQty: number) => {
    const item = lineItems[idx];
    if (item.isSerialized) return; 
    setLineItems(lineItems.map((item, i) => 
      i === idx ? { ...item, qty: Math.max(1, newQty), total: Math.max(1, newQty) * item.price } : item
    ));
  };

  const handleRemoveItem = (idx: number) => {
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const handleSaveInvoice = async () => {
    if (!selectedCustomerId || lineItems.length === 0) {
      toast({ variant: "destructive", title: t('error'), description: t('noItemsSelected') });
      return;
    }

    for (const item of lineItems) {
      if (item.isSerialized && item.serials.length !== item.qty) {
        toast({ variant: "destructive", title: t('error'), description: `Please select serials for ${item.name}` });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await runTransaction(db!, async (transaction) => {
        const invoiceRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "sales_invoices"));
        const invoiceData = {
          id: invoiceRef.id,
          companyId,
          branchId,
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          customerId: selectedCustomerId,
          customerName: customers?.find(c => c.id === selectedCustomerId)?.firstName || "Client",
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
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        transaction.set(invoiceRef, invoiceData);

        for (const item of lineItems) {
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
    setSelectedCustomerId("");
    setLineItems([]);
    setDiscount(0);
    setPaidAmount(0);
    setPaymentMethod("cash");
    setInvoiceDate(new Date().toISOString().split('T')[0]);
  };

  const handleDelete = () => {
    if (!selectedRecord || !db || !companyId || !branchId) return;
    const docRef = doc(db, "companies", companyId, "branches", branchId, "sales_invoices", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: t('success'), description: t('successSub') });
    setIsDeleteAlertOpen(false);
  };

  const filteredInvoices = invoices?.filter(inv => inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()));

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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="h-10 text-[10px] uppercase font-black whitespace-nowrap">{t('invoiceNumber')}</TableHead>
                  <TableHead className="h-10 text-[10px] uppercase font-black whitespace-nowrap">{t('customer')}</TableHead>
                  <TableHead className="h-10 text-[10px] uppercase font-black whitespace-nowrap">{t('amount')}</TableHead>
                  <TableHead className="h-10 text-[10px] uppercase font-black whitespace-nowrap">{t('status')}</TableHead>
                  <TableHead className="h-10 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices?.map((inv) => (
                  <TableRow key={inv.id} className="h-14 hover:bg-muted/5 transition-colors">
                    <TableCell className="font-bold text-xs uppercase text-blue-600 whitespace-nowrap">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-xs font-bold text-slate-700 whitespace-nowrap">
                      {inv.customerName}
                    </TableCell>
                    <TableCell className="font-black text-xs whitespace-nowrap">৳{inv.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[8px] h-5 uppercase border-none px-2 font-black", 
                        inv.status === 'paid' ? "bg-green-50 text-green-700" : 
                        inv.status === 'partial' ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700")}>
                        {t(`${inv.status}_status` as any)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl">
                          <DropdownMenuItem className="text-xs font-bold" onClick={() => { setSelectedRecord(inv); setIsViewModalOpen(true); }}><Eye className="mr-2 h-3.5 w-3.5" /> {t('view')}</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs font-bold text-red-600" onClick={() => { setSelectedRecord(inv); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}</DropdownMenuItem>
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

      {/* POS INVOICE BUILDER */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-[95vw] w-[1400px] p-0 overflow-hidden border-none shadow-2xl bg-slate-50 rounded-[2rem] md:rounded-[2.5rem]">
          <DialogHeader className="bg-blue-600 p-5 text-white flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-bold font-headline uppercase tracking-tight">{t('newInvoice')}</DialogTitle>
                <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em] leading-none mt-1 hidden md:block">Point of Sale Terminal</p>
              </div>
            </div>
            {/* Standard Close X is handled by DialogPrimitive.Close in dialog.tsx component */}
          </DialogHeader>

          <div className="flex flex-col lg:flex-row h-[85vh] lg:h-[80vh] overflow-hidden">
            {/* Main POS Interface */}
            <div className="flex-1 flex flex-col p-4 md:p-6 space-y-4 md:space-y-6 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t('customer')}</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="h-12 rounded-2xl bg-white border-none ring-1 ring-slate-200 shadow-sm transition-all focus:ring-2 focus:ring-blue-600">
                      <SelectValue placeholder={t('search')} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-2xl">
                      {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold">{c.firstName} {c.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t('date')}</Label>
                  <Input type="date" className="h-12 rounded-2xl bg-white border-none ring-1 ring-slate-200 text-xs font-bold" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                </div>
              </div>

              {/* SMART SCANNER INPUT */}
              <form onSubmit={handleScannerInput} className="relative group shrink-0">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Scan className="h-5 w-5 text-blue-600 animate-pulse" />
                </div>
                <Input 
                  placeholder={t('scanPrompt')}
                  className="h-14 pl-12 rounded-[1.25rem] bg-white border-none ring-1 ring-slate-200 shadow-lg text-sm font-bold focus:ring-2 focus:ring-blue-600 transition-all placeholder:font-medium"
                  value={scannerInput}
                  onChange={e => setScannerInput(e.target.value)}
                />
                <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl h-10 px-4 md:px-6 bg-blue-600 text-[10px] font-black uppercase shadow-lg">
                  {t('addItem')}
                </Button>
              </form>

              {/* PRODUCT TABLE */}
              <div className="flex-1 bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden flex flex-col border border-slate-50 min-h-0">
                <div className="overflow-auto flex-1 custom-scrollbar">
                  <Table>
                    <TableHeader className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
                      <TableRow>
                        <TableHead className="text-[10px] uppercase font-black py-4 pl-4 md:pl-8">{t('itemDescription')}</TableHead>
                        <TableHead className="text-[10px] uppercase font-black text-center w-24 md:w-32">{t('qty')}</TableHead>
                        <TableHead className="text-[10px] uppercase font-black text-right w-24 md:w-40 hidden sm:table-cell">{t('unitPrice')}</TableHead>
                        <TableHead className="text-[10px] uppercase font-black text-right w-24 md:w-40 pr-4 md:pr-8">{t('total')}</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-48 md:h-64 text-center">
                            <div className="flex flex-col items-center opacity-20 group">
                              <Barcode className="h-12 w-12 md:h-16 md:w-16 mb-4 transition-transform group-hover:scale-110 duration-500" />
                              <p className="text-[10px] md:text-xs uppercase font-black tracking-[0.3em]">{t('noItemsSelected')}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        lineItems.map((item, idx) => (
                          <TableRow key={idx} className="group hover:bg-slate-50/50 transition-colors h-16 md:h-20">
                            <TableCell className="pl-4 md:pl-8">
                              <div className="flex flex-col min-w-0">
                                <span className="text-[11px] md:text-sm font-black text-slate-900 uppercase tracking-tighter truncate">{item.name}</span>
                                {item.isSerialized && (
                                  <div className="flex flex-wrap gap-1 mt-1.5 max-w-[150px] md:max-w-none">
                                    {item.serials.map((s, si) => (
                                      <Badge key={si} variant="secondary" className="text-[7px] md:text-[8px] h-3.5 md:h-4 bg-blue-50 text-blue-700 border-none font-mono">
                                        {s}
                                      </Badge>
                                    ))}
                                    {item.serials.length === 0 && <span className="text-[8px] md:text-[9px] text-red-500 font-bold italic animate-pulse">Required serials!</span>}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-center">
                                <Input 
                                  type="number" 
                                  className="h-8 md:h-10 text-center font-black text-xs md:text-sm rounded-xl w-16 md:w-24 bg-slate-50 border-none focus:ring-2 focus:ring-blue-600" 
                                  value={item.qty} 
                                  disabled={item.isSerialized}
                                  onChange={e => handleUpdateQty(idx, Number(e.target.value))} 
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-right hidden sm:table-cell">
                              <span className="font-bold text-xs md:text-sm text-slate-500">৳{item.price.toLocaleString()}</span>
                            </TableCell>
                            <TableCell className="text-right pr-4 md:pr-8">
                              <span className="font-black text-xs md:text-sm text-blue-600">৳{item.total.toLocaleString()}</span>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-9 md:w-9 text-red-500 hover:bg-red-50 rounded-full transition-all md:opacity-0 md:group-hover:opacity-100" onClick={() => handleRemoveItem(idx)}>
                                <X className="h-4 w-4 md:h-5 md:w-5" />
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

            {/* Sidebar Summary & Payment */}
            <div className="w-full lg:w-[400px] bg-white border-l border-slate-100 p-4 md:p-8 space-y-4 md:space-y-8 flex flex-col shadow-2xl relative z-20 shrink-0 overflow-y-auto">
              <div className="space-y-4 md:space-y-6">
                <div className="bg-blue-600 text-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl shadow-blue-100 space-y-4 relative overflow-hidden group shrink-0">
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
                      <Input type="number" className="h-10 md:h-11 rounded-xl bg-slate-50 border-none font-bold text-xs" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('vat')} %</Label>
                      <Input type="number" className="h-10 md:h-11 rounded-xl bg-slate-50 border-none font-bold text-xs" value={vatPercent || ''} onChange={e => setVatPercent(Number(e.target.value))} />
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-50">
                    <Label className="text-[9px] md:text-[10px] font-black uppercase text-blue-600 tracking-[0.2em]">{t('paid')}</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600" />
                      <Input type="number" placeholder="0.00" className="h-12 md:h-14 pl-12 text-xl md:text-2xl font-black text-blue-600 rounded-2xl bg-blue-50/30 border-2 border-blue-50 transition-all focus:bg-blue-50 focus:border-blue-200 shadow-inner" value={paidAmount || ''} onChange={e => setPaidAmount(Number(e.target.value))} />
                    </div>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-10 md:h-12 rounded-xl bg-slate-50 border-none font-bold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="cash" className="text-xs font-bold">Cash Payment</SelectItem>
                        <SelectItem value="bkash" className="text-xs font-bold">bKash (Mobile FS)</SelectItem>
                        <SelectItem value="bank" className="text-xs font-bold">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className={cn("p-4 md:p-5 rounded-2xl md:rounded-3xl flex items-center justify-between border-2 border-dashed transition-all duration-500", balanceDue > 0 ? "bg-red-50/50 border-red-100" : "bg-green-50 border-green-200 shadow-lg shadow-green-100/50")}>
                    <div className="space-y-1">
                      <p className="text-[8px] md:text-[9px] uppercase font-black text-muted-foreground tracking-widest">{t('remainingDue')}</p>
                      <p className={cn("text-xl md:text-2xl font-black tracking-tight", balanceDue > 0 ? "text-red-600" : "text-green-700")}>৳{balanceDue.toLocaleString()}</p>
                    </div>
                    {balanceDue <= 0 ? <CheckCircle2 className="h-8 w-8 md:h-10 md:w-10 text-green-500 animate-bounce" /> : <Clock className="h-6 w-6 md:h-8 md:w-8 text-red-300" />}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 md:pt-6">
                <Button 
                  className="w-full h-14 md:h-16 bg-blue-600 hover:bg-blue-700 rounded-[1.25rem] md:rounded-[1.5rem] font-black text-[11px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] shadow-2xl shadow-blue-100 transition-all active:scale-95 group overflow-hidden" 
                  disabled={isSubmitting || lineItems.length === 0} 
                  onClick={handleSaveInvoice}
                >
                  <span className="relative z-10 flex items-center gap-3">
                    {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                    {t('postTransaction')}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* VIEW INVOICE DIALOG */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-[21cm] w-[95vw] p-0 border-none bg-transparent shadow-none overflow-y-auto max-h-[95vh] rounded-none">
          <DialogHeader className="sr-only"><DialogTitle>Invoice View</DialogTitle></DialogHeader>
          <div className="flex justify-end gap-3 mb-4 no-print fixed top-4 right-4 md:top-6 md:right-6 z-[100]">
            <Button onClick={() => window.print()} className="bg-white text-blue-600 hover:bg-blue-50 shadow-2xl rounded-full font-black text-[10px] uppercase h-10 px-6 gap-2 border-none ring-1 ring-blue-100">
              <Printer className="h-4 w-4" /> {t('print')}
            </Button>
            {/* ShadCN DialogContent Close handles removal */}
          </div>
          {selectedRecord && (
            <div className="bg-white shadow-2xl rounded-none md:rounded-[2rem] overflow-hidden">
              <DocumentTemplate
                title={t('sales')}
                type="invoice"
                docNumber={selectedRecord.invoiceNumber}
                date={selectedRecord.invoiceDate}
                customerName={selectedRecord.customerName}
                customerInfo={customers?.find(c => c.id === selectedRecord.customerId)?.phoneNumber}
                items={selectedRecord.items.map((i: any) => ({
                  name: i.name,
                  quantity: i.qty,
                  unitPrice: i.price,
                  total: i.total,
                  serialNumber: i.serials?.join(', ')
                }))}
                subtotal={selectedRecord.subtotal}
                discount={selectedRecord.discount}
                taxRate={selectedRecord.vatPercent}
                taxAmount={selectedRecord.vatAmount}
                grandTotal={selectedRecord.totalAmount}
                status={selectedRecord.status}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2rem] md:rounded-[2.5rem] border-none p-6 md:p-10 shadow-2xl w-[90vw] md:max-w-md mx-auto">
          <div className="flex flex-col items-center text-center space-y-4 md:space-y-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-2 ring-8 ring-red-50/50">
              <AlertCircle className="h-8 w-8 md:h-10 md:w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-black font-headline uppercase tracking-tight text-slate-900">{t('voidInvoice')}</h2>
              <p className="text-[11px] md:text-xs text-muted-foreground font-medium px-4 md:px-8 leading-relaxed">{t('errorSub')}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-8 md:mt-10">
            <Button variant="ghost" className="flex-1 rounded-2xl h-12 md:h-14 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 order-2 sm:order-1" onClick={() => setIsDeleteAlertOpen(false)}>{t('cancel')}</Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700 rounded-2xl h-12 md:h-14 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-100 transition-all active:scale-95 order-1 sm:order-2" onClick={handleDelete}>{t('confirmVoid')}</Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
