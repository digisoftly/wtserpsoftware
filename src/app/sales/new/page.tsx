
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
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
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
  isCustom?: boolean;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [isNewCustomerMode, setIsNewCustomerMode] = React.useState(false);
  
  // Invoice Core State
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

  // Product Search State
  const [productSearch, setProductSearch] = React.useState("");
  const [isSearchingSN, setIsSearchingSN] = React.useState(false);

  // New Customer State
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
    };
    setLineItems([...lineItems, newItem]);
    setProductSearch("");
  };

  const addManualRow = () => {
    const newItem: InvoiceItem = {
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
      setIsNewCustomerMode(false);
      toast({ title: t('common_success'), description: "New customer added and selected" });
    } catch (err: any) {
      toast({ variant: "destructive", title: t('common_error'), description: err.message });
    } finally {
      setIsCustomerCreating(false);
    }
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
            toast({ title: "Serial Found", description: `Added ${product.name}` });
            return;
          }
        }

        const productBySku = products?.find(p => p.sku?.toLowerCase() === productSearch.trim().toLowerCase());
        if (productBySku) {
          handleAddProduct(productBySku);
          return;
        }

        toast({ variant: "destructive", title: "No Match", description: "Serial or Model not found in active stock" });
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingSN(false);
      }
    }
  };

  const handleSaveInvoice = async () => {
    if (!selectedCustomerId || lineItems.length === 0 || isSubmitting) {
      toast({ variant: "destructive", title: "Action Required", description: "Select a customer and add at least one item" });
      return;
    }
    setIsSubmitting(true);

    try {
      await runTransaction(db!, async (transaction) => {
        const invoiceRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "sales_invoices"));
        const customer = customers?.find(c => c.id === selectedCustomerId);

        const invoiceData = {
          id: invoiceRef.id,
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          customerId: selectedCustomerId,
          customerName: customer ? (customer.customerType === 'company' ? customer.companyName : `${customer.firstName} ${customer.lastName}`) : "Client",
          customerPhone: customer?.phoneNumber || "",
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

      toast({ title: t('common_success') });
      router.push("/sales");
    } catch (e: any) {
      toast({ variant: "destructive", title: t('common_error'), description: e.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-full mx-auto space-y-6 pb-20 overflow-x-hidden">
      <div className="flex items-center justify-between border-b pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-2 sm:px-4">
        <div className="flex items-center gap-3 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-8 w-8 md:h-10 md:w-10">
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <div>
            <h1 className="text-base md:text-lg font-black text-slate-900 tracking-tight leading-none">New Sales Invoice</h1>
            <p className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Transaction Ledger Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex font-bold text-xs" onClick={() => router.back()}>{t('common_cancel')}</Button>
          <Button size="sm" className="font-bold text-[10px] md:text-xs gap-2 px-4 md:px-8 h-9 md:h-11 rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100" disabled={isSubmitting} onClick={handleSaveInvoice}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="hidden xs:inline">{t('common_save')} Invoice</span>
            <span className="xs:hidden">Save</span>
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
                    <Button 
                      type="button" 
                      variant="ghost"
                      size="sm" 
                      className={cn("h-8 rounded-full text-[10px] font-black uppercase gap-2 transition-all px-4", !isNewCustomerMode ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-blue-600")}
                      onClick={() => setIsNewCustomerMode(false)}
                    >
                      <Search className="h-3 w-3" /> Select Existing
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost"
                      size="sm" 
                      className={cn("h-8 rounded-full text-[10px] font-black uppercase gap-2 transition-all px-4", isNewCustomerMode ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-blue-600")}
                      onClick={() => setIsNewCustomerMode(true)}
                    >
                      <UserPlus className="h-3 w-3" /> New Registration
                    </Button>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-6">
              {!isNewCustomerMode ? (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                     <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Search Client Account</Label>
                        <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                          <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs focus:ring-2 focus:ring-blue-600">
                            <SelectValue placeholder="Search or select from directory" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px] rounded-xl shadow-2xl border-none ring-1 ring-slate-100">
                            {customers?.map((c, idx) => (
                              <SelectItem key={`c-${c.id}-${idx}`} value={c.id} className="text-xs font-bold uppercase py-2.5 cursor-pointer">
                                {c.customerType === 'company' ? c.companyName : `${c.firstName} ${c.lastName}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                     </div>
                     <div className="bg-blue-50/50 p-4 rounded-2xl ring-1 ring-blue-100 border-none flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                           <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <p className="text-[9px] font-bold text-blue-700 uppercase tracking-tighter">
                          Client details will be automatically loaded into the final invoice once selected
                        </p>
                     </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleQuickCustomerCreate} className="animate-in fade-in slide-in-from-top-2 duration-400 space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Identity Type</Label>
                        <div className="flex gap-2">
                           <Button type="button" variant={quickCustType === 'individual' ? 'default' : 'outline'} className="flex-1 h-10 rounded-xl text-[9px] font-black uppercase" onClick={() => setQuickCustType('individual')}>Individual</Button>
                           <Button type="button" variant={quickCustType === 'company' ? 'default' : 'outline'} className="flex-1 h-10 rounded-xl text-[9px] font-black uppercase" onClick={() => setQuickCustType('company')}>Company</Button>
                        </div>
                      </div>
                      
                      {quickCustType === 'company' && (
                        <div className="space-y-1.5 md:col-span-2">
                          <Label className="text-[10px] font-black uppercase text-slate-500">Legal Company Name *</Label>
                          <Input name="companyName" required className="h-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold" />
                        </div>
                      )}
                      
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-500">First Name *</Label>
                        <Input name="firstName" required className="h-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-500">Last Name *</Label>
                        <Input name="lastName" required className="h-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-500">Mobile / Whatsapp *</Label>
                        <Input name="phoneNumber" required className="h-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200" placeholder="+880" />
                      </div>
                      <div className="space-y-1.5 lg:col-span-1">
                        <Label className="text-[10px] font-black uppercase text-slate-500">Official Email</Label>
                        <Input name="email" type="email" className="h-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200" />
                      </div>
                      <div className="space-y-1.5 lg:col-span-2">
                        <Label className="text-[10px] font-black uppercase text-slate-500">Billing Address</Label>
                        <Input name="address" className="h-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200" />
                      </div>
                   </div>

                   <div className="flex justify-end border-t pt-6">
                      <Button type="submit" disabled={isCreatingCustomer} className="bg-blue-600 hover:bg-blue-700 h-11 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 shadow-xl shadow-blue-100">
                        {isCreatingCustomer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save & Apply Client
                      </Button>
                   </div>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm ring-1 ring-slate-100 bg-white rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
               <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                     <Building className="h-4 w-4" />
                  </div>
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">Project & Logistics</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Target Project</Label>
                  <Input value={projectName} onChange={e => setProjectName(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs" placeholder="e.g CCTV Implementation" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Site Location</Label>
                  <Input value={projectLocation} onChange={e => setProjectLocation(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs" placeholder="e.g Banani Dhaka" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Invoice Date</Label>
                  <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs uppercase" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Payment Due</Label>
                  <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs uppercase" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="relative group">
             <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                {isSearchingSN ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> : <Scan className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600" />}
             </div>
             <Input 
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                onKeyDown={handleProductSearchKeyDown}
                className="h-16 pl-12 pr-6 rounded-[2rem] bg-white border-none ring-2 ring-slate-100 focus:ring-blue-600 shadow-xl text-sm font-black uppercase tracking-tight"
                placeholder="Scan Serial Number or Type Product Name Model"
             />
             
             {suggestedProducts.length > 0 && (
                <Card className="absolute top-full left-0 right-0 mt-2 z-[60] border-none shadow-2xl rounded-[1.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
                   <div className="p-2 space-y-1">
                      {suggestedProducts.map(p => (
                        <div 
                           key={p.id} 
                           className="flex items-center justify-between p-4 hover:bg-blue-50 cursor-pointer rounded-xl group transition-all"
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
                              <Badge className="text-[8px] bg-slate-100 text-slate-500 border-none uppercase h-4 px-1.5">{p.currentStock} In Stock</Badge>
                           </div>
                        </div>
                      ))}
                   </div>
                </Card>
             )}
          </div>

          <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden rounded-[2rem] bg-white">
            <div className="p-5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                 <LayoutGrid className="h-5 w-5 text-blue-600" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Inventory Manifest</h3>
              </div>
              <Button variant="outline" size="sm" className="h-10 rounded-xl gap-2 text-[10px] font-black uppercase border-slate-200 text-slate-900 hover:bg-slate-50 transition-all" onClick={addManualRow}>
                <PlusCircle className="h-4 w-4" /> {t('common_add')} Generic Row
              </Button>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              <Table className="min-w-[1000px]">
                <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                  <TableRow className="hover:bg-transparent h-14">
                    <TableHead className="w-12 text-center text-[10px] font-black uppercase pl-6">Sl</TableHead>
                    <TableHead className="min-w-[400px] text-[10px] font-black uppercase">Item Details & Attributes</TableHead>
                    <TableHead className="w-24 text-[10px] font-black uppercase text-center">Unit</TableHead>
                    <TableHead className="w-24 text-[10px] font-black uppercase text-center">Qty</TableHead>
                    <TableHead className="w-32 text-[10px] font-black uppercase text-right">Unit Price</TableHead>
                    <TableHead className="w-32 text-[10px] font-black uppercase text-right pr-10">Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-64 text-center">
                         <div className="flex flex-col items-center justify-center opacity-20 space-y-4">
                            <Search className="h-12 w-12" />
                            <p className="text-xs font-black uppercase tracking-[0.3em]">Scan or Search above to add items</p>
                         </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    lineItems.map((item, idx) => (
                      <TableRow key={item.id} className="group hover:bg-slate-50/50 border-b border-slate-50 align-top transition-colors">
                        <TableCell className="text-center text-[11px] font-black text-slate-300 py-6 pl-6">{(idx + 1).toString().padStart(2, '0')}</TableCell>
                        <TableCell className="py-6 px-2">
                          <div className="space-y-3">
                            <Input 
                              className="h-10 text-xs font-black uppercase border-none bg-slate-100/50 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all rounded-xl" 
                              value={item.name || ''} 
                              onChange={e => updateItem(item.id, 'name', e.target.value)} 
                              placeholder="Main Item Name" 
                            />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                               <Input className="h-8 text-[10px] font-bold border-slate-100 bg-white rounded-lg" value={item.model || ''} onChange={e => updateItem(item.id, 'model', e.target.value)} placeholder="Model" />
                               <Input className="h-8 text-[10px] font-bold border-slate-100 bg-white rounded-lg" value={item.brand || ''} onChange={e => updateItem(item.id, 'brand', e.target.value)} placeholder="Brand" />
                               <Input className="h-8 text-[10px] font-black text-blue-600 border-blue-100 bg-blue-50/30 rounded-lg uppercase" value={item.sn || ''} onChange={e => updateItem(item.id, 'sn', e.target.value)} placeholder="S/N Number" />
                               <Input className="h-8 text-[10px] font-bold border-slate-100 bg-white rounded-lg" value={item.warranty || ''} onChange={e => updateItem(item.id, 'warranty', e.target.value)} placeholder="Warranty" />
                            </div>
                            <textarea 
                              className="w-full text-[10px] font-medium bg-slate-50 border border-slate-200 rounded-xl p-3 min-h-[60px] resize-none outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all" 
                              value={item.specs || ''} 
                              onChange={e => updateItem(item.id, 'specs', e.target.value)} 
                              placeholder="Full Technical Specification Details" 
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-6">
                          <Select value={item.unit || 'Pcs'} onValueChange={(val) => updateItem(item.id, 'unit', val)}>
                            <SelectTrigger className="h-9 border-none bg-slate-100 text-[11px] font-black uppercase w-20 mx-auto rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-2xl ring-1 ring-slate-100">
                              {masterUnits?.map((u, uidx) => <SelectItem key={`u-${u.id}-${uidx}`} value={u.shortName} className="text-xs font-bold">{u.shortName}</SelectItem>)}
                              {!masterUnits?.length && <SelectItem value="Pcs">Pcs</SelectItem>}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-6 text-center">
                          <Input type="number" className="h-10 text-center font-black text-xs rounded-xl w-16 bg-slate-100 border-none mx-auto focus:ring-1 focus:ring-blue-500" value={item.qty || ''} onChange={e => updateItem(item.id, 'qty', Number(e.target.value))} />
                        </TableCell>
                        <TableCell className="py-6 text-right">
                          <Input type="number" className="h-10 text-right font-black text-xs rounded-xl w-24 bg-slate-100 border-none ml-auto focus:ring-1 focus:ring-blue-500 rounded-xl" value={item.price || ''} onChange={e => updateItem(item.id, 'price', Number(e.target.value))} />
                        </TableCell>
                        <TableCell className="py-6 text-right pr-10 font-black text-xs text-slate-900 tabular-nums">৳{(item.total || 0).toLocaleString()}</TableCell>
                        <TableCell className="py-6 pr-4">
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" onClick={() => setLineItems(lineItems.filter(i => i.id !== item.id))}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <div className="xl:col-span-3 space-y-6">
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
             <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Gross Net Total</p>
                <h2 className="text-4xl md:text-5xl font-headline font-black tracking-tighter tabular-nums text-blue-600">৳{(grandTotal || 0).toLocaleString()}</h2>
             </div>
             <div className="pt-6 space-y-3 border-t border-slate-100 text-[10px] font-black uppercase tracking-widest text-left">
                <div className="flex justify-between items-center text-slate-500">
                   <span>Subtotal</span>
                   <span className="text-slate-900">৳{(subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                   <span>Accrued VAT 15%</span>
                   <span className="text-blue-600">+৳{(itemTaxes || 0).toLocaleString()}</span>
                </div>
             </div>
          </Card>

          <Card className="p-6 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5 p-4 bg-slate-50/80 rounded-3xl border border-slate-100">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                   <Calculator className="h-3.5 w-3.5 text-red-500" /> Extra Discount ৳
                </Label>
                <Input type="number" className="h-10 rounded-xl bg-white border-none ring-1 ring-slate-200 font-black text-sm text-red-600" value={globalDiscount || ''} onChange={e => setGlobalDiscount(Number(e.target.value))} />
              </div>
              
              <div className="space-y-1.5 p-4 bg-slate-50/80 rounded-3xl border border-slate-100">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                   <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Cash Collected ৳
                </Label>
                <Input type="number" className="h-12 rounded-xl bg-white border-none ring-1 ring-slate-200 font-black text-emerald-700 text-lg shadow-inner" value={paidAmount || ''} onChange={e => setPaidAmount(Number(e.target.value))} />
              </div>

              <div className={cn("p-5 rounded-[2rem] flex justify-between items-center transition-all duration-500", balanceDue > 0 ? "bg-red-50 ring-1 ring-red-100" : "bg-emerald-50 ring-1 ring-emerald-100")}>
                 <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase text-slate-400">Balance Due</span>
                    <p className={cn("text-xl font-black tabular-nums leading-none", balanceDue > 0 ? "text-red-600" : "text-emerald-700")}>
                      ৳{Math.abs(balanceDue).toLocaleString()}
                    </p>
                 </div>
                 {balanceDue <= 0 && <CheckCircle2 className="h-6 w-6 text-emerald-500" />}
              </div>
            </div>
            
            <div className="space-y-2 pt-2">
               <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Internal Billing Notes</Label>
               <Textarea className="min-h-[100px] text-[11px] font-bold rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:bg-white transition-all p-4" value={notes || ''} onChange={e => setNotes(e.target.value)} placeholder="Standard terms & conditions apply" />
            </div>

            <Button className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl text-white bg-blue-600 hover:bg-blue-700 transition-all active:scale-95 shadow-blue-200" disabled={isSubmitting || lineItems.length === 0} onClick={handleSaveInvoice}>
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
              Post Final Invoice
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
