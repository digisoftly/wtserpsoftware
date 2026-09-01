
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  Calculator,
  X,
  PlusCircle,
  LayoutGrid
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, updateDoc, serverTimestamp, increment, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface InvoiceItem {
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
  isCustom?: boolean;
}

export default function EditInvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const invoiceRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return doc(db, "companies", companyId, "branches", branchId, "sales_invoices", id as string);
  }, [db, companyId, branchId, id]);

  const { data: invoice, isLoading: isInvoiceLoading } = useDoc(invoiceRef);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [invoiceDate, setInvoiceDate] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("cash");
  const [projectName, setProjectName] = React.useState("");
  const [projectLocation, setProjectLocation] = React.useState("");
  const [lineItems, setLineItems] = React.useState<InvoiceItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = React.useState(0);
  const [additionalCharge, setAdditionalCharge] = React.useState(0);
  const [paidAmount, setPaidAmount] = React.useState(0);
  const [notes, setNotes] = React.useState("");
  const [terms, setTerms] = React.useState("");

  // Sync state with data once it loads - Ensures UI is populated and stable
  React.useEffect(() => {
    if (invoice) {
      setSelectedCustomerId(invoice.customerId || "");
      setInvoiceDate(invoice.invoiceDate || "");
      setDueDate(invoice.dueDate || "");
      setPaymentMethod(invoice.paymentMethod || "cash");
      setProjectName(invoice.projectName || "");
      setProjectLocation(invoice.projectLocation || "");
      setGlobalDiscount(Number(invoice.globalDiscount || invoice.discount || 0));
      setAdditionalCharge(Number(invoice.additionalCharge || 0));
      setPaidAmount(Number(invoice.paidAmount || 0));
      setNotes(invoice.notes || "");
      setTerms(invoice.terms || "");
      
      const itemsWithIds = (invoice.items || []).map((item: any, idx: number) => ({
        ...item,
        id: item.id || `item-${idx}-${item.productId}-${Date.now()}`,
        unit: item.unit || "Pcs",
        brand: item.brand || "",
        model: item.model || "",
        specs: item.specs || "",
        warranty: item.warranty || "",
        sn: item.sn || "",
        qty: Number(item.qty || item.quantity || 0),
        price: Number(item.price || item.unitPrice || 0),
        discount: Number(item.discount || 0),
        tax: Number(item.tax || item.taxPercent || 0),
        total: Number(item.total || 0)
      }));
      setLineItems(itemsWithIds);
    }
  }, [invoice]);

  // General Queries
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

  // Calculations
  const subtotal = React.useMemo(() => lineItems.reduce((sum, item) => sum + (item.qty * item.price), 0), [lineItems]);
  const itemDiscounts = React.useMemo(() => lineItems.reduce((sum, item) => sum + (item.qty * item.price * (item.discount / 100)), 0), [lineItems]);
  const itemTaxes = React.useMemo(() => lineItems.reduce((sum, item) => sum + ((item.qty * item.price) - (item.qty * item.price * (item.discount / 100))) * (item.tax / 100), 0), [lineItems]);
  
  const grandTotal = subtotal - itemDiscounts + itemTaxes - globalDiscount + additionalCharge;
  const balanceDue = grandTotal - paidAmount;

  const handleUpdate = async () => {
    if (!invoiceRef || lineItems.length === 0 || isSubmitting) return;
    setIsSubmitting(true);

    const customer = customers?.find(c => c.id === selectedCustomerId);

    const updatedData = {
      customerId: selectedCustomerId,
      customerName: customer ? (customer.customerType !== 'individual' ? customer.companyName : `${customer.firstName} ${customer.lastName}`) : (invoice?.customerName || "Client"),
      customerPhone: customer?.phoneNumber || invoice?.customerPhone || "",
      customerEmail: customer?.email || invoice?.customerEmail || "",
      customerAddress: customer?.address || invoice?.customerAddress || "",
      projectName,
      projectLocation,
      invoiceDate,
      dueDate,
      paymentMethod,
      items: lineItems,
      subtotal,
      discount: globalDiscount + itemDiscounts,
      globalDiscount,
      taxAmount: itemTaxes,
      additionalCharge,
      totalAmount: grandTotal,
      paidAmount,
      balanceDue,
      status: balanceDue <= 0 ? "paid" : paidAmount > 0 ? "partial" : "due",
      notes,
      terms,
      updatedAt: serverTimestamp(),
    };

    try {
      await updateDoc(invoiceRef, updatedData);
      toast({ title: t('success') });
      router.push("/sales");
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
      setIsSubmitting(false);
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, val: any) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };
      if (['qty', 'price', 'discount', 'tax'].includes(field)) {
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

  if (isInvoiceLoading || !invoice) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-full mx-auto space-y-6 pb-20 overflow-x-hidden">
      <div className="flex items-center justify-between border-b pb-4 bg-white sticky top-0 z-50 px-2 sm:px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">Modify Invoice</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{invoice.invoiceNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="font-bold text-xs" onClick={() => router.back()}>{t('cancel')}</Button>
          <Button size="sm" className="font-bold text-xs gap-2 px-8 h-10 rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl" disabled={isSubmitting} onClick={handleUpdate}>
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {t('save')} Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-9 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-[2rem]">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1.5 md:col-span-1">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Target Client</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="h-11 rounded-xl font-bold text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">{c.customerType === 'company' ? c.companyName : `${c.firstName} ${c.lastName}`}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Project Title</Label><Input value={projectName} onChange={e => setProjectName(e.target.value)} className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Site Location</Label><Input value={projectLocation} onChange={e => setProjectLocation(e.target.value)} className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Invoice Date</Label><Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="h-11 rounded-xl uppercase" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden rounded-[2rem] bg-white">
            <div className="p-5 bg-slate-50 border-b flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Inventory Manifest</h3>
              <Button variant="outline" size="sm" className="h-10 rounded-xl gap-2 text-[10px] font-black uppercase border-slate-200" onClick={() => setLineItems([...lineItems, { id: Math.random().toString(36).substr(2, 9), productId: 'custom', name: '', description: '', brand: '', model: '', specs: '', warranty: '1 Year', sn: '', qty: 1, unit: 'Pcs', price: 0, discount: 0, tax: 15, total: 0, isCustom: true }])}>
                <PlusCircle className="h-4 w-4" /> Add Row
              </Button>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <Table className="min-w-[1000px]">
                <TableHeader className="bg-slate-50/50">
                  <TableRow><TableHead className="w-12 text-center text-[10px] font-black pl-6 uppercase">Sl</TableHead><TableHead className="min-w-[400px] text-[10px] font-black uppercase">Item Attribute Matrix</TableHead><TableHead className="w-24 text-[10px] font-black uppercase text-center">Unit</TableHead><TableHead className="w-24 text-[10px] font-black uppercase text-center">Qty</TableHead><TableHead className="w-32 text-[10px] font-black uppercase text-right">Price</TableHead><TableHead className="w-32 text-[10px] font-black uppercase text-right pr-10">Total</TableHead><TableHead className="w-10"></TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, idx) => (
                    <TableRow key={item.id} className="group hover:bg-slate-50 transition-colors border-b align-top">
                      <TableCell className="text-center text-[11px] font-black text-slate-300 py-6 pl-6">{(idx + 1).toString().padStart(2, '0')}</TableCell>
                      <TableCell className="py-6 px-2">
                        <div className="space-y-4">
                           <Input className="h-10 text-xs font-black uppercase border-none bg-slate-100/50 rounded-xl" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} />
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <Input className="h-8 text-[10px] font-bold" value={item.model} onChange={e => updateItem(item.id, 'model', e.target.value)} placeholder="Model" />
                              <Input className="h-8 text-[10px] font-bold" value={item.brand} onChange={e => updateItem(item.id, 'brand', e.target.value)} placeholder="Brand" />
                              <Input className="h-8 text-[10px] font-black text-blue-600 bg-blue-50/30" value={item.sn} onChange={e => updateItem(item.id, 'sn', e.target.value)} placeholder="Serial" />
                              <Input className="h-8 text-[10px] font-bold" value={item.warranty} onChange={e => updateItem(item.id, 'warranty', e.target.value)} placeholder="Warranty" />
                           </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-6"><Select value={item.unit} onValueChange={v => updateItem(item.id, 'unit', v)}><SelectTrigger className="h-9 w-20 mx-auto rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{masterUnits?.map(u => <SelectItem key={u.id} value={u.shortName}>{u.shortName}</SelectItem>)}</SelectContent></Select></TableCell>
                      <TableCell className="py-6 text-center"><Input type="number" className="h-10 text-center font-black text-xs w-16 bg-slate-100 border-none mx-auto rounded-xl" value={item.qty || ''} onChange={e => updateItem(item.id, 'qty', Number(e.target.value))} /></TableCell>
                      <TableCell className="py-6 text-right"><Input type="number" className="h-10 text-right font-black text-xs w-24 bg-slate-100 border-none ml-auto rounded-xl" value={item.price || ''} onChange={e => updateItem(item.id, 'price', Number(e.target.value))} /></TableCell>
                      <TableCell className="py-6 text-right pr-10 font-black text-xs text-slate-900">৳{item.total.toLocaleString()}</TableCell>
                      <TableCell className="py-6 pr-4"><Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-red-600 rounded-full" onClick={() => setLineItems(lineItems.filter(i => i.id !== item.id))}><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <div className="xl:col-span-3 space-y-6">
          <Card className="p-8 rounded-[2.5rem] bg-slate-900 text-white space-y-6 text-center shadow-2xl">
             <div className="space-y-1"><p className="text-[10px] font-black uppercase opacity-60 tracking-[0.3em]">Total Transaction Value</p><h2 className="text-4xl font-headline font-black text-emerald-400">৳{grandTotal.toLocaleString()}</h2></div>
             <div className="pt-6 space-y-3 border-t border-white/10 text-[10px] font-black uppercase text-left">
                <div className="flex justify-between opacity-60"><span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-blue-300"><span>Accrued VAT 15%</span><span>+৳{itemTaxes.toLocaleString()}</span></div>
             </div>
          </Card>

          <Card className="p-6 rounded-[2.5rem] bg-white space-y-6 shadow-sm ring-1 ring-slate-100">
            <div className="space-y-4">
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Global Adjustment (৳)</Label><Input type="number" className="h-11 rounded-xl bg-slate-50 border-none font-black text-red-600" value={globalDiscount || ''} onChange={e => setGlobalDiscount(Number(e.target.value))} /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Paid Amount (৳)</Label><Input type="number" className="h-12 rounded-xl bg-green-50 border-none font-black text-green-700 text-lg" value={paidAmount || ''} onChange={e => setPaidAmount(Number(e.target.value))} /></div>
            </div>
            
            <div className="space-y-3 pt-3">
               <Label className="text-[10px] font-black uppercase text-slate-400">Administrative Notes</Label>
               <Textarea className="min-h-[120px] text-[11px] font-bold rounded-2xl bg-slate-50 border-none p-4" value={notes || ''} onChange={e => setNotes(e.target.value)} />
            </div>

            <Button className="w-full h-16 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95" disabled={isSubmitting} onClick={handleUpdate}>
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />} Post Updated Ledger
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
