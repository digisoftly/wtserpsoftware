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
  PlusCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, updateDoc, serverTimestamp, increment } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface InvoiceItem {
  id: string;
  productId: string;
  name: string;
  description: string;
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
  const [salesPerson, setSalesPerson] = React.useState("");
  const [lineItems, setLineItems] = React.useState<InvoiceItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = React.useState(0);
  const [additionalCharge, setAdditionalCharge] = React.useState(0);
  const [paidAmount, setPaidAmount] = React.useState(0);
  const [notes, setNotes] = React.useState("");
  const [terms, setTerms] = React.useState("");

  React.useEffect(() => {
    if (invoice) {
      setSelectedCustomerId(invoice.customerId);
      setInvoiceDate(invoice.invoiceDate);
      setDueDate(invoice.dueDate || "");
      setPaymentMethod(invoice.paymentMethod || "cash");
      setSalesPerson(invoice.salesPerson || "");
      setGlobalDiscount(invoice.globalDiscount || 0);
      setAdditionalCharge(invoice.additionalCharge || 0);
      setPaidAmount(invoice.paidAmount || 0);
      setNotes(invoice.notes || "");
      setTerms(invoice.terms || "");
      
      const itemsWithIds = (invoice.items || []).map((item: any, idx: number) => ({
        ...item,
        id: item.id || `item-${idx}-${item.productId}`
      }));
      setLineItems(itemsWithIds);
    }
  }, [invoice]);

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
  const subtotal = React.useMemo(() => lineItems.reduce((sum, item) => sum + (item.qty * item.price), 0), [lineItems]);
  const itemDiscounts = React.useMemo(() => lineItems.reduce((sum, item) => sum + (item.qty * item.price * (item.discount / 100)), 0), [lineItems]);
  const itemTaxes = React.useMemo(() => lineItems.reduce((sum, item) => sum + ((item.qty * item.price) - (item.qty * item.price * (item.discount / 100))) * (item.tax / 100), 0), [lineItems]);
  
  const grandTotal = React.useMemo(() => subtotal - itemDiscounts + itemTaxes - globalDiscount + additionalCharge, [subtotal, itemDiscounts, itemTaxes, globalDiscount, additionalCharge]);
  const balanceDue = React.useMemo(() => grandTotal - paidAmount, [grandTotal, paidAmount]);

  const handleAddProduct = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      name: product.name,
      description: product.description || "",
      qty: 1,
      unit: product.unit || "Pcs",
      price: product.unitPrice || 0,
      discount: 0,
      tax: 15,
      total: product.unitPrice || 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const addManualRow = () => {
    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: "custom",
      name: "",
      description: "",
      qty: 1,
      unit: "Pcs",
      price: 0,
      discount: 0,
      tax: 0,
      total: 0,
      isCustom: true
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, val: any) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };
      if (['qty', 'price', 'discount', 'tax'].includes(field)) {
        const q = Number(updated.qty) || 0;
        const p = Number(updated.price) || 0;
        const d = Number(updated.discount) || 0;
        const t = Number(updated.tax) || 0;
        const base = q * p;
        const disc = base * (d / 100);
        const taxed = (base - disc) * (t / 100);
        updated.total = base - disc + taxed;
      }
      return updated;
    }));
  };

  const handleUpdate = async () => {
    if (!invoiceRef || lineItems.length === 0 || isSubmitting) return;
    setIsSubmitting(true);

    const customer = customers?.find(c => c.id === selectedCustomerId);

    const updatedData = {
      customerId: selectedCustomerId,
      customerName: customer ? `${customer.firstName} ${customer.lastName}` : "Client",
      invoiceDate,
      dueDate,
      paymentMethod,
      salesPerson,
      items: lineItems,
      subtotal,
      discount: globalDiscount + itemDiscounts,
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

  if (isInvoiceLoading) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-4 bg-white sticky top-0 z-50 px-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{t('edit')} Invoice</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{invoice?.invoiceNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="font-bold text-xs" onClick={() => router.back()}>{t('cancel')}</Button>
          <Button size="sm" className="font-bold text-xs gap-2" disabled={isSubmitting} onClick={handleUpdate}>
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {t('save')}
          </Button>
        </div>
      </div>

      {/* INFO GRID */}
      <Card className="border-none shadow-sm ring-1 ring-slate-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('customer')}</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Client" /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-medium">{c.firstName} {c.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('invoiceDate')}</Label>
              <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="h-9 text-xs font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('dueDate')}</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-9 text-xs font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('paymentMethod')}</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash" className="text-xs font-medium">Cash</SelectItem>
                  <SelectItem value="bank" className="text-xs font-medium">Bank Transfer</SelectItem>
                  <SelectItem value="bkash" className="text-xs font-medium text-pink-600">bKash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('salesPerson')}</Label>
              <Input value={salesPerson} onChange={e => setSalesPerson(e.target.value)} className="h-9 text-xs" placeholder="Employee Name" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ITEMS TABLE */}
      <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('itemDescription')}</h3>
          <div className="flex gap-2">
            <Select onValueChange={handleAddProduct}>
              <SelectTrigger className="h-8 w-64 text-[10px] bg-white border-slate-200 font-bold uppercase"><SelectValue placeholder="Add From Catalog" /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {products?.map(p => <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 rounded-md gap-2 text-[10px] font-bold uppercase" onClick={addManualRow}>
              <PlusCircle className="h-3.5 w-3.5" /> {t('addGeneric')}
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12 text-center text-[10px] font-black uppercase tracking-tighter">SL</TableHead>
                <TableHead className="min-w-[200px] text-[10px] font-black uppercase tracking-tighter">Item</TableHead>
                <TableHead className="min-w-[200px] text-[10px] font-black uppercase tracking-tighter">Description</TableHead>
                <TableHead className="w-24 text-[10px] font-black uppercase tracking-tighter text-center">Unit</TableHead>
                <TableHead className="w-32 text-[10px] font-black uppercase tracking-tighter text-center">Quantity</TableHead>
                <TableHead className="w-32 text-[10px] font-black uppercase tracking-tighter text-right">Rate</TableHead>
                <TableHead className="w-24 text-[10px] font-black uppercase tracking-tighter text-center">Disc%</TableHead>
                <TableHead className="w-24 text-[10px] font-black uppercase tracking-tighter text-center">VAT%</TableHead>
                <TableHead className="w-32 text-[10px] font-black uppercase tracking-tighter text-right pr-10">Amount</TableHead>
                <TableHead className="w-20 text-right pr-4"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineItems.map((item, idx) => (
                <TableRow key={item.id} className="group hover:bg-slate-50 transition-colors h-16 border-b border-slate-100">
                  <TableCell className="text-center text-[10px] font-bold text-slate-400">{(idx + 1).toString().padStart(2, '0')}</TableCell>
                  <TableCell>
                    {item.isCustom ? (
                      <Input className="h-8 text-xs font-bold uppercase border-slate-200" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} />
                    ) : (
                      <span className="text-[11px] font-black uppercase text-slate-900 leading-tight">{item.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <textarea className="w-full text-[10px] font-medium bg-transparent border-none resize-none h-8 focus:ring-0 outline-none" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Model/Serial/Details..." />
                  </TableCell>
                  <TableCell className="text-center text-[10px] font-bold uppercase text-slate-500">{item.unit}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-center">
                      <Input type="number" className="h-8 w-16 text-center text-xs font-bold bg-slate-50 border-none" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} />
                      <span className="text-[9px] font-black uppercase text-slate-400">{item.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Input type="number" className="h-8 w-24 text-right text-xs font-black bg-slate-50 border-none ml-auto" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} />
                  </TableCell>
                  <TableCell><Input type="number" className="h-8 w-14 text-center text-xs font-bold bg-slate-50 border-none mx-auto" value={item.discount} onChange={e => updateItem(item.id, 'discount', e.target.value)} /></TableCell>
                  <TableCell><Input type="number" className="h-8 w-14 text-center text-xs font-bold bg-slate-50 border-none mx-auto" value={item.tax} onChange={e => updateItem(item.id, 'tax', e.target.value)} /></TableCell>
                  <TableCell className="text-right pr-10 font-black text-xs text-slate-900">৳{item.total.toLocaleString()}</TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-600 rounded-full" onClick={() => setLineItems(lineItems.filter(i => i.id !== item.id))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('customerNotes')}</Label>
            <Textarea className="h-24 text-xs font-medium bg-white rounded-xl border-slate-200" placeholder="Notes for customer..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Terms & Conditions</Label>
            <Textarea className="h-24 text-xs font-medium bg-white rounded-xl border-slate-200" placeholder="Warranty, Payment policies..." value={terms} onChange={e => setTerms(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col items-end">
          <Card className="w-full max-w-md border-none shadow-sm ring-1 ring-slate-200 bg-white">
            <CardContent className="p-8 space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-tight">
                <span>Subtotal Gross</span>
                <span className="text-slate-900">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-red-500 uppercase tracking-tight">
                <span>Item Discounts</span>
                <span>-৳{itemDiscounts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-tight">
                <span>Total VAT / Tax</span>
                <span className="text-slate-900">+৳{itemTaxes.toLocaleString()}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Extra Discount (৳)</Label>
                  <Input type="number" className="h-9 text-xs font-bold bg-slate-50" value={globalDiscount || ''} onChange={e => setGlobalDiscount(Number(e.target.value))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-slate-400">Add. Charges (৳)</Label>
                  <Input type="number" className="h-9 text-xs font-bold bg-slate-50" value={additionalCharge || ''} onChange={e => setAdditionalCharge(Number(e.target.value))} />
                </div>
              </div>

              <div className="pt-6 border-t mt-4 flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Payable</p>
                  <h2 className="text-3xl font-black text-blue-600 tracking-tighter">৳{grandTotal.toLocaleString()}</h2>
                </div>
                <div className="text-right space-y-2">
                  <Label className="text-[10px] font-black uppercase text-green-600 tracking-widest">{t('paid')}</Label>
                  <Input type="number" className="h-10 w-32 text-right text-base font-black border-2 border-green-50 bg-green-50/20 text-green-700" value={paidAmount || ''} onChange={e => setPaidAmount(Number(e.target.value))} />
                </div>
              </div>

              <div className={cn("p-4 rounded-xl flex justify-between items-center mt-6 transition-colors", balanceDue > 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700")}>
                <div className="flex items-center gap-3">
                   <Calculator className="h-5 w-5 opacity-50" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Balance Due</span>
                </div>
                <span className="text-xl font-black tabular-nums">৳{balanceDue.toLocaleString()}</span>
              </div>

              <Button className="w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 mt-6" disabled={isSubmitting || lineItems.length === 0} onClick={handleUpdate}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Synchronize Changes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
