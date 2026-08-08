"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  Truck,
  X,
  PlusCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, runTransaction, serverTimestamp, increment } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface ChallanItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  qty: number;
  unit: string;
  price: number;
  total: number;
  isCustom?: boolean;
}

export default function NewChallanPage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState("none");
  const [dispatchDate, setDispatchDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [deliveryMethod, setDeliveryMethod] = React.useState("Company Vehicle");
  const [vehicleNumber, setVehicleNumber] = React.useState("");
  const [driverName, setDriverName] = React.useState("");
  const [lineItems, setLineItems] = React.useState<ChallanItem[]>([]);
  const [notes, setNotes] = React.useState("");

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

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "sales_invoices");
  }, [db, companyId, branchId]);
  const { data: invoices } = useCollection(invoicesQuery);

  const handleAddProduct = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    const newItem: ChallanItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      name: product.name,
      description: product.description || "",
      qty: 1,
      unit: product.unit || "Pcs",
      price: product.unitPrice || 0,
      total: product.unitPrice || 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const addManualRow = () => {
    const newItem: ChallanItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: "custom",
      name: "",
      description: "",
      qty: 1,
      unit: "Pcs",
      price: 0,
      total: 0,
      isCustom: true
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateItem = (id: string, field: keyof ChallanItem, val: any) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: val };
      if (field === 'qty' || field === 'price') {
        updated.total = (Number(updated.qty) || 0) * (Number(updated.price) || 0);
      }
      return updated;
    }));
  };

  const handleSave = async () => {
    if (!selectedCustomerId || lineItems.length === 0 || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await runTransaction(db!, async (transaction) => {
        const challanRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "delivery_challans"));
        const customer = customers?.find(c => c.id === selectedCustomerId);

        const challanData = {
          id: challanRef.id,
          challanNumber: `CHL-${Date.now().toString().slice(-6)}`,
          customerId: selectedCustomerId,
          customerName: customer ? `${customer.firstName} ${customer.lastName}` : "Client",
          invoiceId: selectedInvoiceId,
          dispatchDate,
          deliveryMethod,
          vehicleNumber,
          driverName,
          items: lineItems,
          totalAmount: lineItems.reduce((s, i) => s + i.total, 0),
          status: "pending",
          notes,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        transaction.set(challanRef, challanData);

        for (const item of lineItems) {
          if (!item.isCustom) {
            const productRef = doc(db!, "companies", companyId!, "branches", branchId!, "products", item.productId);
            transaction.update(productRef, { currentStock: increment(-item.qty) });
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
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b pb-4 bg-white sticky top-0 z-50 px-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{t('addChallan')}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">WTS/CHL-NEW</p>
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

      {/* INFO GRID */}
      <Card className="border-none shadow-sm ring-1 ring-slate-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('customer')}</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Client" /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-medium">{c.firstName} {c.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('fromInvoice')}</Label>
              <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Standalone Dispatch</SelectItem>
                  {invoices?.map(i => <SelectItem key={i.id} value={i.id} className="text-xs">{i.invoiceNumber}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('dispatchDate')}</Label>
              <Input type="date" value={dispatchDate} onChange={e => setDispatchDate(e.target.value)} className="h-9 text-xs font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('deliveryMethod')}</Label>
              <Input value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)} className="h-9 text-xs font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('vehicleNumber')}</Label>
              <Input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} className="h-9 text-xs font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('driverName')}</Label>
              <Input value={driverName} onChange={e => setDriverName(e.target.value)} className="h-9 text-xs font-bold" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ITEMS TABLE */}
      <Card className="border-none shadow-sm ring-1 ring-slate-200 overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('itemDescription')}</h3>
          <div className="flex gap-2">
            <Select onValueChange={handleAddProduct}>
              <SelectTrigger className="h-8 w-64 text-[10px] bg-white border-slate-200 font-bold uppercase"><SelectValue placeholder="Add From Catalog" /></SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {products?.map(p => <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>)}
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
                <TableHead className="w-32 text-[10px] font-black uppercase tracking-tighter text-right pr-10">Total Weight/Vol</TableHead>
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
                    <textarea className="w-full text-[10px] font-medium bg-transparent border-none resize-none h-8 focus:ring-0 outline-none" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} placeholder="Dispatch instructions..." />
                  </TableCell>
                  <TableCell className="text-center text-[10px] font-bold uppercase text-slate-500">{item.unit}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 justify-center">
                      <Input type="number" className="h-8 w-16 text-center text-xs font-bold bg-slate-50 border-none" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} />
                      <span className="text-[9px] font-black uppercase text-slate-400">{item.unit}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                     <span className="text-xs font-bold text-slate-600">{item.qty} {item.unit}</span>
                  </TableCell>
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
            <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('details')}</Label>
            <Textarea className="h-24 text-xs font-medium bg-white rounded-xl border-slate-200" placeholder="Dispatch specific notes..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col items-end">
          <Card className="w-full max-w-md border-none shadow-sm ring-1 ring-slate-200 bg-white">
            <CardContent className="p-8">
              <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-400 mb-6">
                 <span>Total Dispatch Load</span>
                 <span className="text-slate-900">{lineItems.reduce((s, i) => s + i.qty, 0)} Items</span>
              </div>
              <Button className="w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100" disabled={isSubmitting || lineItems.length === 0} onClick={handleSave}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Generate Delivery Challan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
