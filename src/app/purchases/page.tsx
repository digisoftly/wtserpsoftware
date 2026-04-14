"use client"

import * as React from "react"
import { Plus, Package, Search, Loader2, MoreVertical, ShoppingBag, Truck, DollarSign, Trash2, Calculator, Scan, Edit, Eye, Download } from "lucide-react"
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
import { collection, serverTimestamp, query, orderBy, doc, increment, runTransaction, updateDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { KPICard } from "@/components/dashboard/kpi-card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
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
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
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
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitCost } : item
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

  const handleSubmitPO = async () => {
    if (!selectedSupplierId || lineItems.length === 0) return;
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
              transaction.set(serialRef, { id: serialRef.id, companyId, branchId, productId: item.productId, serialNumber: s, status: "available", purchaseOrderId: poRef.id, createdAt: serverTimestamp() });
            }
          }
        }
      });
      toast({ title: "Purchase Recorded", description: "Warehouse levels updated." });
      setIsAddModalOpen(false);
      resetForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePO = async () => {
    if (!selectedRecord) return;
    setIsSubmitting(true);
    try {
      const docRef = doc(db, "companies", companyId!, "branches", branchId!, "purchase_orders", selectedRecord.id);
      await updateDoc(docRef, { supplierId: selectedSupplierId, totalAmount: totalSpend, items: lineItems, updatedAt: serverTimestamp() });
      toast({ title: "Purchase Record Adjusted" });
      setIsEditModalOpen(false);
      resetForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDeletePO = () => {
    if (!selectedRecord || !db) return;
    const docRef = doc(db, "companies", companyId!, "branches", branchId!, "purchase_orders", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Purchase Record Deleted" });
    setIsDeleteAlertOpen(false);
  };

  const resetForm = () => {
    setSelectedSupplierId("");
    setLineItems([]);
    setSelectedRecord(null);
  };

  const openEdit = (po: any) => {
    setSelectedRecord(po);
    setSelectedSupplierId(po.supplierId);
    setLineItems(po.items || []);
    setIsEditModalOpen(true);
  };

  const handlePrint = (po: any) => {
    toast({ title: "Preparing Document", description: `PO ${po.orderNumber} is ready for export.` });
    setTimeout(() => window.print(), 500);
  };

  const filteredPOs = purchaseOrders?.filter(po => 
    po.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-orange-600">Inventory Sourcing</h1>
          <p className="text-sm text-muted-foreground mt-1">Intake new stock and register serial numbers</p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 gap-2 rounded-full px-8 shadow-lg" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
          <Plus className="h-4 w-4" /> Receive Inbound
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Procurement" value={`৳${purchaseOrders?.reduce((s, i) => s + (i.totalAmount || 0), 0).toLocaleString()}`} icon={ShoppingBag} colorClass="bg-orange-500" />
        <KPICard title="Vendors" value={suppliers?.length || 0} icon={Truck} colorClass="bg-blue-500" />
        <KPICard title="Inbound Events" value={purchaseOrders?.length || 0} icon={Package} colorClass="bg-green-500" />
        <KPICard title="Active Orders" value={purchaseOrders?.length || 0} icon={Calculator} colorClass="bg-purple-500" />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search PO #..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
                  <TableHead>Items Count</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs?.map((po) => (
                  <TableRow key={po.id} className="hover:bg-muted/20">
                    <TableCell className="font-bold text-orange-700 uppercase">{po.orderNumber}</TableCell>
                    <TableCell className="text-sm">{suppliers?.find(s => s.id === po.supplierId)?.name || "Vendor"}</TableCell>
                    <TableCell className="text-xs">{po.items?.length || 0} SKU(s)</TableCell>
                    <TableCell className="font-bold text-xs">৳{po.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePrint(po)}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(po)}><Edit className="mr-2 h-4 w-4" /> Edit Record</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrint(po)}><Download className="mr-2 h-4 w-4" /> Download PDF</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedRecord(po); setIsDeleteAlertOpen(true); }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete PO
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* NEW/EDIT PO MODAL */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-orange-600" /> {isEditModalOpen ? `Adjust PO ${selectedRecord?.orderNumber}` : "Inbound Stock Record"}</DialogTitle></DialogHeader>
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
                {!isEditModalOpen && (
                  <div className="flex items-center justify-between"><Label className="font-bold">Add Line Item</Label>
                    <Select onValueChange={handleAddLineItem}>
                      <SelectTrigger className="w-[250px] bg-orange-50 border-orange-200"><SelectValue placeholder="Search Product..." /></SelectTrigger>
                      <SelectContent>{products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-4">
                  {lineItems.map((item, idx) => (
                    <Card key={idx} className="p-4 border-dashed bg-muted/10">
                      <div className="flex items-start justify-between mb-3">
                        <div className="font-bold text-sm">{item.name}</div>
                        {!isEditModalOpen && <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div className="space-y-1"><Label className="text-[10px] uppercase">Unit Cost</Label><Input type="number" value={item.unitCost} className="h-8 text-xs font-bold" onChange={e => setLineItems(lineItems.map((li, i) => i === idx ? { ...li, unitCost: Number(e.target.value), total: Number(e.target.value) * li.quantity } : li))} /></div>
                        <div className="space-y-1"><Label className="text-[10px] uppercase">Quantity</Label><Input type="number" disabled={isEditModalOpen} value={item.quantity} className="h-8 text-xs font-bold" onChange={e => setLineItems(lineItems.map((li, i) => i === idx ? { ...li, quantity: Number(e.target.value), total: item.unitCost * Number(e.target.value) } : li))} /></div>
                        <div className="hidden sm:block space-y-1"><Label className="text-[10px] uppercase">Total</Label><div className="h-8 flex items-center font-bold text-xs">৳{item.total.toLocaleString()}</div></div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-4 bg-orange-50/50 p-6 rounded-2xl border-2 border-orange-100 flex flex-col justify-between h-fit sticky top-0">
              <div className="space-y-6">
                <div className="space-y-1"><p className="text-xs uppercase font-bold text-orange-800 tracking-wider">Total PO Value</p><p className="text-4xl font-headline font-bold text-orange-700">৳{totalSpend.toLocaleString()}</p></div>
              </div>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 h-14 rounded-xl mt-8 font-bold text-lg gap-2 shadow-lg" onClick={isEditModalOpen ? handleUpdatePO : handleSubmitPO} disabled={isSubmitting || lineItems.length === 0}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : isEditModalOpen ? <Calculator /> : <Truck />} {isEditModalOpen ? "Save Adjustments" : "Confirm Receipt"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE ALERT */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Purchase Record?</AlertDialogTitle><AlertDialogDescription>This removes the record for {selectedRecord?.orderNumber}. Note: Existing stock will NOT be automatically reversed.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeletePO}>Confirm Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
