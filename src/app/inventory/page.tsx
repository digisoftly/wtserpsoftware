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
  Barcode,
  Copy,
  Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, limit, writeBatch, where, deleteDoc } from "firebase/firestore"
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
import { useBulkSelection } from "@/hooks/use-bulk-selection"
import { BulkActionToolbar } from "@/components/layout/bulk-action-toolbar"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

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

  // Dynamic Master Data
  const unitsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_units"), where("isActive", "==", true), orderBy("name"));
  }, [db, companyId]);
  const { data: masterUnits } = useCollection(unitsQuery);

  const catsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_categories"), where("isActive", "==", true), orderBy("name"));
  }, [db, companyId]);
  const { data: masterCats } = useCollection(catsQuery);

  const brandsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_brands"), where("isActive", "==", true), orderBy("name"));
  }, [db, companyId]);
  const { data: masterBrands } = useCollection(brandsQuery);

  const pTypesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_data"), where("type", "==", "productTypes"), where("isActive", "==", true), orderBy("name"));
  }, [db, companyId]);
  const { data: masterPTypes } = useCollection(pTypesQuery);

  const warrantyQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_data"), where("type", "==", "warrantyTypes"), where("isActive", "==", true), orderBy("name"));
  }, [db, companyId]);
  const { data: masterWarranties } = useCollection(warrantyQuery);

  // Bulk Selection
  const { 
    selectedIds, 
    isAllSelected, 
    isSomeSelected, 
    toggleSelect, 
    toggleSelectAll, 
    clearSelection, 
    selectedCount 
  } = useBulkSelection(products);

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
    
    const currentStock = Number(formData.get("currentStock"));
    const productData = {
      companyId,
      branchId,
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      brandId: formData.get("brandId") as string,
      categoryId: formData.get("categoryId") as string,
      unitId: formData.get("unitId") as string,
      productTypeId: formData.get("productTypeId") as string,
      unitPrice: Number(formData.get("unitPrice")),
      costPrice: Number(formData.get("costPrice")),
      currentStock,
      minStockLevel: Number(formData.get("minStockLevel") || 5),
      warrantyId: formData.get("warrantyId") as string || "",
      description: formData.get("description") as string || "",
      serialNumberTrackingRequired: isSerialTracking,
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
        if (!isEditOpen) batch.update(productRef, { currentStock: snList.length });
      }

      await batch.commit();
      toast({ title: t('success') });
      setIsAddOpen(false);
      setIsEditOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (!db || !companyId || !branchId || selectedIds.length === 0) return;

    if (action === 'delete') {
      if (confirm(`Delete ${selectedIds.length} products?`)) {
        setIsSubmitting(true);
        try {
          const batch = writeBatch(db);
          selectedIds.forEach(id => {
            const docRef = doc(db, "companies", companyId, "branches", branchId, "products", id);
            batch.delete(docRef);
          });
          await batch.commit();
          toast({ title: t('success'), description: `${selectedIds.length} items removed.` });
          clearSelection();
        } catch (e) {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `companies/${companyId}/branches/${branchId}/products/...`,
            operation: 'delete'
          }));
          toast({ variant: "destructive", title: t('error') });
        } finally {
          setIsSubmitting(false);
        }
      }
    } else {
      toast({ title: "Bulk Action", description: `${action} triggered for ${selectedIds.length} products.` });
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-headline text-blue-600 uppercase tracking-tight">{t('inventory')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <Button className="rounded-full gap-2 h-11 px-8 bg-blue-600 hover:bg-blue-700 font-bold text-[10px] uppercase shadow-xl shadow-blue-100 transition-all active:scale-95 w-full md:w-auto" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" /> {t('addProduct')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title={t('totalProducts')} value={stats.totalProducts} icon={Boxes} colorClass="bg-blue-600" />
        <KPICard title={t('lowStock')} value={stats.lowStock} icon={AlertCircle} colorClass="bg-red-600" />
        <KPICard title={t('stockValue')} value={`৳${stats.totalValue.toLocaleString()}`} icon={DollarSign} colorClass="bg-green-600" />
      </div>

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
              <SelectTrigger className="w-[150px] h-11 rounded-2xl bg-slate-50 border-none text-[10px] font-bold uppercase tracking-wider"><SelectValue placeholder={t('brand')} /></SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all" className="text-xs uppercase">{t('allBrands')}</SelectItem>
                {masterBrands?.map(b => <SelectItem key={b.id} value={b.id} className="text-xs uppercase">{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px] h-11 rounded-2xl bg-slate-50 border-none text-[10px] font-bold uppercase tracking-wider"><SelectValue placeholder={t('category')} /></SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value="all" className="text-xs uppercase">{t('allCategories')}</SelectItem>
                {masterCats?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs uppercase">{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden rounded-[2rem] bg-white ring-1 ring-slate-100">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-12 pl-8">
                    <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('itemDescription')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('brand')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black text-center">{t('stock')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black text-right">{t('price')}</TableHead>
                  <TableHead className="h-12 text-right pr-8 sticky right-0 bg-white/95 backdrop-blur-sm z-20 w-[160px]">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered?.map((p) => (
                  <TableRow key={p.id} className={cn("h-20 hover:bg-muted/5 transition-colors group", selectedIds.includes(p.id) && "bg-blue-50/30")}>
                    <TableCell className="pl-8">
                      <Checkbox checked={selectedIds.includes(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-black text-xs uppercase tracking-tight text-slate-900">{p.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">{p.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[10px] font-bold uppercase text-blue-600">{masterBrands?.find(b => b.id === p.brandId)?.name || "---"}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          "text-[11px] font-black h-7 px-4 flex items-center justify-center rounded-xl whitespace-nowrap",
                          (p.currentStock || 0) <= (p.minStockLevel || 5) ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {p.currentStock || 0} {masterUnits?.find(u => u.id === p.unitId)?.shortName || 'Pcs'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right"><span className="font-black text-xs text-slate-900">৳{p.unitPrice?.toLocaleString()}</span></TableCell>
                    <TableCell className="text-right pr-8 sticky right-0 bg-white/90 backdrop-blur-sm group-hover:bg-slate-50/90 transition-colors z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-end items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => openEdit(p)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-amber-600" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-600" onClick={() => deleteDocumentNonBlocking(doc(db!, "companies", companyId!, "branches", branchId!, "products", p.id))}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={isAddOpen || isEditOpen} onOpenChange={(open) => { if(!open) { setIsAddOpen(false); setIsEditOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-slate-50 max-h-[96vh]">
          <DialogHeader className="bg-blue-600 p-6 text-white flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md"><Package className="h-6 w-6" /></div>
              <div>
                <DialogTitle className="text-xl font-black font-headline uppercase tracking-tight">{isEditOpen ? t('edit') : t('addProduct')}</DialogTitle>
                <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em] mt-0.5">Inventory Catalog Definition</p>
              </div>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleSaveProduct} className="flex flex-col overflow-hidden">
            <div className="p-4 md:p-10 space-y-8 overflow-y-auto custom-scrollbar max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">{t('itemDescription')} *</Label><Input name="name" required defaultValue={selectedProduct?.name} className="h-12 rounded-xl" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">{t('sku')} *</Label><Input name="sku" required defaultValue={selectedProduct?.sku} className="h-12 rounded-xl uppercase font-mono" /></div>
                
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">{t('category')}</Label>
                  <Select name="categoryId" defaultValue={selectedProduct?.categoryId}>
                    <SelectTrigger className="h-12 rounded-xl bg-white">{SelectValue ? <SelectValue /> : "General"}</SelectTrigger>
                    <SelectContent>{masterCats?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs uppercase">{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">{t('brand')}</Label>
                  <Select name="brandId" defaultValue={selectedProduct?.brandId}>
                    <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{masterBrands?.map(b => <SelectItem key={b.id} value={b.id} className="text-xs uppercase">{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">{t('productTypes')}</Label>
                  <Select name="productTypeId" defaultValue={selectedProduct?.productTypeId}>
                    <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{masterPTypes?.map(t => <SelectItem key={t.id} value={t.id} className="text-xs uppercase">{t.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">{t('costPrice')}</Label><Input name="costPrice" type="number" required defaultValue={selectedProduct?.costPrice} className="h-12 rounded-xl" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">{t('price')}</Label><Input name="unitPrice" type="number" required defaultValue={selectedProduct?.unitPrice} className="h-12 rounded-xl text-blue-600 font-bold" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">{t('units')}</Label>
                  <Select name="unitId" defaultValue={selectedProduct?.unitId || masterUnits?.find(u => u.isDefault)?.id}>
                    <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{masterUnits?.map(u => <SelectItem key={u.id} value={u.id} className="text-xs uppercase">{u.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">{t('stock')}</Label><Input name="currentStock" type="number" required defaultValue={selectedProduct?.currentStock} className="h-12 rounded-xl" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">Min Limit</Label><Input name="minStockLevel" type="number" defaultValue={selectedProduct?.minStockLevel || 5} className="h-12 rounded-xl text-red-500" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">{t('warrantyTypes')}</Label>
                  <Select name="warrantyId" defaultValue={selectedProduct?.warrantyId}>
                    <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{masterWarranties?.map(w => <SelectItem key={w.id} value={w.id} className="text-xs uppercase">{w.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border shadow-sm">
                   <div className="space-y-0.5"><Label className="text-xs font-black uppercase text-slate-900">{t('serialRequired')}</Label><p className="text-[9px] text-muted-foreground uppercase">Enable IMEI/SN tracking for this item</p></div>
                   <Switch checked={isSerialTracking} onCheckedChange={setIsSerialTracking} />
                </div>
                {isSerialTracking && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Bulk Serial Entry</Label>
                    <Textarea value={rawSerials} onChange={e => setRawSerials(e.target.value)} placeholder="SN123, SN124..." className="min-h-[100px] rounded-2xl font-mono text-[11px]" />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="p-6 md:p-8 bg-white border-t gap-4">
              <Button type="button" variant="ghost" className="rounded-full px-8 h-12 text-[10px] uppercase font-black" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }}>{t('cancel')}</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 rounded-full px-12 h-12 text-[10px] uppercase font-black shadow-lg">
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Toolbar */}
      <BulkActionToolbar 
        selectedCount={selectedCount} 
        onClear={clearSelection} 
        onAction={handleBulkAction}
        isLoading={isSubmitting}
      />
    </div>
  )
}
