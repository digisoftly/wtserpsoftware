
"use client"

import * as React from "react"
import { Plus, Package, Search, Loader2, MoreVertical, Filter, ShoppingBag, Truck, Clock, DollarSign, Trash2, ChevronRight, Calculator } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy, doc, increment, runTransaction } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { cn } from "@/lib/utils"
import { KPICard } from "@/components/dashboard/kpi-card"
import { toast } from "@/hooks/use-toast"

interface POItem {
  productId: string;
  name: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export default function PurchasesPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
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
        total: product.costPrice || 0
      }]);
    }
  };

  const handleSubmitPO = async () => {
    if (!selectedSupplierId || lineItems.length === 0) {
      toast({ variant: "destructive", title: "Incomplete Form", description: "Select a supplier and products." });
      return;
    }

    setIsSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Create PO
        const poRef = doc(collection(db, "companies", companyId!, "branches", branchId!, "purchase_orders"));
        transaction.set(poRef, {
          id: poRef.id,
          companyId,
          branchId,
          orderNumber: `PO-${Date.now().toString().slice(-6)}`,
          supplierId: selectedSupplierId,
          items: lineItems,
          totalAmount: totalSpend,
          status: "received", // ERP assumes instant receipt for this logic
          orderDate: new Date().toISOString(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // 2. Increase Stock
        for (const item of lineItems) {
          const productRef = doc(db, "companies", companyId!, "branches", branchId!, "products", item.productId);
          transaction.update(productRef, {
            currentStock: increment(item.quantity)
          });
        }
      });

      toast({ title: "Purchase Recorded", description: "Stock levels increased and order saved." });
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
          <p className="text-sm text-muted-foreground mt-1">Increase stock levels through verified supplier orders</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 gap-2 rounded-full px-8 shadow-lg" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Receive Stock
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Procurement" value={`$${purchaseOrders?.reduce((s, i) => s + (i.totalAmount || 0), 0).toLocaleString()}`} icon={ShoppingBag} colorClass="bg-orange-500" />
        <KPICard title="Suppliers" value={suppliers?.length || 0} icon={Truck} colorClass="bg-blue-500" />
        <KPICard title="Recent Receipts" value={purchaseOrders?.filter(po => po.status === 'received').length || 0} icon={Package} colorClass="bg-green-500" />
        <KPICard title="Monthly Spend" value={`$${totalSpend.toLocaleString()}`} icon={DollarSign} colorClass="bg-purple-500" />
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search PO #..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
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
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders?.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-bold text-orange-700">{po.orderNumber}</TableCell>
                    <TableCell>{suppliers?.find(s => s.id === po.supplierId)?.name || "Unknown"}</TableCell>
                    <TableCell className="font-bold">${po.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell><Badge className="bg-green-50 text-green-700 border-green-200">Received</Badge></TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-orange-600" />
              Inventory Inbound Record
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-2">
                <Label>Supplier Selection</Label>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>
                    {suppliers?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">Items Received</Label>
                  <Select onValueChange={handleAddLineItem}>
                    <SelectTrigger className="w-[200px] bg-orange-50 border-orange-200">
                      <SelectValue placeholder="Select product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-xl">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Product</TableHead>
                        <TableHead className="text-xs w-[80px]">Qty</TableHead>
                        <TableHead className="text-xs">Unit Cost</TableHead>
                        <TableHead className="text-xs text-right">Total</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs">{item.name}</TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              value={item.quantity} 
                              className="h-8" 
                              onChange={e => setLineItems(lineItems.map((li, i) => i === idx ? { ...li, quantity: Number(e.target.value), total: Number(e.target.value) * li.unitCost } : li))}
                            />
                          </TableCell>
                          <TableCell className="text-xs">${item.unitCost}</TableCell>
                          <TableCell className="text-right font-bold">${item.total.toLocaleString()}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="bg-orange-50/50 p-6 rounded-2xl border-2 border-orange-100 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-orange-800 uppercase text-xs mb-4">Total Purchase Value</h3>
                <div className="text-3xl font-bold text-orange-700">${totalSpend.toLocaleString()}</div>
              </div>
              <Button 
                className="w-full bg-orange-600 hover:bg-orange-700 h-12 font-bold gap-2"
                onClick={handleSubmitPO}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Truck className="h-5 w-5" />}
                Confirm Receipt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
