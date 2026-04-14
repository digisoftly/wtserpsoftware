
"use client"

import * as React from "react"
import { Plus, Package, Search, Loader2, MoreVertical, ShoppingBag, Truck, DollarSign, Trash2, Calculator, Scan } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy, doc, increment, runTransaction } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { KPICard } from "@/components/dashboard/kpi-card"
import { toast } from "@/hooks/use-toast"

interface POItem {
  productId: string;
  name: string;
  quantity: number;
  unitCost: number;
  total: number;
  serials?: string[];
  requiresSerials: boolean;
}

export default function PurchasesPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [selectedSupplierId, setSelectedSupplierId] = React.useState("");
  const [lineItems, setLineItems] = React.useState<POItem[]>([]);

  const poQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "purchase_orders"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: purchaseOrders, isLoading } = useCollection(poQuery);

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

  const totalSpend = lineItems.reduce((sum, item) => sum + item.total, 0);

  const handleAddLineItem = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    const existing = lineItems.find(item => item.productId === productId);
    if (existing) {
      setLineItems(lineItems.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitCost }
          : item
      ));
    } else {
      setLineItems([...lineItems, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitCost: product.costPrice || 0,
        total: product.costPrice || 0,
        requiresSerials: product.serialNumberTrackingRequired || false,
        serials: []
      }]);
    }
  };

  const handleUpdateSerials = (idx: number, text: string) => {
    const serials = text.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
    setLineItems(lineItems.map((item, i) => i === idx ? { ...item, serials, quantity: serials.length, total: serials.length * item.unitCost } : item));
  };

  const handleSubmitPO = async () => {
    if (!selectedSupplierId || lineItems.length === 0) {
      toast({ variant: "destructive", title: "Incomplete", description: "Select supplier and items." });
      return;
    }

    const missingSerials = lineItems.find(item => item.requiresSerials && (item.serials?.length || 0) !== item.quantity);
    if (missingSerials) {
      toast({ variant: "destructive", title: "Missing Serials", description: `Please provide ${missingSerials.quantity} serials for ${missingSerials.name}.` });
      return;
    }

    setIsSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const poRef = doc(collection(db, "companies", companyId!, "branches", branchId!, "purchase_orders"));
        transaction.set(poRef, {
          id: poRef.id,
          companyId,
          branchId,
          orderNumber: `PO-${Date.now().toString().slice(-6)}`,
          supplierId: selectedSupplierId,
          items: lineItems,
          totalAmount: totalSpend,
          status: "received", 
          orderDate: new Date().toISOString(),
          createdAt: serverTimestamp(),
        });

        for (const item of lineItems) {
          const productRef = doc(db, "companies", companyId!, "branches", branchId!, "products", item.productId);
          transaction.update(productRef, { currentStock: increment(item.quantity) });

          if (item.requiresSerials && item.serials) {
            for (const s of item.serials) {
              const serialRef = doc(collection(db, "companies", companyId!, "branches", branchId!, "serial_numbers"));
              transaction.set(serialRef, {
                id: serialRef.id,
                companyId,
                branchId,
                productId: item.productId,
                serialNumber: s,
                status: "available",
                purchaseOrderId: poRef.id,
                createdAt: serverTimestamp(),
              });
            }
          }
        }
      });

      toast({ title: "Purchase Success", description: "Stock updated and serials registered." });
      setIsAddModalOpen(false);
      setLineItems([]);
      setSelectedSupplierId("");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-orange-600">Inventory Sourcing</h1>
          <p className="text-sm text-muted-foreground mt-1">Intake new stock and register serial numbers</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 gap-2 rounded-full px-8 shadow-lg" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" /> Receive Inbound
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Procurement" value={`৳${purchaseOrders?.reduce((s, i) => s + (i.totalAmount || 0), 0).toLocaleString()}`} icon={ShoppingBag} colorClass="bg-orange-500" />
        <KPICard title="Vendors" value={suppliers?.length || 0} icon={Truck} colorClass="bg-blue-500" />
        <KPICard title="Serials Intake" value={purchaseOrders?.reduce((sum, po) => sum + (po.items?.reduce((s: number, i: any) => s + (i.serials?.length || 0), 0) || 0), 0) || 0} icon={Scan} colorClass="bg-purple-500" />
        <KPICard title="Inbound Events" value={purchaseOrders?.length || 0} icon={Package} colorClass="bg-green-500" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-orange-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items Count</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders?.map((po) => (
                  <TableRow key={po.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-bold text-orange-700 uppercase">{po.orderNumber}</TableCell>
                    <TableCell className="text-sm font-medium">{suppliers?.find(s => s.id === po.supplierId)?.name || "Unknown Vendor"}</TableCell>
                    <TableCell className="text-xs">{po.items?.length || 0} SKU(s)</TableCell>
                    <TableCell className="font-bold">৳{po.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-orange-600" /> Inbound Stock Record</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 py-4">
            <div className="lg:col-span-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-muted-foreground">Supplier</Label>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Identify Vendor..." /></SelectTrigger>
                  <SelectContent>{suppliers?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between"><Label className="font-bold">Line Items</Label>
                  <Select onValueChange={handleAddLineItem}>
                    <SelectTrigger className="w-[250px] bg-orange-50 border-orange-200"><SelectValue placeholder="Search Product to Add..." /></SelectTrigger>
                    <SelectContent>{products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {lineItems.map((item, idx) => (
                    <Card key={idx} className="p-4 border-dashed bg-muted/10">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-sm">{item.name}</p>
                          {item.requiresSerials && <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-700 border-purple-200 uppercase mt-1">Serialized Tracking</Badge>}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase">Unit Cost</Label>
                          <Input type="number" value={item.unitCost} className="h-8 text-xs" onChange={e => setLineItems(lineItems.map((li, i) => i === idx ? { ...li, unitCost: Number(e.target.value), total: Number(e.target.value) * li.quantity } : li))} />
                        </div>
                        <div className="sm:col-span-2 space-y-1">
                          {item.requiresSerials ? (
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase text-purple-700">Paste / Scan Serials (One per line)</Label>
                              <Textarea placeholder="SERIAL-001&#10;SERIAL-002" className="text-[10px] min-h-[60px]" onChange={e => handleUpdateSerials(idx, e.target.value)} />
                              <p className="text-[9px] text-muted-foreground italic">Current count: {item.serials?.length || 0}</p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase">Quantity</Label>
                              <Input type="number" value={item.quantity} className="h-8 text-xs" onChange={e => setLineItems(lineItems.map((li, i) => i === idx ? { ...li, quantity: Number(e.target.value), total: item.unitCost * Number(e.target.value) } : li))} />
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-orange-50/50 p-6 rounded-2xl border-2 border-orange-100 flex flex-col justify-between h-fit sticky top-0">
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-xs uppercase font-bold text-orange-800 tracking-wider">Total Purchase Value</p>
                  <p className="text-4xl font-headline font-bold text-orange-700">৳{totalSpend.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-white/80 rounded-xl border border-orange-200 text-[10px] leading-relaxed text-orange-900 italic">
                  Completing this receipt will instantly update warehouse stock levels and register all provided serial numbers as "Available".
                </div>
              </div>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 h-14 rounded-xl mt-8 font-bold text-lg gap-3 shadow-xl shadow-orange-200" onClick={handleSubmitPO} disabled={isSubmitting || lineItems.length === 0}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Calculator className="h-6 w-6" />} Confirm Receipt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
