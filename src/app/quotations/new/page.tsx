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
  FileText,
  UserPlus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, setDoc, serverTimestamp, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface QuoteItem {
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

export default function NewQuotationPage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [quotationDate, setQuotationDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = React.useState("");
  const [lineItems, setLineItems] = React.useState<QuoteItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = React.useState(0);
  const [notes, setNotes] = React.useState("");
  const [terms, setTerms] = React.useState("");

  // Quick Customer State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = React.useState(false);
  const [isCreatingCustomer, setIsCustomerCreating] = React.useState(false);

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
  const subtotal = React.useMemo(() => lineItems.reduce((sum, item) => sum + (item.qty * item.price), 0), [lineItems]);
  const itemDiscounts = React.useMemo(() => lineItems.reduce((sum, item) => sum + (item.qty * item.price * (item.discount / 100)), 0), [lineItems]);
  const itemTaxes = React.useMemo(() => lineItems.reduce((sum, item) => sum + ((item.qty * item.price) - (item.qty * item.price * (item.discount / 100))) * (item.tax / 100), 0), [lineItems]);
  const grandTotal = React.useMemo(() => subtotal - itemDiscounts + itemTaxes - globalDiscount, [subtotal, itemDiscounts, itemTaxes, globalDiscount]);

  const handleAddProduct = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    const newItem: QuoteItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      name: product.name,
      description: product.description || "",
      qty: 1,
      unit: product.unit || "Pcs",
      price: product.unitPrice || 0,
      discount: 0,
      tax: 0,
      total: product.unitPrice || 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const addManualRow = () => {
    const newItem: QuoteItem = {
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

  const updateItem = (id: string, field: keyof QuoteItem, val: any) => {
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

  const handleQuickCustomerCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || isCreatingCustomer) return;

    setIsCustomerCreating(true);
    const formData = new FormData(e.currentTarget);
    
    const customerData = {
      companyId,
      branchId,
      customerType: 'individual',
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const colRef = collection(db, "companies", companyId, "branches", branchId, "customers");
      const newDocRef = doc(colRef);
      await setDoc(newDocRef, { ...customerData, id: newDocRef.id });
      
      setSelectedCustomerId(newDocRef.id);
      setIsCustomerModalOpen(false);
      toast({ title: t('success'), description: "Customer created and selected." });
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    } finally {
      setIsCustomerCreating(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCustomerId || lineItems.length === 0 || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const quoteRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "quotations"));
      const customer = customers?.find(c => c.id === selectedCustomerId);

      const quoteData = {
        id: quoteRef.id,
        quotationNumber: `QTN-${Date.now().toString().slice(-4)}`,
        customerId: selectedCustomerId,
        customerName: customer ? `${customer.firstName} ${customer.lastName}` : "Client",
        customerPhone: customer?.phoneNumber || "",
        customerAddress: customer?.address || "",
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

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between border-b pb-4 bg-white sticky top-0 z-50 px-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{t('createQuote')}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="font-bold text-xs" onClick={() => router.back()}>{t('cancel')}</Button>
          <Button size="sm" className="font-bold text-xs gap-2" disabled={isSubmitting} onClick={handleSave}>
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {t('save')}
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-slate-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('customer')}</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Client" /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {customers?.map((c, idx) => <SelectItem key={`cust-new-${c.id}-${idx}`} value={c.id} className="text-xs font-medium">{c.firstName} {c.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  className="h-9 w-9 rounded-md border-slate-200 text-blue-600 hover:bg-blue-50"
                  onClick={() => setIsCustomerModalOpen(true)}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('date')}</Label>
              <Input type="date" value={quotationDate} onChange={e => setQuotationDate(e.target.value)} className="h-9 text-xs font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('validUntil')}</Label>
              <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="h-9 text-xs font-bold" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('itemDescription')}</h3>
          <div className="flex gap-2">
            <Select onValueChange={handleAddProduct}>
              <SelectTrigger className="h-8 w-64 text-[10px] bg-white border-slate-200 font-bold uppercase"><SelectValue placeholder="Add From Catalog" /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {products?.map((p, idx) => <SelectItem key={`prod-new-${p.id}-${idx}`} value={p.id} className="text-xs">{p.name}</SelectItem>)}
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
                    <textarea className="w-full text-[10px] font-medium bg-transparent border-none resize-none h-8 focus:ring-0 outline-none" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Technical Specs..." />
                  </TableCell>
                  <TableCell>
                    <Select value={item.unit} onValueChange={(val) => updateItem(item.id, 'unit', val)}>
                      <SelectTrigger className="h-8 border-none bg-slate-50 text-[10px] font-bold uppercase w-20 mx-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {masterUnits?.map((u, uidx) => <SelectItem key={`unit-new-${u.id}-${uidx}`} value={u.shortName} className="text-xs font-bold">{u.shortName}</SelectItem>)}
                        {!masterUnits?.length && <SelectItem value="Pcs">Pcs</SelectItem>}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-center">
                      <Input type="number" className="h-8 w-16 text-center text-xs font-bold bg-slate-50 border-none" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} />
                      <span className="text-[9px] font-black text-slate-400 uppercase">{item.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Input type="number" className="h-8 w-24 text-right text-xs font-black bg-slate-50 border-none ml-auto" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} />
                  </TableCell>
                  <TableCell><Input type="number" className="h-8 w-14 text-center text-xs font-bold bg-slate-50 border-none mx-auto" value={item.discount} onChange={e => updateItem(item.id, 'discount', e.target.value)} /></TableCell>
                  <TableCell><Input type="number" className="h-8 w-14 text-center text-xs font-bold bg-slate-50 border-none mx-auto" value={item.tax} onChange={e => updateItem(item.id, 'tax', e.target.value)} /></TableCell>
                  <TableCell className="text-right pr-10 font-black text-xs text-slate-900">৳{item.total.toLocaleString()}</TableCell>
                  <TableCell className="text-right pr-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-600 rounded-full" onClick={() => setLineItems(lineItems.filter(i => i.id !== item.id))}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
            <Textarea className="h-24 text-xs font-medium bg-white rounded-xl border-slate-200" placeholder="Notes for proposal..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Terms & Conditions</Label>
            <Textarea className="h-24 text-xs font-medium bg-white rounded-xl border-slate-200" placeholder="Validity, Payment conditions..." value={terms} onChange={e => setTerms(e.target.value)} />
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
              
              <div className="space-y-1.5 pt-4 border-t border-slate-50">
                <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Extra Discount (৳)</Label>
                <Input type="number" className="h-9 text-xs font-bold bg-slate-50" value={globalDiscount || ''} onChange={e => setGlobalDiscount(Number(e.target.value))} />
              </div>

              <div className="pt-6 border-t mt-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Grand Total</p>
                <h2 className="text-3xl font-black text-blue-600 tracking-tighter">৳{grandTotal.toLocaleString()}</h2>
              </div>

              <Button className="w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 mt-6" disabled={isSubmitting || lineItems.length === 0} onClick={handleSave}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Draft Quotation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Customer Modal */}
      <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-[2rem] bg-white">
          <DialogHeader className="bg-blue-600 p-6 text-white">
            <DialogTitle className="text-xl font-black font-headline uppercase tracking-tight flex items-center gap-3">
              <UserPlus className="h-6 w-6" /> Quick Registration
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickCustomerCreate} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">First Name *</Label>
                  <Input name="firstName" required className="h-11 rounded-xl" />
               </div>
               <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Last Name *</Label>
                  <Input name="lastName" required className="h-11 rounded-xl" />
               </div>
            </div>
            <div className="space-y-1.5">
               <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Phone Number *</Label>
               <Input name="phoneNumber" required className="h-11 rounded-xl" placeholder="+880..." />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsCustomerModalOpen(false)} className="rounded-xl h-11 text-[10px] font-black uppercase">Cancel</Button>
              <Button type="submit" disabled={isCreatingCustomer} className="bg-blue-600 hover:bg-blue-700 rounded-xl h-11 px-8 text-[10px] font-black uppercase shadow-lg shadow-blue-100">
                {isCreatingCustomer ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} Save Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}