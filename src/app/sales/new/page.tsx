"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  ShoppingCart, 
  ArrowLeft, 
  Save, 
  Loader2, 
  User, 
  PackagePlus, 
  ShoppingBag, 
  X, 
  Calculator,
  ArrowRight,
  Search,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, runTransaction, serverTimestamp, increment } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface InvoiceItem {
  id: string;
  productId: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  total: number;
  isCustom?: boolean;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [isManualCustomer, setIsManualCustomer] = React.useState(false);
  const [manualCustomer, setManualCustomer] = React.useState({ name: "", phone: "", address: "" });
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [invoiceDate, setInvoiceDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [lineItems, setLineItems] = React.useState<InvoiceItem[]>([]);
  
  const [discount, setDiscount] = React.useState(0);
  const [paidAmount, setPaidAmount] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState("cash");

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
  const subtotal = React.useMemo(() => lineItems.reduce((sum, item) => sum + item.total, 0), [lineItems]);
  const grandTotal = React.useMemo(() => subtotal - discount, [subtotal, discount]);
  const balanceDue = React.useMemo(() => grandTotal - paidAmount, [grandTotal, paidAmount]);

  const handleAddProduct = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    const newItem: InvoiceItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      name: product.name,
      qty: 1,
      unit: product.unit || "Pcs",
      price: product.unitPrice || 0,
      total: product.unitPrice || 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, val: any) => {
    setLineItems(prev => prev.map((item) => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };
      if (field === 'qty') updated.qty = Math.max(1, Number(val) || 0);
      if (field === 'price') updated.price = Math.max(0, Number(val) || 0);
      updated.total = updated.qty * updated.price;
      return updated;
    }));
  };

  const handleSaveInvoice = async () => {
    if (isSubmitting) return;
    if (!isManualCustomer && !selectedCustomerId) {
      toast({ variant: "destructive", title: "Missing Identity", description: "Please select a client or enter manual details." });
      return;
    }
    if (lineItems.length === 0) {
      toast({ variant: "destructive", title: "Empty Cart", description: "No products added to the invoice." });
      return;
    }

    setIsSubmitting(true);
    try {
      await runTransaction(db!, async (transaction) => {
        const invoiceRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "sales_invoices"));
        
        let customerName = isManualCustomer ? manualCustomer.name : (customers?.find(c => c.id === selectedCustomerId)?.firstName + " " + customers?.find(c => c.id === selectedCustomerId)?.lastName);

        transaction.set(invoiceRef, {
          id: invoiceRef.id,
          companyId,
          branchId,
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          customerId: isManualCustomer ? "manual" : selectedCustomerId,
          customerName,
          invoiceDate,
          items: lineItems,
          subtotal,
          discount,
          totalAmount: grandTotal,
          paidAmount,
          balanceDue,
          paymentMethod,
          status: balanceDue <= 0 ? "paid" : paidAmount > 0 ? "partial" : "due",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        for (const item of lineItems) {
          const productRef = doc(db!, "companies", companyId!, "branches", branchId!, "products", item.productId);
          transaction.update(productRef, { currentStock: increment(-item.qty), updatedAt: serverTimestamp() });
        }
      });

      toast({ title: t('success') });
      router.push("/sales");
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-8 w-8 hover:bg-slate-200">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create Sales Invoice</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Registers / Sales Register / New Entry</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-md font-bold text-xs h-9 px-6 border-slate-200" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button size="sm" className="rounded-md font-bold text-xs h-9 px-8 gap-2 shadow-lg shadow-primary/20" disabled={isSubmitting} onClick={handleSaveInvoice}>
            {isSubmitting ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            Save Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Form Details */}
        <div className="xl:col-span-2 space-y-6">
          {/* Identity Section */}
          <Card className="border border-slate-200 shadow-sm rounded-md bg-white">
            <CardHeader className="border-b border-slate-50 px-6 py-4">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Customer Identification</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-6 mb-8 bg-slate-50 p-4 rounded-md border border-slate-100 w-fit">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Billing Mode:</span>
                <div className="flex items-center gap-2">
                  <Switch checked={isManualCustomer} onCheckedChange={setIsManualCustomer} className="scale-75" />
                  <span className="text-[11px] font-bold text-slate-900 uppercase">Manual Individual</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isManualCustomer ? (
                  <>
                    <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Full Name</Label><Input className="h-10 text-sm font-medium" value={manualCustomer.name} onChange={e => setManualCustomer({...manualCustomer, name: e.target.value})} /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Mobile #</Label><Input className="h-10 text-sm font-medium" value={manualCustomer.phone} onChange={e => setManualCustomer({...manualCustomer, phone: e.target.value})} /></div>
                    <div className="md:col-span-2 space-y-1.5"><Label className="text-xs font-bold text-slate-600">Address</Label><Input className="h-10 text-sm font-medium" value={manualCustomer.address} onChange={e => setManualCustomer({...manualCustomer, address: e.target.value})} /></div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Select Customer</Label>
                      <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                        <SelectTrigger className="h-10 text-sm bg-white"><SelectValue placeholder="Search database..." /></SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-sm">{c.firstName} {c.lastName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Billing Date</Label><Input type="date" className="h-10 text-sm font-bold uppercase" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} /></div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Matrix Section */}
          <Card className="border border-slate-200 shadow-sm rounded-md bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 px-6 py-4 flex flex-row items-center justify-between border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Product Worksheet</CardTitle>
              <div className="flex gap-2">
                <Select onValueChange={handleAddProduct}>
                  <SelectTrigger className="h-9 w-64 text-xs bg-white"><SelectValue placeholder="Add From Catalog..." /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {products?.map(p => <SelectItem key={p.id} value={p.id} className="text-sm font-medium">{p.name} <span className="opacity-50 ml-2">(S: {p.currentStock})</span></SelectItem>)}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-9 rounded-md gap-2 text-xs font-bold border-slate-200">
                  <PackagePlus className="h-3.5 w-3.5" /> Manual Line
                </Button>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/30">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-bold text-slate-500 pl-8 h-10">Description</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-slate-500 text-center h-10 w-24">Qty</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-slate-500 text-right h-10 w-32">Rate (৳)</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold text-slate-500 text-right pr-10 h-10 w-32">Amount</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-40 text-center"><div className="flex flex-col items-center opacity-30"><ShoppingBag className="h-10 w-10 mb-2" /><p className="text-xs font-bold uppercase tracking-widest">Worksheet Empty</p></div></TableCell></TableRow>
                  ) : (
                    lineItems.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/30 transition-colors">
                        <TableCell className="pl-8 text-xs font-bold uppercase text-slate-700">{item.name}</TableCell>
                        <TableCell><Input type="number" className="h-8 text-center text-xs font-bold rounded w-16 bg-slate-100/50 border-none mx-auto" value={item.qty} onChange={e => handleUpdateItem(item.id, 'qty', e.target.value)} /></TableCell>
                        <TableCell className="text-right"><Input type="number" className="h-8 text-right text-xs font-bold rounded w-24 bg-slate-100/50 border-none ml-auto" value={item.price} onChange={e => handleUpdateItem(item.id, 'price', e.target.value)} /></TableCell>
                        <TableCell className="text-right pr-10 font-bold text-xs">৳{item.total.toLocaleString()}</TableCell>
                        <TableCell className="pr-4"><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-600 rounded-full" onClick={() => setLineItems(lineItems.filter(i => i.id !== item.id))}><X className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        {/* Right Column: Financial Summary */}
        <div className="space-y-6">
          <Card className="border border-slate-200 shadow-sm rounded-md bg-white p-8 space-y-8">
            <div className="text-center space-y-2 border-b border-slate-50 pb-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Final Settlement Amount</p>
              <h2 className="text-4xl font-black tracking-tighter text-primary">৳{grandTotal.toLocaleString()}</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-tight text-slate-500">
                <span>Subtotal Gross</span>
                <span className="text-slate-900">৳{subtotal.toLocaleString()}</span>
              </div>
              <div className="space-y-1.5 pt-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Instant Discount (৳)</Label>
                <Input type="number" className="h-10 text-sm font-bold bg-slate-50 border-none ring-1 ring-slate-100" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} />
              </div>
              
              <div className="w-full h-px bg-slate-100 my-4" />

              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Payment Amount Received (৳)</Label>
                <Input type="number" className="h-12 text-xl font-bold bg-blue-50/50 border-2 border-blue-100 text-blue-700 text-center" value={paidAmount || ''} onChange={e => setPaidAmount(Number(e.target.value))} />
              </div>

              <div className="space-y-1.5 pt-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Payment Terminal</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="h-10 text-xs font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash" className="text-xs font-bold">Physical Cash</SelectItem>
                    <SelectItem value="bank" className="text-xs font-bold">Bank Transfer</SelectItem>
                    <SelectItem value="bkash" className="text-xs font-bold text-pink-600">bKash Merchant</SelectItem>
                    <SelectItem value="nagad" className="text-xs font-bold text-orange-600">Nagad Pay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-md text-white flex justify-between items-center">
              <div>
                <p className="text-[9px] font-bold uppercase opacity-50">Remaining Due</p>
                <p className="text-xl font-bold tabular-nums">৳{balanceDue.toLocaleString()}</p>
              </div>
              <div className="h-8 w-8 rounded bg-white/10 flex items-center justify-center">
                <Calculator className="h-4 w-4" />
              </div>
            </div>

            <Button className="w-full h-12 rounded-md font-bold text-sm uppercase tracking-widest shadow-xl shadow-primary/20 gap-2 transition-all active:scale-95" disabled={isSubmitting || lineItems.length === 0} onClick={handleSaveInvoice}>
              {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              Finalize & Post
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}