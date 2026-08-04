"use client"

import * as React from "react"
import { 
  Plus, 
  Search, 
  Loader2, 
  MoreVertical, 
  Eye, 
  Trash2, 
  TrendingUp, 
  Calendar, 
  AlertCircle, 
  Download,
  Edit,
  Printer,
  Filter,
  ShoppingCart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, limit, deleteDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { useBulkSelection } from "@/hooks/use-bulk-selection"
import { BulkActionToolbar } from "@/components/layout/bulk-action-toolbar"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function SalesPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const router = useRouter();
  
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const deferredSearch = React.useDeferredValue(searchTerm);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "sales_invoices"), 
      orderBy("createdAt", "desc"),
      limit(100)
    );
  }, [db, companyId, branchId]);
  const { data: invoices, isLoading } = useCollection(invoicesQuery);

  const { selectedIds, isAllSelected, toggleSelect, toggleSelectAll, clearSelection, selectedCount } = useBulkSelection(invoices);

  const filteredInvoices = React.useMemo(() => {
    return invoices?.filter(inv => 
      inv.invoiceNumber?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      inv.customerName?.toLowerCase().includes(deferredSearch.toLowerCase())
    );
  }, [invoices, deferredSearch]);

  const handleDelete = async () => {
    if (!selectedRecord || !db || !companyId || !branchId) return;
    try {
      await deleteDoc(doc(db, "companies", companyId, "branches", branchId, "sales_invoices", selectedRecord.id));
      toast({ title: t('success') });
      setIsDeleteAlertOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: t('error') });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('sales')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 rounded-md gap-2 text-xs font-bold border-slate-200">
            <Download className="h-3.5 w-3.5" /> {t('export')}
          </Button>
          <Button size="sm" className="h-8 rounded-md gap-2 px-4 font-bold text-xs" asChild>
            <Link href="/sales/new">
              <Plus className="h-3.5 w-3.5" /> {t('newInvoice')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title={t('todaySales')} value="৳0" icon={TrendingUp} />
        <KPICard title={t('thisMonth')} value="৳0" icon={Calendar} />
        <KPICard title={t('totalOrders')} value={invoices?.length || 0} icon={ShoppingCart} />
        <KPICard title={t('pendingInvoices')} value="৳0" icon={AlertCircle} />
      </div>

      <div className="bg-white p-3 rounded-md border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input 
            placeholder="Search invoice or customer..." 
            className="pl-9 h-8 w-full rounded-md bg-slate-50/50 border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-primary outline-none" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <Button variant="ghost" size="sm" className="h-8 px-3 gap-2 text-[11px] font-bold text-slate-500">
          <Filter className="h-3.5 w-3.5" /> Filter
        </Button>
      </div>

      <Card className="border border-slate-200 shadow-sm rounded-md overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-20">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-6 h-10">
                  <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} className="h-3.5 w-3.5" />
                </TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-500 h-10">Ref #</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-500 h-10">{t('customer')}</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-500 h-10">{t('amount')}</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-500 text-center h-10">Status</TableHead>
                <TableHead className="text-[10px] uppercase font-bold text-slate-500 text-right pr-6 sticky right-0 bg-slate-50 h-10 w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="h-40 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-200" /></TableCell></TableRow>
              ) : filteredInvoices?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-40 text-center text-slate-300 text-xs font-medium italic">{t('noSales')}</TableCell></TableRow>
              ) : (
                filteredInvoices?.map((inv) => (
                  <TableRow key={inv.id} className={cn("hover:bg-slate-50/50 transition-colors group border-slate-50", selectedIds.includes(inv.id) && "bg-blue-50/30")}>
                    <TableCell className="pl-6 py-3">
                      <Checkbox checked={selectedIds.includes(inv.id)} onCheckedChange={() => toggleSelect(inv.id)} className="h-3.5 w-3.5" />
                    </TableCell>
                    <TableCell className="text-xs font-bold text-primary">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-600 truncate max-w-[180px]">{inv.customerName}</TableCell>
                    <TableCell className="text-xs font-bold">৳{inv.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn(
                        "text-[9px] uppercase font-bold px-2 h-4 border-none",
                        inv.status === 'paid' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                      )}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 sticky right-0 bg-white group-hover:bg-slate-50 transition-colors">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => router.push(`/sales/${inv.id}/view`)}><Eye className="h-3.5 w-3.5 text-slate-400" /></Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md"><MoreVertical className="h-3.5 w-3.5 text-slate-400" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-md shadow-xl p-1">
                            <DropdownMenuItem onClick={() => router.push(`/sales/${inv.id}/edit`)} className="text-xs font-medium py-1.5"><Edit className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-medium py-1.5"><Printer className="mr-2 h-3.5 w-3.5" /> Print</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setSelectedRecord(inv); setIsDeleteAlertOpen(true); }} className="text-red-600 text-xs font-medium py-1.5"><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-lg p-6 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Delete Entry?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">Record will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="h-9 text-xs font-bold rounded-md">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 h-9 text-xs font-bold rounded-md" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
