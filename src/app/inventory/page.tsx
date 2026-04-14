
"use client"

import * as React from "react"
import Link from "next/link"
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
  CheckCircle2,
  Table as TableIcon,
  Tag,
  Cpu,
  Settings2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, doc, setDoc, updateDoc, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { KPICard } from "@/components/dashboard/kpi-card"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"

export default function InventoryPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  
  // Tabs & UI States
  const [activeTab, setActiveTab] = React.useState("products")
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = React.useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = React.useState(false);
  
  // Selection States
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [serialRequired, setSerialRequired] = React.useState(false);
  
  // Filters
  const [brandFilter, setBrandFilter] = React.useState("all");
  const [modelFilter, setModelFilter] = React.useState("all");

  // --- DATA QUERIES ---
  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "products");
  }, [db, companyId, branchId]);
  const { data: products, isLoading: productsLoading } = useCollection(productsQuery);

  const brandsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "brands"), orderBy("name"));
  }, [db, companyId]);
  const { data: brands } = useCollection(brandsQuery);

  const modelsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "models"), orderBy("name"));
  }, [db, companyId]);
  const { data: models } = useCollection(modelsQuery);

  // --- ACTIONS ---
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
        brandId: formData.get("brandId") as string,
        modelId: formData.get("modelId") as string,
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
    if (!selectedRecord || !db || !companyId || !branchId) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const docRef = doc(db, "companies", companyId, "branches", branchId, "products", selectedRecord.id);
      await updateDoc(docRef, {
        brandId: formData.get("brandId"),
        modelId: formData.get("modelId"),
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
    if (!selectedRecord || !db || !companyId || !branchId) return;
    const docRef = doc(db, "companies", companyId, "branches", branchId, "products", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Product Removed" });
    setIsDeleteAlertOpen(false);
  };

  const handleAddBrand = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId) return;
    setIsSubmitting(true);
    try {
      const brandRef = doc(collection(db, "companies", companyId, "brands"));
      await setDoc(brandRef, {
        id: brandRef.id,
        companyId,
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        createdAt: serverTimestamp()
      });
      toast({ title: "Brand Registered" });
      setIsBrandModalOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddModel = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId) return;
    setIsSubmitting(true);
    try {
      const modelRef = doc(collection(db, "companies", companyId, "models"));
      await setDoc(modelRef, {
        id: modelRef.id,
        companyId,
        brandId: formData.get("brandId") as string,
        name: formData.get("name") as string,
        createdAt: serverTimestamp()
      });
      toast({ title: "Model Line Initialized" });
      setIsModelModalOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
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

  // --- FILTERING ---
  const [formSelectedBrand, setFormSelectedBrand] = React.useState<string>("");

  const filteredProducts = React.useMemo(() => {
    return products?.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBrand = brandFilter === "all" || p.brandId === brandFilter;
      const matchesModel = modelFilter === "all" || p.modelId === modelFilter;
      return matchesSearch && matchesBrand && matchesModel;
    });
  }, [products, searchTerm, brandFilter, modelFilter]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-primary flex items-center gap-2">
            <Boxes className="h-8 w-8" /> Warehouse Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Stock control, brands & serial tracking</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full gap-2 px-6" asChild>
            <Link href="/inventory/bulk-add">
              <TableIcon className="h-4 w-4" /> Bulk Intake
            </Link>
          </Button>
          <Button className="bg-primary hover:bg-primary/90 rounded-full gap-2 px-6 shadow-lg h-11" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Assets" value={products?.length || 0} icon={Boxes} colorClass="bg-blue-500" />
        <KPICard title="Valuation" value={`৳${products?.reduce((s, p) => s + ((p.currentStock || 0) * (p.costPrice || 0)), 0).toLocaleString()}`} icon={DollarSign} colorClass="bg-green-500" />
        <KPICard title="Low Stock" value={products?.filter(p => (p.currentStock || 0) <= (p.minStockLevel || 0)).length || 0} icon={AlertTriangle} colorClass="bg-red-500" />
        <KPICard title="Manufacturers" value={brands?.length || 0} icon={Tag} colorClass="bg-orange-500" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border rounded-xl p-1 mb-6 shadow-sm flex h-auto overflow-x-auto no-scrollbar">
          <TabsTrigger value="products" className="rounded-lg gap-2 flex-1 py-2"><Boxes className="h-4 w-4" /> Products</TabsTrigger>
          <TabsTrigger value="brands" className="rounded-lg gap-2 flex-1 py-2"><Tag className="h-4 w-4" /> Brands</TabsTrigger>
          <TabsTrigger value="models" className="rounded-lg gap-2 flex-1 py-2"><Cpu className="h-4 w-4" /> Models</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card className="border-none shadow-sm rounded-xl overflow-hidden">
            <div className="p-4 border-b bg-muted/20 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search SKU or Name..." className="pl-9 h-10 border-none ring-1 ring-input bg-background" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="h-10 bg-background min-w-[140px]"><SelectValue placeholder="Brand" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={modelFilter} onValueChange={setModelFilter}>
                  <SelectTrigger className="h-10 bg-background min-w-[140px]"><SelectValue placeholder="Model" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    {models?.filter(m => brandFilter === 'all' || m.brandId === brandFilter).map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="overflow-x-auto">
              {productsLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Product Identity</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Stock Status</TableHead>
                      <TableHead>Pricing</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground italic">No products matching filters.</TableCell></TableRow>
                    ) : (
                      filteredProducts?.map((p) => (
                        <TableRow key={p.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell>
                            <div className="font-bold text-primary text-xs md:text-sm">{p.name}</div>
                            <div className="flex gap-1 mt-1">
                              <Badge variant="outline" className="text-[8px] uppercase tracking-tighter bg-blue-50 text-blue-700 border-blue-100">
                                {brands?.find(b => b.id === p.brandId)?.name || "Generic"}
                              </Badge>
                              {p.modelId && (
                                <Badge variant="outline" className="text-[8px] uppercase tracking-tighter">
                                  {models?.find(m => m.id === p.modelId)?.name}
                                </Badge>
                              )}
                              {p.serialNumberTrackingRequired && <Badge className="text-[8px] bg-purple-50 text-purple-700 border-purple-100">SERIALIZED</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-[10px] uppercase">{p.sku}</TableCell>
                          <TableCell>
                            <div className={cn("text-xs font-bold", (p.currentStock || 0) <= (p.minStockLevel || 0) ? "text-red-600" : "text-green-600")}>
                              {p.currentStock || 0} Units
                            </div>
                            <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Min Alert: {p.minStockLevel}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-bold">৳{p.unitPrice?.toLocaleString()}</div>
                            <div className="text-[9px] text-muted-foreground font-bold tracking-tighter">COST: ৳{p.costPrice?.toLocaleString()}</div>
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
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="brands">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-sm rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow><TableHead>Brand Name</TableHead><TableHead>Models Count</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {brands?.map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="font-bold">{b.name}</TableCell>
                      <TableCell><Badge variant="secondary">{models?.filter(m => m.brandId === b.id).length || 0} models</Badge></TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            <Card className="border-none shadow-sm rounded-xl h-fit">
              <CardHeader><CardTitle className="text-lg">Register Brand</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddBrand} className="space-y-4">
                  <div className="space-y-2"><Label className="text-xs uppercase font-bold text-muted-foreground">Manufacturer Name</Label><Input name="name" required placeholder="e.g. Samsung" /></div>
                  <div className="space-y-2"><Label className="text-xs uppercase font-bold text-muted-foreground">Description</Label><Input name="description" placeholder="Brief info..." /></div>
                  <Button type="submit" className="w-full h-11 rounded-xl shadow-lg" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Save Brand"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="models">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-sm rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow><TableHead>Model Name</TableHead><TableHead>Brand</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {models?.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-bold">{m.name}</TableCell>
                      <TableCell><Badge variant="outline">{brands?.find(b => b.id === m.brandId)?.name}</Badge></TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-red-500" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            <Card className="border-none shadow-sm rounded-xl h-fit">
              <CardHeader><CardTitle className="text-lg">Register Model</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddModel} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Parent Brand</Label>
                    <Select name="brandId" required>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Identify manufacturer" /></SelectTrigger>
                      <SelectContent>{brands?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label className="text-xs uppercase font-bold text-muted-foreground">Model Number/Line</Label><Input name="name" required placeholder="e.g. Galaxy S24" /></div>
                  <Button type="submit" className="w-full h-11 rounded-xl shadow-lg" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Save Model"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ADD/EDIT PRODUCT MODAL */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[95vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className={cn("p-6 text-white", isEditModalOpen ? "bg-blue-600" : "bg-primary")}>
            <DialogTitle className="text-2xl font-headline flex items-center gap-3">
              <Boxes className="h-6 w-6" /> {isEditModalOpen ? "Modify Inventory Item" : "Register New Product"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={isEditModalOpen ? handleUpdateProduct : handleAddProduct} className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-4 p-4 bg-muted/20 rounded-2xl border-2 border-dashed">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Master Classification</Label>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Brand / Manufacturer</Label>
                      <Select 
                        name="brandId" 
                        required 
                        defaultValue={selectedRecord?.brandId}
                        onValueChange={setFormSelectedBrand}
                      >
                        <SelectTrigger className="h-11 rounded-xl bg-white shadow-sm"><SelectValue placeholder="Choose brand..." /></SelectTrigger>
                        <SelectContent>{brands?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Product Model</Label>
                      <Select name="modelId" required defaultValue={selectedRecord?.modelId}>
                        <SelectTrigger className="h-11 rounded-xl bg-white shadow-sm"><SelectValue placeholder="Identify model line..." /></SelectTrigger>
                        <SelectContent>
                          {models?.filter(m => !formSelectedBrand || m.brandId === formSelectedBrand).map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Product Display Name</Label>
                  <Input name="name" required defaultValue={selectedRecord?.name} placeholder="e.g. Sony 4K IP Camera" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">SKU / Unique ID</Label>
                  <Input name="sku" required defaultValue={selectedRecord?.sku} placeholder="CAM-001-PRO" className="h-11 rounded-xl font-mono uppercase" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl border-2 border-purple-100 shadow-sm">
                  <div className="space-y-0.5"><Label className="text-purple-900 font-bold">Serial Tracking</Label><p className="text-[10px] text-purple-700">Enforce unique item monitoring</p></div>
                  <Switch checked={serialRequired} onCheckedChange={setSerialRequired} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-red-600">Unit Cost (৳)</Label>
                    <Input name="costPrice" type="number" step="0.01" defaultValue={selectedRecord?.costPrice} required className="h-11 rounded-xl border-red-50 focus:border-red-500 shadow-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase text-green-600">Sale Price (৳)</Label>
                    <Input name="unitPrice" type="number" step="0.01" defaultValue={selectedRecord?.unitPrice} required className="h-11 rounded-xl border-green-50 focus:border-green-500 shadow-sm" />
                  </div>
                </div>

                {!isEditModalOpen && (
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase">Initial Stock</Label>
                    <Input name="currentStock" type="number" defaultValue="0" className="h-11 rounded-xl" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase">Low Stock Warning Level</Label>
                  <Input name="minStockLevel" type="number" defaultValue={selectedRecord?.minStockLevel || 5} className="h-11 rounded-xl" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-6 bg-muted/20 rounded-2xl border-2 border-dashed">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-primary"><Settings2 className="h-6 w-6" /></div>
                <div><p className="text-sm font-bold">Inventory Sync</p><p className="text-[10px] text-muted-foreground">Product will be added to the active branch ({branchId?.replace('-', ' ')})</p></div>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" className="rounded-full px-8 h-12" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 rounded-full px-12 h-12 font-bold shadow-xl">
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle2 className="h-5 w-5 mr-2" />} 
                  {isEditModalOpen ? "Save Adjustments" : "Initialize Item"}
                </Button>
              </div>
            </div>
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
