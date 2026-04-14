
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
  Settings2,
  PlusCircle,
  X,
  PlusSquare,
  AlertCircle
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
  
  // Inline Model Creation State
  const [isInlineModelOpen, setIsInlineModelOpen] = React.useState(false);
  const [newModelName, setNewModelName] = React.useState("");
  const [formSelectedBrand, setFormSelectedBrand] = React.useState<string>("");
  const [selectedModelId, setSelectedModelId] = React.useState<string>("");

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
        brandId: formSelectedBrand,
        modelId: selectedModelId,
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
      toast({ title: "Product Created", description: "The item is now tracked in inventory." });
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
        brandId: formSelectedBrand,
        modelId: selectedModelId,
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

  const handleQuickAddModel = async () => {
    if (!db || !companyId || !formSelectedBrand || !newModelName) {
      toast({ variant: "destructive", title: "Missing Context", description: "Please select a brand before creating a new model." });
      return;
    }
    
    // Prevent duplicates
    const exists = models?.some(m => m.brandId === formSelectedBrand && m.name.toLowerCase() === newModelName.trim().toLowerCase());
    if (exists) {
      toast({ variant: "destructive", title: "Duplicate Model", description: "This model name already exists for the selected brand." });
      return;
    }

    setIsSubmitting(true);
    try {
      const modelRef = doc(collection(db, "companies", companyId, "models"));
      const newId = modelRef.id;
      const modelData = {
        id: newId,
        companyId,
        brandId: formSelectedBrand,
        name: newModelName.trim(),
        createdAt: serverTimestamp()
      };
      await setDoc(modelRef, modelData);
      
      toast({ title: "Model Added", description: `"${newModelName}" is now available.` });
      setSelectedModelId(newId);
      setNewModelName("");
      setIsInlineModelOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedRecord(null);
    setSerialRequired(false);
    setFormSelectedBrand("");
    setSelectedModelId("");
    setNewModelName("");
    setIsInlineModelOpen(false);
  };

  const openEdit = (p: any) => {
    setSelectedRecord(p);
    setSerialRequired(p.serialNumberTrackingRequired || false);
    setFormSelectedBrand(p.brandId || "");
    setSelectedModelId(p.modelId || "");
    setIsEditModalOpen(true);
  };

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
          <p className="text-sm text-muted-foreground mt-1">Real-time stock monitoring and brand tracking</p>
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
        <KPICard title="Total Assets" value={products?.length || 0} icon={Boxes} colorClass="bg-blue-500" />
        <KPICard title="Warehouse Valuation" value={`৳${products?.reduce((s, p) => s + ((p.currentStock || 0) * (p.costPrice || 0)), 0).toLocaleString()}`} icon={DollarSign} colorClass="bg-green-500" />
        <KPICard title="Low Stock Alerts" value={products?.filter(p => (p.currentStock || 0) <= (p.minStockLevel || 0)).length || 0} icon={AlertTriangle} colorClass="bg-red-500" />
        <KPICard title="Brands" value={brands?.length || 0} icon={Tag} colorClass="bg-orange-500" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border rounded-xl p-1 mb-6 shadow-sm flex h-auto overflow-x-auto no-scrollbar">
          <TabsTrigger value="products" className="rounded-lg gap-2 flex-1 py-2 font-bold"><Boxes className="h-4 w-4" /> Products</TabsTrigger>
          <TabsTrigger value="brands" className="rounded-lg gap-2 flex-1 py-2 font-bold"><Tag className="h-4 w-4" /> Brands</TabsTrigger>
          <TabsTrigger value="models" className="rounded-lg gap-2 flex-1 py-2 font-bold"><Cpu className="h-4 w-4" /> Models</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <Card className="border-none shadow-sm rounded-xl overflow-hidden">
            <div className="p-4 border-b bg-muted/20 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search SKU, Name or Serial..." className="pl-9 h-10 border-none ring-1 ring-input bg-background shadow-inner" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <Select value={brandFilter} onValueChange={setBrandFilter}>
                  <SelectTrigger className="h-10 bg-background min-w-[140px] rounded-lg"><SelectValue placeholder="Brand" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={modelFilter} onValueChange={setModelFilter}>
                  <SelectTrigger className="h-10 bg-background min-w-[140px] rounded-lg"><SelectValue placeholder="Model" /></SelectTrigger>
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
                      <TableHead>Identity</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Availability</TableHead>
                      <TableHead>Commercials</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-16 text-muted-foreground italic">No products matched your criteria.</TableCell></TableRow>
                    ) : (
                      filteredProducts?.map((p) => (
                        <TableRow key={p.id} className="hover:bg-muted/30 transition-colors group">
                          <TableCell>
                            <div className="font-bold text-primary text-xs md:text-sm">{p.name}</div>
                            <div className="flex gap-1 mt-1">
                              <Badge variant="outline" className="text-[8px] uppercase tracking-tighter bg-blue-50 text-blue-700 border-blue-100">
                                {brands?.find(b => b.id === p.brandId)?.name || "Generic"}
                              </Badge>
                              {p.modelId && (
                                <Badge variant="outline" className="text-[8px] uppercase tracking-tighter bg-slate-50">
                                  {models?.find(m => m.id === p.modelId)?.name}
                                </Badge>
                              )}
                              {p.serialNumberTrackingRequired && <Badge className="text-[8px] bg-purple-50 text-purple-700 border-purple-100">SN-TRACKED</Badge>}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-[10px] uppercase text-muted-foreground">{p.sku}</TableCell>
                          <TableCell>
                            <div className={cn("text-xs font-bold", (p.currentStock || 0) <= (p.minStockLevel || 0) ? "text-red-600" : "text-emerald-600")}>
                              {p.currentStock || 0} Units
                            </div>
                            {(p.currentStock || 0) <= (p.minStockLevel || 0) && (
                              <div className="flex items-center gap-1 text-[9px] text-red-500 font-bold uppercase animate-pulse">
                                <AlertCircle className="h-2 w-2" /> Critical Low
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-bold text-slate-900">৳{p.unitPrice?.toLocaleString()}</div>
                            <div className="text-[9px] text-muted-foreground font-bold tracking-tighter uppercase">GP: {(((p.unitPrice - p.costPrice) / p.unitPrice) * 100).toFixed(1)}%</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEdit(p)}><Edit className="mr-2 h-4 w-4" /> Edit Record</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedRecord(p); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Remove</DropdownMenuItem>
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
                  <TableRow><TableHead>Brand Name</TableHead><TableHead>Active Models</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {brands?.map(b => (
                    <TableRow key={b.id} className="hover:bg-muted/20">
                      <TableCell className="font-bold">{b.name}</TableCell>
                      <TableCell><Badge variant="secondary" className="rounded-md font-bold">{models?.filter(m => m.brandId === b.id).length || 0} series</Badge></TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-600 rounded-full"><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            <Card className="border-none shadow-md rounded-xl h-fit">
              <CardHeader className="bg-orange-50/30 border-b"><CardTitle className="text-lg flex items-center gap-2"><PlusSquare className="h-5 w-5 text-orange-600" /> Register Brand</CardTitle></CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleAddBrand} className="space-y-4">
                  <div className="space-y-2"><Label className="text-xs uppercase font-bold text-muted-foreground">Manufacturer Label</Label><Input name="name" required placeholder="e.g. Hikvision" className="h-11 rounded-xl" /></div>
                  <div className="space-y-2"><Label className="text-xs uppercase font-bold text-muted-foreground">Corporate Description</Label><Input name="description" placeholder="Brief info..." className="h-11 rounded-xl" /></div>
                  <Button type="submit" className="w-full h-12 rounded-xl shadow-lg bg-orange-600 hover:bg-orange-700 font-bold" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Authorize Brand"}
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
                  <TableRow><TableHead>Model Line</TableHead><TableHead>Manufacturer</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {models?.map(m => (
                    <TableRow key={m.id} className="hover:bg-muted/20">
                      <TableCell className="font-bold">{m.name}</TableCell>
                      <TableCell><Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">{brands?.find(b => b.id === m.brandId)?.name}</Badge></TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-600 rounded-full"><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            <Card className="border-none shadow-md rounded-xl h-fit">
              <CardHeader className="bg-purple-50/30 border-b"><CardTitle className="text-lg flex items-center gap-2"><Cpu className="h-5 w-5 text-purple-600" /> New Model Series</CardTitle></CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Parent Brand</Label>
                    <Select value={formSelectedBrand} onValueChange={setFormSelectedBrand}>
                      <SelectTrigger className="h-11 rounded-xl border-purple-100"><SelectValue placeholder="Identify manufacturer" /></SelectTrigger>
                      <SelectContent>{brands?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Product Version/Model</Label>
                    <Input value={newModelName} onChange={e => setNewModelName(e.target.value)} placeholder="e.g. Pro-Series 4K" className="h-11 rounded-xl" />
                  </div>
                  <Button onClick={handleQuickAddModel} className="w-full h-12 rounded-xl shadow-lg bg-purple-600 hover:bg-purple-700 font-bold" disabled={isSubmitting || !formSelectedBrand || !newModelName}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Deploy Model"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ADD/EDIT PRODUCT MODAL */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] overflow-y-auto p-0 border-none shadow-2xl rounded-3xl">
          <DialogHeader className={cn("p-8 text-white", isEditModalOpen ? "bg-blue-600" : "bg-primary")}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Boxes className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-3xl font-headline font-bold">
                  {isEditModalOpen ? "Adjust Inventory" : "New Acquisition"}
                </DialogTitle>
                <p className="text-white/70 text-xs font-medium tracking-wide uppercase mt-1">Master Product Registration</p>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={isEditModalOpen ? handleUpdateProduct : handleAddProduct} className="p-8 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="space-y-6 p-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.2em]">Categorization</Label>
                    <Badge className="bg-primary/10 text-primary border-none text-[9px] uppercase font-black">Step 1</Badge>
                  </div>
                  
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Manufacturer Brand</Label>
                      <Select 
                        name="brandId" 
                        required 
                        value={formSelectedBrand}
                        onValueChange={setFormSelectedBrand}
                      >
                        <SelectTrigger className="h-12 rounded-2xl bg-white border-slate-200 shadow-sm transition-all focus:ring-primary"><SelectValue placeholder="Choose brand..." /></SelectTrigger>
                        <SelectContent>{brands?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-700">Product Model</Label>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className={cn("h-7 text-[10px] font-black uppercase tracking-widest rounded-lg px-3 transition-colors", isInlineModelOpen ? "text-red-500 hover:bg-red-50" : "text-primary hover:bg-primary/5")}
                          onClick={() => {
                            if(!formSelectedBrand) {
                              toast({ variant: "destructive", title: "Action Blocked", description: "Select a brand first to link the new model." });
                              return;
                            }
                            setIsInlineModelOpen(!isInlineModelOpen);
                          }}
                        >
                          {isInlineModelOpen ? <X className="h-3 w-3 mr-1.5" /> : <PlusCircle className="h-3 w-3 mr-1.5" />}
                          {isInlineModelOpen ? "Cancel" : "Add New"}
                        </Button>
                      </div>

                      {isInlineModelOpen ? (
                        <div className="flex gap-2 animate-in slide-in-from-top-4 duration-300">
                          <Input 
                            className="h-12 rounded-2xl bg-white border-2 border-primary/20 text-sm font-bold shadow-md shadow-primary/5 focus:border-primary" 
                            placeholder="Enter new model code..." 
                            value={newModelName} 
                            autoFocus
                            onChange={e => setNewModelName(e.target.value)}
                          />
                          <Button 
                            type="button" 
                            className="h-12 w-12 shrink-0 rounded-2xl bg-primary shadow-lg shadow-primary/20 active:scale-95 transition-transform"
                            disabled={!newModelName || isSubmitting}
                            onClick={handleQuickAddModel}
                          >
                            {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                          </Button>
                        </div>
                      ) : (
                        <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                          <SelectTrigger className="h-12 rounded-2xl bg-white border-slate-200 shadow-sm transition-all focus:ring-primary"><SelectValue placeholder="Identify series..." /></SelectTrigger>
                          <SelectContent>
                            {!formSelectedBrand ? (
                              <div className="p-4 text-center text-[10px] text-slate-400 font-bold uppercase italic">Pick a brand first</div>
                            ) : (
                              models?.filter(m => m.brandId === formSelectedBrand).map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Display Identity</Label>
                    <Input name="name" required defaultValue={selectedRecord?.name} placeholder="e.g. 4K NightVision PTZ Camera" className="h-14 rounded-2xl bg-white border-slate-200 text-base font-bold placeholder:font-normal" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Stock Keeping Unit (SKU)</Label>
                    <Input name="sku" required defaultValue={selectedRecord?.sku} placeholder="WAR-CAM-001" className="h-14 rounded-2xl bg-white border-slate-200 font-mono text-base uppercase font-bold text-primary" />
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="p-6 bg-purple-50/50 rounded-[2rem] border-2 border-purple-100 shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-purple-900 text-sm font-black uppercase tracking-tighter">Unique Serialization</Label>
                    <p className="text-[10px] text-purple-600 font-medium leading-none">Track individual IMEI/Serial numbers</p>
                  </div>
                  <Switch checked={serialRequired} onCheckedChange={setSerialRequired} className="data-[state=checked]:bg-purple-600" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-red-600 uppercase tracking-widest">Base Cost (৳)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                      <Input name="costPrice" type="number" step="0.01" defaultValue={selectedRecord?.costPrice} required className="h-14 rounded-2xl pl-10 bg-white border-red-50 focus:border-red-500 font-bold text-lg" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Retail MSRP (৳)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                      <Input name="unitPrice" type="number" step="0.01" defaultValue={selectedRecord?.unitPrice} required className="h-14 rounded-2xl pl-10 bg-white border-emerald-50 focus:border-emerald-500 font-bold text-lg" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {!isEditModalOpen && (
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Initial Opening Stock</Label>
                      <Input name="currentStock" type="number" defaultValue="0" className="h-14 rounded-2xl bg-white border-slate-200 font-bold" />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Safety Limit (Low Stock)</Label>
                    <Input name="minStockLevel" type="number" defaultValue={selectedRecord?.minStockLevel || 5} className="h-14 rounded-2xl bg-white border-slate-200 font-bold text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400"><Settings2 className="h-6 w-6" /></div>
                <div><p className="text-sm font-black text-slate-900 uppercase tracking-tighter">System Synchronization</p><p className="text-[10px] text-slate-500 font-bold uppercase">Deployment Target: {branchId?.replace('-', ' ')}</p></div>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <Button type="button" variant="outline" className="flex-1 md:flex-none rounded-2xl px-10 h-14 font-bold border-slate-200" onClick={() => setIsAddModalOpen(false)}>Discard</Button>
                <Button type="submit" disabled={isSubmitting} className={cn("flex-1 md:flex-none rounded-2xl px-16 h-14 font-black uppercase tracking-widest text-sm shadow-2xl transition-all active:scale-95", isEditModalOpen ? "bg-blue-600 hover:bg-blue-700 shadow-blue-200" : "bg-primary hover:bg-primary/90 shadow-primary/20")}>
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : isEditModalOpen ? "Push Adjustments" : "Finalize Item"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE ALERT */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-4">
              <Trash2 className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-2xl font-headline font-bold">Remove Product Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-sm leading-relaxed">
              This will permanently delete <strong className="text-slate-900">{selectedRecord?.name}</strong> from your master catalog. Stock levels and historical ledger links for this ID will be detached. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 px-8 font-bold border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 px-8 font-bold text-white shadow-lg shadow-red-100" onClick={handleDeleteProduct}>Confirm Removal</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
