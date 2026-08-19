
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
  User,
  LayoutGrid,
  Search,
  Scan,
  Package,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, setDoc, serverTimestamp, query, orderBy, where, getDocs, limit } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

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

  // Search State
  const [productSearch, setProductSearch] = React.useState("");
  const [isSearchingSN, setIsSearchingSN] = React.useState(false);

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

  // Filtered Products for Suggestion
  const suggestedProducts = React.useMemo(() => {
    if (!productSearch || productSearch.length < 2 || !products) return [];
    const search = productSearch.toLowerCase();
    return products.filter(p => 
      p.name?.toLowerCase().includes(search) || 
      p.sku?.toLowerCase().includes(search)
    ).slice(0, 5);
  }, [productSearch, products]);

  // Calculations
  const subtotal = React.useMemo(() => lineItems.reduce((sum, item) => sum + (item.qty * item.price), 0), [lineItems]);
  const itemDiscounts = lineItems.reduce((sum, item) => sum + (item.qty * item.price * (item.discount / 100)), 0);
  const itemTaxes = lineItems.reduce((sum, item) => sum + ((item.qty * item.price) - (item.qty * item.price * (item.discount / 100))) * (item.tax / 100), 0);
  const grandTotal = subtotal - itemDiscounts + itemTaxes - globalDiscount;

  const handleAddProduct = (product: any, serialNumber: string = "") => {
    if (!product) return;

    const newItem: QuoteItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      name: product.name || '',
      description: product.description || "",
      brand: product.brand || "",
      model: product.sku || "",
      specs: product.description || "",
      warranty: product.warranty || "1 Year",
      sn: serialNumber,
      qty: 1,
      unit: product.unit || "Pcs",
      price: product.unitPrice || 0,
      discount: 0,
      tax: 0,
      total: product.unitPrice || 0,
    };
    setLineItems([...lineItems, newItem]);
    setProductSearch("");
  };

  const handleProductSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && productSearch.trim()) {
      e.preventDefault();
      setIsSearchingSN(true);
      
      try {
        const snQuery = query(
          collection(db!, "companies", companyId!, "branches", branchId!, "serial_numbers"),
          where("serialNumber", "==", productSearch.trim()),
          limit(1)
        );
        const snSnap = await getDocs(snQuery);
        
        if (!snSnap.empty) {
          const snDoc = snSnap.docs[0].data();
          const product = products?.find(p => p.id === snDoc.productId);
          if (product) {
            handleAddProduct(product, snDoc.serialNumber);
            toast({ title: "Serial Linked", description: `Added: ${product.name}` });
            return;
          }
        }

        const productBySku = products?.find(p => p.sku?.toLowerCase() === productSearch.trim().toLowerCase());
        if (productBySku) {
          handleAddProduct(productBySku);
          return;
        }

        toast({ variant: "destructive", title: "Notice", description: "Serial number or SKU not matched. Try searching by name." });
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingSN(false);
      }
    }
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
      sn: "",
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
      toast({ title: t('common.success'), description: "Customer created and selected." });
    } catch (err: any) {
      toast({ variant: "destructive", title: t('common.error'), description: err.message });
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
      toast({ title: t('common.success') });
      router.push("/quotations");
    } catch (e: any) {
      toast({ variant: "destructive", title: t('common.error'), description: e.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-full mx-auto space-y-4 pb-20 overflow-x-hidden">
      <div className="flex items-center justify-between border-b pb-3 bg-white sticky top-0 z-50 px-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{t('nav.quotations')} / New Proposal</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Proposal Module</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="font-bold text-xs" onClick={() => router.back()}>{t('common.cancel')}</Button>
          <Button size="sm" className="font-bold text-xs gap-2 px-6 h-9 rounded-lg" disabled={isSubmitting} onClick={handleSave}>
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {t('common.save')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-9 space-y-4">
          <Card className="border-none shadow-sm ring-1 ring-slate-200 rounded-[2rem] bg-white">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">{t('forms.customer')}</Label>
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
                  <Label className="text-[10px] font-bold uppercase text-slate-500">{t('forms.project')}</Label>
                  <Input value={projectName} onChange={e => setProjectName(e.target.value)} className="h-9 text-[11px] font-bold" placeholder="Fiber Setup" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">{t('forms.location')}</Label>
                  <Input value={projectLocation} onChange={e => setProjectLocation(e.target.value)} className="h-9 text-[11px] font-bold" placeholder="Dhaka" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">{t('common.date')}</Label>
                  <Input type="date" value={quotationDate} onChange={e => setQuotationDate(e.target.value)} className="h-9 text-[11px] font-bold" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-slate-500">Expiry</Label>
                  <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="h-9 text-[11px] font-bold" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="relative">
             <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                {isSearchingSN ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> : <Scan className="h-5 w-5 text-slate-400" />}
             </div>
             <Input 
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                onKeyDown={handleProductSearchKeyDown}
                className="h-14 pl-12 pr-6 rounded-[2rem] bg-white border-none ring-2 ring-slate-100 focus:ring-blue-600 shadow-lg text-sm font-bold uppercase"
                placeholder="Scan S/N or Search Product (Name/Model)..."
             />
             
             {suggestedProducts.length > 0 && (
                <Card className="absolute top-full left-0 right-0 mt-2 z-[60] border-none shadow-2xl rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
                   <div className="p-2 space-y-1">
                      {suggestedProducts.map(p => (
                        <div 
                           key={p.id} 
                           className="flex items-center justify-between p-3 hover:bg-blue-50 cursor-pointer rounded-xl group transition-all"
                           onClick={() => handleAddProduct(p)}
                        >
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600">
                                 <Package className="h-5 w-5" />
                              </div>
                              <div>
                                 <p className="text-[11px] font-black uppercase text-slate-900">{p.name}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase">{p.sku}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[11px] font-black text-blue-600">৳{p.unitPrice?.toLocaleString()}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </Card>
             )}
          </div>

          <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden rounded-[2rem] bg-white">
            <div className="p-5 bg-white border-b flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                 <LayoutGrid className="h-5 w-5 text-blue-600" />
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Proposal Matrix</h3>
              </div>
              <Button variant="outline" size="sm" className="h-10 rounded-xl gap-2 text-[10px] font-black uppercase border-slate-200 text-slate-900 hover:bg-slate-50 transition-all" onClick={addManualRow}>
                <PlusCircle className="h-3.5 w-3.5" /> {t('common.add')} Generic Row
              </Button>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <Table className="min-w-[1000px]">
                <TableHeader className="bg-slate-50/50 border-b">
                  <TableRow className="hover:bg-transparent h-14">
                    <TableHead className="w-10 text-center text-[9px] font-black uppercase pl-6">Sl.</TableHead>
                    <TableHead className="min-w-[400px] text-[9px] font-black uppercase">{t('forms.itemName')} & {t('forms.specs')}</TableHead>
                    <TableHead className="w-20 text-[9px] font-black uppercase text-center">Unit</TableHead>
                    <TableHead className="w-20 text-[9px] font-black uppercase text-center">{t('forms.qty')}</TableHead>
                    <TableHead className="w-28 text-[9px] font-black uppercase text-right">Unit Price</TableHead>
                    <TableHead className="w-28 text-[9px] font-black uppercase text-right pr-6">{t('common.total')}</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, idx) => (
                    <TableRow key={item.id} className="group hover:bg-slate-50/30 border-b border-slate-100 align-top">
                      <TableCell className="text-center text-[10px] font-bold text-slate-400 py-6 pl-6">{(idx + 1).toString().padStart(2, '0')}</TableCell>
                      <TableCell className="py-6 px-2">
                        <div className="space-y-3">
                          <Input 
                            className="h-10 text-xs font-black uppercase border-none bg-slate-100/50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all rounded-xl" 
                            value={item.name || ''} 
                            onChange={e => updateItem(item.id, 'name', e.target.value)} 
                            placeholder={t('forms.itemName')} 
                          />
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                             <Input className="h-8 text-[10px] font-bold border-slate-100 bg-white rounded-lg" value={item.model || ''} onChange={e => updateItem(item.id, 'model', e.target.value)} placeholder={t('forms.model')} />
                             <Input className="h-8 text-[10px] font-bold border-slate-100 bg-white rounded-lg" value={item.brand || ''} onChange={e => updateItem(item.id, 'brand', e.target.value)} placeholder={t('forms.brand')} />
                             <Input className="h-8 text-[10px] font-black text-blue-600 border-blue-100 bg-blue-50/30 rounded-lg uppercase" value={item.sn || ''} onChange={e => updateItem(item.id, 'sn', e.target.value)} placeholder="S/N" />
                             <Input className="h-8 text-[10px] font-bold border-slate-100 bg-white rounded-lg" value={item.warranty || ''} onChange={e => updateItem(item.id, 'warranty', e.target.value)} placeholder={t('forms.warranty')} />
                          </div>
                          <textarea 
                            className="w-full text-[9px] font-medium bg-slate-50 border border-slate-200 rounded-xl p-3 min-h-[40px] resize-none outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all" 
                            value={item.specs || ''} 
                            onChange={e => updateItem(item.id, 'specs', e.target.value)} 
                            placeholder={t('forms.specs')} 
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-6">
                        <Select value={item.unit || 'Pcs'} onValueChange={(val) => updateItem(item.id, 'unit', val)}>
                          <SelectTrigger className="h-8 border-none bg-slate-100 text-[10px] font-bold uppercase w-16 mx-auto rounded-lg"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {masterUnits?.map((u, uidx) => <SelectItem key={`unq-${u.id}-${uidx}`} value={u.shortName} className="text-xs font-bold">{u.shortName}</SelectItem>)}
                            {!masterUnits?.length && <SelectItem value="Pcs">Pcs</SelectItem>}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-6 text-center">
                        <Input type="number" className="h-9 w-12 text-center text-[11px] font-black bg-slate-50 border-none mx-auto focus:ring-1 focus:ring-blue-500 rounded-xl" value={item.qty || ''} onChange={e => updateItem(item.id, 'qty', Number(e.target.value))} />
                      </TableCell>
                      <TableCell className="py-6 text-right">
                        <Input type="number" className="h-9 w-20 text-right text-[11px] font-black bg-slate-50 border-none ml-auto focus:ring-1 focus:ring-blue-500 rounded-xl" value={item.price || ''} onChange={e => updateItem(item.id, 'price', Number(e.target.value))} />
                      </TableCell>
                      <TableCell className="py-6 text-right pr-6 font-black text-[11px] text-slate-900">৳{(item.total || 0).toLocaleString()}</TableCell>
                      <TableCell className="py-6">
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
          <Card className="p-8 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
             <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em]">{t('forms.grandTotal')}</p>
             <h2 className="text-3xl font-headline font-black tracking-tighter text-blue-600">৳{grandTotal?.toLocaleString()}</h2>
             <div className="pt-6 border-t border-slate-100 text-[10px] font-black uppercase tracking-widest text-left text-slate-500 space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>৳{subtotal?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>VAT</span><span>+৳{itemTaxes?.toLocaleString()}</span></div>
             </div>
          </Card>

          <Card className="p-6 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-slate-400">{t('forms.discount')} (৳)</Label>
                <Input type="number" className="h-10 rounded-xl bg-slate-50 border-none font-black text-red-600" value={globalDiscount || ''} onChange={e => setGlobalDiscount(Number(e.target.value))} />
              </div>
            </div>
            <div className="space-y-3 pt-3 border-t">
               <Label className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{t('forms.notes')}</Label>
               <Textarea className="min-h-[120px] text-[11px] font-bold rounded-2xl bg-slate-50 border-none p-4" value={notes || ''} onChange={e => setNotes(e.target.value)} placeholder="Terms..." />
            </div>
            <Button className="w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-100 bg-blue-600 hover:bg-blue-700 transition-all active:scale-95" disabled={isSubmitting || lineItems.length === 0} onClick={handleSave}>
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
              Draft Quotation
            </Button>
          </Card>
        </div>
      </div>

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
