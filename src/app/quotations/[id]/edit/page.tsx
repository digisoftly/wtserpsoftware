
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
      setSelectedCustomerId(quote.customerId);
      setProjectName(quote.projectName || "");
      setProjectLocation(quote.projectLocation || "");
      
      const itemsWithIds = (quote.items || []).map((item: any, idx: number) => ({
        ...item,
        id: item.id || `quote-item-${idx}-${item.productId}-${Date.now()}`,
        unit: item.unit || "Pcs",
        brand: item.brand || "",
        model: item.model || "",
        specs: item.specs || "",
        warranty: item.warranty || ""
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

  const unitsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_units"), orderBy("name"));
  }, [db, companyId]);
  const { data: masterUnits } = useCollection(unitsQuery);

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
      const raw = (Number(updated.quantity) || 0) * (Number(updated.unitPrice) || 0);
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
      customerName: quote?.customerId === 'manual' ? quote.customerName : `${clientData.firstName || ''} ${clientData.lastName || ''}`,
      projectName,
      projectLocation,
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
            <h1 className="text-lg font-bold text-blue-600 uppercase tracking-tight">{t('edit')} Proposal</h1>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400">Client</Label>
                 <Input disabled value={quote?.customerName || ''} className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs" />
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400">Project Name</Label>
                 <Input value={projectName} onChange={e => setProjectName(e.target.value)} className="h-10 rounded-xl font-bold text-xs" />
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase text-slate-400">Location</Label>
                 <Input value={projectLocation} onChange={e => setProjectLocation(e.target.value)} className="h-10 rounded-xl font-bold text-xs" />
               </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 border-t pt-4">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400">Expiry</Label>
                   <Input type="date" value={expiryDate || ''} onChange={e => setExpiryDate(e.target.value)} className="h-10 rounded-xl text-xs font-black uppercase" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-400">Status</Label>
                   <Select value={status || 'draft'} onValueChange={setStatus}>
                      <SelectTrigger className="h-10 rounded-xl font-black text-[10px] uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                         <SelectItem value="draft" className="text-xs font-black">DRAFT</SelectItem>
                         <SelectItem value="sent" className="text-xs font-black">SENT</SelectItem>
                         <SelectItem value="approved" className="text-xs font-black text-green-600">APPROVED</SelectItem>
                         <SelectItem value="rejected" className="text-xs font-black text-red-600">REJECTED</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
            </div>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white overflow-hidden flex flex-col">
            <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <LayoutGrid className="h-4 w-4 text-blue-600" />
                 <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Proposal Matrix</h3>
               </div>
               <Button variant="outline" size="sm" className="rounded-full gap-2 border-blue-100 text-blue-700 bg-white h-9 px-4 font-black text-[10px] uppercase shadow-sm" onClick={() => setLineItems([...lineItems, { id: Math.random().toString(36).substr(2, 9), productId: 'custom', name: '', description: '', brand: '', model: '', specs: '', warranty: '', quantity: 1, unit: 'Pcs', unitPrice: 0, discountValue: 0, discountType: 'percent', taxPercent: 0, total: 0, isCustom: true }])}>
                 <PackagePlus className="h-4 w-4" /> New Row
               </Button>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/30">
                  <TableRow>
                    <TableHead className="w-10 text-center text-[9px] font-black uppercase py-4 pl-6">Sl.</TableHead>
                    <TableHead className="text-[9px] font-black uppercase py-4">Item Details</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-center w-20">Unit</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-center w-20">Qty</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-right w-24">Price</TableHead>
                    <TableHead className="text-[9px] font-black uppercase text-right pr-6 w-24">Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, idx) => (
                    <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                      <TableCell className="pl-6 text-center text-[10px] font-bold text-slate-400">{(idx + 1).toString().padStart(2, '0')}</TableCell>
                      <TableCell className="py-3">
                        <div className="space-y-2">
                          <Input className="h-8 text-[11px] font-black uppercase border-none ring-1 ring-slate-100 bg-slate-50/30 rounded-lg" value={item.name || ''} onChange={e => handleUpdateLineItem(item.id, 'name', e.target.value)} placeholder="Item Name" />
                          <div className="grid grid-cols-3 gap-1.5">
                             <Input className="h-7 text-[9px] font-bold border-slate-200" value={item.brand || ''} onChange={e => handleUpdateLineItem(item.id, 'brand', e.target.value)} placeholder="Brand" />
                             <Input className="h-7 text-[9px] font-bold border-slate-200" value={item.model || ''} onChange={e => handleUpdateLineItem(item.id, 'model', e.target.value)} placeholder="Model" />
                             <Input className="h-7 text-[9px] font-bold border-slate-200" value={item.warranty || ''} onChange={e => handleUpdateLineItem(item.id, 'warranty', e.target.value)} placeholder="Warranty" />
                          </div>
                          <textarea className="w-full text-[9px] font-medium bg-slate-50 border border-slate-200 rounded p-1.5 min-h-[40px] resize-none outline-none" value={item.specs || ''} onChange={e => handleUpdateLineItem(item.id, 'specs', e.target.value)} placeholder="Specification" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select value={item.unit || 'Pcs'} onValueChange={(val) => handleUpdateLineItem(item.id, 'unit', val)}>
                          <SelectTrigger className="h-7 border-none bg-slate-50 text-[10px] font-bold uppercase w-14 mx-auto"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {masterUnits?.map(u => <SelectItem key={u.id} value={u.shortName} className="text-xs font-bold">{u.shortName}</SelectItem>)}
                            {!masterUnits?.length && <SelectItem value="Pcs">Pcs</SelectItem>}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-center">
                         <Input type="number" className="h-8 text-center font-black text-xs rounded-lg w-14 bg-slate-50 border-none mx-auto" value={item.quantity || ''} onChange={e => handleUpdateLineItem(item.id, 'quantity', Number(e.target.value))} />
                      </TableCell>
                      <TableCell className="text-right">
                         <Input type="number" className="h-8 text-right font-black text-xs rounded-lg w-20 bg-slate-50 border-none ml-auto" value={item.unitPrice || ''} onChange={e => handleUpdateLineItem(item.id, 'unitPrice', Number(e.target.value))} />
                      </TableCell>
                      <TableCell className="text-right pr-6"><span className="font-black text-xs text-blue-600">৳{(item.total || 0).toLocaleString()}</span></TableCell>
                      <TableCell className="pr-4"><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 rounded-full" onClick={() => setLineItems(lineItems.filter(i => i.id !== item.id))}><X className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <div className="w-full lg:w-[380px] space-y-6">
          <Card className="p-8 rounded-[2.5rem] shadow-2xl space-y-6 text-center text-white bg-blue-600">
            <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em]">Net Proposal Value</p>
            <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tighter">৳{(calculations.finalTotal || 0).toLocaleString()}</h2>
            <div className="pt-6 space-y-2 border-t border-white/10 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex justify-between opacity-70"><span>Gross Subtotal</span><span>৳{(calculations.rawSubtotal || 0).toLocaleString()}</span></div>
              <div className="flex justify-between text-blue-100"><span>Accrued VAT</span><span>+ ৳{(calculations.taxes || 0).toLocaleString()}</span></div>
            </div>
          </Card>

          <Card className="p-6 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Global Discount (৳)</Label>
              <Input type="number" className="h-11 rounded-2xl bg-slate-50 border-none font-black text-sm text-red-600" value={globalDiscount || ''} onChange={e => setGlobalDiscount(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Notes & Terms</Label>
              <textarea className="w-full min-h-[150px] rounded-2xl bg-slate-50 border-none p-4 text-[10px] font-bold text-slate-600 resize-none outline-none" value={notes || ''} onChange={e => setNotes(e.target.value)} />
            </div>
            <Button className="w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95" disabled={isSubmitting || lineItems.length === 0} onClick={handleSaveUpdate}>
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
              Update Proposal
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
