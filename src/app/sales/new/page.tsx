
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, doc, runTransaction, serverTimestamp, increment, query, orderBy, setDoc, getDocs, where, limit } from "firebase/firestore"
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
  imageUrl?: string;
  isCustom?: boolean;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const copyFromId = searchParams.get('copyFrom');
  const sourceType = searchParams.get('sourceType') || 'invoice'; 
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [isNewCustomerMode, setIsNewCustomerMode] = React.useState(false);
  
  const [invoiceDate, setInvoiceDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = React.useState("");
  const [projectName, setProjectName] = React.useState("");
  const [projectLocation, setProjectLocation] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState("cash");
  const [lineItems, setLineItems] = React.useState<InvoiceItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = React.useState(0);
  const [additionalCharge, setAdditionalCharge] = React.useState(0);
  const [paidAmount, setPaidAmount] = React.useState(0);
  const [notes, setNotes] = React.useState("");
  const [terms, setTerms] = React.useState("");

  const sourceCol = sourceType === 'quotation' ? 'quotations' : 'sales_invoices';
  const copySourceRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !copyFromId) return null;
    return doc(db, "companies", companyId, "branches", branchId, sourceCol, copyFromId);
  }, [db, companyId, branchId, copyFromId, sourceCol]);
  const { data: sourceDoc } = useDoc(copySourceRef);

  React.useEffect(() => {
    if (sourceDoc) {
      setSelectedCustomerId(sourceDoc.customerId || "");
      setProjectName(sourceDoc.projectName || "");
      setProjectLocation(sourceDoc.projectLocation || "");
      setGlobalDiscount(Number(sourceDoc.globalDiscount || sourceDoc.discount || 0));
      setAdditionalCharge(Number(sourceDoc.additionalCharge || 0));
      setNotes(sourceDoc.notes || "");
      setTerms(sourceDoc.terms || "");
      
      const itemsWithIds = (sourceDoc.items || []).map((item: any, idx: number) => ({
        ...item,
        id: `clone-item-${idx}-${Date.now()}`,
        qty: Number(item.qty || item.quantity || 0),
        price: Number(item.price || item.unitPrice || 0),
        total: Number(item.total || 0),
        sn: "" 
      }));
      setLineItems(itemsWithIds);
    }
  }, [sourceDoc]);

  const [productSearch, setProductSearch] = React.useState("");
  const [isSearchingSN, setIsSearchingSN] = React.useState(false);
  const [isCreatingCustomer, setIsCustomerCreating] = React.useState(false);
  const [quickCustType, setQuickCustType] = React.useState<"individual" | "company">("individual");

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

  const suggestedProducts = React.useMemo(() => {
    if (!productSearch || productSearch.length < 2 || !products) return [];
    const search = productSearch.toLowerCase();
    return products.filter(p => 
      p.name?.toLowerCase().includes(search) || 
      p.sku?.toLowerCase().includes(search)
    ).slice(0, 5);
  }, [productSearch, products]);

  const subtotal = React.useMemo(() => lineItems.reduce((sum, item) => sum + (item.qty * item.price), 0), [lineItems]);
  const itemDiscounts = lineItems.reduce((sum, item) => sum + (item.qty * item.price * (item.discount / 100)), 0);
  const itemTaxes = lineItems.reduce((sum, item) => sum + ((item.qty * item.price) - (item.qty * item.price * (item.discount / 100))) * (item.tax / 100), 0);
  const grandTotal = subtotal - itemDiscounts + itemTaxes - globalDiscount + additionalCharge;
  const balanceDue = grandTotal - paidAmount;

  const handleAddProduct = (product: any, serialNumber: string = "") => {
    if (!product) return;
    const newItem: InvoiceItem = {
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
      imageUrl: product.imageUrl || "",
    };
    setLineItems([...lineItems, newItem]);
    setProductSearch("");
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
      fullName: quickCustType === 'individual' ? (formData.get("firstName") as string + " " + formData.get("lastName") as string) : (formData.get("companyName") as string),
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      email: formData.get("email") as string || "",
      address: formData.get("address") as string || "",
      contactPerson: quickCustType === 'company' ? (formData.get("firstName") as string + " " + formData.get("lastName") as string) : "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    try {
      const colRef = collection(db, "companies", companyId, "branches", branchId, "customers");
      const newDocRef = doc(colRef);
      await setDoc(newDocRef, { ...customerData, id: newDocRef.id });
      setSelectedCustomerId(newDocRef.id);
      setIsNewCustomerMode(false);
      toast({ title: t('success') });
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    } finally {
      setIsCustomerCreating(false);
    }
  };

  const handleProductSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && productSearch.trim()) {
      e.preventDefault();
      setIsSearchingSN(true);
      try {
        const snQuery = query(collection(db!, "companies", companyId!, "branches", branchId!, "serial_numbers"), where("serialNumber", "==", productSearch.trim()), limit(1));
        const snSnap = await getDocs(snQuery);
        if (!snSnap.empty) {
          const snDoc = snSnap.docs[0].data();
          const product = products?.find(p => p.id === snDoc.productId);
          if (product) { handleAddProduct(product, snDoc.serialNumber); return; }
        }
        const productBySku = products?.find(p => p.sku?.toLowerCase() === productSearch.trim().toLowerCase());
        if (productBySku) { handleAddProduct(productBySku); return; }
        toast({ variant: "destructive", title: "No Match Found" });
      } catch (err) { console.error(err); } finally { setIsSearchingSN(false); }
    }
  };

  const handleSaveInvoice = async () => {
    if (!selectedCustomerId || lineItems.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await runTransaction(db!, async (transaction) => {
        const invoiceRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "sales_invoices"));
        const customer = customers?.find(c => c.id === selectedCustomerId);
        
        const resolvedCustomerName = customer 
          ? (customer.customerType !== 'individual' ? customer.companyName : customer.fullName)
          : "Client";

        const invoiceData = {
          id: invoiceRef.id,
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          customerId: selectedCustomerId,
          customerName: resolvedCustomerName,
          customerPhone: customer?.phoneNumber || "",
          customerEmail: customer?.email || "",
          customerAddress: customer?.address || "",
          projectName,
          projectLocation,
          invoiceDate,
          dueDate,
          paymentMethod,
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
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        transaction.set(invoiceRef, invoiceData);
        for (const item of lineItems) {
          if (!item.isCustom) {
            const productRef = doc(db!, "companies", companyId!, "branches", branchId!, "products", item.productId);
            transaction.update(productRef, { currentStock: increment(-item.qty) });
          }
        }
      });
      toast({ title: t('success') });
      router.push("/sales");
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
      setIsSubmitting(false);
    }
  };

  const addManualRow = () => {
    setLineItems([...lineItems, { id: Math.random().toString(36).substr(2, 9), productId: "custom", name: "", description: "", brand: "", model: "", specs: "", warranty: "1 Year", sn: "", qty: 1, unit: "Pcs", price: 0, discount: 0, tax: 0, total: 0, isCustom: true }]);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, val: any) => {
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
            <h1 className="text-base md:text-lg font-black text-slate-900 tracking-tight leading-none">{copyFromId ? 'Duplicate' : 'New Sales Invoice'}</h1>
            <p className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Transaction Ledger Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="font-bold text-[10px] md:text-xs gap-2 px-4 md:px-8 h-9 md:h-11 rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100" disabled={isSubmitting} onClick={handleSaveInvoice}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{t('save')} Invoice</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-9 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-slate-100 bg-white overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
               <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                       <User className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">Customer Identity</CardTitle>
                  </div>
                  <div className="flex gap-2 p-1 bg-white rounded-full border border-slate-200">
                    <Button type="button" variant="ghost" size="sm" className={cn("h-8 rounded-full text-[10px] font-black uppercase gap-2 transition-all px-4", !isNewCustomerMode ? "bg-blue-600 text-white shadow-lg" : "text-slate-400")} onClick={() => setIsNewCustomerMode(false)}>Select Existing</Button>
                    <Button type="button" variant="ghost" size="sm" className={cn("h-8 rounded-full text-[10px] font-black uppercase gap-2 transition-all px-4", isNewCustomerMode ? "bg-blue-600 text-white shadow-lg" : "text-slate-400")} onClick={() => setIsNewCustomerMode(true)}>New Registration</Button>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-6">
              {!isNewCustomerMode ? (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                     <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Search Client Account</Label>
                        <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                          <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs">
                            <SelectValue placeholder="Search or select from directory" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] rounded-xl shadow-2xl">
                            {customers?.map((c, idx) => (
                              <SelectItem key={`c-inv-${c.id}-${idx}`} value={c.id} className="text-xs font-bold uppercase py-2.5">
                                {c.customerType !== 'individual' ? c.companyName : c.fullName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                     </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleQuickCustomerCreate} className="animate-in fade-in slide-in-from-top-2 space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Identity Type</Label>
                        <div className="flex gap-2">
                           <Button type="button" variant={quickCustType === 'individual' ? 'default' : 'outline'} className="flex-1 h-10 rounded-xl text-[9px] font-black uppercase" onClick={() => setQuickCustType('individual')}>Individual</Button>
                           <Button type="button" variant={quickCustType === 'company' ? 'default' : 'outline'} className="flex-1 h-10 rounded-xl text-[9px] font-black uppercase" onClick={() => setQuickCustType('company')}>Company</Button>
                        </div>
                      </div>
                      {quickCustType === 'company' && <div className="space-y-1.5 md:col-span-2"><Label className="text-[10px] font-black uppercase text-slate-500">Legal Company Name *</Label><Input name="companyName" required className="h-10 rounded-xl" /></div>}
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">First Name *</Label><Input name="firstName" required className="h-10 rounded-xl" /></div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Last Name *</Label><Input name="lastName" required className="h-10 rounded-xl" /></div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Mobile *</Label><Input name="phoneNumber" required className="h-10 rounded-xl" /></div>
                      <div className="space-y-1.5 lg:col-span-2"><Label className="text-[10px] font-black uppercase text-slate-500">Full Address</Label><Input name="address" className="h-10 rounded-xl" /></div>
                   </div>
                   <div className="flex justify-end border-t pt-6"><Button type="submit" disabled={isCreatingCustomer} className="bg-blue-600 text-white h-11 px-8 rounded-xl font-black uppercase text-[10px]">Save & Apply</Button></div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-[2rem] overflow-hidden">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Project Title</Label><Input value={projectName} onChange={e => setProjectName(e.target.value)} className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Site Location</Label><Input value={projectLocation} onChange={e => setProjectLocation(e.target.value)} className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Invoice Date</Label><Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="h-11 rounded-xl uppercase" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Payment Due</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-11 rounded-xl uppercase" /></div>
              </div>
            </CardContent>
          </Card>

          <div className="relative group">
             <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">{isSearchingSN ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> : <Scan className="h-5 w-5 text-slate-400" />}</div>
             <Input value={productSearch} onChange={e => setProductSearch(e.target.value)} onKeyDown={handleProductSearchKeyDown} className="h-16 pl-12 pr-6 rounded-[2rem] bg-white shadow-xl text-sm font-black uppercase" placeholder="Scan Serial or Search Catalog" />
             {suggestedProducts.length > 0 && (
                <Card className="absolute top-full left-0 right-0 mt-2 z-[60] shadow-2xl rounded-[1.5rem] overflow-hidden bg-white">
                   <div className="p-2 space-y-1">
                      {suggestedProducts.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-4 hover:bg-blue-50 cursor-pointer rounded-xl group" onClick={() => handleAddProduct(p)}>
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden">{p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Package className="h-5 w-5" />}</div>
                              <div><p className="text-[11px] font-black uppercase">{p.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase">{p.sku}</p></div>
                           </div>
                           <div className="text-right"><p className="text-[11px] font-black text-blue-600">৳{p.unitPrice?.toLocaleString()}</p></div>
                        </div>
                      ))}
                   </div>
                </Card>
             )}
          </div>

          <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden rounded-[2rem] bg-white">
            <div className="p-5 bg-white border-b flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase text-slate-900">Inventory Manifest</h3>
              <Button variant="outline" size="sm" className="h-9 rounded-xl text-[10px] font-black uppercase" onClick={addManualRow}><PlusCircle className="h-4 w-4 mr-2" /> Add Manual Item</Button>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <Table className="min-w-[1000px]">
                <TableHeader className="bg-slate-50/50">
                  <TableRow><TableHead className="w-12 text-center text-[10px] font-black pl-6 uppercase">Sl</TableHead><TableHead className="min-w-[400px] text-[10px] font-black uppercase">Item Details</TableHead><TableHead className="w-24 text-[10px] font-black uppercase text-center">Unit</TableHead><TableHead className="w-24 text-[10px] font-black uppercase text-center">Qty</TableHead><TableHead className="w-32 text-[10px] font-black uppercase text-right">Unit Price</TableHead><TableHead className="w-32 text-[10px] font-black uppercase text-right pr-10">Total</TableHead><TableHead className="w-10"></TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, idx) => (
                    <TableRow key={item.id} className="group hover:bg-slate-50/50 border-b align-top transition-colors">
                      <TableCell className="text-center text-[11px] font-black text-slate-300 py-6 pl-6">{(idx + 1).toString().padStart(2, '0')}</TableCell>
                      <TableCell className="py-6 px-2">
                        <div className="space-y-4">
                           <Input className="h-10 text-xs font-black uppercase border-none bg-slate-100/50 rounded-xl" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} />
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <Input className="h-8 text-[10px] font-bold" value={item.model} onChange={e => updateItem(item.id, 'model', e.target.value)} placeholder="Model" />
                              <Input className="h-8 text-[10px] font-bold" value={item.brand} onChange={e => updateItem(item.id, 'brand', e.target.value)} placeholder="Brand" />
                              <Input className="h-8 text-[10px] font-black text-blue-600 bg-blue-50/30" value={item.sn} onChange={e => updateItem(item.id, 'sn', e.target.value)} placeholder="Serial Number" />
                              <Input className="h-8 text-[10px] font-bold" value={item.warranty} onChange={e => updateItem(item.id, 'warranty', e.target.value)} placeholder="Warranty" />
                           </div>
                           <textarea className="w-full text-[10px] font-medium bg-slate-50 border rounded-xl p-3 min-h-[60px]" value={item.specs} onChange={e => updateItem(item.id, 'specs', e.target.value)} placeholder="Specifications..." />
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
          <Card className="p-8 rounded-[2.5rem] bg-white space-y-6 text-center shadow-sm">
             <div className="space-y-1"><p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Total Invoice Payable</p><h2 className="text-3xl font-headline font-black text-blue-600">৳{grandTotal.toLocaleString()}</h2></div>
             <div className="pt-6 space-y-3 border-t text-[10px] font-black uppercase text-left">
                <div className="flex justify-between"><span>{t('subtotal')}</span><span className="text-slate-900">৳{subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Accrued VAT 15%</span><span className="text-blue-600">+৳{itemTaxes.toLocaleString()}</span></div>
             </div>
          </Card>

          <Card className="p-6 rounded-[2.5rem] bg-white space-y-6 shadow-sm">
            <div className="space-y-4">
              <div className="space-y-1.5 p-4 bg-slate-50 rounded-3xl"><Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Extra Discount ৳</Label><Input type="number" className="h-10 rounded-xl bg-white border-none font-black text-red-600" value={globalDiscount || ''} onChange={e => setGlobalDiscount(Number(e.target.value))} /></div>
              <div className="space-y-1.5 p-4 bg-slate-50 rounded-3xl"><Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Paid Amount ৳</Label><Input type="number" className="h-12 rounded-xl bg-white border-none font-black text-emerald-700 text-lg" value={paidAmount || ''} onChange={e => setPaidAmount(Number(e.target.value))} /></div>
              <div className={cn("p-5 rounded-[2rem] flex justify-between items-center", balanceDue > 0 ? "bg-red-50" : "bg-emerald-50")}>
                 <div className="space-y-0.5"><span className="text-[9px] font-black uppercase text-slate-400">Balance Due</span><p className={cn("text-xl font-black", balanceDue > 0 ? "text-red-600" : "text-emerald-700")}>৳{Math.abs(balanceDue).toLocaleString()}</p></div>
                 {balanceDue <= 0 && <CheckCircle2 className="h-6 w-6 text-emerald-500" />}
              </div>
            </div>
            <Button className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95" disabled={isSubmitting || lineItems.length === 0} onClick={handleSaveInvoice}>
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />} Post Final Invoice
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
