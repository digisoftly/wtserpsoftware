"use client"

import * as React from "react"
import { Search, Plus, Loader2, Boxes, AlertCircle, DollarSign, Eye, Upload } from "lucide-react"
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
  const { t, formatCurrency } = useTranslation();
  const router = useRouter();
  
  const [searchTerm, setSearchTerm] = React.useState("");
  const deferredSearch = React.useDeferredValue(searchTerm);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "products"),
      orderBy("createdAt", "desc"),
      limit(200)
    );
  }, [db, companyId, branchId]);
  const { data: products, isLoading } = useCollection(productsQuery);

  const { selectedIds, isAllSelected, toggleSelect, toggleSelectAll, clearSelection, selectedCount } = useBulkSelection(products);

  const filtered = React.useMemo(() => {
    return products?.filter(p => 
      p.name?.toLowerCase().includes(deferredSearch.toLowerCase()) || 
      p.sku?.toLowerCase().includes(deferredSearch.toLowerCase())
    );
  }, [products, deferredSearch]);

  const stats = React.useMemo(() => ({
    total: products?.length || 0,
    lowStock: products?.filter(p => (p.currentStock || 0) <= (p.minStockLevel || 5)).length || 0,
    value: products?.reduce((s, p) => s + ((p.currentStock || 0) * (p.costPrice || 0)), 0) || 0
  }), [products]);

  // grid-cols-2 md:grid-cols-3 lg:grid-cols-4
  const gridClass = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-4";

  return (
    <div className="space-y-4 md:space-y-6 pb-20 touch-scroll">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-blue-600 uppercase tracking-tight">{t('inventory')}</h1>
          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Asset Registry Terminal</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-9 rounded-full gap-2 text-[10px] font-black uppercase border-slate-200 px-4 shadow-sm bg-white" asChild>
            <Link href="/inventory/bulk-add"><Upload className="h-3.5 w-3.5" /></Link>
          </Button>
          <Button className="h-9 rounded-full gap-2 px-6 font-black text-[10px] uppercase bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100" asChild>
            <Link href="/inventory/new"><Plus className="h-3.5 w-3.5" /> {t('add')}</Link>
          </Button>
        </div>
      </div>

      <div className={gridClass}>
        <KPICard title="totalProducts" value={stats.total} icon={Boxes} colorClass="bg-blue-600" />
        <KPICard title="lowStockCount" value={stats.lowStock} icon={AlertCircle} colorClass="bg-red-600" />
        <KPICard title="stockValue" value={formatCurrency(stats.value)} icon={DollarSign} colorClass="bg-green-600" />
      </div>

      <div className="bg-white p-2 md:p-3 rounded-2xl border ring-1 ring-slate-100">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <input 
            placeholder={t('search')} 
            className="pl-10 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs font-bold outline-none" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-slate-100">
              <TableRow className="h-10 md:h-12">
                <TableHead className="w-10 pl-4 md:pl-8">
                  <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} className="h-4 w-4" />
                </TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500">{t('itemName')}</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 text-center">{t('inStock')}</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 text-right pr-4 md:pr-8">{t('price')}</TableHead>
                <TableHead className="w-12 pr-4 md:pr-8 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="h-40 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-200" /></TableCell></TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-40 text-center text-slate-300 text-[9px] font-black uppercase italic tracking-[0.2em]">{t('noData')}</TableCell></TableRow>
              ) : (
                filtered?.map((p, idx) => (
                  <TableRow 
                    key={p.id} 
                    className={cn(
                      "h-14 md:h-16 transition-all border-b border-white/50 active:bg-blue-50",
                      idx % 2 === 0 ? "bg-[#EAF6FF]/30" : "bg-[#EEF9F1]/30"
                    )}
                  >
                    <TableCell className="pl-4 md:pl-8">
                      <Checkbox checked={selectedIds.includes(p.id)} onCheckedChange={() => toggleSelect(p.id)} className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[11px] font-black text-slate-900 uppercase truncate max-w-[120px] md:max-w-md">{p.name}</span>
                        <span className="text-[8px] font-mono text-blue-600 font-bold uppercase truncate">{p.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "text-[8px] md:text-[9px] font-black h-4 md:h-5 px-1.5 border-none shadow-sm uppercase",
                        (p.currentStock || 0) <= (p.minStockLevel || 5) ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
                      )}>
                        {p.currentStock || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-4 md:pr-8">
                       <span className="text-[11px] font-black text-slate-900 tabular-nums">৳{p.unitPrice?.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-right pr-4 md:pr-8">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600 active:bg-blue-100" onClick={() => router.push(`/inventory/${p.id}/view`)}><Eye className="h-3.5 w-3.5" /></Button>
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