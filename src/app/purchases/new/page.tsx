
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  Calculator,
  X,
  PlusCircle,
  ShoppingCart,
  Scan,
  Barcode,
  Package
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, runTransaction, serverTimestamp, increment, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface POItem {
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
  serials: string;
  isSerialized: boolean;
  isCustom?: boolean;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = React.useState("");
  const [orderDate, setOrderDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [paymentTerms, setPaymentTerms] = React.useState("COD");
  const [reference, setReference] = React.useState("");
  const [lineItems, setLineItems] = React.useState<POItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = React.useState(0);
  const [additionalCharge, setAdditionalCharge] = React.useState(0);
  const [paidAmount, setPaidAmount] = React.useState(0);
  const [notes, setNotes] = React.useState("");

  // Queries
  const suppliersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "suppliers");
  }, [db, companyId, branchId]);
  const { data: suppliers } = useCollection(suppliersQuery);

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
  const subtotal = React.useMemo(() => lineItems.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.price || 0)), 0), [lineItems]);
  const itemDiscounts = lineItems.reduce((sum, item) => sum + (Number(item.qty || 0) * Number(item.price || 0) * (Number(item.discount || 0) / 100)), 0);
  const itemTaxes = lineItems.reduce((sum, item) => {
    const base = Number(item.qty || 0) * Number(item.price || 0);
    const disc = base * (Number(item.discount || 0) / 100);
    return sum + ((base - disc) * (Number(item.tax || 0) / 100));
  }, 0);

  const grandTotal = subtotal - itemDiscounts + itemTaxes - globalDiscount + additionalCharge;
  const balanceDue = grandTotal - paidAmount;

  const handleAddProduct = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    const newItem: POItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      name: product.name,
      description: product.description || "",
      qty: 1,
      unit: product.unit || "Pcs",
      price: product.costPrice || 0,
      discount: 0,
      tax: 0,
      total: product.costPrice || 0,
      serials: "",
      isSerialized: !!product.serialNumberTrackingRequired,
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateItem = (id: string, field: keyof POItem, val: any) => {
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

  const handleSave = async () => {
    if (!selectedSupplierId || lineItems.length === 0 || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await runTransaction(db!, async (transaction) => {
        const poRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "purchase_orders"));
        const supplier = suppliers?.find(s => s.id === selectedSupplierId);

        const poData = {
          id: poRef.id,
          orderNumber: `PO-${Date.now().toString().slice(-6)}`,
          supplierId: selectedSupplierId,
          supplierName: supplier?.name || "Vendor",
          orderDate,
          paymentTerms,
          reference,
          items: lineItems,
          subtotal,
          totalAmount: grandTotal,
          paidAmount,
          balanceDue,
          status: "received",
          notes,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        transaction.set(poRef, poData);

        for (const item of lineItems) {
          if (!item.isCustom) {
            const productRef = doc(db!, "companies", companyId!, "branches", branchId!, "products", item.productId);
            transaction.update(productRef, { 
              currentStock: increment(item.qty),
              costPrice: item.price
            });

            if (item.isSerialized && item.serials) {
              const snList = item.serials.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
              for (const sn of snList) {
                const snRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "serial_numbers"));
                transaction.set(snRef, {
                  id: snRef.id,
                  companyId,
                  branchId,
                  productId: item.productId,
                  serialNumber: sn,
                  status: "available",
                  purchaseOrderId: poRef.id,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                });
              }
            }
          }
        }
      });

      toast({ title: t('success') });
      router.push("/purchases");
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-full mx-auto space-y-6 pb-20 overflow-x-hidden">
      <div className="flex items-center justify-between border-b pb-4 bg-white sticky top-0 z-50 px-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">Procurement Registry</h1>
            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-1">Inventory Intake Terminal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="font-bold text-xs" onClick={() => router.back()}>{t('cancel')}</Button>
          <Button size="sm" className="font-bold text-xs gap-2 px-8 h-10 rounded-full bg-orange-600 hover:bg-orange-700 shadow-xl" disabled={isSubmitting} onClick={handleSave}>
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>Register Intake</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <div className="p-6 md:p-10 space-y-12">
          
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <ShoppingCart className="h-4 w-4 text-orange-600" />
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Procurement Context</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Target Supplier</Label>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue placeholder="Search Directory" /></SelectTrigger>
                  <SelectContent className="max-h-[300px] rounded-xl shadow-2xl">
                    {suppliers?.map(s => <SelectItem key={s.id} value={s.id} className="text-xs font-bold uppercase">{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Order Date</Label><Input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-none" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Bill/Challan Reference</Label><Input value={reference} onChange={e => setReference(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-none" placeholder="REF-001" /></div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-orange-600" />
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Asset Manifest</h3>
              </div>
              <div className="w-full max-w-sm">
                <Select onValueChange={handleAddProduct}>
                  <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue placeholder="Select From Catalog" /></SelectTrigger>
                  <SelectContent className="max-h-[300px] rounded-xl shadow-2xl">
                    {products?.map(p => <SelectItem key={p.id} value={p.id} className="text-xs uppercase">{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-[1000px]">
                <TableHeader className="bg-slate-50/50">
                  <TableRow><TableHead className="w-12 text-center text-[10px] font-black pl-6 uppercase">Sl</TableHead><TableHead className="text-[10px] font-black uppercase">Item Attribute Matrix</TableHead><TableHead className="w-24 text-center text-[10px] font-black uppercase">Unit</TableHead><TableHead className="w-24 text-center text-[10px] font-black uppercase">Qty</TableHead><TableHead className="w-32 text-right text-[10px] font-black uppercase">Cost Rate</TableHead><TableHead className="w-32 text-right pr-10 text-[10px] font-black uppercase">Total</TableHead><TableHead className="w-10"></TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, idx) => (
                    <TableRow key={item.id} className="group hover:bg-slate-50 transition-colors border-b align-top">
                      <TableCell className="text-center text-[11px] font-black text-slate-300 py-6 pl-6">{(idx + 1).toString().padStart(2, '0')}</TableCell>
                      <TableCell className="py-6 px-2">
                        <div className="space-y-4">
                           <span className="text-[11px] font-black uppercase text-slate-900">{item.name}</span>
                           {item.isSerialized && (
                             <div className="space-y-1.5 animate-in fade-in">
                                <div className="flex items-center gap-2 text-purple-600"><Scan className="h-3.5 w-3.5" /><span className="text-[9px] font-black uppercase">Bulk Serial Entry</span></div>
                                <textarea className="w-full h-16 bg-slate-50 border border-slate-200 rounded-xl p-3 text-[10px] font-mono focus:ring-1 focus:ring-purple-500 outline-none" value={item.serials} onChange={e => updateItem(item.id, 'serials', e.target.value)} placeholder="SN-001, SN-002..." />
                                <p className="text-[8px] font-bold text-slate-400 uppercase">Registered: {item.serials.split(/[\n,]+/).filter(s => s.trim().length > 0).length} / {item.qty}</p>
                             </div>
                           )}
                        </div>
                      </TableCell>
                      <TableCell className="py-6"><Select value={item.unit} onValueChange={v => updateItem(item.id, 'unit', v)}><SelectTrigger className="h-9 w-20 mx-auto rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{masterUnits?.map(u => <SelectItem key={u.id} value={u.shortName}>{u.shortName}</SelectItem>)}</SelectContent></Select></TableCell>
                      <TableCell className="py-6 text-center"><Input type="number" className="h-10 text-center font-black text-xs w-16 bg-slate-50 border-none mx-auto rounded-xl" value={item.qty || ''} onChange={e => updateItem(item.id, 'qty', Number(e.target.value))} /></TableCell>
                      <TableCell className="py-6 text-right"><Input type="number" className="h-10 text-right font-black text-xs w-24 bg-slate-100 border-none ml-auto rounded-xl" value={item.price || ''} onChange={e => updateItem(item.id, 'price', Number(e.target.value))} /></TableCell>
                      <TableCell className="py-6 text-right pr-10 font-black text-xs text-slate-900">৳{item.total.toLocaleString()}</TableCell>
                      <TableCell className="py-6 pr-4"><Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-red-600 rounded-full" onClick={() => setLineItems(lineItems.filter(i => i.id !== item.id))}><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                  {lineItems.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="h-40 text-center text-slate-300 italic text-[10px] font-black uppercase tracking-widest">No assets selected for procurement</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-12 pt-8 border-t">
            <div className="space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Purchase Remarks</h3>
              <Textarea className="min-h-[120px] rounded-2xl bg-slate-50 border-none p-6 text-xs font-medium" placeholder="Internal notes or vendor comments..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-8 shadow-2xl">
               <div className="flex flex-col items-center text-center space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Gross Procurement Total</p>
                 <h2 className="text-5xl font-headline font-black text-blue-400 tracking-tighter">৳{grandTotal.toLocaleString()}</h2>
               </div>
               
               <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-8">
                  <div className="space-y-4 text-[10px] font-black uppercase tracking-widest opacity-40">
                    <div className="flex justify-between"><span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
                  </div>
                  <div className="space-y-4 border-l border-white/5 pl-4">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-emerald-400"><span>Paid</span><span>৳{paidAmount.toLocaleString()}</span></div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-red-400"><span>Due</span><span>৳{balanceDue.toLocaleString()}</span></div>
                  </div>
               </div>

               <div className="pt-4">
                  <Label className="text-[9px] font-black uppercase opacity-40">Net Cash Paid ৳</Label>
                  <Input type="number" className="h-10 bg-white/5 border-white/10 rounded-xl text-xs font-black text-emerald-400 mt-1" value={paidAmount || ''} onChange={e => setPaidAmount(Number(e.target.value))} />
               </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
