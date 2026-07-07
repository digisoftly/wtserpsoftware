"use client"

import * as React from "react"
import { 
  Plus, 
  Search, 
  Loader2, 
  MoreVertical, 
  Eye, 
  Trash2, 
  ShoppingCart, 
  TrendingUp, 
  Calendar, 
  ShoppingBag, 
  AlertCircle, 
  Download,
  Edit,
  Printer
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
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
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
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Queries
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "sales_invoices"), 
      orderBy("createdAt", "desc"),
      limit(100)
    );
  }, [db, companyId, branchId]);
  const { data: invoices, isLoading } = useCollection(invoicesQuery);

  // Bulk Selection
  const { 
    selectedIds, 
    isAllSelected, 
    isSomeSelected, 
    toggleSelect, 
    toggleSelectAll, 
    clearSelection, 
    selectedCount 
  } = useBulkSelection(invoices);

  const stats = React.useMemo(() => {
    if (!invoices) return { today: 0, monthly: 0, total: 0, due: 0 };
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);
    
    return {
      today: invoices.filter(i => i.invoiceDate?.startsWith(today)).reduce((s, i) => s + (i.totalAmount || 0), 0),
      monthly: invoices.filter(i => i.invoiceDate?.startsWith(thisMonth)).reduce((s, i) => s + (i.totalAmount || 0), 0),
      total: invoices.length,
      due: invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.balanceDue || 0), 0)
    };
  }, [invoices]);

  const handleBulkAction = async (action: string) => {
    if (!db || !companyId || !branchId || selectedIds.length === 0) return;

    if (action === 'delete') {
      if (confirm(`Delete ${selectedIds.length} items?`)) {
        setIsSubmitting(true);
        const promises = selectedIds.map(id => {
          const docRef = doc(db, "companies", companyId, "branches", branchId, "sales_invoices", id);
          return deleteDoc(docRef);
        });

        const results = await Promise.allSettled(promises);
        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        if (failed > 0) {
          toast({ variant: "destructive", title: "Partial Success", description: `${succeeded} deleted, ${failed} failed.` });
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `companies/${companyId}/branches/${branchId}/sales_invoices/...`,
            operation: 'delete'
          }));
        } else {
          toast({ title: t('success'), description: `${succeeded} items removed.` });
        }
        clearSelection();
        setIsSubmitting(false);
      }
    } else if (action === 'print') {
      window.print();
    }
  };

  const filteredInvoices = React.useMemo(() => {
    return invoices?.filter(inv => 
      inv.invoiceNumber?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      inv.customerName?.toLowerCase().includes(deferredSearch.toLowerCase())
    );
  }, [invoices, deferredSearch]);

  return (
    <div className="space-y-6 pb-10 w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-headline text-blue-600 uppercase tracking-tight">{t('sales')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('lastActiveSales')}</p>
        </div>
        <Button className="rounded-full gap-2 h-9 md:h-10 px-6 md:px-8 bg-blue-600 hover:bg-blue-700 font-bold text-[10px] uppercase shadow-xl shadow-blue-100 transition-all active:scale-95 w-full md:w-auto" asChild>
          <Link href="/sales/new">
            <Plus className="h-4 w-4" /> {t('newInvoice')}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('todaySales')} value={`৳${stats.today.toLocaleString()}`} icon={TrendingUp} colorClass="bg-blue-600" />
        <KPICard title={t('thisMonth')} value={`৳${stats.monthly.toLocaleString()}`} icon={Calendar} colorClass="bg-green-600" />
        <KPICard title={t('totalOrders')} value={stats.total} icon={ShoppingBag} colorClass="bg-purple-600" />
        <KPICard title={t('pendingInvoices')} value={`৳${stats.due.toLocaleString()}`} icon={AlertCircle} colorClass="bg-red-600" />
      </div>

      <div className="flex gap-2 bg-white p-3 rounded-xl border shadow-sm ring-1 ring-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input 
            placeholder={t('search')} 
            className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs focus:ring-2 focus:ring-blue-500 transition-all outline-none" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
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
                  <TableHead className="w-12 pl-6">
                    <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('invoiceNumber')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('customer')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('amount')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('status')}</TableHead>
                  <TableHead className="h-12 text-right pr-6 sticky right-0 bg-white/95 backdrop-blur-sm z-20 w-[150px]">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices?.map((inv) => (
                  <TableRow key={inv.id} className={cn("h-16 hover:bg-muted/5 transition-colors group", selectedIds.includes(inv.id) && "bg-blue-50/30")}>
                    <TableCell className="pl-6">
                      <Checkbox checked={selectedIds.includes(inv.id)} onCheckedChange={() => toggleSelect(inv.id)} />
                    </TableCell>
                    <TableCell className="font-bold text-xs uppercase text-blue-600 truncate max-w-[120px]">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{inv.customerName}</TableCell>
                    <TableCell className="font-black text-xs">৳{inv.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[8px] h-5 uppercase border-none px-2 font-black", 
                        inv.status === 'paid' ? "bg-green-50 text-green-700" : 
                        inv.status === 'partial' ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700")}>
                        {t(`${inv.status}_status` as any)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 sticky right-0 bg-white/90 backdrop-blur-sm group-hover:bg-slate-50/90 transition-colors z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-end items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => router.push(`/sales/${inv.id}/view`)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-amber-600" onClick={() => router.push(`/sales/${inv.id}/edit`)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-600" onClick={() => { setSelectedRecord(inv); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
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

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tight text-slate-900">{t('delete')}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">{t('errorSub')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest" onClick={() => { if(selectedRecord) { deleteDoc(doc(db!, "companies", companyId!, "branches", branchId!, "sales_invoices", selectedRecord.id)); setIsDeleteAlertOpen(false); toast({ title: t('success') }); } }}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
