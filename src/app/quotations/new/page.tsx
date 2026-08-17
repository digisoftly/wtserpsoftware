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
  UserPlus,
  Building,
  User
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
  brand: string;
  model: string;
  specs: string;
  warranty: string;
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
  const [projectName, setProjectName] = React.useState("");
  const [projectLocation, setProjectLocation] = React.useState("");
  const [lineItems, setLineItems] = React.useState<QuoteItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = React.useState(0);
  const [notes, setNotes] = React.useState("");
  const [terms, setTerms] = React.useState("");

  // Quick Customer State
  const [isCustomerModalOpen, setIsCustomerModalOpen] = React.useState(false);
  const [isCreatingCustomer, setIsCustomerCreating] = React.useState(false);
  const [quickCustType, setQuickCustType] = React.useState<"individual" | "company">("individual");

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
      brand: product.brand || "",
      model: product.sku || "",
      specs: "",
      warranty: product.warranty || "1 Year",
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
      brand: "",
      model: "",
      specs: "",
      warranty: "1 Year",
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
      customerType: quickCustType,
      companyName: quickCustType === 'company' ? (formData.get("companyName") as string) : "",
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      email: formData.get("email") as string || "",
      address: formData.get("address") as string || "",
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
        customerName: customer ? (customer.customerType === 'company' ? customer.companyName : `${customer.firstName} ${customer.lastName}`) : "Client",
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

  return (
    <div className="max-w-full mx-auto space-y-4 pb-20">
      <div className="flex items-center justify-between border-b pb-3 bg-white sticky top-0 z-50 px-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{t('createQuote')}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proposal Module</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="font-bold text-xs" onClick={() => router.back()}>{t('cancel')}</Button>
          <Button size="sm" className="font-bold text-xs gap-2 px-6 h-9 rounded-lg" disabled={isSubmitting} onClick={handleSave}>
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {t('save')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-9 space-y-4">
          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">{t('customer')}</Label>
                  <div className="flex gap-1">
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                      <SelectTrigger className="h-9 text-[11px] font-bold bg-slate-50/50"><SelectValue placeholder="Client" /></SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {customers?.map((c, idx) => <SelectItem key={`cq-${c.id}-${idx}`} value={c.id} className="text-xs font-medium">{c.customerType === 'company' ? c.companyName : `${c.firstName} ${c.lastName}`}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0 border-slate-200 text-blue-600" onClick={() => setIsCustomerModalOpen(true)}><UserPlus className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Project Name</Label>
                  <Input value={projectName} onChange={e => setProjectName(e.target.value)} className="h-9 text-[11px] font-bold" placeholder="Fiber Setup" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Location</Label>
                  <Input value={projectLocation} onChange={e => setProjectLocation(e.target.value)} className="h-9 text-[11px] font-bold" placeholder="Dhaka" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">{t('date')}</Label>
                  <Input type="date" value={quotationDate} onChange={e => setQuotationDate(e.target.value)} className="h-9 text-[11px] font-bold" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Expiry</Label>
                  <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="h-9 text-[11px] font-bold" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
            <div className="p-3 bg-slate-50 border-b flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase text-slate-500">Line Items</h3>
              <div className="flex gap-2">
                <Select onValueChange={handleAddProduct}>
                  <SelectTrigger className="h-8 w-48 text-[10px] bg-white border-slate-200 font-bold uppercase"><SelectValue placeholder="Import Product" /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {products?.map((p, idx) => <SelectItem key={`pq-${p.id}-${idx}`} value={p.id} className="text-xs font-bold">{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-8 rounded-lg gap-2 text-[10px] font-black uppercase" onClick={addManualRow}>
                  <PlusCircle className="h-3.5 w-3.5" /> {t('addGeneric')}
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/20 border-b">
                  <TableRow className="hover:bg-transparent h-10">
                    <TableHead className="w-10 text-center text-[9px] font-black uppercase">Sl.</TableHead>
                    <TableHead className="min-w-[250px] text-[9px] font-black uppercase">Product Details</TableHead>
                    <TableHead className="w-20 text-[9px] font-black uppercase text-center">Unit</TableHead>
                    <TableHead className="w-20 text-[9px] font-black uppercase text-center">Qty</TableHead>
                    <TableHead className="w-24 text-[9px] font-black uppercase text-right">Price</TableHead>
                    <TableHead className="w-24 text-[9px] font-black uppercase text-right pr-6">Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, idx) => (
                    <TableRow key={item.id} className="group hover:bg-slate-50/30 border-b border-slate-100">
                      <TableCell className="text-center text-[10px] font-bold text-slate-400">{(idx + 1).toString().padStart(2, '0')}</TableCell>
                      <TableCell className="py-2">
                        <div className="space-y-2">
                          <Input className="h-7 text-[11px] font-black uppercase border-none bg-slate-100/50" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder="Item Name" />
                          <div className="grid grid-cols-2 gap-1.5">
                             <Input className="h-6 text-[9px] font-bold border-slate-200" value={item.model} onChange={e => updateItem(item.id, 'model', e.target.value)} placeholder="Model" />
                             <Input className="h-6 text-[9px] font-bold border-slate-200" value={item.brand} onChange={e => updateItem(item.id, 'brand', e.target.value)} placeholder="Brand" />
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                             <Input className="h-6 text-[9px] font-bold border-slate-200" value={item.warranty} onChange={e => updateItem(item.id, 'warranty', e.target.value)} placeholder="Warranty" />
                          </div>
                          <textarea className="w-full text-[9px] font-medium bg-slate-50 border border-slate-200 rounded p-1.5 min-h-[40px] resize-none outline-none" value={item.specs} onChange={e => updateItem(item.id, 'specs', e.target.value)} placeholder="Specification" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select value={item.unit} onValueChange={(val) => updateItem(item.id, 'unit', val)}>
                          <SelectTrigger className="h-7 border-none bg-slate-50 text-[10px] font-bold uppercase w-14 mx-auto"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {masterUnits?.map((u, uidx) => <SelectItem key={`unq-${u.id}-${uidx}`} value={u.shortName} className="text-xs font-bold">{u.shortName}</SelectItem>)}
                            {!masterUnits?.length && <SelectItem value="Pcs">Pcs</SelectItem>}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input type="number" className="h-7 w-12 text-center text-[11px] font-black bg-slate-50 border-none mx-auto" value={item.qty} onChange={e => updateItem(item.id, 'qty', Number(e.target.value))} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" className="h-7 w-20 text-right text-[11px] font-black bg-slate-50 border-none ml-auto" value={item.price} onChange={e => updateItem(item.id, 'price', Number(e.target.value))} />
                      </TableCell>
                      <TableCell className="text-right pr-6 font-black text-[11px] text-slate-900">৳{item.total?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-600 rounded-full" onClick={() => setLineItems(lineItems.filter(i => i.id !== item.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <div className="xl:col-span-3 space-y-4">
          <Card className="p-6 rounded-2xl shadow-2xl space-y-4 text-center text-white bg-blue-600">
             <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em]">Net Proposal Value</p>
             <h2 className="text-4xl font-headline font-black tracking-tighter">৳{grandTotal?.toLocaleString()}</h2>
          </Card>

          <Card className="p-4 rounded-2xl border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400">Global Discount (৳)</Label>
                <Input type="number" className="h-8 rounded-lg bg-slate-50 border-none font-black text-red-600" value={globalDiscount || ''} onChange={e => setGlobalDiscount(Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-3 pt-3 border-t">
               <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Notes</Label>
               <Textarea className="min-h-[120px] text-[11px] font-bold rounded-xl" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Terms..." />
            </div>
            <Button className="w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-100 bg-blue-600 hover:bg-blue-700" disabled={isSubmitting || lineItems.length === 0} onClick={handleSave}>
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
              Draft Quotation
            </Button>
          </Card>
        </div>
      </div>

      {/* QUICK CUSTOMER MODAL */}
      <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white">
          <DialogHeader className="bg-blue-600 p-6 text-white"><DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3"><UserPlus className="h-6 w-6" /> Quick Registration</DialogTitle></DialogHeader>
          <form onSubmit={handleQuickCustomerCreate} className="p-8 space-y-6">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Customer Type</Label>
              <div className="flex gap-4">
                <Button type="button" variant={quickCustType === 'individual' ? 'default' : 'outline'} className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase gap-2" onClick={() => setQuickCustType('individual')}><User className="h-4 w-4" /> Individual</Button>
                <Button type="button" variant={quickCustType === 'company' ? 'default' : 'outline'} className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase gap-2" onClick={() => setQuickCustType('company')}><Building className="h-4 w-4" /> Company / Corp</Button>
              </div>
            </div>
            {quickCustType === 'company' && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Company Name *</Label>
                <Input name="companyName" required className="h-11 rounded-xl bg-slate-50" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">First Name *</Label><Input name="firstName" required className="h-11 rounded-xl" /></div>
               <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Last Name *</Label><Input name="lastName" required className="h-11 rounded-xl" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Mobile *</Label><Input name="phoneNumber" required className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Email</Label><Input name="email" type="email" className="h-11 rounded-xl" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Full Address</Label><textarea name="address" className="w-full h-20 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 p-3 text-xs" /></div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsCustomerModalOpen(false)} className="rounded-xl h-11 text-[10px] font-black uppercase">Cancel</Button>
              <Button type="submit" disabled={isCreatingCustomer} className="bg-blue-600 hover:bg-blue-700 rounded-xl h-11 px-8 text-[10px] font-black uppercase shadow-lg shadow-blue-100">{isCreatingCustomer ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} Save Customer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
