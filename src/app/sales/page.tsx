
"use client"

import * as React from "react"
import { Plus, Search, Loader2, MoreVertical, Eye, Trash2, TrendingUp, Calendar, AlertCircle, Download, Edit, Printer, Filter, ShoppingCart, CreditCard, History } from "lucide-react"
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

  const stats = React.useMemo(() => ({
    receivable: invoices?.reduce((s, i) => s + (i.balanceDue || 0), 0) || 0,
    collectedToday: invoices?.filter(i => i.lastPaymentDate === new Date().toISOString().split('T')[0]).reduce((s, i) => s + (i.paidAmount || 0), 0) || 0,
    totalSales: invoices?.reduce((s, i) => s + (i.totalAmount || 0), 0) || 0,
    count: invoices?.length || 0
  }), [invoices]);

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
        <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{t('sales')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 rounded-lg gap-2 text-[11px] font-black uppercase tracking-widest border-slate-200">
            <Download className="h-4 w-4" /> {t('export')}
          </Button>
          <Button size="sm" className="h-9 rounded-lg gap-2 px-6 font-black text-[11px] uppercase tracking-widest bg-blue-600 hover:bg-blue-700" asChild>
            <Link href="/sales/new">
              <Plus className="h-4 w-4" /> {t('newInvoice')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Total Sales" value={`৳${stats.totalSales.toLocaleString()}`} icon={ShoppingCart} colorClass="bg-blue-600" />
        <KPICard title="Total Collected" value={`৳${(stats.totalSales - stats.receivable).toLocaleString()}`} icon={TrendingUp} colorClass="bg-green-600" />
        <KPICard title="Total Receivable" value={`৳${stats.receivable.toLocaleString()}`} icon={AlertCircle} colorClass="bg-red-600" />
        <KPICard title="Invoice Count" value={stats.count} icon={Calendar} colorClass="bg-purple-600" />
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between ring-1 ring-slate-100">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <input 
            placeholder="Search invoice or customer..." 
            className="pl-10 h-10 w-full rounded-lg bg-slate-50/50 border-none text-xs font-bold focus:ring-1 focus:ring-blue-600 outline-none transition-all" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <Button variant="ghost" size="sm" className="h-10 px-4 gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">
          <Filter className="h-3.5 w-3.5" /> {t('filter')}
        </Button>
      </div>

      <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-6 h-12">
                  <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} />
                </TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 h-12 pl-4">Ref #</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 h-12">Customer</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 h-12 text-right">Invoice Total</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 h-12 text-right">Balance Due</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 text-center h-12">Payment</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 text-right pr-6 sticky right-0 bg-white/95 h-12 w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="h-40 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-200" /></TableCell></TableRow>
              ) : filteredInvoices?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-40 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] italic">{t('noSales')}</TableCell></TableRow>
              ) : (
                filteredInvoices?.map((inv) => (
                  <TableRow key={inv.id} className={cn("h-20 hover:bg-muted/5 transition-colors group", selectedIds.includes(inv.id) && "bg-blue-50/30")}>
                    <TableCell className="pl-6 py-3">
                      <Checkbox checked={selectedIds.includes(inv.id)} onCheckedChange={() => toggleSelect(inv.id)} />
                    </TableCell>
                    <TableCell className="pl-4">
                       <span className="text-xs font-black text-blue-600 uppercase">{inv.invoiceNumber}</span>
                       <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">{new Date(inv.invoiceDate).toLocaleDateString()}</p>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-700 truncate max-w-[180px] uppercase">{inv.customerName}</TableCell>
                    <TableCell className="text-right text-xs font-black text-slate-900">৳{inv.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-xs font-black text-red-600">৳{(inv.balanceDue || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                        "text-[9px] uppercase font-black px-2 h-5 border-none",
                        inv.status === 'paid' ? "bg-green-50 text-green-700" : inv.status === 'partial' ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"
                      )}>
                        {inv.status || 'UNPAID'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 sticky right-0 bg-white group-hover:bg-slate-50/90 transition-colors shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => router.push(`/sales/${inv.id}/view`)}><Eye className="h-4 w-4" /></Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl p-2 border-slate-100">
                            <DropdownMenuItem onClick={() => router.push(`/sales/payments/collect/${inv.id}`)} className="rounded-xl h-10 text-xs font-bold py-1.5 text-green-600 focus:bg-green-50 focus:text-green-700"><CreditCard className="mr-2 h-4 w-4" /> Collect Payment</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/sales/payments/history/${inv.id}`)} className="rounded-xl h-10 text-xs font-bold py-1.5"><History className="mr-2 h-4 w-4" /> Payment History</DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 bg-slate-50" />
                            <DropdownMenuItem onClick={() => router.push(`/sales/${inv.id}/edit`)} className="rounded-xl h-10 text-xs font-bold py-1.5"><Edit className="mr-2 h-4 w-4" /> Edit Invoice</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/sales/${inv.id}/view?print=true`)} className="rounded-xl h-10 text-xs font-bold py-1.5"><Printer className="mr-2 h-4 w-4" /> Print</DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 bg-slate-50" />
                            <DropdownMenuItem onClick={() => { setSelectedRecord(inv); setIsDeleteAlertOpen(true); }} className="rounded-xl h-10 text-red-600 text-xs font-bold py-1.5 focus:bg-red-50 focus:text-red-700"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
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
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Delete Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-bold text-slate-500">This action is permanent and will remove all linked payment data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-6">
            <AlertDialogCancel className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
