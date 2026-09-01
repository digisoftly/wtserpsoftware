
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
          globalDiscount,
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
            <h1 className="text-base md:text-lg font-black text-slate-900 tracking-tight leading-none uppercase">{copyFromId ? 'Duplicate' : 'New Sales Invoice'}</h1>
            <p className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Transaction Ledger Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="font-bold text-xs" onClick={() => router.back()}>{t('cancel')}</Button>
          <Button size="sm" className="font-bold text-xs gap-2 px-6 md:px-8 h-9 md:h-11 rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl" disabled={isSubmitting} onClick={handleSaveInvoice}>
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="hidden sm:inline">{t('save')} Invoice</span>
            <span className="sm:hidden">{t('save')}</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border shadow-sm ring-1 ring-slate-100 overflow-hidden">
        {/* UNIFIED FORM CONTAINER */}
        <div className="p-6 md:p-10 space-y-12">
          
          {/* SECTION 1: CUSTOMER & PROJECT */}
          <section className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><User className="h-4 w-4" /></div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Customer Identity</h3>
              </div>
              <div className="flex gap-2 p-1 bg-slate-50 rounded-full border">
                <Button type="button" variant="ghost" size="sm" className={cn("h-8 rounded-full text-[10px] font-black uppercase px-4", !isNewCustomerMode ? "bg-white shadow-sm text-blue-600" : "text-slate-400")} onClick={() => setIsNewCustomerMode(false)}>Existing</Button>
                <Button type="button" variant="ghost" size="sm" className={cn("h-8 rounded-full text-[10px] font-black uppercase px-4", isNewCustomerMode ? "bg-white shadow-sm text-blue-600" : "text-slate-400")} onClick={() => setIsNewCustomerMode(true)}>Register</Button>
              </div>
            </div>

            {!isNewCustomerMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1.5 lg:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Search Client Account</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue placeholder="Search Directory" /></SelectTrigger>
                    <SelectContent className="max-h-[300px] rounded-xl shadow-2xl">
                      {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">{c.customerType !== 'individual' ? c.companyName : c.fullName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Invoice Date</Label><Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-none" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Due Date</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-none" /></div>
                
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Project Title</Label><Input value={projectName} onChange={e => setProjectName(e.target.value)} className="h-11 rounded-xl" placeholder="Global HQ Expansion" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Site Location</Label><Input value={projectLocation} onChange={e => setProjectLocation(e.target.value)} className="h-11 rounded-xl" placeholder="Mohakhali, Dhaka" /></div>
                <div className="space-y-1.5 lg:col-span-2"><Label className="text-[10px] font-black uppercase text-slate-400">Terms of Payment</Label><Input value={terms} onChange={e => setTerms(e.target.value)} className="h-11 rounded-xl" placeholder="Immediate / 15 Days" /></div>
              </div>
            ) : (
              <form onSubmit={handleQuickCustomerCreate} className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 p-6 rounded-3xl animate-in fade-in">
                {quickCustType === 'company' && <div className="md:col-span-3 space-y-1.5"><Label className="text-[10px] font-black">Company Name</Label><Input name="companyName" required className="h-10 bg-white" /></div>}
                <div className="space-y-1.5"><Label className="text-[10px] font-black">First Name</Label><Input name="firstName" required className="h-10 bg-white" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black">Last Name</Label><Input name="lastName" required className="h-10 bg-white" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black">Phone</Label><Input name="phoneNumber" required className="h-10 bg-white" /></div>
                <div className="md:col-span-3 flex justify-end"><Button type="submit" size="sm" className="bg-blue-600 h-9 px-6 rounded-xl font-black text-[10px] uppercase">Add & Apply</Button></div>
              </form>
            )}
          </section>

          {/* SECTION 2: INVENTORY MANIFEST */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600"><Package className="h-4 w-4" /></div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-900">Inventory Manifest</h3>
              </div>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input value={productSearch} onChange={e => setProductSearch(e.target.value)} onKeyDown={handleProductSearchKeyDown} className="h-10 pl-10 pr-6 rounded-xl bg-slate-50 border-none shadow-inner" placeholder="Scan or Search Catalog..." />
                {suggestedProducts.length > 0 && (
                  <Card className="absolute top-full left-0 right-0 mt-1 z-[60] shadow-2xl rounded-2xl overflow-hidden bg-white border border-slate-100">
                    <div className="p-1 space-y-0.5">
                      {suggestedProducts.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 hover:bg-blue-50 cursor-pointer rounded-xl group transition-colors" onClick={() => handleAddProduct(p)}>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden">{p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Package className="h-4 w-4 text-slate-300" />}</div>
                            <div><p className="text-[10px] font-black uppercase text-slate-900 leading-none">{p.name}</p><p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{p.sku}</p></div>
                          </div>
                          <p className="text-[10px] font-black text-blue-600">৳{p.unitPrice?.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="min-w-[1000px]">
                <TableHeader className="bg-slate-50/50">
                  <TableRow><TableHead className="w-12 text-center text-[10px] font-black uppercase pl-6">Sl</TableHead><TableHead className="text-[10px] font-black uppercase">Item Attribute Matrix</TableHead><TableHead className="w-24 text-center text-[10px] font-black uppercase">Unit</TableHead><TableHead className="w-24 text-center text-[10px] font-black uppercase">Qty</TableHead><TableHead className="w-32 text-right text-[10px] font-black uppercase">Price</TableHead><TableHead className="w-32 text-right pr-10 text-[10px] font-black uppercase">Total</TableHead><TableHead className="w-10"></TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item, idx) => (
                    <TableRow key={item.id} className="group hover:bg-slate-50 transition-colors border-b align-top">
                      <TableCell className="text-center text-[11px] font-black text-slate-300 py-6 pl-6">{(idx + 1).toString().padStart(2, '0')}</TableCell>
                      <TableCell className="py-6 px-2">
                        <div className="space-y-4">
                           <Input className="h-10 text-xs font-black uppercase border-none bg-slate-50 rounded-xl focus:bg-white focus:ring-1 focus:ring-blue-500" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} />
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <Input className="h-8 text-[10px] font-bold bg-white" value={item.model} onChange={e => updateItem(item.id, 'model', e.target.value)} placeholder="Model" />
                              <Input className="h-8 text-[10px] font-bold bg-white" value={item.brand} onChange={e => updateItem(item.id, 'brand', e.target.value)} placeholder="Brand" />
                              <Input className="h-8 text-[10px] font-black text-blue-600 bg-blue-50/50" value={item.sn} onChange={e => updateItem(item.id, 'sn', e.target.value)} placeholder="S/N" />
                              <Input className="h-8 text-[10px] font-bold bg-white" value={item.warranty} onChange={e => updateItem(item.id, 'warranty', e.target.value)} placeholder="Warranty" />
                           </div>
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
                    <TableRow><TableCell colSpan={7} className="h-40 text-center text-slate-300 italic text-[10px] font-black uppercase tracking-widest">No items added to manifest</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="p-4 flex justify-center bg-slate-50/30">
               <Button variant="ghost" className="h-12 w-full max-w-xs border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white hover:text-blue-600 transition-all gap-2" onClick={addManualRow}>
                 <PlusCircle className="h-4 w-4" /> Add Manual Row
               </Button>
            </div>
          </section>

          {/* SECTION 3: FINANCIALS & SETTLEMENT */}
          <section className="grid grid-cols-1 xl:grid-cols-2 gap-12 pt-8 border-t">
            <div className="space-y-6">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Ledger Remarks</h3>
              <Textarea className="min-h-[120px] rounded-2xl bg-slate-50 border-none p-6 text-xs font-medium" placeholder="Special instructions or terms..." value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl" />
               <div className="flex flex-col items-center text-center space-y-2">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Net Invoice Payable</p>
                 <h2 className="text-5xl font-headline font-black text-emerald-400 tracking-tighter">৳{grandTotal.toLocaleString()}</h2>
               </div>
               
               <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40"><span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40"><span>VAT 15%</span><span>৳{itemTaxes.toLocaleString()}</span></div>
                  </div>
                  <div className="space-y-4 border-l border-white/5 pl-4">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-red-400"><span>Adjustment</span><span>-৳{globalDiscount.toLocaleString()}</span></div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-400"><span>Paid</span><span>৳{paidAmount.toLocaleString()}</span></div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase opacity-40">Extra Disc. ৳</Label><Input type="number" className="h-10 bg-white/5 border-white/10 rounded-xl text-xs font-black text-red-400" value={globalDiscount || ''} onChange={e => setGlobalDiscount(Number(e.target.value))} /></div>
                  <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase opacity-40">Paid Amount ৳</Label><Input type="number" className="h-10 bg-white/5 border-white/10 rounded-xl text-xs font-black text-emerald-400" value={paidAmount || ''} onChange={e => setPaidAmount(Number(e.target.value))} /></div>
               </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
