"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  FileText, 
  ArrowLeft, 
  Save, 
  Loader2, 
  LayoutGrid, 
  PackagePlus, 
  Box, 
  X, 
  Calculator, 
  Calendar, 
  AlertCircle,
  ArrowRight,
  FileBadge
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
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface QuoteItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountValue: number;
  discountType: 'percent' | 'amount';
  taxPercent: number;
  total: number;
  isCustom?: boolean;
}

export default function NewQuotationPage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Builder State
  const [isManualCustomer, setIsManualCustomer] = React.useState(false);
  const [manualCustomer, setManualCustomer] = React.useState({ name: "", phone: "", email: "", address: "" });
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [lineItems, setLineItems] = React.useState<QuoteItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = React.useState(0);
  const [notes, setNotes] = React.useState("1. Quotation is valid for 30 days.\n2. 50% Advance required for order processing.\n3. Goods once sold are not returnable.");
  const [status, setStatus] = React.useState("draft");
  const [expiryDate, setExpiryDate] = React.useState("");

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

  // Calculations
  const calculations = React.useMemo(() => {
    const itemSubtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const itemDiscounts = lineItems.reduce((sum, item) => {
      const disc = item.discountType === 'percent' 
        ? (item.quantity * item.unitPrice * (item.discountValue / 100))
        : item.discountValue;
      return sum + disc;
    }, 0);
    const itemTaxes = lineItems.reduce((sum, item) => {
      const discountedPrice = (item.quantity * item.unitPrice) - (item.discountType === 'percent' ? (item.quantity * item.unitPrice * (item.discountValue / 100)) : item.discountValue);
      return sum + (discountedPrice * (item.taxPercent / 100));
    }, 0);

    const subtotal = itemSubtotal - itemDiscounts;
    const finalTotal = subtotal + itemTaxes - globalDiscount;

    return {
      rawSubtotal: itemSubtotal,
      discounts: itemDiscounts,
      taxes: itemTaxes,
      subtotal,
      finalTotal
    };
  }, [lineItems, globalDiscount]);

  const handleAddLineItem = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;
    
    const newItem: QuoteItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      name: product.name,
      description: "",
      quantity: 1,
      unit: product.unit || "Pcs",
      unitPrice: product.unitPrice || 0,
      discountValue: 0,
      discountType: 'percent',
      taxPercent: 0,
      total: product.unitPrice || 0,
      isCustom: false
    };
    setLineItems([...lineItems, newItem]);
  };

  const addCustomItem = () => {
    const newItem: QuoteItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: "custom",
      name: "",
      description: "",
      quantity: 1,
      unit: "Pcs",
      unitPrice: 0,
      discountValue: 0,
      discountType: 'percent',
      taxPercent: 0,
      total: 0,
      isCustom: true
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (id: string, field: keyof QuoteItem, value: any) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      const raw = updated.quantity * updated.unitPrice;
      const disc = updated.discountType === 'percent' ? (raw * (updated.discountValue / 100)) : updated.discountValue;
      const taxed = (raw - disc) * (updated.taxPercent / 100);
      updated.total = raw - disc + taxed;
      return updated;
    }));
  };

  const handleSaveQuote = async () => {
    if (!db || !companyId || !branchId) return;
    if (!isManualCustomer && !selectedCustomerId) {
      toast({ variant: "destructive", title: "Missing Customer", description: "Please select or add a client." });
      return;
    }
    if (lineItems.length === 0) {
      toast({ variant: "destructive", title: t('error'), description: t('noItemsSelected') });
      return;
    }

    setIsSubmitting(true);
    try {
      const quoteRef = doc(collection(db, "companies", companyId, "branches", branchId, "quotations"));
      let clientData = isManualCustomer ? manualCustomer : (customers?.find(c => c.id === selectedCustomerId) || {});

      const quoteData = {
        id: quoteRef.id,
        companyId,
        branchId,
        quotationNumber: `QTN-${Date.now().toString().slice(-4)}`,
        customerId: isManualCustomer ? "manual" : selectedCustomerId,
        customerName: isManualCustomer ? manualCustomer.name : `${clientData.firstName} ${clientData.lastName}`,
        customerEmail: clientData.email || "",
        customerPhone: isManualCustomer ? manualCustomer.phone : (clientData.phoneNumber || ""),
        customerAddress: isManualCustomer ? manualCustomer.address : (clientData.companyName || ""),
        items: lineItems,
        subtotal: calculations.subtotal,
        taxAmount: calculations.taxes,
        discount: globalDiscount,
        totalAmount: calculations.finalTotal,
        status,
        notes,
        expiryDate,
        quotationDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(quoteRef, quoteData);
      toast({ title: t('success') });
      router.push("/quotations");
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-blue-600">{t('createQuote')}</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Proposal Terminal Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-full px-8 h-10 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 gap-2" disabled={isSubmitting} onClick={handleSaveQuote}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            {t('save')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6">
        <div className="flex-1 space-y-6">
          <Card className="p-6 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                   <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Client Identification</Label>
                   <div className="flex items-center gap-3 bg-slate-50 px-3 py-1 rounded-full scale-90">
                     <span className="text-[9px] font-black uppercase text-muted-foreground">Manual Individual</span>
                     <Switch checked={isManualCustomer} onCheckedChange={setIsManualCustomer} className="data-[state=checked]:bg-blue-600" />
                   </div>
                </div>
                {isManualCustomer ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <Input className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 text-xs font-bold" value={manualCustomer.name} onChange={e => setManualCustomer({...manualCustomer, name: e.target.value})} placeholder="Customer Name" />
                     <Input className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 text-xs font-bold" value={manualCustomer.phone} onChange={e => setManualCustomer({...manualCustomer, phone: e.target.value})} placeholder="Phone Number" />
                     <div className="md:col-span-2"><Input className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 text-xs" value={manualCustomer.address} onChange={e => setManualCustomer({...manualCustomer, address: e.target.value})} placeholder="Full Address" /></div>
                  </div>
                ) : (
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue placeholder="Search from database..." /></SelectTrigger>
                    <SelectContent className="max-h-[300px] rounded-xl">{customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold">{c.firstName} {c.lastName}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </div>
              <div className="md:col-span-4 space-y-4">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Timeline</Label>
                <div className="space-y-4">
                   <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-600" />
                      <Input type="date" className="h-11 pl-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 text-[11px] font-black uppercase" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                      <span className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-slate-400 uppercase tracking-widest">Expiry</span>
                   </div>
                   <Select value={status} onValueChange={setStatus}>
                     <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-black text-[10px] uppercase"><SelectValue /></SelectTrigger>
                     <SelectContent className="rounded-xl">
                        <SelectItem value="draft" className="text-xs font-black">DRAFT</SelectItem>
                        <SelectItem value="sent" className="text-xs font-black">SENT</SelectItem>
                        <SelectItem value="approved" className="text-xs font-black text-green-600">APPROVED</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white overflow-hidden flex flex-col">
            <div className="p-5 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                 <LayoutGrid className="h-4 w-4 text-blue-600" />
                 <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Itemization Matrix</h3>
               </div>
               <div className="flex gap-2">
                  <Select onValueChange={handleAddLineItem}>
                    <SelectTrigger className="h-10 w-[200px] rounded-full bg-white border-none ring-1 ring-slate-200 text-[10px] font-black uppercase">
                      <SelectValue placeholder="Add From Catalog" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">{products?.map(p => <SelectItem key={p.id} value={p.id} className="text-xs font-bold">{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="rounded-full gap-2 border-blue-100 text-blue-700 bg-white h-10 px-4 font-black text-[10px] uppercase shadow-sm" onClick={addCustomItem}>
                    <PackagePlus className="h-4 w-4" /> Custom Row
                  </Button>
               </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/30 sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-black py-4 pl-8 w-[30%]">Description</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-center w-28">Qty</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-right w-32">Price</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-center w-32">Discount</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-right pr-8 w-32">Total</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="h-64 text-center opacity-20"><Box className="h-12 w-12 mx-auto mb-4" /><p className="text-xs uppercase font-black tracking-widest">Empty Worksheet</p></TableCell></TableRow>
                  ) : (
                    lineItems.map((item, idx) => (
                      <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors h-24">
                        <TableCell className="pl-8">
                          <div className="space-y-1.5">
                            {item.isCustom ? (
                              <Input className="h-9 text-[11px] font-black uppercase border-none ring-1 ring-slate-100 bg-slate-50/30 rounded-lg" value={item.name} onChange={e => updateLineItem(item.id, 'name', e.target.value)} placeholder="Type product name..." />
                            ) : (
                              <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">{item.name}</span>
                            )}
                            <textarea className="w-full text-[9px] font-bold bg-transparent border-none resize-none h-8 text-muted-foreground outline-none" placeholder="Details..." value={item.description} onChange={e => updateLineItem(item.id, 'description', e.target.value)} />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <Input type="number" className="h-9 text-center font-black text-xs rounded-lg w-16 bg-slate-50 border-none" value={item.quantity} onChange={e => updateLineItem(item.id, 'quantity', Number(e.target.value))} />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.unit || 'Pcs'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Input type="number" className="h-9 text-right font-black text-xs rounded-lg w-24 bg-slate-50 border-none ml-auto" value={item.unitPrice} onChange={e => updateLineItem(item.id, 'unitPrice', Number(e.target.value))} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 justify-center">
                             <Input type="number" className="h-9 text-center font-black text-xs rounded-lg w-14 bg-slate-50 border-none" value={item.discountValue} onChange={e => updateLineItem(item.id, 'discountValue', Number(e.target.value))} />
                             <span className="text-[9px] font-black">{item.discountType === 'percent' ? '%' : '৳'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8"><span className="font-black text-xs text-blue-600">৳{item.total.toLocaleString()}</span></TableCell>
                        <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full" onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}><X className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <div className="w-full lg:w-[400px] space-y-6">
          <Card className="p-8 rounded-[2.5rem] shadow-2xl space-y-4 text-center text-white bg-blue-600">
            <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em]">Net Proposal Value</p>
            <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tighter">৳{calculations.finalTotal.toLocaleString()}</h2>
            <div className="pt-6 space-y-2 border-t border-white/10 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex justify-between opacity-70"><span>Gross Subtotal</span><span>৳{calculations.rawSubtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-blue-100"><span>Discounts</span><span>- ৳{calculations.discounts.toLocaleString()}</span></div>
              <div className="flex justify-between text-blue-100"><span>Accrued VAT</span><span>+ ৳{calculations.taxes.toLocaleString()}</span></div>
            </div>
          </Card>

          <Card className="p-6 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Calculator className="h-3 w-3" /> Global Discount (৳)</Label>
              <Input type="number" className="h-11 rounded-2xl bg-slate-50 border-none font-black text-sm text-red-600" value={globalDiscount || ''} onChange={e => setGlobalDiscount(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><FileText className="h-3 w-3" /> Notes & Terms</Label>
              <textarea className="w-full min-h-[150px] rounded-2xl bg-slate-50 border-none p-4 text-[10px] font-bold text-slate-600 resize-none outline-none" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <Button className="w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 text-white bg-blue-600 hover:bg-blue-700" disabled={isSubmitting || lineItems.length === 0} onClick={handleSaveQuote}>
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
              Synchronize Proposal
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
