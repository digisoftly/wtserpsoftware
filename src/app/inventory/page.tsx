
"use client"

import * as React from "react"
import { 
  Search, 
  Plus, 
  Filter, 
  Zap, 
  RefreshCw,
  Loader2,
  Boxes,
  AlertTriangle,
  DollarSign,
  Scan,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle2
} from "lucide-react"
import { inventoryForecasting, type InventoryForecastingOutput } from "@/ai/flows/ai-inventory-forecasting-and-optimization"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, doc, setDoc, updateDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { KPICard } from "@/components/dashboard/kpi-card"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"

export default function InventoryPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isForecasting, setIsForecasting] = React.useState(false)
  const [forecast, setForecast] = React.useState<InventoryForecastingOutput | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [serialRequired, setSerialRequired] = React.useState(false);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "products");
  }, [db, companyId, branchId]);

  const { data: products, isLoading } = useCollection(productsQuery);

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) return;

    setIsSubmitting(true);
    try {
      const productRef = doc(collection(db, "companies", companyId, "branches", branchId, "products"));
      await setDoc(productRef, {
        id: productRef.id,
        companyId,
        branchId,
        name: formData.get("name") as string,
        sku: formData.get("sku") as string,
        unitPrice: Number(formData.get("unitPrice")),
        costPrice: Number(formData.get("costPrice")),
        currentStock: Number(formData.get("currentStock")),
        minStockLevel: Number(formData.get("minStockLevel")),
        serialNumberTrackingRequired: serialRequired,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Product Created" });
      setIsAddModalOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRecord || !db) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const docRef = doc(db, "companies", companyId!, "branches", branchId!, "products", selectedRecord.id);
      await updateDoc(docRef, {
        name: formData.get("name"),
        sku: formData.get("sku"),
        unitPrice: Number(formData.get("unitPrice")),
        costPrice: Number(formData.get("costPrice")),
        minStockLevel: Number(formData.get("minStockLevel")),
        serialNumberTrackingRequired: serialRequired,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Inventory Updated" });
      setIsEditModalOpen(false);
      resetForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = () => {
    if (!selectedRecord || !db) return;
    const docRef = doc(db, "companies", companyId!, "branches", branchId!, "products", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Product Removed" });
    setIsDeleteAlertOpen(false);
  };

  const resetForm = () => {
    setSelectedRecord(null);
    setSerialRequired(false);
  };

  const openEdit = (p: any) => {
    setSelectedRecord(p);
    setSerialRequired(p.serialNumberTrackingRequired || false);
    setIsEditModalOpen(true);
  };

  const filteredProducts = products?.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-primary">Warehouse Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Stock control & serial tracking</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 rounded-full gap-2 px-6" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Assets" value={products?.length || 0} icon={Boxes} colorClass="bg-blue-500" />
        <KPICard title="Valuation" value={`৳${products?.reduce((s, p) => s + ((p.currentStock || 0) * (p.costPrice || 0)), 0).toLocaleString()}`} icon={DollarSign} colorClass="bg-green-500" />
        <KPICard title="Low Stock" value={products?.filter(p => (p.currentStock || 0) <= (p.minStockLevel || 0)).length || 0} icon={AlertTriangle} colorClass="bg-red-500" />
        <KPICard title="Serialized" value={products?.filter(p => p.serialNumberTrackingRequired).length || 0} icon={Scan} colorClass="bg-purple-500" />
      </div>

      <Card className="border-none shadow-sm rounded-xl overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <div className="relative max-w-sm w-full"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search SKU or Name..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Stock Status</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts?.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="font-bold text-primary text-xs md:text-sm">{p.name}</div>
                    {p.serialNumberTrackingRequired && <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-700 mt-1">Serialized</Badge>}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                  <TableCell>
                    <div className={cn("text-xs font-bold", (p.currentStock || 0) <= (p.minStockLevel || 0) ? "text-red-600" : "text-foreground")}>{p.currentStock || 0} Units</div>
                    <div className="text-[10px] text-muted-foreground">Min Alert: {p.minStockLevel}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-bold">৳{p.unitPrice?.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground">Cost: ৳{p.costPrice?.toLocaleString()}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(p)}><Edit className="mr-2 h-4 w-4" /> Edit Product</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedRecord(p); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ADD/EDIT MODAL */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{isEditModalOpen ? "Adjust Product Data" : "New Inventory Item"}</DialogTitle></DialogHeader>
          <form onSubmit={isEditModalOpen ? handleUpdateProduct : handleAddProduct} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Product Name</Label><Input name="name" defaultValue={selectedRecord?.name} required /></div>
              <div className="space-y-2"><Label>SKU / ID</Label><Input name="sku" defaultValue={selectedRecord?.sku} required /></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
              <div className="space-y-0.5"><Label className="text-purple-900 font-bold">Serial Tracking</Label><p className="text-[10px] text-purple-700">Required for unique item monitoring</p></div>
              <Switch checked={serialRequired} onCheckedChange={setSerialRequired} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Unit Cost (৳)</Label><Input name="costPrice" type="number" defaultValue={selectedRecord?.costPrice} required /></div>
              <div className="space-y-2"><Label>Selling Price (৳)</Label><Input name="unitPrice" type="number" defaultValue={selectedRecord?.unitPrice} required /></div>
            </div>
            {!isEditModalOpen && <div className="space-y-2"><Label>Opening Stock</Label><Input name="currentStock" type="number" defaultValue="0" /></div>}
            <div className="space-y-2"><Label>Low Stock Warning Level</Label><Input name="minStockLevel" type="number" defaultValue={selectedRecord?.minStockLevel || 5} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : "Save to Inventory"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE ALERT */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove Product?</AlertDialogTitle><AlertDialogDescription>This will delete {selectedRecord?.name}. Stock records and existing transactions using this ID may be affected.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteProduct}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
