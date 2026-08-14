
"use client"

import * as React from "react"
import { Search, Plus, Loader2, Edit, Trash2, Boxes, AlertCircle, DollarSign, Filter, Eye, ShieldCheck, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { cn } from "@/lib/utils"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { useBulkSelection } from "@/hooks/use-bulk-selection"
import { BulkActionToolbar } from "@/components/layout/bulk-action-toolbar"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function InventoryPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const deferredSearch = React.useDeferredValue(searchTerm);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "products"),
      orderBy("createdAt", "desc"),
      limit(100)
    );
  }, [db, companyId, branchId]);
  const { data: products, isLoading } = useCollection(productsQuery);

  const { selectedIds, isAllSelected, toggleSelect, toggleSelectAll, clearSelection, selectedCount } = useBulkSelection(products);

  const filtered = React.useMemo(() => {
    return products?.filter(p => 
      p.name?.toLowerCase().includes(deferredSearch.toLowerCase()) || 
      p.sku?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      p.location?.toLowerCase().includes(deferredSearch.toLowerCase())
    );
  }, [products, deferredSearch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-slate-900">{t('inventory')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 rounded-lg gap-2 text-[11px] font-black uppercase tracking-widest border-slate-200" asChild>
            <Link href="/inventory/bulk-add">Import CSV</Link>
          </Button>
          <Button size="sm" className="h-9 rounded-lg gap-2 px-6 font-black text-[11px] uppercase tracking-widest bg-primary" asChild>
            <Link href="/inventory/new">
              <Plus className="h-4 w-4" /> {t('addProduct')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title={t('totalProducts')} value={products?.length || 0} icon={Boxes} colorClass="bg-blue-600" />
        <KPICard title={t('lowStock')} value={products?.filter(p => (p.currentStock || 0) <= 5).length || 0} icon={AlertCircle} colorClass="bg-red-600" />
        <KPICard title={t('stockValue')} value={`৳0`} icon={DollarSign} colorClass="bg-green-600" />
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between ring-1 ring-slate-100">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <input 
            placeholder="Search catalog or location..." 
            className="pl-10 h-10 w-full rounded-lg bg-slate-50/50 border-none text-xs font-bold focus:ring-1 focus:ring-primary outline-none transition-all" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <Button variant="ghost" size="sm" className="h-10 px-4 gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">
          <Filter className="h-3.5 w-3.5" /> {t('filter')}
        </Button>
      </div>

      <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white ring-1 ring-slate-100">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-100 sticky top-0 z-20">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-6 h-10">
                  <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} className="h-4 w-4" />
                </TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 h-10">Product / {t('sku')}</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 h-10 text-center">In Stock</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 h-10">Warranty & Location</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 h-10 text-right">Price</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 text-right pr-6 sticky right-0 bg-slate-50 h-10 w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-40 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-200" /></TableCell></TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] italic">No items found</TableCell></TableRow>
              ) : (
                filtered?.map((p) => (
                  <TableRow key={p.id} className={cn("h-14 hover:bg-slate-50/50 transition-colors group border-slate-50", selectedIds.includes(p.id) && "bg-blue-50/30")}>
                    <TableCell className="pl-6">
                      <Checkbox checked={selectedIds.includes(p.id)} onCheckedChange={() => toggleSelect(p.id)} className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-900 uppercase tracking-tighter">{p.name}</span>
                        <span className="text-[9px] font-mono text-slate-400 font-bold uppercase mt-0.5">{p.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "text-[9px] font-black h-5 px-2 inline-flex items-center justify-center rounded uppercase",
                        (p.currentStock || 0) <= (p.minStockLevel || 5) ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
                      )}>
                        {p.currentStock || 0} {p.unit || 'Units'}
                      </span>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                             <ShieldCheck className="h-3 w-3 text-emerald-500" /> {p.warranty || 'No Warranty'}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                             <MapPin className="h-3 w-3 text-blue-400" /> {p.location || '---'}
                          </div>
                       </div>
                    </TableCell>
                    <TableCell className="text-right text-xs font-black text-slate-700">৳{p.unitPrice?.toLocaleString() || 0}</TableCell>
                    <TableCell className="text-right pr-6 sticky right-0 bg-white group-hover:bg-slate-50/90 transition-colors shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-blue-600" onClick={() => router.push(`/inventory/${p.id}/view`)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-amber-600" onClick={() => router.push(`/inventory/${p.id}/edit`)}><Edit className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <BulkActionToolbar selectedCount={selectedCount} onClear={clearSelection} onAction={() => {}} />
    </div>
  )
}
