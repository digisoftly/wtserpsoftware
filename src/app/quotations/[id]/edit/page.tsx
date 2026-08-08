"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
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
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, updateDoc, serverTimestamp, collection } from "firebase/firestore"
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

export default function EditQuotationPage() {
  const router = useRouter();
  const { id } = useParams();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const quoteRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return doc(db, "companies", companyId, "branches", branchId, "quotations", id as string);
  }, [db, companyId, branchId, id]);

  const { data: quote, isLoading: isQuoteLoading } = useDoc(quoteRef);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [lineItems, setLineItems] = React.useState<QuoteItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = React.useState(0);
  const [notes, setNotes] = React.useState("");
  const [status, setStatus] = React.useState("draft");
  const [expiryDate, setExpiryDate] = React.useState("");

  React.useEffect(() => {
    if (quote) {
      setSelectedCustomerId(quote.customerId);
      
      // FIX: Ensure every item has a unique key/id even if missing in database
      const itemsWithIds = (quote.items || []).map((item: any, idx: number) => ({
        ...item,
        id: item.id || `quote-item-${idx}-${item.productId}`
      }));
      setLineItems(itemsWithIds);
      
      setGlobalDiscount(quote.discount || 0);
      setNotes(quote.notes || "");
      setStatus(quote.status || "draft");
      setExpiryDate(quote.expiryDate || "");
    }
  }, [quote]);

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

    return { rawSubtotal: itemSubtotal, discounts: itemDiscounts, taxes: itemTaxes, subtotal, finalTotal };
  }, [lineItems, globalDiscount]);

  const handleUpdateLineItem = (id: string, field: keyof QuoteItem, value: any) => {
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

  const handleSaveUpdate = async () => {
    if (!quoteRef || isSubmitting) return;
    setIsSubmitting(true);
    
    const clientData = customers?.find(c => c.id === selectedCustomerId) || {};

    const updatedData = {
      customerId: selectedCustomerId,
      customerName: quote?.customerId === 'manual' ? quote.customerName : `${clientData.firstName} ${clientData.lastName}`,
      items: lineItems,
      subtotal: calculations.subtotal,
      taxAmount: calculations.taxes,
      discount: globalDiscount,
      totalAmount: calculations.finalTotal,
      status,
      notes,
      expiryDate,
      updatedAt: serverTimestamp(),
    };

    try {
      await updateDoc(quoteRef, updatedData);
      toast({ title: t('success') });
      router.push("/quotations");
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
      setIsSubmitting(false);
    }
  };

  if (isQuoteLoading) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen pb-20">
      <div className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-blue-600">{t('edit')} Proposal</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{quote?.quotationNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-full px-8 h-10 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 gap-2" disabled={isSubmitting} onClick={handleSaveUpdate}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            {t('save')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6">
        <div className="flex-1 space-y-6">
          <Card className="p-6 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Client Identification</Label>
                 <Input disabled value={quote?.customerName} className="h-11 rounded-xl bg-slate-50 border-none font-bold" />
               </div>
               <div className="space-y-4">
                 <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Proposal Settings</Label>
                 <div className="grid grid-cols-2 gap-3">
                   <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="h-11 rounded-xl text-xs font-black uppercase" />
                   <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-11 rounded-xl font-black text-[10px] uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                         <SelectItem value="draft" className="text-xs font-black">DRAFT</SelectItem>
                         <SelectItem value="sent" className="text-xs font-black">SENT</SelectItem>
                         <SelectItem value="approved" className="text-xs font-black text-green-600">APPROVED</SelectItem>
                         <SelectItem value="rejected" className="text-xs font-black text-red-600">REJECTED</SelectItem>
                      </SelectContent>
                   </Select>
                 </div>
               </div>
            </div>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white overflow-hidden flex flex-col">
            <div className="p-5 border-b bg-slate-50/50 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <LayoutGrid className="h-4 w-4 text-blue-600" />
                 <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Proposal Matrix</h3>
               </div>
               <Button variant="outline" size="sm" className="rounded-full gap-2 border-blue-100 text-blue-700 bg-white h-10 px-4 font-black text-[10px] uppercase shadow-sm" onClick={() => setLineItems([...lineItems, { id: Math.random().toString(36).substr(2, 9), productId: 'custom', name: '', description: '', quantity: 1, unit: 'Pcs', unitPrice: 0, discountValue: 0, discountType: 'percent', taxPercent: 0, total: 0, isCustom: true }])}>
                 <PackagePlus className="h-4 w-4" /> New Row
               </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/30">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-black py-4 pl-8">Item Description</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-center w-28">Qty</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-right w-32">Price</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-right pr-8 w-32">Total</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, idx) => (
                    <TableRow key={item.id} className="h-24 group hover:bg-slate-50/50 transition-colors">
                      <TableCell className="pl-8">
                        <div className="space-y-1">
                          <Input className="h-9 text-[11px] font-black uppercase border-none ring-1 ring-slate-100 bg-slate-50/30 rounded-lg" value={item.name} onChange={e => handleUpdateLineItem(item.id, 'name', e.target.value)} />
                          <textarea className="w-full text-[9px] font-bold bg-transparent border-none resize-none h-8 text-muted-foreground outline-none" value={item.description} onChange={e => handleUpdateLineItem(item.id, 'description', e.target.value)} />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <Input type="number" className="h-9 text-center font-black text-xs rounded-lg w-16 bg-slate-50 border-none mx-auto" value={item.quantity} onChange={e => handleUpdateLineItem(item.id, 'quantity', Number(e.target.value))} />
                      </TableCell>
                      <TableCell className="text-right">
                         <Input type="number" className="h-9 text-right font-black text-xs rounded-lg w-24 bg-slate-50 border-none ml-auto" value={item.unitPrice} onChange={e => handleUpdateLineItem(item.id, 'unitPrice', Number(e.target.value))} />
                      </TableCell>
                      <TableCell className="text-right pr-8"><span className="font-black text-xs text-blue-600">৳{item.total.toLocaleString()}</span></TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 rounded-full" onClick={() => setLineItems(lineItems.filter(i => i.id !== item.id))}><X className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <div className="w-full lg:w-[400px] space-y-6">
          <Card className="p-8 rounded-[2.5rem] shadow-2xl space-y-6 text-center text-white bg-blue-600">
            <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em]">Net Proposal Value</p>
            <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tighter">৳{calculations.finalTotal.toLocaleString()}</h2>
            <div className="pt-6 space-y-2 border-t border-white/10 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex justify-between opacity-70"><span>Gross Subtotal</span><span>৳{calculations.rawSubtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-blue-100"><span>Accrued VAT</span><span>+ ৳{calculations.taxes.toLocaleString()}</span></div>
            </div>
          </Card>

          <Card className="p-6 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Global Discount (৳)</Label>
              <Input type="number" className="h-11 rounded-2xl bg-slate-50 border-none font-black text-sm text-red-600" value={globalDiscount || ''} onChange={e => setGlobalDiscount(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Notes & Terms</Label>
              <textarea className="w-full min-h-[150px] rounded-2xl bg-slate-50 border-none p-4 text-[10px] font-bold text-slate-600 resize-none outline-none" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <Button className="w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl text-white bg-blue-600 hover:bg-blue-700" disabled={isSubmitting || lineItems.length === 0} onClick={handleSaveUpdate}>
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
              Update Proposal
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
