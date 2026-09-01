
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
  ArrowRight,
  User,
  Package
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, updateDoc, serverTimestamp, collection, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface QuoteItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  brand: string;
  model: string;
  specs: string;
  warranty: string;
  sn: string;
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
  const [projectName, setProjectName] = React.useState("");
  const [projectLocation, setProjectLocation] = React.useState("");

  React.useEffect(() => {
    if (quote) {
      setSelectedCustomerId(quote.customerId || "");
      setProjectName(quote.projectName || "");
      setProjectLocation(quote.projectLocation || "");
      
      const itemsWithIds = (quote.items || []).map((item: any, idx: number) => ({
        ...item,
        id: item.id || `quote-item-${idx}-${item.productId}-${Date.now()}`,
        name: item.name || '',
        description: item.description || '',
        unit: item.unit || "Pcs",
        brand: item.brand || "",
        model: item.model || "",
        specs: item.specs || "",
        warranty: item.warranty || "",
        sn: item.sn || "",
        quantity: Number(item.quantity || item.qty || 0),
        unitPrice: Number(item.unitPrice || item.price || 0),
        discountValue: Number(item.discountValue || item.discount || 0),
        discountType: item.discountType || 'percent',
        taxPercent: Number(item.taxPercent || item.tax || 0),
        total: Number(item.total || 0)
      }));
      setLineItems(itemsWithIds);
      
      setGlobalDiscount(Number(quote.discount || 0));
      setNotes(quote.notes || "");
      setStatus(quote.status || "draft");
      setExpiryDate(quote.expiryDate || "");
    }
  }, [quote]);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  const unitsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_units"), orderBy("name"));
  }, [db, companyId]);
  const { data: masterUnits } = useCollection(unitsQuery);

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
    const subtotalCalc = itemSubtotal - itemDiscounts;
    const finalTotal = subtotalCalc + itemTaxes - globalDiscount;
    return { rawSubtotal: itemSubtotal, discounts: itemDiscounts, taxes: itemTaxes, subtotal: subtotalCalc, finalTotal };
  }, [lineItems, globalDiscount]);

  const handleUpdateLineItem = (id: string, field: keyof QuoteItem, value: any) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      const raw = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0);
      const disc = updated.discountType === 'percent' ? (raw * (updated.discountValue / 100)) : Number(updated.discountValue);
      const taxed = (raw - disc) * (Number(updated.taxPercent) / 100);
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
      customerName: quote?.customerId === 'manual' ? quote.customerName : `${clientData.firstName || ''} ${clientData.lastName || ''}`,
      projectName,
      projectLocation,
      items: lineItems,
      subtotal: calculations.subtotal,
      taxAmount: calculations.taxes,
      discount: globalDiscount + calculations.discounts,
      globalDiscount: globalDiscount,
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

  if (isQuoteLoading || !quote) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-full mx-auto space-y-6 pb-20 overflow-x-hidden">
      <div className="flex items-center justify-between border-b pb-4 bg-white sticky top-0 z-50 px-2 sm:px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
          <div><h1 className="text-lg font-black text-blue-600 uppercase">Modify Proposal</h1><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{quote?.quotationNumber}</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="font-bold text-xs" onClick={() => router.back()}>{t('cancel')}</Button>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-full px-8 h-10 text-[10px] font-black uppercase shadow-xl" disabled={isSubmitting} onClick={handleSaveUpdate}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} {t('save')} Changes
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <div className="p-6 md:p-10 space-y-12">
          
          <section className="space-y-6">
            <div className="flex items-center gap-2 border-b pb-4">
              <User className="h-4 w-4 text-blue-600" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Prospect Identity</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="space-y-1.5 lg:col-span-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400">Client Account</Label>
                 <Input disabled value={quote?.customerName || ''} className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs" />
               </div>
               <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Project Name</Label><Input value={projectName || ''} onChange={e => setProjectName(e.target.value)} className="h-11 rounded-xl" /></div>
               <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Location</Label><Input value={projectLocation || ''} onChange={e => setProjectLocation(e.target.value)} className="h-11 rounded-xl" /></div>
               <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Expiry Date</Label><Input type="date" value={expiryDate || ''} onChange={e => setExpiryDate(e.target.value)} className="h-11 rounded-xl uppercase" /></div>
               <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Proposal Status</Label>
                 <Select value={status || 'draft'} onValueChange={setStatus}>
                    <SelectTrigger className="h-11 rounded-xl font-black text-[10px] uppercase"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="draft" className="text-xs font-black">DRAFT</SelectItem><SelectItem value="sent" className="text-xs font-black">SENT</SelectItem><SelectItem value="approved" className="text-xs font-black text-green-600">APPROVED</SelectItem><SelectItem value="rejected" className="text-xs font-black text-red-600">REJECTED</SelectItem></SelectContent>
                 </Select>
               </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
               <div className="flex items-center gap-3">
                 <Package className="h-4 w-4 text-blue-600" />
                 <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Proposal Matrix</h3>
               </div>
               <Button variant="outline" size="sm" className="h-10 rounded-xl gap-2 text-[10px] font-black uppercase border-slate-200" onClick={() => setLineItems([...lineItems, { id: Math.random().toString(36).substr(2, 9), productId: 'custom', name: '', description: '', brand: '', model: '', specs: '', warranty: '1 Year', sn: '', quantity: 1, unit: 'Pcs', unitPrice: 0, discountValue: 0, discountType: 'percent', taxPercent: 0, total: 0, isCustom: true }])}>
                 <PackagePlus className="h-4 w-4" /> New Row
               </Button>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <Table className="min-w-[1000px]">
                <TableHeader className="bg-slate-50/50">
                  <TableRow><TableHead className="w-12 text-center text-[10px] font-black pl-6 uppercase">Sl</TableHead><TableHead className="min-w-[400px] text-[10px] font-black uppercase">Technical Specs & Details</TableHead><TableHead className="w-24 text-center text-[10px] font-black uppercase">Unit</TableHead><TableHead className="w-24 text-center text-[10px] font-black uppercase">Qty</TableHead><TableHead className="w-32 text-right text-[10px] font-black uppercase">Price</TableHead><TableHead className="w-32 text-right pr-10 text-[10px] font-black uppercase">Total</TableHead><TableHead className="w-10"></TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, idx) => (
                    <TableRow key={item.id} className="group hover:bg-slate-50 transition-colors border-b align-top">
                      <TableCell className="text-center text-[11px] font-black text-slate-300 py-6 pl-6">{(idx + 1).toString().padStart(2, '0')}</TableCell>
                      <TableCell className="py-6 px-2">
                        <div className="space-y-4">
                           <Input className="h-10 text-xs font-black uppercase border-none bg-slate-50 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500" value={item.name} onChange={e => handleUpdateLineItem(item.id, 'name', e.target.value)} />
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <Input className="h-8 text-[10px] font-bold bg-white" value={item.model} onChange={e => handleUpdateLineItem(item.id, 'model', e.target.value)} placeholder="Model" />
                              <Input className="h-8 text-[10px] font-bold bg-white" value={item.brand} onChange={e => handleUpdateLineItem(item.id, 'brand', e.target.value)} placeholder="Brand" />
                              <Input className="h-8 text-[10px] font-bold bg-white" value={item.warranty} onChange={e => handleUpdateLineItem(item.id, 'warranty', e.target.value)} placeholder="Warranty" />
                           </div>
                           <textarea className="w-full text-[10px] font-medium bg-slate-50 border rounded-xl p-3 min-h-[60px]" value={item.specs} onChange={e => handleUpdateLineItem(item.id, 'specs', e.target.value)} placeholder="Specs..." />
                        </div>
                      </TableCell>
                      <TableCell className="py-6"><Select value={item.unit} onValueChange={v => handleUpdateLineItem(item.id, 'unit', v)}><SelectTrigger className="h-9 w-20 mx-auto rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{masterUnits?.map(u => <SelectItem key={u.id} value={u.shortName}>{u.shortName}</SelectItem>)}</SelectContent></Select></TableCell>
                      <TableCell className="py-6 text-center"><Input type="number" className="h-10 text-center font-black text-xs w-16 bg-slate-50 border-none mx-auto rounded-xl" value={item.quantity || ''} onChange={e => handleUpdateLineItem(item.id, 'quantity', Number(e.target.value))} /></TableCell>
                      <TableCell className="py-6 text-right"><Input type="number" className="h-10 text-right font-black text-xs w-24 bg-slate-100 border-none ml-auto rounded-xl" value={item.unitPrice || ''} onChange={e => handleUpdateLineItem(item.id, 'unitPrice', Number(e.target.value))} /></TableCell>
                      <TableCell className="py-6 text-right pr-10 font-black text-xs text-slate-900">৳{item.total.toLocaleString()}</TableCell>
                      <TableCell className="py-6 pr-4"><Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-red-600 rounded-full" onClick={() => setLineItems(lineItems.filter(i => i.id !== item.id))}><X className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-12 pt-8 border-t">
            <div className="space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Quotation Remarks</h3>
              <Textarea className="min-h-[150px] rounded-2xl bg-slate-50 border-none p-6 text-xs font-medium" placeholder="Special terms, notes..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-8 shadow-2xl">
               <div className="flex flex-col items-center text-center space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Net Proposal Value</p>
                 <h2 className="text-5xl font-headline font-black text-blue-400 tracking-tighter">৳{calculations.finalTotal.toLocaleString()}</h2>
               </div>
               <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-8">
                  <div className="space-y-3"><div className="flex justify-between text-[10px] font-black uppercase opacity-40"><span>Subtotal</span><span>৳{calculations.rawSubtotal.toLocaleString()}</span></div><div className="flex justify-between text-[10px] font-black uppercase text-blue-300"><span>VAT 15%</span><span>+৳{calculations.taxes.toLocaleString()}</span></div></div>
                  <div className="space-y-3 border-l border-white/5 pl-4"><div className="flex justify-between text-[10px] font-black uppercase text-red-400"><span>Adjustment</span><span>-৳{globalDiscount.toLocaleString()}</span></div></div>
               </div>
               <div className="pt-4"><Label className="text-[9px] font-black uppercase opacity-40">Global Discount ৳</Label><Input type="number" className="h-10 bg-white/5 border-white/10 rounded-xl text-xs font-black text-red-400 mt-1" value={globalDiscount || ''} onChange={e => setGlobalDiscount(Number(e.target.value))} /></div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
