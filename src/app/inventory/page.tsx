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
  Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, limit, where, deleteDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { useBulkSelection } from "@/hooks/use-bulk-selection"
import { BulkActionToolbar } from "@/components/layout/bulk-action-toolbar"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function InventoryPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const router = useRouter();
  
  // State
  const [searchTerm, setSearchTerm] = React.useState("");
  const deferredSearch = React.useDeferredValue(searchTerm);
  const [brandFilter, setBrandFilter] = React.useState("all");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
      return matchesSearch;
    });
  }, [products, deferredSearch]);

  const handleBulkAction = async (action: string) => {
    if (!db || !companyId || !branchId || selectedIds.length === 0) return;

    if (action === 'delete') {
      if (confirm(`Delete ${selectedIds.length} items?`)) {
        setIsSubmitting(true);
        const promises = selectedIds.map(id => {
          const docRef = doc(db, "companies", companyId, "branches", branchId, "products", id);
          return deleteDoc(docRef);
        });
        const results = await Promise.allSettled(promises);
        clearSelection();
        setIsSubmitting(false);
        toast({ title: t('success') });
      }
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-headline text-blue-600 uppercase tracking-tight">{t('inventory')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <Button className="rounded-full gap-2 h-11 px-8 bg-blue-600 hover:bg-blue-700 font-bold text-[10px] uppercase shadow-xl shadow-blue-100 transition-all active:scale-95 w-full md:w-auto" asChild>
          <Link href="/inventory/new">
            <Plus className="h-4 w-4" /> {t('addProduct')}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title={t('totalProducts')} value={stats.totalProducts} icon={Boxes} colorClass="bg-blue-600" />
        <KPICard title={t('lowStock')} value={stats.lowStock} icon={AlertCircle} colorClass="bg-red-600" />
        <KPICard title={t('stockValue')} value={`৳${stats.totalValue.toLocaleString()}`} icon={DollarSign} colorClass="bg-green-600" />
      </div>

      <div className="bg-white p-4 rounded-3xl border shadow-sm ring-1 ring-slate-100">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input 
            placeholder={t('search')} 
            className="pl-9 h-11 w-full rounded-2xl bg-slate-50/50 border-none text-xs focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
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
                    <TableCell className="text-center">
                      <span className={cn(
                        "text-[11px] font-black h-7 px-4 inline-flex items-center justify-center rounded-xl",
                        (p.currentStock || 0) <= (p.minStockLevel || 5) ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {p.currentStock || 0} {p.unit || 'Pcs'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right"><span className="font-black text-xs text-slate-900">৳{p.unitPrice?.toLocaleString() || 0}</span></TableCell>
                    <TableCell className="text-right pr-8 sticky right-0 bg-white/90 backdrop-blur-sm group-hover:bg-slate-50/90 transition-colors z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-end items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => router.push(`/inventory/${p.id}/view`)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-amber-600" onClick={() => router.push(`/inventory/${p.id}/edit`)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-600" onClick={() => deleteDoc(doc(db!, "companies", companyId!, "branches", branchId!, "products", p.id))}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <BulkActionToolbar selectedCount={selectedCount} onClear={clearSelection} onAction={handleBulkAction} isLoading={isSubmitting} />
    </div>
  )
}
