"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  ShoppingCart, 
  ArrowLeft, 
  Save, 
  Loader2, 
  Scan, 
  User, 
  PackagePlus, 
  ShoppingBag, 
  X, 
  Calculator,
  ArrowRight,
  Barcode,
  Percent,
  Truck,
  Wrench,
  Receipt,
  QrCode,
  Search,
  ShieldCheck,
  Briefcase,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, runTransaction, serverTimestamp, increment, where, limit, query } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface InvoiceItem {
  id: string;
  productId: string;
  name: string;
  brand?: string;
  model?: string;
  category?: string;
  qty: number;
  unit: string;
  price: number;
  discount: number;
  vat: number;
  warranty?: string;
  total: number;
  serials: string[];
  isSerialized: boolean;
  isCustom?: boolean;
}

const UNITS = ["Pcs", "Kg", "Gram", "Liter", "ML", "Feet", "Meter", "Roll", "Box", "Carton", "Pack", "Pair", "Set", "Dozen", "Bundle", "Hour", "Month", "Year", "Service"];

export default function NewInvoicePage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [scannerInput, setScannerInput] = React.useState("");

  // Form State
  const [isManualCustomer, setIsManualCustomer] = React.useState(false);
  const [manualCustomer, setManualCustomer] = React.useState({ name: "", phone: "", email: "", company: "", address: "" });
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [invoiceDate, setInvoiceDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = React.useState("");
  
  const [lineItems, setLineItems] = React.useState<InvoiceItem[]>([]);
  
  // Financial Overrides
  const [globalDiscount, setGlobalDiscount] = React.useState(0);
  const [transportCost, setTransportCost] = React.useState(0);
  const [installationCharge, setInstallationCharge] = React.useState(0);
  const [previousDue, setPreviousDue] = React.useState(0);
  const [roundOff, setRoundOff] = React.useState(0);
  const [paidAmount, setPaidAmount] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState("cash");
  const [transactionId, setTransactionId] = React.useState("");

  // Queries
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

  // Calculations
  const calculations = React.useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const itemDiscounts = lineItems.reduce((sum, item) => sum + (item.discount || 0), 0);
    const itemVat = lineItems.reduce((sum, item) => sum + (item.vat || 0), 0);
    
    const grandTotal = subtotal - itemDiscounts - globalDiscount + itemVat + transportCost + installationCharge + roundOff;
    const dueAmount = grandTotal - paidAmount;
    const outstanding = dueAmount + previousDue;

    return { subtotal, itemDiscounts, itemVat, grandTotal, dueAmount, outstanding };
  }, [lineItems, globalDiscount, transportCost, installationCharge, roundOff, paidAmount, previousDue]);

  const handleAddProduct = React.useCallback((productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      name: product.name,
      brand: product.brand || "",
      model: product.model || "",
      category: product.category || "",
      qty: 1,
      unit: product.unit || "Pcs",
      price: product.unitPrice || 0,
      discount: 0,
      vat: 0,
      warranty: "1 Year",
      total: product.unitPrice || 0,
      isSerialized: product.serialNumberTrackingRequired || false,
      serials: [],
      isCustom: false
    };

    setLineItems([...lineItems, newItem]);
  }, [products, lineItems]);

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, val: any) => {
    setLineItems(prev => prev.map((item) => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };
      if (field === 'qty') updated.qty = Math.max(1, Number(val) || 0);
      if (field === 'price') updated.price = Math.max(0, Number(val) || 0);
      updated.total = (updated.qty * updated.price) - (updated.discount || 0) + (updated.vat || 0);
      return updated;
    }));
  };

  const handleSaveInvoice = async () => {
    if (isSubmitting) return;
    if (!isManualCustomer && !selectedCustomerId) {
      toast({ variant: "destructive", title: "Select Customer", description: "Customer identification is required." });
      return;
    }
    if (lineItems.length === 0) {
      toast({ variant: "destructive", title: "Cart Empty", description: "Please add products to the invoice." });
      return;
    }

    setIsSubmitting(true);
    try {
      await runTransaction(db!, async (transaction) => {
        const invoiceRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "sales_invoices"));
        
        let customerName = manualCustomer.name;
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
          invoiceNumber: `INV-2026-${Date.now().toString().slice(-6)}`,
          customerId: finalCustomerId,
          customerName,
          customerPhone: isManualCustomer ? manualCustomer.phone : (customers?.find(c => c.id === selectedCustomerId)?.phoneNumber || ""),
          customerAddress: isManualCustomer ? manualCustomer.address : (customers?.find(c => c.id === selectedCustomerId)?.companyName || ""),
          invoiceDate,
          dueDate,
          items: lineItems,
          subtotal: calculations.subtotal,
          itemDiscounts: calculations.itemDiscounts,
          globalDiscount,
          vatAmount: calculations.itemVat,
          transportCost,
          installationCharge,
          roundOff,
          grandTotal: calculations.grandTotal,
          paidAmount,
          balanceDue: calculations.dueAmount,
          paymentMethod,
          transactionId,
          status: calculations.dueAmount <= 0 ? "paid" : paidAmount > 0 ? "partial" : "due",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        transaction.set(invoiceRef, invoiceData);

        // Stock Updates
        for (const item of lineItems) {
          if (!item.isCustom) {
            const productRef = doc(db!, "companies", companyId!, "branches", branchId!, "products", item.productId);
            transaction.update(productRef, { 
              currentStock: increment(-item.qty),
              updatedAt: serverTimestamp()
            });
          }
        }
      });

      toast({ title: t('success') });
      router.push("/sales");
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] min-h-screen pb-20 font-sans">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-slate-50 transition-colors">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-600" />
              <h1 className="text-xl font-bold font-headline text-slate-900 tracking-tight">PREMIUM SALES TERMINAL</h1>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Warrior Tech System ERP • Enterprise Edition</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full text-[11px] font-bold uppercase tracking-wider px-8 border-slate-200 h-10 hover:bg-slate-50" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-10 h-10 text-[11px] font-black uppercase tracking-[0.1em] shadow-xl shadow-blue-100 gap-2 transition-all active:scale-95" disabled={isSubmitting} onClick={handleSaveInvoice}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            {t('postTransaction')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 p-6 lg:p-10 max-w-[1800px] mx-auto w-full">
        {/* Main Creation Interface */}
        <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          
          {/* Section: Customer Identification */}
          <Card className="p-8 rounded-2xl border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest">Client Identification</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Define target entity for billing</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                <span className="text-[10px] font-black uppercase text-slate-500">Manual Entry</span>
                <Switch checked={isManualCustomer} onCheckedChange={setIsManualCustomer} className="data-[state=checked]:bg-blue-600 scale-90" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {isManualCustomer ? (
                <>
                  <div className="space-y-1.5 lg:col-span-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Full Name</Label>
                    <Input className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 text-sm font-bold focus:ring-2 focus:ring-blue-600 transition-all" value={manualCustomer.name} onChange={e => setManualCustomer({...manualCustomer, name: e.target.value})} placeholder="e.g. Star Tech Ltd." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Mobile Number</Label>
                    <Input className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 text-sm font-bold" value={manualCustomer.phone} onChange={e => setManualCustomer({...manualCustomer, phone: e.target.value})} placeholder="+880..." />
                  </div>
                  <div className="space-y-1.5 lg:col-span-3">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Billing Address</Label>
                    <Input className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 text-sm" value={manualCustomer.address} onChange={e => setManualCustomer({...manualCustomer, address: e.target.value})} placeholder="Complete corporate or residential address..." />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5 lg:col-span-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{t('customer')}</Label>
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 shadow-sm font-bold text-sm">
                        <SelectValue placeholder="Search verified clients..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[350px] rounded-2xl shadow-2xl border-slate-100 p-2">
                        <div className="relative mb-2">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          <input className="w-full h-10 pl-9 pr-4 rounded-lg bg-slate-50 border-none text-[11px] font-bold focus:ring-0" placeholder="Filter customer database..." />
                        </div>
                        {customers?.map(c => <SelectItem key={c.id} value={c.id} className="rounded-lg h-10 text-xs font-bold">{c.firstName} {c.lastName} <span className="opacity-40 font-normal ml-2">({c.phoneNumber})</span></SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{t('invoiceDate')}</Label>
                    <div className="relative">
                      <Input type="date" className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 text-sm font-black uppercase" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Section: Product Matrix */}
          <Card className="rounded-2xl border-none shadow-sm ring-1 ring-slate-100 bg-white overflow-hidden flex flex-col">
            <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                   <PackagePlus className="h-5 w-5" />
                 </div>
                 <div>
                   <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest">Inventory Matrix</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">Real-time stock deduction enabled</p>
                 </div>
               </div>
               
               <div className="flex gap-3 flex-1 max-w-2xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Select onValueChange={handleAddProduct}>
                      <SelectTrigger className="h-12 pl-11 rounded-xl bg-white border-none ring-1 ring-slate-200 shadow-sm transition-all focus:ring-2 focus:ring-blue-500 font-bold text-xs">
                        <SelectValue placeholder="Quick Search Product Catalog..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[400px] rounded-2xl shadow-2xl border-slate-100">
                        {products?.map(p => (
                          <SelectItem key={p.id} value={p.id} className="rounded-lg h-12 text-xs font-bold">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">IMG</div>
                               <div className="flex flex-col">
                                 <span>{p.name}</span>
                                 <span className="text-[8px] font-black uppercase text-blue-600 tracking-widest">Stock: {p.currentStock} • ৳{p.unitPrice?.toLocaleString()}</span>
                               </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative w-48">
                    <Scan className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 animate-pulse" />
                    <form onSubmit={(e) => { e.preventDefault(); setScannerInput(""); }} className="h-full">
                      <Input 
                        placeholder="Scan S/N..."
                        className="h-12 pl-11 rounded-xl bg-white border-none ring-1 ring-slate-200 shadow-sm text-[11px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-600 transition-all"
                        value={scannerInput}
                        onChange={e => setScannerInput(e.target.value)}
                      />
                    </form>
                  </div>
               </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-slate-50 border-b">
                  <TableRow className="hover:bg-slate-50">
                    <TableHead className="text-[10px] uppercase font-black py-5 pl-8 w-16 text-center text-slate-400">SL</TableHead>
                    <TableHead className="text-[10px] uppercase font-black py-5 text-slate-400">Product / Description</TableHead>
                    <TableHead className="text-[10px] uppercase font-black py-5 text-center text-slate-400 w-28">Qty / Unit</TableHead>
                    <TableHead className="text-[10px] uppercase font-black py-5 text-right text-slate-400 w-36">Unit Price (৳)</TableHead>
                    <TableHead className="text-[10px] uppercase font-black py-5 text-right text-slate-400 w-32">VAT / Tax</TableHead>
                    <TableHead className="text-[10px] uppercase font-black py-5 text-right text-slate-400 w-40 pr-10">Net Total (৳)</TableHead>
                    <TableHead className="w-14"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-80 text-center">
                        <div className="flex flex-col items-center justify-center opacity-30 select-none animate-in fade-in zoom-in-95 duration-700">
                          <ShoppingBag className="h-20 w-20 text-slate-300 mb-6" />
                          <h3 className="text-xl font-black uppercase text-slate-900 tracking-[0.3em]">Matrix Empty</h3>
                          <p className="text-xs font-bold text-slate-400 uppercase mt-2 tracking-widest">Select products from catalog or scan barcode to begin</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    lineItems.map((item, idx) => (
                      <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors h-24 border-b border-slate-50">
                        <TableCell className="pl-8 text-center text-[10px] font-black text-slate-400">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex flex-col min-w-0 pr-4">
                            <span className="text-sm font-black text-slate-900 uppercase tracking-tighter truncate leading-none mb-1.5">{item.name}</span>
                            <div className="flex items-center gap-2">
                               <Badge variant="outline" className="text-[7px] h-3.5 px-1 font-black bg-slate-50 border-slate-200 text-slate-500 uppercase">{item.brand || 'No Brand'}</Badge>
                               <Badge variant="outline" className="text-[7px] h-3.5 px-1 font-black bg-blue-50 border-blue-100 text-blue-600 uppercase tracking-widest">Warranty: {item.warranty}</Badge>
                            </div>
                            {item.isSerialized && (
                              <div className="flex flex-wrap gap-1 mt-2">{item.serials.map((s, si) => <Badge key={si} variant="secondary" className="text-[7px] h-3.5 bg-blue-600 text-white border-none font-mono uppercase">{s}</Badge>)}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 justify-center">
                            <Input 
                              type="number" 
                              className="h-10 text-center font-black text-xs rounded-xl w-20 bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 transition-all" 
                              value={item.qty} 
                              disabled={item.isSerialized} 
                              onChange={e => handleUpdateItem(item.id, 'qty', e.target.value)} 
                            />
                            <span className="text-[9px] font-black uppercase text-slate-400 w-10 text-left">{item.unit || 'Pcs'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Input 
                            type="number" 
                            className="h-10 text-right font-black text-xs rounded-xl w-32 bg-slate-50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 transition-all ml-auto" 
                            value={item.price} 
                            onChange={e => handleUpdateItem(item.id, 'price', e.target.value)} 
                          />
                        </TableCell>
                        <TableCell className="text-right">
                           <div className="flex flex-col items-end gap-1">
                              <Input type="number" className="h-8 text-right font-black text-[10px] rounded-lg w-20 bg-slate-50 border-none" placeholder="VAT ৳" value={item.vat || ''} onChange={e => handleUpdateItem(item.id, 'vat', Number(e.target.value))} />
                              <span className="text-[8px] font-bold text-slate-400 uppercase">Inclusive</span>
                           </div>
                        </TableCell>
                        <TableCell className="text-right pr-10">
                           <div className="flex flex-col items-end">
                              <span className="font-black text-sm text-blue-600 leading-none">৳{item.total.toLocaleString()}</span>
                              <span className="text-[8px] font-bold text-slate-400 uppercase mt-1">Net Line Amount</span>
                           </div>
                        </TableCell>
                        <TableCell className="pr-4">
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100" onClick={() => setLineItems(lineItems.filter(i => i.id !== item.id))}>
                             <X className="h-4 w-4" />
                           </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {lineItems.length > 0 && (
              <div className="p-4 bg-slate-50/50 border-t flex justify-end">
                 <Button variant="outline" className="rounded-full gap-2 border-slate-200 h-10 px-6 font-black text-[10px] uppercase text-slate-600 bg-white" onClick={() => setLineItems([])}>
                   <X className="h-4 w-4" /> Clear All Items
                 </Button>
              </div>
            )}
          </Card>

          {/* Section: Project & Extended Meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <Card className="p-8 rounded-2xl border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6">
                <div className="flex items-center gap-3 border-b pb-4 border-slate-50">
                   <Briefcase className="h-4 w-4 text-slate-400" />
                   <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Enterprise & Project Info</h3>
                </div>
                <div className="grid grid-cols-1 gap-6">
                   <div className="space-y-1.5">
                     <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Quotation Reference</Label>
                     <Input className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 text-xs font-bold uppercase" placeholder="e.g. QTN-2026-001" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Challan Ref</Label>
                        <Input className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 text-xs font-bold uppercase" placeholder="CHL-001" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sales Person</Label>
                        <Input className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 text-xs font-bold" placeholder="Assigned staff..." />
                      </div>
                   </div>
                </div>
             </Card>

             <Card className="p-8 rounded-2xl border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6">
                <div className="flex items-center gap-3 border-b pb-4 border-slate-50">
                   <AlertCircle className="h-4 w-4 text-slate-400" />
                   <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Customer Documentation</h3>
                </div>
                <div className="space-y-1.5">
                   <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Internal Remarks</Label>
                   <textarea className="w-full min-h-[105px] rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 p-4 text-xs font-bold text-slate-600 resize-none outline-none focus:ring-2 focus:ring-blue-600" placeholder="Notes for internal accounting and verification..." />
                </div>
             </Card>
          </div>
        </div>

        {/* Sidebar Financial Summary */}
        <div className="w-full lg:w-[420px] space-y-8 animate-in fade-in slide-in-from-right-2 duration-500">
          <Card className="p-10 rounded-[2.5rem] shadow-2xl space-y-8 text-center text-white bg-blue-600 relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
            <div className="relative z-10">
              <p className="text-[10px] uppercase font-black opacity-60 tracking-[0.3em] mb-3">Grand Settlement Total</p>
              <h2 className="text-5xl font-headline font-black tracking-tighter tabular-nums drop-shadow-xl">৳{calculations.grandTotal.toLocaleString()}</h2>
              
              <div className="mt-10 pt-8 border-t border-white/20 grid grid-cols-2 gap-8 text-[10px] font-black uppercase tracking-widest">
                <div className="text-left space-y-1.5">
                  <p className="opacity-60">Subtotal Gross</p>
                  <p className="text-sm tracking-tight">৳{calculations.subtotal.toLocaleString()}</p>
                </div>
                <div className="text-right space-y-1.5">
                  <p className="opacity-60 text-red-200">Net Discount</p>
                  <p className="text-sm tracking-tight text-red-100">- ৳{(calculations.itemDiscounts + globalDiscount).toLocaleString()}</p>
                </div>
                <div className="text-left space-y-1.5">
                  <p className="opacity-60 text-blue-200">Accrued VAT</p>
                  <p className="text-sm tracking-tight">+ ৳{calculations.itemVat.toLocaleString()}</p>
                </div>
                <div className="text-right space-y-1.5">
                  <p className="opacity-60">Overhead Cost</p>
                  <p className="text-sm tracking-tight">+ ৳{(transportCost + installationCharge).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 rounded-2xl border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-8">
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">{t('transportCost')}</Label>
                    <Input type="number" className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-black text-xs" value={transportCost || ''} onChange={e => setTransportCost(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">{t('installationCharge')}</Label>
                    <Input type="number" className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-black text-xs" value={installationCharge || ''} onChange={e => setInstallationCharge(Number(e.target.value))} />
                  </div>
               </div>

               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Global Discount Override (৳)</Label>
                 <Input type="number" className="h-12 rounded-xl bg-red-50/50 border-none ring-1 ring-red-100 font-black text-sm text-red-600" value={globalDiscount || ''} onChange={e => setGlobalDiscount(Number(e.target.value))} />
               </div>

               <div className="space-y-4 pt-6 border-t border-slate-50">
                  <div className="flex items-center justify-between px-1">
                    <Label className="text-[10px] font-black uppercase text-blue-600 tracking-widest">{t('paidAmount')} (৳)</Label>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-[8px] font-black border-none uppercase">Instant Credit</Badge>
                  </div>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    className="h-16 text-3xl font-black text-blue-600 rounded-2xl bg-blue-50/20 border-2 border-blue-50 text-center transition-all focus:ring-4 focus:ring-blue-100" 
                    value={paidAmount || ''} 
                    onChange={e => setPaidAmount(Number(e.target.value))} 
                  />
               </div>

               <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">{t('paymentMethod')}</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-12 rounded-xl border-none ring-1 ring-slate-100 bg-white font-bold text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-xl">
                      <SelectItem value="cash" className="text-xs font-bold">Cash Payment</SelectItem>
                      <SelectItem value="bank" className="text-xs font-bold">Bank Transfer</SelectItem>
                      <SelectItem value="bkash" className="text-xs font-bold text-pink-600">bKash Merchant</SelectItem>
                      <SelectItem value="nagad" className="text-xs font-bold text-orange-600">Nagad Merchant</SelectItem>
                      <SelectItem value="rocket" className="text-xs font-bold text-indigo-600">Rocket</SelectItem>
                      <SelectItem value="card" className="text-xs font-bold">Card (POS Terminal)</SelectItem>
                    </SelectContent>
                  </Select>
               </div>

               {paymentMethod !== 'cash' && (
                 <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">{t('transactionId')}</Label>
                    <Input className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 text-xs font-black uppercase tracking-widest" value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="TXN-XXXXXX" />
                 </div>
               )}
            </div>

            <div className="p-6 bg-slate-900 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
               <div className="relative z-10 flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">{t('outstandingBalance')}</p>
                    <p className="text-2xl font-headline font-black tracking-tighter tabular-nums text-red-400">৳{calculations.outstanding.toLocaleString()}</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                    <Calculator className="h-6 w-6 text-white" />
                  </div>
               </div>
            </div>

            <Button className="w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-100 transition-all active:scale-95 text-white bg-blue-600 hover:bg-blue-700" disabled={isSubmitting || lineItems.length === 0} onClick={handleSaveInvoice}>
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-3" /> : <ArrowRight className="h-5 w-5 mr-3" />}
              {t('postTransaction')}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}