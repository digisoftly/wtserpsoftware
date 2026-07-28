"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ShoppingCart, 
  ArrowLeft, 
  Save, 
  Loader2, 
  Scan, 
  User, 
  PackagePlus, 
  ShoppingBag, 
  X, 
  Calculator,
  ArrowRight,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, runTransaction, serverTimestamp, increment, where, limit, query, updateDoc } from "firebase/firestore"
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
  serials: string[];
  isSerialized: boolean;
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
  const [isManualCustomer, setIsManualCustomer] = React.useState(false);
  const [manualCustomer, setManualCustomer] = React.useState({ name: "", phone: "", address: "" });
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [invoiceDate, setInvoiceDate] = React.useState("");
  const [lineItems, setLineItems] = React.useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = React.useState(0);
  const [vatPercent, setVatPercent] = React.useState(15);
  const [paidAmount, setPaidAmount] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState("cash");

  React.useEffect(() => {
    if (invoice) {
      setIsManualCustomer(invoice.customerId === "manual");
      setManualCustomer({
        name: invoice.customerId === "manual" ? invoice.customerName : "",
        phone: invoice.customerPhone || "",
        address: invoice.customerAddress || ""
      });
      setSelectedCustomerId(invoice.customerId !== "manual" ? invoice.customerId : "");
      setInvoiceDate(invoice.invoiceDate);
      setLineItems(invoice.items || []);
      setDiscount(invoice.discount || 0);
      setVatPercent(invoice.vatPercent || 15);
      setPaidAmount(invoice.paidAmount || 0);
      setPaymentMethod(invoice.paymentMethod || "cash");
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
  const subtotal = React.useMemo(() => lineItems.reduce((sum, item) => sum + item.total, 0), [lineItems]);
  const vatAmount = React.useMemo(() => (subtotal - discount) * (vatPercent / 100), [subtotal, discount, vatPercent]);
  const totalAmount = React.useMemo(() => subtotal - discount + vatAmount, [subtotal, discount, vatAmount]);
  const balanceDue = React.useMemo(() => totalAmount - paidAmount, [totalAmount, paidAmount]);

  const handleAddProduct = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    setLineItems(prev => {
      const existingIdx = prev.findIndex(item => item.productId === productId);
      if (existingIdx > -1 && !product.serialNumberTrackingRequired && !prev[existingIdx].isCustom) {
        const updated = [...prev];
        updated[existingIdx].qty += 1;
        updated[existingIdx].total = updated[existingIdx].qty * updated[existingIdx].price;
        return updated;
      } else {
        return [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          productId: product.id,
          name: product.name,
          qty: 1,
          unit: product.unit || "Pcs",
          price: product.unitPrice || 0,
          total: product.unitPrice || 0,
          isSerialized: product.serialNumberTrackingRequired || false,
          serials: [],
          isCustom: false
        }];
      }
    });
  };

  const handleAddManualItem = () => {
    setLineItems(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      productId: "custom",
      name: "",
      qty: 1,
      unit: "Pcs",
      price: 0,
      total: 0,
      isSerialized: false,
      serials: [],
      isCustom: true
    }]);
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, val: any) => {
    setLineItems(prev => prev.map((item) => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };
      if (field === 'qty') updated.qty = Math.max(1, Number(val) || 0);
      if (field === 'price') updated.price = Math.max(0, Number(val) || 0);
      if (field === 'qty' || field === 'price') updated.total = updated.qty * updated.price;
      return updated;
    }));
  };

  const handleSaveUpdate = async () => {
    if (!invoiceRef || isSubmitting) return;
    setIsSubmitting(true);
    
    let customerName = "";
    let customerPhone = "";
    let customerAddress = "";
    let finalCustomerId = "";

    if (isManualCustomer) {
      customerName = manualCustomer.name;
      customerPhone = manualCustomer.phone;
      customerAddress = manualCustomer.address;
      finalCustomerId = "manual";
    } else {
      const customer = customers?.find(c => c.id === selectedCustomerId);
      customerName = customer ? `${customer.firstName} ${customer.lastName}` : "Client";
      customerPhone = customer?.phoneNumber || "";
      customerAddress = customer?.companyName || "";
      finalCustomerId = selectedCustomerId;
    }

    const updatedData = {
      customerId: finalCustomerId,
      customerName,
      customerPhone,
      customerAddress,
      invoiceDate,
      items: lineItems,
      subtotal,
      discount,
      vatPercent,
      vatAmount,
      totalAmount,
      paidAmount,
      balanceDue,
      paymentMethod,
      status: balanceDue <= 0 ? "paid" : paidAmount > 0 ? "partial" : "due",
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
    <div className="flex flex-col h-full bg-slate-50 min-h-screen pb-20">
      <div className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-blue-600">{t('edit')} Invoice</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{invoice?.invoiceNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-full px-8 h-10 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 gap-2" disabled={isSubmitting} onClick={handleSaveUpdate}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            {t('save')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6">
        <div className="flex-1 space-y-6">
          <Card className="p-6 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 space-y-6 bg-white">
            <CardHeader className="p-0 pb-4 border-b border-slate-50">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Customer Identification</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-4">
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
                    <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Full Name</Label><Input className="h-10 text-sm font-medium" value={manualCustomer.name} onChange={e => setManualCustomer({...manualCustomer, name: e.target.value})} placeholder="e.g. John Doe" /></div>
                    <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-600">Mobile #</Label><Input className="h-10 text-sm font-medium" value={manualCustomer.phone} onChange={e => setManualCustomer({...manualCustomer, phone: e.target.value})} placeholder="+880..." /></div>
                    <div className="md:col-span-2 space-y-1.5"><Label className="text-xs font-bold text-slate-600">Address</Label><Input className="h-10 text-sm font-medium" value={manualCustomer.address} onChange={e => setManualCustomer({...manualCustomer, address: e.target.value})} placeholder="Full physical address" /></div>
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

          <Card className="p-6 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6">
            <CardHeader className="p-0 pb-4 flex flex-row items-center justify-between border-b border-slate-50">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-slate-500">Product Worksheet</CardTitle>
              <div className="flex gap-2">
                <Select onValueChange={handleAddProduct}>
                  <SelectTrigger className="h-9 w-64 text-xs bg-white"><SelectValue placeholder="Add From Catalog..." /></SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {products?.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-sm font-medium">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="h-9 rounded-md gap-2 text-xs font-bold border-slate-200" onClick={handleAddManualItem}>
                  <PackagePlus className="h-3.5 w-3.5" /> Manual Line
                </Button>
              </div>
            </CardHeader>
            <div className="rounded-[1.5rem] overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-black py-4 pl-6">{t('itemDescription')}</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-center w-32">{t('qty')}</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-right w-32">{t('unitPrice')}</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-right pr-6 w-32">{t('total')}</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item) => (
                    <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors h-20">
                      <TableCell className="pl-6">
                        {item.isCustom ? (
                          <Input 
                            className="h-8 text-[11px] font-black uppercase border-none bg-slate-50" 
                            value={item.name} 
                            onChange={e => handleUpdateItem(item.id, 'name', e.target.value)} 
                            placeholder="Custom item name..."
                          />
                        ) : (
                          <span className="text-[11px] md:text-sm font-black text-slate-900 uppercase tracking-tighter truncate">{item.name}</span>
                        )}
                        {item.isSerialized && (
                          <div className="flex flex-wrap gap-1 mt-1.5">{item.serials.map((s, si) => <Badge key={si} variant="secondary" className="text-[7px] h-3.5 bg-blue-50 text-blue-700 border-none font-mono uppercase">{s}</Badge>)}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input type="number" className="h-9 text-center font-black text-sm rounded-xl w-16 bg-slate-50 border-none mx-auto" value={item.qty} disabled={item.isSerialized} onChange={e => handleUpdateItem(item.id, 'qty', e.target.value)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Input type="number" className="h-9 text-right font-black text-xs rounded-xl w-24 bg-slate-50 border-none ml-auto" value={item.price} onChange={e => handleUpdateItem(item.id, 'price', e.target.value)} />
                      </TableCell>
                      <TableCell className="text-right pr-6"><span className="font-black text-xs text-blue-600">৳{item.total.toLocaleString()}</span></TableCell>
                      <TableCell><Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 rounded-full" onClick={() => setLineItems(lineItems.filter(i => i.id !== item.id))}><X className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <div className="w-full lg:w-[400px] space-y-6">
          <Card className="p-8 rounded-[2.5rem] shadow-2xl space-y-6 text-center text-white bg-blue-600">
            <p className="text-[9px] uppercase font-black opacity-60 tracking-[0.2em]">{t('netFinalAmount')}</p>
            <h2 className="text-4xl font-headline font-black tracking-tighter">৳{totalAmount.toLocaleString()}</h2>
            <div className="pt-6 space-y-2 border-t border-white/10 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex justify-between opacity-70"><span>{t('subtotal')}</span><span>৳{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-red-200"><span>{t('discount')}</span><span>- ৳{discount.toLocaleString()}</span></div>
              <div className="flex justify-between opacity-70"><span>{t('vat')} ({vatPercent}%)</span><span>+ ৳{vatAmount.toLocaleString()}</span></div>
            </div>
          </Card>

          <Card className="p-6 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6">
             <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">{t('discount')}</Label><Input type="number" className="h-11 rounded-2xl bg-slate-50 border-none font-bold text-xs" value={discount} onChange={e => setDiscount(Number(e.target.value))} /></div>
              <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">{t('vat')} %</Label><Input type="number" className="h-11 rounded-2xl bg-slate-50 border-none font-bold text-xs" value={vatPercent} onChange={e => setVatPercent(Number(e.target.value))} /></div>
            </div>
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-[10px] font-black uppercase text-blue-600 tracking-widest">{t('paid')}</Label>
              <Input type="number" className="h-14 text-2xl font-black text-blue-600 rounded-2xl bg-blue-50/30 border-2 border-blue-50 text-center" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} />
            </div>
            <Button className="w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl text-white bg-blue-600 hover:bg-blue-700" disabled={isSubmitting} onClick={handleSaveUpdate}>
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
              Update Record
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
