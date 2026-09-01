
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  Calculator,
  X,
  PlusCircle,
  FileText,
  UserPlus,
  Building,
  User,
  LayoutGrid,
  Search,
  CheckCircle2,
  Scan,
  Package,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, doc, runTransaction, serverTimestamp, increment, query, orderBy, setDoc, getDocs, where, limit } from "firebase/firestore"
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
  qty: number;
  unit: string;
  price: number;
  discount: number;
  tax: number;
  total: number;
  imageUrl?: string;
  isCustom?: boolean;
}

export default function NewQuotationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copyFromId = searchParams.get('copyFrom');
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [isNewCustomerMode, setIsNewCustomerMode] = React.useState(false);

  const [quotationDate, setQuotationDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = React.useState("");
  const [projectName, setProjectName] = React.useState("");
  const [projectLocation, setProjectLocation] = React.useState("");
  const [lineItems, setLineItems] = React.useState<QuoteItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = React.useState(0);
  const [notes, setNotes] = React.useState("");
  const [terms, setTerms] = React.useState("");

  const copySourceRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !copyFromId) return null;
    return doc(db, "companies", companyId, "branches", branchId, "quotations", copyFromId);
  }, [db, companyId, branchId, copyFromId]);
  const { data: sourceQuote } = useDoc(copySourceRef);

  React.useEffect(() => {
    if (sourceQuote) {
      setSelectedCustomerId(sourceQuote.customerId || "");
      setProjectName(sourceQuote.projectName || "");
      setProjectLocation(sourceQuote.projectLocation || "");
      setGlobalDiscount(Number(sourceQuote.globalDiscount || sourceQuote.discount || 0));
      setNotes(sourceQuote.notes || "");
      setTerms(sourceQuote.terms || "");
      const itemsWithIds = (sourceQuote.items || []).map((item: any, idx: number) => ({
        ...item,
        id: `clone-quote-${idx}-${Date.now()}`,
        qty: Number(item.qty || item.quantity || 0),
        price: Number(item.price || item.unitPrice || 0),
        total: Number(item.total || 0),
        sn: "" 
      }));
      setLineItems(itemsWithIds);
    }
  }, [sourceQuote]);

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

  const subtotal = React.useMemo(() => lineItems.reduce((sum, item) => sum + (item.qty * item.price), 0), [lineItems]);
  const itemDiscounts = lineItems.reduce((sum, item) => sum + (item.qty * item.price * (item.discount / 100)), 0);
  const itemTaxes = lineItems.reduce((sum, item) => sum + ((item.qty * item.price) - (item.qty * item.price * (item.discount / 100))) * (item.tax / 100), 0);
  const grandTotal = subtotal - itemDiscounts + itemTaxes - globalDiscount;

  const handleSave = async () => {
    if (!selectedCustomerId || lineItems.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const quoteRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "quotations"));
      const customer = customers?.find(c => c.id === selectedCustomerId);
      
      const resolvedCustomerName = customer 
        ? (customer.customerType !== 'individual' ? customer.companyName : customer.fullName)
        : "Client";

      const quoteData = {
        id: quoteRef.id,
        quotationNumber: `QTN-${Date.now().toString().slice(-4)}`,
        customerId: selectedCustomerId,
        customerName: resolvedCustomerName,
        customerPhone: customer?.phoneNumber || "",
        customerAddress: customer?.address || "",
        projectName,
        projectLocation,
        quotationDate,
        expiryDate,
        items: lineItems,
        subtotal,
        discount: globalDiscount + itemDiscounts,
        taxAmount: itemTaxes,
        totalAmount: grandTotal,
        status: "draft",
        notes,
        terms,
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

  const addManualRow = () => {
    setLineItems([...lineItems, { id: Math.random().toString(36).substr(2, 9), productId: "custom", name: "", description: "", brand: "", model: "", specs: "", warranty: "1 Year", sn: "", qty: 1, unit: "Pcs", price: 0, discount: 0, tax: 0, total: 0, isCustom: true }]);
  };

  const updateItem = (id: string, field: keyof QuoteItem, val: any) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };
      if (['qty', 'price', 'discount', 'tax'].includes(field as string)) {
        const q = Number(updated.qty) || 0;
        const p = Number(updated.price) || 0;
        const d = Number(updated.discount) || 0;
        const t_val = Number(updated.tax) || 0;
        const base = q * p;
        const disc = base * (d / 100);
        const taxed = (base - disc) * (t_val / 100);
        updated.total = base - disc + taxed;
      }
      return updated;
    }));
  };

  return (
    <div className="max-w-full mx-auto space-y-6 pb-20 overflow-x-hidden">
      <div className="flex items-center justify-between border-b pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-2 sm:px-4">
        <div className="flex items-center gap-3 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-8 w-8 md:h-10 md:w-10">
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <div>
            <h1 className="text-base md:text-lg font-black text-slate-900 tracking-tight leading-none uppercase">Provision Proposal</h1>
            <p className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Quotation Terminal Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="font-bold text-xs" onClick={() => router.back()}>{t('cancel')}</Button>
          <Button size="sm" className="font-bold text-xs gap-2 px-6 md:px-8 h-9 md:h-11 rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl" disabled={isSubmitting} onClick={handleSave}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{t('save')} Proposal</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <div className="p-6 md:p-10 space-y-12">
          
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
               <div className="flex items-center gap-2">
                 <User className="h-4 w-4 text-blue-600" />
                 <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Prospect Identity</h3>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5 lg:col-span-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Target Customer</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue placeholder="Search Directory" /></SelectTrigger>
                  <SelectContent className="max-h-[300px] rounded-xl shadow-2xl">
                    {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">{c.customerType !== 'individual' ? c.companyName : c.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Quote Date</Label><Input type="date" value={quotationDate} onChange={e => setQuotationDate(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-none" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Expiry Date</Label><Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-none" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Project Name</Label><Input value={projectName} onChange={e => setProjectName(e.target.value)} className="h-11 rounded-xl" placeholder="Security Upgrade" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Site Location</Label><Input value={projectLocation} onChange={e => setProjectLocation(e.target.value)} className="h-11 rounded-xl" placeholder="Site Address" /></div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-orange-600" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Proposal Matrix</h3>
              </div>
              <Button variant="outline" size="sm" className="h-9 rounded-xl text-[10px] font-black uppercase" onClick={addManualRow}><PlusCircle className="h-4 w-4 mr-2" /> Add Row</Button>
            </div>

            <div className="overflow-x-auto">
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
                           <Input className="h-10 text-xs font-black uppercase border-none bg-slate-50 rounded-xl" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder="Item Name" />
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <Input className="h-8 text-[10px] font-bold bg-white" value={item.model} onChange={e => updateItem(item.id, 'model', e.target.value)} placeholder="Model" />
                              <Input className="h-8 text-[10px] font-bold bg-white" value={item.brand} onChange={e => updateItem(item.id, 'brand', e.target.value)} placeholder="Brand" />
                              <Input className="h-8 text-[10px] font-bold bg-white" value={item.warranty} onChange={e => updateItem(item.id, 'warranty', e.target.value)} placeholder="Warranty" />
                           </div>
                           <textarea className="w-full text-[10px] font-medium bg-slate-50 border rounded-xl p-3 min-h-[60px]" value={item.specs} onChange={e => updateItem(item.id, 'specs', e.target.value)} placeholder="Specs..." />
                        </div>
                      </TableCell>
                      <TableCell className="py-6"><Select value={item.unit} onValueChange={v => updateItem(item.id, 'unit', v)}><SelectTrigger className="h-9 w-20 mx-auto rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{masterUnits?.map(u => <SelectItem key={u.id} value={u.shortName}>{u.shortName}</SelectItem>)}</SelectContent></Select></TableCell>
                      <TableCell className="py-6 text-center"><Input type="number" className="h-10 text-center font-black text-xs w-16 bg-slate-50 border-none mx-auto rounded-xl" value={item.qty || ''} onChange={e => updateItem(item.id, 'qty', Number(e.target.value))} /></TableCell>
                      <TableCell className="py-6 text-right"><Input type="number" className="h-10 text-right font-black text-xs w-24 bg-slate-100 border-none ml-auto rounded-xl" value={item.price || ''} onChange={e => updateItem(item.id, 'price', Number(e.target.value))} /></TableCell>
                      <TableCell className="py-6 text-right pr-10 font-black text-xs text-slate-900">৳{item.total.toLocaleString()}</TableCell>
                      <TableCell className="py-6 pr-4"><Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-red-600 rounded-full" onClick={() => setLineItems(lineItems.filter(i => i.id !== item.id))}><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-12 pt-8 border-t">
            <div className="space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Terms & Conditions</h3>
              <Textarea className="min-h-[150px] rounded-2xl bg-slate-50 border-none p-6 text-xs font-medium" placeholder="Payment terms, delivery time, etc..." value={terms} onChange={e => setTerms(e.target.value)} />
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-8 shadow-2xl">
               <div className="flex flex-col items-center text-center space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Net Proposal Value</p>
                 <h2 className="text-5xl font-headline font-black text-blue-400 tracking-tighter">৳{grandTotal.toLocaleString()}</h2>
               </div>
               
               <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40"><span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40"><span>VAT 15%</span><span>৳{itemTaxes.toLocaleString()}</span></div>
                  </div>
                  <div className="space-y-4 border-l border-white/5 pl-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-red-400"><span>Adjustment</span><span>-৳{globalDiscount.toLocaleString()}</span></div>
                  </div>
               </div>

               <div className="pt-4">
                  <Label className="text-[9px] font-black uppercase opacity-40">Extra Discount ৳</Label>
                  <Input type="number" className="h-10 bg-white/5 border-white/10 rounded-xl text-xs font-black text-red-400 mt-1" value={globalDiscount || ''} onChange={e => setGlobalDiscount(Number(e.target.value))} />
               </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
