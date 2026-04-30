
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
  Filter, 
  AlertCircle, 
  DollarSign, 
  Tag, 
  Layers, 
  Package,
  ShieldCheck,
  ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { toast } from "@/hooks/use-toast"

export default function InventoryPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  
  // State
  const [searchTerm, setSearchTerm] = React.useState("");
  const [brandFilter, setBrandFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Queries
  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "products"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);
  const { data: products, isLoading } = useCollection(productsQuery);

  // Derived Data
  const stats = React.useMemo(() => ({
    totalProducts: products?.length || 0,
    lowStock: products?.filter(p => (p.currentStock || 0) <= (p.minStockLevel || 5)).length || 0,
    totalValue: products?.reduce((s, p) => s + ((p.currentStock || 0) * (p.unitPrice || 0)), 0) || 0
  }), [products]);

  const brands = React.useMemo(() => 
    ["all", ...Array.from(new Set(products?.map(p => p.brand).filter(Boolean)))], 
  [products]);

  const categories = React.useMemo(() => 
    ["all", ...Array.from(new Set(products?.map(p => p.category).filter(Boolean)))], 
  [products]);

  const filtered = products?.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBrand = brandFilter === "all" || p.brand === brandFilter;
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesBrand && matchesCategory;
  });

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId || !branchId) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const productData = {
      companyId,
      branchId,
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      brand: formData.get("brand") as string,
      model: formData.get("model") as string,
      category: formData.get("category") as string,
      unitPrice: Number(formData.get("unitPrice")),
      costPrice: Number(formData.get("costPrice")),
      currentStock: Number(formData.get("currentStock")),
      minStockLevel: Number(formData.get("minStockLevel") || 5),
      serialNumberTrackingRequired: formData.get("serialRequired") === "on",
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await addDocumentNonBlocking(collection(db, "companies", companyId, "branches", branchId, "products"), productData);
      toast({ title: t('success') });
      setIsAddOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!db || !companyId || !branchId) return;
    const docRef = doc(db, "companies", companyId, "branches", branchId, "products", id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: t('success') });
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-headline text-blue-600 uppercase tracking-tight">{t('inventory')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <Button className="rounded-full gap-2 h-10 px-8 bg-blue-600 hover:bg-blue-700 font-bold text-[10px] uppercase shadow-xl shadow-blue-100 transition-all active:scale-95" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" /> {t('addProduct')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title={t('totalProducts')} value={stats.totalProducts} icon={Boxes} colorClass="bg-blue-600" />
        <KPICard title={t('lowStock')} value={stats.lowStock} icon={AlertCircle} colorClass="bg-red-600" />
        <KPICard title={t('stockValue')} value={`৳${stats.totalValue.toLocaleString()}`} icon={DollarSign} colorClass="bg-green-600" />
      </div>

      <div className="bg-white p-4 rounded-2xl border shadow-sm ring-1 ring-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input 
              placeholder={t('search')} 
              className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="flex gap-2">
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-[140px] h-10 rounded-xl bg-slate-50 border-none text-[10px] font-bold uppercase tracking-wider">
                <SelectValue placeholder={t('brand')} />
              </SelectTrigger>
              <SelectContent>
                {brands.map(b => <SelectItem key={b} value={b} className="text-xs uppercase">{b === "all" ? t('allBrands') : b}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] h-10 rounded-xl bg-slate-50 border-none text-[10px] font-bold uppercase tracking-wider">
                <SelectValue placeholder={t('category')} />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c} className="text-xs uppercase">{c === "all" ? t('allCategories') : c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="h-12 text-[10px] uppercase font-black pl-6">{t('itemDescription')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('brand')} / {t('model')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('category')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black text-center">{t('stock')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black text-right">{t('price')}</TableHead>
                  <TableHead className="h-12 text-right pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered?.map((p) => (
                  <TableRow key={p.id} className="h-16 hover:bg-muted/5 transition-colors group">
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="font-black text-xs uppercase tracking-tight text-slate-900">{p.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{p.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase text-blue-600">{p.brand || "---"}</span>
                        <span className="text-[10px] font-medium text-slate-500 uppercase">{p.model || "Standard"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[8px] font-black uppercase border-none bg-slate-100 text-slate-600 h-5">
                        {p.category || "General"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          "text-xs font-black h-6 w-10 flex items-center justify-center rounded-lg",
                          (p.currentStock || 0) <= (p.minStockLevel || 5) ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {p.currentStock || 0}
                        </span>
                        {p.serialNumberTrackingRequired && (
                          <div className="flex items-center gap-1 mt-1">
                            <ShieldCheck className="h-2.5 w-2.5 text-green-500" />
                            <span className="text-[7px] font-black uppercase text-green-600 tracking-tighter">SERIALIZED</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-black text-xs text-slate-900">৳{p.unitPrice?.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-blue-50 text-blue-600 transition-colors opacity-0 group-hover:opacity-100"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32 rounded-xl shadow-xl">
                          <DropdownMenuItem className="text-xs font-bold"><Edit className="mr-2 h-3.5 w-3.5" /> {t('edit')}</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs font-bold text-red-600" onClick={() => handleDelete(p.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}</DropdownMenuItem>
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

      {/* ADD PRODUCT DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-[2rem]">
          <DialogHeader className="bg-blue-600 p-6 text-white flex-row items-center gap-4 space-y-0">
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold font-headline uppercase tracking-tight">{t('addProduct')}</DialogTitle>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">{t('initialize')}</p>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleAddProduct} className="p-8 space-y-6 bg-slate-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('itemDescription')}</Label>
                  <Input name="name" required className="h-11 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 bg-white" placeholder="e.g. Sony 4K PTZ Camera" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('sku')}</Label>
                  <Input name="sku" required className="h-11 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 bg-white font-mono" placeholder="CAM-SNY-001" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('brand')}</Label>
                    <Input name="brand" className="h-11 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 bg-white" placeholder="Sony" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('model')}</Label>
                    <Input name="model" className="h-11 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 bg-white" placeholder="X-500" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('category')}</Label>
                  <Input name="category" className="h-11 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 bg-white" placeholder="CCTV" />
                </div>
              </div>

              {/* Financials & Stock */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('costPrice')} (৳)</Label>
                    <Input name="costPrice" type="number" required className="h-11 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 bg-white font-black" placeholder="0.00" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('price')} (৳)</Label>
                    <Input name="unitPrice" type="number" required className="h-11 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 bg-white font-black text-blue-600" placeholder="0.00" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('stock')}</Label>
                    <Input name="currentStock" type="number" required className="h-11 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 bg-white font-black" placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Min. Level</Label>
                    <Input name="minStockLevel" type="number" defaultValue="5" className="h-11 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 bg-white font-black" />
                  </div>
                </div>

                <div className="p-5 bg-white rounded-3xl ring-1 ring-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-black uppercase text-slate-900 tracking-tight">{t('serialRequired')}</Label>
                      <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Track individual units via unique S/N</p>
                    </div>
                    <Switch name="serialRequired" className="data-[state=checked]:bg-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t gap-3 flex-col sm:flex-row">
              <Button type="button" variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-8" onClick={() => setIsAddOpen(false)}>{t('cancel')}</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 rounded-full px-12 h-12 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 transition-all active:scale-95">
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
