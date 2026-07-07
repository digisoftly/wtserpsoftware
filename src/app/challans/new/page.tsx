"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  Plus, 
  ArrowLeft, 
  Save, 
  Loader2, 
  Truck, 
  PackagePlus, 
  Box, 
  X, 
  Calculator, 
  ArrowRight,
  FileText,
  User,
  MapPin,
  Phone,
  Barcode
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
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

interface ChallanItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  isCustom?: boolean;
}

export default function NewChallanPage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [isManualCustomer, setIsManualCustomer] = React.useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState("");
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [manualCustomerName, setManualCustomerName] = React.useState("");
  const [manualCustomerPhone, setManualCustomerPhone] = React.useState("");
  const [manualCustomerAddress, setManualCustomerAddress] = React.useState("");
  
  const [dispatchDate, setDispatchDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [lineItems, setLineItems] = React.useState<ChallanItem[]>([]);
  const [deliveryMethod, setDeliveryMethod] = React.useState("Company Vehicle");
  const [vehicleNumber, setVehicleNumber] = React.useState("");
  const [driverName, setDriverName] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [status, setStatus] = React.useState("pending");

  // Queries
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "sales_invoices");
  }, [db, companyId, branchId]);
  const { data: invoices } = useCollection(invoicesQuery);

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
  const totalAmount = React.useMemo(() => lineItems.reduce((sum, item) => sum + item.total, 0), [lineItems]);

  const addCatalogItem = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    setLineItems(prev => {
      const existing = prev.find(i => i.productId === productId);
      if (existing && !existing.isCustom) {
        return prev.map(i => 
          i.productId === productId 
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice } 
            : i
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        sku: product.sku || "N/A",
        quantity: 1,
        unit: product.unit || "Pcs",
        unitPrice: product.unitPrice || 0,
        total: product.unitPrice || 0,
        isCustom: false
      }];
    });
  };

  const addCustomItem = () => {
    setLineItems(prev => [...prev, {
      productId: `manual-${Date.now()}`,
      name: "",
      sku: "CUSTOM",
      quantity: 1,
      unit: "Pcs",
      unitPrice: 0,
      total: 0,
      isCustom: true
    }]);
  };

  const updateItem = (index: number, field: keyof ChallanItem, value: any) => {
    setLineItems(prev => {
      const updated = [...prev];
      const current = { ...updated[index], [field]: value };
      
      if (field === 'quantity') {
        current.quantity = Math.max(1, Number(value) || 0);
      }
      if (field === 'unitPrice') {
        current.unitPrice = Math.max(0, Number(value) || 0);
      }
      
      if (field === 'quantity' || field === 'unitPrice') {
        current.total = current.quantity * current.unitPrice;
      }
      
      updated[index] = current;
      return updated;
    });
  };

  const handleSaveChallan = async () => {
    if (!db || !companyId || !branchId) return;
    if (!isManualCustomer && !selectedCustomerId) {
      toast({ variant: "destructive", title: t('error'), description: "Please select a customer or provide manual details." });
      return;
    }
    if (isManualCustomer && !manualCustomerName.trim()) {
      toast({ variant: "destructive", title: t('error'), description: "Please enter customer name." });
      return;
    }
    if (lineItems.length === 0) {
      toast({ variant: "destructive", title: t('error'), description: t('noItemsSelected') });
      return;
    }

    setIsSubmitting(true);
    try {
      await runTransaction(db!, async (transaction) => {
        const challanRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "delivery_challans"));
        
        let customerName = manualCustomerName;
        let customerPhone = manualCustomerPhone;
        let customerAddress = manualCustomerAddress;
        let finalCustomerId = selectedCustomerId;

        if (!isManualCustomer) {
          const customer = customers?.find(c => c.id === selectedCustomerId);
          customerName = customer ? `${customer.firstName} ${customer.lastName}` : "Client";
          customerPhone = customer?.phoneNumber || "";
          customerAddress = customer?.companyName || "---";
        } else {
          finalCustomerId = "manual";
        }

        const invoice = invoices?.find(i => i.id === selectedInvoiceId);

        const challanData = {
          id: challanRef.id,
          companyId,
          branchId,
          challanNumber: `CHL-${Date.now().toString().slice(-6)}`,
          invoiceId: selectedInvoiceId || "manual",
          invoiceNumber: invoice?.invoiceNumber || "MANUAL",
          customerId: finalCustomerId,
          customerName,
          customerPhone,
          customerAddress,
          dispatchDate,
          deliveryDate: "",
          deliveryMethod,
          vehicleNumber,
          driverName,
          notes,
          items: lineItems,
          totalAmount,
          status: status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        transaction.set(challanRef, challanData);

        for (const item of lineItems) {
          if (!item.isCustom) {
            const productRef = doc(db!, "companies", companyId!, "branches", branchId!, "products", item.productId);
            transaction.update(productRef, { 
              currentStock: increment(-item.quantity),
              updatedAt: serverTimestamp()
            });
          }
        }
      });

      toast({ title: t('success') });
      router.push("/challans");
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen pb-20">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-amber-600">{t('addChallan')}</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Logistics Terminal Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button className="bg-amber-600 hover:bg-amber-700 rounded-full px-8 h-10 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-100 gap-2" disabled={isSubmitting} onClick={handleSaveChallan}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            {t('save')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6">
        <div className="flex-1 space-y-6">
          <Card className="p-6 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 space-y-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                  <FileText className="h-3 w-3" /> {t('fromInvoice')} (Optional)
                </Label>
                <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 transition-all focus:ring-2 focus:ring-amber-600 font-bold text-xs">
                    <SelectValue placeholder="Link existing sales record..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-2xl max-h-[250px]">
                    <SelectItem value="none" className="text-xs font-bold text-slate-400 italic">None (Standalone Dispatch)</SelectItem>
                    {invoices?.map(i => <SelectItem key={i.id} value={i.id} className="text-xs font-bold">{i.invoiceNumber} - {i.customerName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                  <Calculator className="h-3 w-3" /> {t('dispatchDate')}
                </Label>
                <Input type="date" className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 text-xs font-black" value={dispatchDate} onChange={e => setDispatchDate(e.target.value)} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-50">
              <h3 className="text-[10px] font-black uppercase text-slate-900 flex items-center gap-2 tracking-widest">
                <User className="h-4 w-4 text-amber-600" /> Customer Identification
              </h3>
              <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full scale-90">
                <Label className="text-[9px] font-black uppercase text-muted-foreground cursor-pointer" htmlFor="manual-entry">Manual Entry</Label>
                <Switch id="manual-entry" checked={isManualCustomer} onCheckedChange={setIsManualCustomer} className="data-[state=checked]:bg-amber-600" />
              </div>
            </div>

            {isManualCustomer ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-1">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Full Name</Label>
                  <Input className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 text-xs font-bold" value={manualCustomerName} onChange={e => setManualCustomerName(e.target.value)} placeholder="e.g. John Doe" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Phone Number</Label>
                  <Input className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 text-xs font-bold" value={manualCustomerPhone} onChange={e => setManualCustomerPhone(e.target.value)} placeholder="+880..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Delivery Address</Label>
                  <Input className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 text-xs font-bold" value={manualCustomerAddress} onChange={e => setManualCustomerAddress(e.target.value)} placeholder="Area, City..." />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t('customer')}</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 shadow-sm font-bold text-xs">
                    <SelectValue placeholder="Search from database..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[250px] rounded-xl">
                    {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold">{c.firstName} {c.lastName} - {c.companyName || 'Personal'}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </Card>

          <Card className="p-6 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
              <div className="flex-1 space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Select Product to Add</Label>
                <Select onValueChange={addCatalogItem}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 shadow-sm transition-all focus:ring-2 focus:ring-amber-500 font-bold text-xs">
                    <SelectValue placeholder={t('addProduct')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] rounded-xl">
                    {products?.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-xs font-bold">
                        {p.name} <span className="text-[9px] opacity-60 ml-2 font-mono">(STOCK: {p.currentStock})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="h-12 rounded-xl gap-2 border-amber-200 text-amber-700 font-black text-[10px] uppercase bg-amber-50/50" onClick={addCustomItem}>
                <PackagePlus className="h-4 w-4" /> {t('addCustomItem')}
              </Button>
            </div>

            <div className="rounded-[1.5rem] overflow-hidden ring-1 ring-slate-100 border border-slate-50">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-black py-4 pl-6">Item Description</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-center w-32">Qty</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-right w-32">Price</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-right pr-6 w-32">Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-64 text-center opacity-20"><Box className="h-12 w-12 mx-auto mb-4" /><p className="text-xs uppercase font-black tracking-widest">{t('noItemsSelected')}</p></TableCell></TableRow>
                  ) : (
                    lineItems.map((item, idx) => (
                      <TableRow key={idx} className="group hover:bg-slate-50/50 transition-colors h-20">
                        <TableCell className="pl-6">
                          {item.isCustom ? (
                            <Input className="h-9 text-[11px] font-black uppercase border-none ring-1 ring-slate-100 bg-slate-50/30 w-full" value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} placeholder="Type product name..." />
                          ) : (
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">{item.name}</span>
                              <p className="text-[9px] font-mono text-muted-foreground">{item.sku}</p>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 justify-center">
                            <Input type="number" className="h-9 text-center font-black text-sm rounded-xl w-16 bg-slate-50 border-none" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.unit || 'Pcs'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Input type="number" className="h-9 text-right font-black text-xs rounded-xl w-24 bg-slate-50 border-none ml-auto" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} disabled={!item.isCustom} />
                        </TableCell>
                        <TableCell className="text-right pr-6"><span className="font-black text-xs text-amber-600">৳{item.total.toLocaleString()}</span></TableCell>
                        <TableCell><Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:bg-red-50 rounded-full" onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}><X className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <div className="w-full lg:w-[400px] space-y-6">
          <Card className="p-8 rounded-[2.5rem] shadow-2xl space-y-4 text-center text-white bg-amber-600">
            <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em]">Grand Total</p>
            <h2 className="text-4xl font-headline font-black tracking-tighter">৳{totalAmount.toLocaleString()}</h2>
          </Card>

          <Card className="p-6 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{t('deliveryMethod')}</Label>
              <Input className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 text-xs font-bold" value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{t('vehicleNumber')}</Label>
              <Input className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 text-xs font-bold" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{t('driverName')}</Label>
              <Input className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 text-xs font-bold" value={driverName} onChange={e => setDriverName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[9px] font-black uppercase text-slate-500 tracking-widest">{t('status')}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 text-xs font-bold"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Notes</Label>
              <textarea className="w-full min-h-[100px] rounded-2xl bg-slate-50 border-none p-4 text-[10px] font-bold text-slate-600 resize-none outline-none" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <Button className="w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 text-white bg-amber-600 hover:bg-amber-700" disabled={isSubmitting || lineItems.length === 0} onClick={handleSaveChallan}>
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
              Synchronize Challan
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
