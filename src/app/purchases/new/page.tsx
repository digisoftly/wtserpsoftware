"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  Plus, 
  ArrowLeft, 
  Save, 
  Loader2, 
  Truck, 
  Package, 
  X, 
  Calculator, 
  ArrowRight,
  ShoppingCart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, runTransaction, serverTimestamp, increment } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"

interface POItem {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
  unitCost: number;
  total: number;
}

export default function NewPurchasePage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = React.useState("");
  const [lineItems, setLineItems] = React.useState<POItem[]>([]);

  // Queries
  const suppliersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "suppliers");
  }, [db, companyId, branchId]);
  const { data: suppliers } = useCollection(suppliersQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "products");
  }, [db, companyId, branchId]);
  const { data: products } = useCollection(productsQuery);

  const totalSpend = React.useMemo(() => lineItems.reduce((sum, item) => sum + item.total, 0), [lineItems]);

  const handleAddLineItem = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;
    
    setLineItems(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        return prev.map(item => 
          item.productId === productId 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitCost } : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unit: product.unit || "Pcs",
        unitCost: product.costPrice || 0,
        total: product.costPrice || 0
      }];
    });
  };

  const handleUpdateLine = (idx: number, field: keyof POItem, val: any) => {
    setLineItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: val };
      if (field === 'quantity' || field === 'unitCost') {
        const numVal = Number(val) || 0;
        (updated as any)[field] = numVal;
        updated.total = updated.quantity * updated.unitCost;
      }
      return updated;
    }));
  };

  const handleSubmitPO = async () => {
    if (!db || !companyId || !branchId || !selectedSupplierId || lineItems.length === 0) return;
    setIsSubmitting(true);
    try {
      await runTransaction(db!, async (transaction) => {
        const poRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "purchase_orders"));
        const orderNumber = `PO-${Date.now().toString().slice(-6)}`;
        
        transaction.set(poRef, {
          id: poRef.id,
          companyId,
          branchId,
          orderNumber,
          supplierId: selectedSupplierId,
          supplierName: suppliers?.find(s => s.id === selectedSupplierId)?.name || "Vendor",
          items: lineItems,
          totalAmount: totalSpend,
          status: "received",
          orderDate: new Date().toISOString(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        for (const item of lineItems) {
          const productRef = doc(db!, "companies", companyId!, "branches", branchId!, "products", item.productId);
          transaction.update(productRef, { 
            currentStock: increment(item.quantity),
            costPrice: item.unitCost,
            updatedAt: serverTimestamp() 
          });
        }
      });

      toast({ title: t('success') });
      router.push("/purchases");
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
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-orange-600">{t('receiveStock')}</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Procurement Terminal Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700 rounded-full px-8 h-10 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-100 gap-2" disabled={isSubmitting} onClick={handleSubmitPO}>
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
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t('supplier')}</Label>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 shadow-sm transition-all focus:ring-2 focus:ring-orange-500 font-bold text-xs">
                    <SelectValue placeholder={t('search')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-2xl">
                    {suppliers?.map(s => <SelectItem key={s.id} value={s.id} className="text-xs font-bold">{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Select Product to Add</Label>
                <Select onValueChange={handleAddLineItem}>
                  <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 shadow-sm transition-all focus:ring-2 focus:ring-orange-500 font-bold text-xs">
                    <SelectValue placeholder={t('addProduct')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] rounded-xl">
                    {products?.map(p => <SelectItem key={p.id} value={p.id} className="text-xs font-bold">{p.name} (Stock: {p.currentStock})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-[1.5rem] overflow-hidden ring-1 ring-slate-100 border border-slate-50">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-black py-4 pl-6">Item Description</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-center w-32">Qty</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-right w-32">Unit Cost</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-right pr-6 w-32">Total</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-64 text-center opacity-20"><Package className="h-12 w-12 mx-auto mb-4" /><p className="text-xs uppercase font-black tracking-widest">{t('noItemsSelected')}</p></TableCell></TableRow>
                  ) : (
                    lineItems.map((item, idx) => (
                      <TableRow key={idx} className="group hover:bg-slate-50/50 transition-colors h-20">
                        <TableCell className="pl-6">
                          <span className="text-[11px] md:text-sm font-black text-slate-900 uppercase tracking-tighter truncate">{item.name}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 justify-center">
                            <Input type="number" className="h-9 text-center font-black text-sm rounded-xl w-16 bg-slate-50 border-none" value={item.quantity} onChange={e => handleUpdateLine(idx, 'quantity', e.target.value)} />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.unit || 'Pcs'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Input type="number" className="h-9 text-right font-black text-xs rounded-xl w-24 bg-slate-50 border-none ml-auto" value={item.unitCost} onChange={e => handleUpdateLine(idx, 'unitCost', e.target.value)} />
                        </TableCell>
                        <TableCell className="text-right pr-6"><span className="font-black text-xs text-orange-600">৳{item.total.toLocaleString()}</span></TableCell>
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
          <Card className="p-8 rounded-[2.5rem] shadow-2xl space-y-4 text-center text-white bg-orange-600">
            <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em]">Net Purchase Value</p>
            <h2 className="text-4xl font-headline font-black tracking-tighter">৳{totalSpend.toLocaleString()}</h2>
          </Card>

          <Card className="p-6 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6">
            <div className="p-5 bg-slate-50 rounded-3xl space-y-3">
              <div className="flex items-center gap-3">
                <Calculator className="h-4 w-4 text-orange-600" />
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Order Summary</p>
              </div>
              <div className="space-y-1.5 border-t border-slate-200 pt-3">
                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                  <span>Total Items</span>
                  <span>{lineItems.length}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-500">
                  <span>Total Qty</span>
                  <span>{lineItems.reduce((s, i) => s + i.quantity, 0)}</span>
                </div>
              </div>
            </div>

            <Button className="w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 text-white bg-orange-600 hover:bg-orange-700" disabled={isSubmitting || lineItems.length === 0 || !selectedSupplierId} onClick={handleSubmitPO}>
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
              {t('initializeIntake')}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
