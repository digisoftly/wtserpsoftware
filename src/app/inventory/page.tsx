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
  Filter,
  Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, limit, deleteDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
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
      p.sku?.toLowerCase().includes(deferredSearch.toLowerCase())
    );
  }, [products, deferredSearch]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('inventory')}</h1>
          <nav className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Assets / Item Directory</nav>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-md gap-2 h-9 text-xs font-bold px-4" asChild>
            <Link href="/inventory/bulk-add">Import CSV</Link>
          </Button>
          <Button size="sm" className="rounded-md gap-2 h-9 text-xs font-bold px-4 shadow-lg shadow-primary/10" asChild>
            <Link href="/inventory/new">
              <Plus className="h-3.5 w-3.5" /> {t('addProduct')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard title={t('totalProducts')} value={products?.length || 0} icon={Boxes} />
        <KPICard title={t('lowStock')} value={products?.filter(p => (p.currentStock || 0) <= 5).length || 0} icon={AlertCircle} colorClass="text-red-500" />
        <KPICard title={t('stockValue')} value={`৳0`} icon={DollarSign} colorClass="text-green-600" />
      </div>

      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input 
            placeholder="Filter catalog by name or SKU..." 
            className="pl-9 h-9 w-full rounded-md bg-slate-50/50 border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-primary outline-none" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-9 px-3 gap-2 text-xs font-bold text-slate-500">
            <Filter className="h-3.5 w-3.5" /> Advance
          </Button>
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm rounded-md overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-20">
              <TableRow>
                <TableHead className="w-10 pl-6 h-10">
                  <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} className="h-4 w-4" />
                </TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-500 h-10">Product / SKU</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-500 h-10 text-center">In Stock</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-500 h-10 text-right">Standard Price</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-500 text-right pr-6 sticky right-0 bg-slate-50 h-10 w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="h-40 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-300" /></TableCell></TableRow>
              ) : filtered?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-40 text-center text-slate-400 text-xs font-medium italic">No items found in directory</TableCell></TableRow>
              ) : (
                filtered?.map((p) => (
                  <TableRow key={p.id} className={cn("hover:bg-slate-50/50 transition-colors group", selectedIds.includes(p.id) && "bg-blue-50/30")}>
                    <TableCell className="pl-6 py-3">
                      <Checkbox checked={selectedIds.includes(p.id)} onCheckedChange={() => toggleSelect(p.id)} className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-tighter">{p.name}</span>
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">{p.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "text-[10px] font-bold h-6 px-2.5 inline-flex items-center justify-center rounded uppercase",
                        (p.currentStock || 0) <= 5 ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"
                      )}>
                        {p.currentStock || 0} {p.unit || 'Units'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs font-bold text-slate-700">৳{p.unitPrice?.toLocaleString() || 0}</TableCell>
                    <TableCell className="text-right pr-6 sticky right-0 bg-white group-hover:bg-slate-50 transition-colors">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => router.push(`/inventory/${p.id}/view`)}><Eye className="h-3.5 w-3.5 text-slate-400" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => router.push(`/inventory/${p.id}/edit`)}><Edit className="h-3.5 w-3.5 text-slate-400" /></Button>
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