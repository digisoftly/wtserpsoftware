
"use client"

import * as React from "react"
import { 
  Search, 
  Plus, 
  Loader2, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Boxes, 
  AlertCircle, 
  DollarSign, 
  Package,
  ShieldCheck,
  Eye,
  Scan,
  LayoutGrid,
  Info,
  History,
  Barcode
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, limit, writeBatch } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function InventoryPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  
  // State
  const [searchTerm, setSearchTerm] = React.useState("");
  const deferredSearch = React.useDeferredValue(searchTerm);
  const [brandFilter, setBrandFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<any>(null);

  // Form Local State
  const [isSerialTracking, setIsSerialTracking] = React.useState(false);
  const [rawSerials, setRawSerials] = React.useState("");

  // Queries
  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "products"),
      orderBy("createdAt", "desc"),
      limit(100)
    );
  }, [db, companyId, branchId]);
  const { data: products, isLoading } = useCollection(productsQuery);

  // Master Data
  const unitsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_units"), orderBy("name"));
  }, [db, companyId]);
  const { data: masterUnits } = useCollection(unitsQuery);

  const catsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_categories"), orderBy("name"));
  }, [db, companyId]);
  const { data: masterCats } = useCollection(catsQuery);

  const brandsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_brands"), orderBy("name"));
  }, [db, companyId]);
  const { data: masterBrands } = useCollection(brandsQuery);

  const modelsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_models"), orderBy("name"));
  }, [db, companyId]);
  const { data: masterModels } = useCollection(modelsQuery);

  const customFieldsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_custom_fields"), orderBy("label"));
  }, [db, companyId]);
  const { data: masterCustomFields } = useCollection(customFieldsQuery);

  // Stats
  const stats = React.useMemo(() => ({
    totalProducts: products?.length || 0,
    lowStock: products?.filter(p => (p.currentStock || 0) <= (p.minStockLevel || 5)).length || 0,
    totalValue: products?.reduce((s, p) => s + ((p.currentStock || 0) * (p.unitPrice || 0)), 0) || 0
  }), [products]);

  const filtered = React.useMemo(() => {
    return products?.filter(p => {
      const matchesSearch = p.name?.toLowerCase().includes(deferredSearch.toLowerCase()) || 
                            p.sku?.toLowerCase().includes(deferredSearch.toLowerCase());
      const matchesBrand = brandFilter === "all" || p.brandId === brandFilter;
      const matchesCategory = categoryFilter === "all" || p.categoryId === categoryFilter;
      return matchesSearch && matchesBrand && matchesCategory;
    });
  }, [products, deferredSearch, brandFilter, categoryFilter]);

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    // Extract custom fields
    const customFields: Record<string, any> = {};
    masterCustomFields?.filter(f => f.targetModule === 'product').forEach(f => {
      const val = formData.get(`cf_${f.id}`);
      customFields[f.id] = f.type === 'checkbox' ? val === 'on' : val;
    });

    const currentStock = Number(formData.get("currentStock"));
    const productData = {
      companyId,
      branchId,
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      brandId: formData.get("brandId") as string,
      modelId: formData.get("modelId") as string,
      categoryId: formData.get("categoryId") as string,
      unitId: formData.get("unitId") as string,
      unitPrice: Number(formData.get("unitPrice")),
      costPrice: Number(formData.get("costPrice")),
      currentStock,
      minStockLevel: Number(formData.get("minStockLevel") || 5),
      warranty: formData.get("warranty") as string || "",
      description: formData.get("description") as string || "",
      serialNumberTrackingRequired: isSerialTracking,
      customFields,
      isActive: true,
      updatedAt: serverTimestamp(),
    };

    try {
      const batch = writeBatch(db);
      let productRef;

      if (isEditOpen && selectedProduct) {
        productRef = doc(db, "companies", companyId, "branches", branchId, "products", selectedProduct.id);
        batch.update(productRef, productData);
      } else {
        productRef = doc(collection(db, "companies", companyId, "branches", branchId, "products"));
        batch.set(productRef, { ...productData, id: productRef.id, createdAt: serverTimestamp() });
      }

      // Handle opening stock serials if tracking is enabled
      if (isSerialTracking && rawSerials.trim()) {
        const snList = rawSerials.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
        const snColRef = collection(db, "companies", companyId, "branches", branchId, "serial_numbers");
        
        snList.forEach(sn => {
          const snDocRef = doc(snColRef);
          batch.set(snDocRef, {
            id: snDocRef.id,
            companyId,
            branchId,
            productId: productRef.id,
            serialNumber: sn,
            status: "available",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });

        // Ensure stock matches serial count if entered
        if (!isEditOpen) {
          batch.update(productRef, { currentStock: snList.length });
        }
      }

      await batch.commit();
      toast({ title: t('success') });
      setIsAddOpen(false);
      setIsEditOpen(false);
      setSelectedProduct(null);
      resetForm();
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setIsSerialTracking(false);
    setRawSerials("");
  };

  const openEdit = (p: any) => {
    setSelectedProduct(p);
    setIsSerialTracking(p.serialNumberTrackingRequired || false);
    setRawSerials("");
    setIsEditOpen(true);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-headline text-blue-600 uppercase tracking-tight">{t('inventory')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <Button className="rounded-full gap-2 h-11 px-8 bg-blue-600 hover:bg-blue-700 font-bold text-[10px] uppercase shadow-xl shadow-blue-100 transition-all active:scale-95 w-full md:w-auto" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" /> {t('addProduct')}
        </Button>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title={t('totalProducts')} value={stats.totalProducts} icon={Boxes} colorClass="bg-blue-600" />
        <KPICard title={t('lowStock')} value={stats.lowStock} icon={AlertCircle} colorClass="bg-red-600" />
        <KPICard title={t('stockValue')} value={`৳${stats.totalValue.toLocaleString()}`} icon={DollarSign} colorClass="bg-green-600" />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border shadow-sm ring-1 ring-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input 
              placeholder={t('search')} 
              className="pl-9 h-11 w-full rounded-2xl bg-slate-50/50 border-none text-xs focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="flex gap-2">
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-[150px] h-11 rounded-2xl bg-slate-50 border-none text-[10px] font-bold uppercase tracking-wider">
                <SelectValue placeholder={t('brand')} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all" className="text-xs uppercase">{t('allBrands')}</SelectItem>
                {masterBrands?.map(b => <SelectItem key={b.id} value={b.id} className="text-xs uppercase">{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px] h-11 rounded-2xl bg-slate-50 border-none text-[10px] font-bold uppercase tracking-wider">
                <SelectValue placeholder={t('category')} />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all" className="text-xs uppercase">{t('allCategories')}</SelectItem>
                {masterCats?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs uppercase">{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden rounded-[2rem] bg-white ring-1 ring-slate-100">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="h-12 text-[10px] uppercase font-black pl-8">{t('itemDescription')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('brand')} / {t('model')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black text-center">{t('stock')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black text-right">{t('price')}</TableHead>
                  <TableHead className="h-12 text-right pr-8 sticky right-0 bg-white/95 backdrop-blur-sm z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] w-[160px]">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered?.map((p) => (
                  <TableRow key={p.id} className="h-20 hover:bg-muted/5 transition-colors group">
                    <TableCell className="pl-8">
                      <div className="flex flex-col">
                        <span className="font-black text-xs uppercase tracking-tight text-slate-900">{p.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">{p.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase text-blue-600">{masterBrands?.find(b => b.id === p.brandId)?.name || "---"}</span>
                        <span className="text-[9px] font-medium text-slate-500 uppercase tracking-tighter">{masterModels?.find(m => m.id === p.modelId)?.name || "Standard"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          "text-[11px] font-black h-7 px-4 flex items-center justify-center rounded-xl whitespace-nowrap",
                          (p.currentStock || 0) <= (p.minStockLevel || 5) ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {p.currentStock || 0} {masterUnits?.find(u => u.id === p.unitId)?.shortName || 'Pcs'}
                        </span>
                        {p.serialNumberTrackingRequired && (
                          <div className="flex items-center gap-1 mt-1">
                            <ShieldCheck className="h-3 w-3 text-green-500" />
                            <span className="text-[8px] font-black uppercase text-green-600 tracking-tighter">SERIALIZED</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-black text-xs text-slate-900">৳{p.unitPrice?.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-right pr-8 sticky right-0 bg-white/90 backdrop-blur-sm group-hover:bg-slate-50/90 transition-colors z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-end items-center gap-1">
                        <div className="hidden md:flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => openEdit(p)} title={t('view')}><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-amber-600 hover:bg-amber-50" onClick={() => openEdit(p)} title={t('edit')}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-600 hover:bg-red-50" onClick={() => deleteDocumentNonBlocking(doc(db!, "companies", companyId!, "branches", branchId!, "products", p.id))} title={t('delete')}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden rounded-full hover:bg-blue-50 text-blue-600 transition-colors"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-2xl shadow-xl">
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => openEdit(p)}><Edit className="mr-2 h-3.5 w-3.5" /> {t('edit')}</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold text-red-600" onClick={() => deleteDocumentNonBlocking(doc(db!, "companies", companyId!, "branches", branchId!, "products", p.id))}><Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* PRODUCT TERMINAL MODAL */}
      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => { if(!open) { setIsAddOpen(false); setIsEditOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-[95vw] md:max-w-4xl lg:max-w-5xl p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-slate-50 max-h-[96vh]">
          <DialogHeader className="bg-blue-600 p-6 text-white flex-row items-center justify-between space-y-0 shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black font-headline uppercase tracking-tight">{isEditOpen ? t('edit') : t('addProduct')}</DialogTitle>
                <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mt-0.5">Inventory Catalog Definition</p>
              </div>
            </div>
            <Badge variant="outline" className="border-white/20 text-white font-black text-[9px] uppercase px-3 py-1 rounded-full hidden sm:block">ID: {selectedProduct?.id?.slice(-6) || "AUTO-GEN"}</Badge>
          </DialogHeader>
          
          <form onSubmit={handleSaveProduct} className="flex flex-col overflow-hidden">
            <div className="p-4 md:p-10 space-y-8 overflow-y-auto lg:overflow-x-hidden custom-scrollbar max-h-[70vh]">
              {/* Basic Information Group */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b pb-3 mb-6">
                  <LayoutGrid className="h-4 w-4 text-blue-600" />
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest">General Identity</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2 lg:col-span-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-1.5">
                      {t('itemDescription')} <span className="text-red-500 font-bold">*</span>
                    </Label>
                    <Input name="name" required defaultValue={selectedProduct?.name} className="h-12 rounded-2xl border-none ring-1 ring-slate-200 bg-white font-bold text-sm focus:ring-2 focus:ring-blue-600" placeholder="e.g. Sony 4K PTZ Security Camera" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('sku')} / ID</Label>
                    <Input name="sku" required defaultValue={selectedProduct?.sku} className="h-12 rounded-2xl border-none ring-1 ring-slate-200 bg-white font-mono text-sm uppercase" placeholder="CAM-SNY-001" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('category')}</Label>
                    <Select name="categoryId" defaultValue={selectedProduct?.categoryId}>
                      <SelectTrigger className="h-12 rounded-2xl border-none ring-1 ring-slate-200 bg-white font-bold text-xs uppercase">
                        <SelectValue placeholder="General" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {masterCats?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('brand')}</Label>
                    <Select name="brandId" defaultValue={selectedProduct?.brandId}>
                      <SelectTrigger className="h-12 rounded-2xl border-none ring-1 ring-slate-200 bg-white font-bold text-xs uppercase">
                        <SelectValue placeholder="Brand" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {masterBrands?.map(b => <SelectItem key={b.id} value={b.id} className="text-xs font-bold uppercase">{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('model')}</Label>
                    <Select name="modelId" defaultValue={selectedProduct?.modelId}>
                      <SelectTrigger className="h-12 rounded-2xl border-none ring-1 ring-slate-200 bg-white font-bold text-xs uppercase">
                        <SelectValue placeholder="Model" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {masterModels?.map(m => <SelectItem key={m.id} value={m.id} className="text-xs font-bold uppercase">{m.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Financials & Stock Group */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center gap-3 border-b pb-3 mb-6">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest">Financials & Logistics</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('costPrice')} (৳)</Label>
                    <Input name="costPrice" type="number" step="0.01" required defaultValue={selectedProduct?.costPrice} className="h-12 rounded-2xl border-none ring-1 ring-slate-200 bg-white font-black text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('price')} (৳)</Label>
                    <Input name="unitPrice" type="number" step="0.01" required defaultValue={selectedProduct?.unitPrice} className="h-12 rounded-2xl border-none ring-1 ring-slate-200 bg-white font-black text-sm text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('units')}</Label>
                    <Select name="unitId" defaultValue={selectedProduct?.unitId || masterUnits?.find(u => u.isDefault)?.id}>
                      <SelectTrigger className="h-12 rounded-2xl border-none ring-1 ring-slate-200 bg-white font-bold text-xs uppercase">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {masterUnits?.map(u => <SelectItem key={u.id} value={u.id} className="text-xs font-bold uppercase">{u.name} ({u.shortName})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('stock')}</Label>
                    <Input name="currentStock" type="number" required defaultValue={selectedProduct?.currentStock} className="h-12 rounded-2xl border-none ring-1 ring-slate-200 bg-white font-black text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Min. Limit</Label>
                    <Input name="minStockLevel" type="number" defaultValue={selectedProduct?.minStockLevel || 5} className="h-12 rounded-2xl border-none ring-1 ring-slate-200 bg-white font-black text-sm text-red-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Warranty Period</Label>
                    <Input name="warranty" defaultValue={selectedProduct?.warranty} className="h-12 rounded-2xl border-none ring-1 ring-slate-200 bg-white font-bold text-sm uppercase" placeholder="e.g. 1 Year" />
                  </div>
                </div>
              </div>

              {/* Advanced / Serial Group */}
              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <div className="flex items-center gap-3">
                    <Barcode className="h-4 w-4 text-blue-600" />
                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest">Advanced Configuration</h3>
                  </div>
                  <div className="flex items-center gap-3 bg-white p-2 rounded-2xl ring-1 ring-slate-100 shadow-sm px-4">
                    <Label className="text-[10px] font-black uppercase text-blue-600 cursor-pointer" htmlFor="serial-track">{t('serialRequired')}</Label>
                    <Switch id="serial-track" checked={isSerialTracking} onCheckedChange={setIsSerialTracking} className="data-[state=checked]:bg-blue-600 scale-90" />
                  </div>
                </div>

                {isSerialTracking && (
                  <div className="bg-white p-6 md:p-8 rounded-[2rem] ring-1 ring-slate-200 shadow-inner space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase text-slate-900 tracking-widest flex items-center gap-2">
                          <Scan className="h-3.5 w-3.5" /> Serial / IMEI Enrollment
                        </Label>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Enter one serial per line or scan directly</p>
                      </div>
                      <Badge className="bg-blue-50 text-blue-700 text-[8px] font-black h-5 px-3 uppercase border-none">Opening Units</Badge>
                    </div>
                    <Textarea 
                      placeholder="SN-123456&#10;SN-789012..."
                      className="min-h-[140px] rounded-2xl bg-slate-50/50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-600 font-mono text-xs uppercase p-5"
                      value={rawSerials}
                      onChange={e => setRawSerials(e.target.value)}
                    />
                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl border border-dashed border-blue-100">
                      <Info className="h-3.5 w-3.5 text-blue-600" />
                      <p className="text-[9px] font-bold text-blue-700 uppercase">Detection Logic: {rawSerials.split(/[\n,]+/).filter(Boolean).length} unique units detected.</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Full Product Description</Label>
                   <Textarea name="description" defaultValue={selectedProduct?.description} className="min-h-[100px] rounded-2xl bg-white border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 text-xs font-medium p-4" placeholder="Enter detailed specifications, feature list, or usage instructions..." />
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 md:p-8 bg-white border-t flex-col sm:flex-row gap-4 shrink-0">
              <Button type="button" variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-[0.2em] px-10 h-12 hover:bg-slate-100" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>{t('cancel')}</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 rounded-full px-16 h-14 font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-blue-100 transition-all active:scale-95 flex-1 md:flex-none">
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
