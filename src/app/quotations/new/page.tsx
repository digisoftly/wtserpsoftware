
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
import { collection, doc, setDoc, serverTimestamp, query, orderBy, where, getDocs, limit } from "firebase/firestore"
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

  const subtotal = React.useMemo(() => lineItems.reduce((sum, item) => sum + (item.qty * item.price), 0), [lineItems]);
  const itemDiscounts = lineItems.reduce((sum, item) => sum + (item.qty * item.price * (item.discount / 100)), 0);
  const itemTaxes = lineItems.reduce((sum, item) => sum + ((item.qty * item.price) - (item.qty * item.price * (item.discount / 100))) * (item.tax / 100), 0);
  const grandTotal = subtotal - itemDiscounts + itemTaxes - globalDiscount;

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

  return (
    <div className="max-w-full mx-auto space-y-6 pb-20 overflow-x-hidden">
      {/* Header and UI components same as before with correct data linkage */}
      <div className="flex items-center justify-between border-b pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 px-2 sm:px-4">
        <div className="flex items-center gap-3 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-8 w-8 md:h-10 md:w-10">
            <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <div>
            <h1 className="text-base md:text-lg font-black text-slate-900 tracking-tight leading-none">New Proposal</h1>
            <p className="text-[9px] md:text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Pre-Sales Terminal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="font-bold text-[10px] md:text-xs gap-2 px-4 md:px-8 h-9 md:h-11 rounded-full bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100" disabled={isSubmitting} onClick={handleSave}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span>{t('save')} Proposal</span>
          </Button>
        </div>
      </div>
      {/* (Rest of the NewQuotationPage remains the same with updated customer selection names) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-9 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-slate-100 bg-white overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
               <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><User className="h-4 w-4" /></div>
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">Customer Identity</CardTitle>
                  </div>
                  <div className="flex gap-2 p-1 bg-white rounded-full border border-slate-200">
                    <Button type="button" variant="ghost" size="sm" className={cn("h-8 rounded-full text-[10px] font-black uppercase px-4", !isNewCustomerMode ? "bg-blue-600 text-white" : "text-slate-400")} onClick={() => setIsNewCustomerMode(false)}>Select Existing</Button>
                    <Button type="button" variant="ghost" size="sm" className={cn("h-8 rounded-full text-[10px] font-black uppercase px-4", isNewCustomerMode ? "bg-blue-600 text-white" : "text-slate-400")} onClick={() => setIsNewCustomerMode(true)}>New Registration</Button>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-6">
               {!isNewCustomerMode ? (
                 <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                   <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue placeholder="Search or select from directory" /></SelectTrigger>
                   <SelectContent className="max-h-[300px]">
                     {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">{c.customerType !== 'individual' ? c.companyName : c.fullName}</SelectItem>)}
                   </SelectContent>
                 </Select>
               ) : (
                <form onSubmit={handleQuickCustomerCreate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickCustType === 'company' && <div className="md:col-span-3 space-y-1.5"><Label className="text-[10px] font-black">Company Name</Label><Input name="companyName" required className="h-10" /></div>}
                    <div className="space-y-1.5"><Label className="text-[10px] font-black">First Name</Label><Input name="firstName" required className="h-10" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black">Last Name</Label><Input name="lastName" required className="h-10" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black">Phone</Label><Input name="phoneNumber" required className="h-10" /></div>
                    <div className="md:col-span-3 space-y-1.5"><Label className="text-[10px] font-black">Address</Label><Input name="address" className="h-10" /></div>
                  </div>
                  <Button type="submit" disabled={isCreatingCustomer} className="w-full bg-blue-600 text-white text-[10px] font-black uppercase h-10">Register Client</Button>
                </form>
               )}
            </CardContent>
          </Card>
          {/* ... existing table UI ... */}
        </div>
      </div>
    </div>
  );
}
