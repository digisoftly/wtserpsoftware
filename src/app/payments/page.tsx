
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
  CreditCard, 
  Printer, 
  Download,
  Filter,
  History,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, limit } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { useBulkSelection } from "@/hooks/use-bulk-selection"
import { BulkActionToolbar } from "@/components/layout/bulk-action-toolbar"
import { PaymentService } from "@/lib/payment-service"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function GlobalPaymentsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const router = useRouter();
  
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const deferredSearch = React.useDeferredValue(searchTerm);

  // Queries
  const paymentsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "payments"), 
      orderBy("createdAt", "desc"),
      limit(100)
    );
  }, [db, companyId, branchId]);
  const { data: payments, isLoading } = useCollection(paymentsQuery);

  const { selectedIds, isAllSelected, toggleSelect, toggleSelectAll, clearSelection, selectedCount } = useBulkSelection(payments);

  const filteredPayments = React.useMemo(() => {
    return payments?.filter(p => 
      p.receiptNumber?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      p.invoiceNumber?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      p.customerName?.toLowerCase().includes(deferredSearch.toLowerCase())
    );
  }, [payments, deferredSearch]);

  const stats = React.useMemo(() => {
    if (!payments) return { today: 0, monthly: 0, total: 0 };
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);
    
    return {
      today: payments.filter(p => p.paymentDate === today).reduce((s, p) => s + (p.amount || 0), 0),
      monthly: payments.filter(p => p.paymentDate?.startsWith(thisMonth)).reduce((s, p) => s + (p.amount || 0), 0),
      total: payments.reduce((s, p) => s + (p.amount || 0), 0)
    };
  }, [payments]);

  const handleDelete = async () => {
    if (!selectedRecord || !db || !companyId || !branchId) return;
    try {
      await PaymentService.deletePayment(db, companyId, branchId, selectedRecord.id);
      toast({ title: t('success'), description: "Payment record reversed." });
      setIsDeleteAlertOpen(false);
    } catch (e) {
      toast({ variant: "destructive", title: t('error') });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-slate-900 uppercase tracking-tight">{t('payment')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Global Collection Terminal</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-10 rounded-full gap-2 text-[10px] font-black uppercase tracking-widest border-slate-200" onClick={() => router.push('/sales')}>
             Receive from Invoice
          </Button>
          <Button size="sm" className="h-10 rounded-full gap-2 px-8 font-black text-[10px] uppercase tracking-[0.2em] bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95" asChild>
            <Link href="/payments/new">
              <Plus className="h-4 w-4" /> {t('addPayment')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Collected Today" value={`৳${stats.today.toLocaleString()}`} icon={TrendingUp} colorClass="bg-green-600" />
        <KPICard title="Collected This Month" value={`৳${stats.monthly.toLocaleString()}`} icon={Calendar} colorClass="bg-blue-600" />
        <KPICard title="Total Collection" value={`৳${stats.total.toLocaleString()}`} icon={CreditCard} colorClass="bg-emerald-600" />
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between ring-1 ring-slate-100">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <input 
            placeholder="Search receipt, invoice or client..." 
            className="pl-10 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs font-bold focus:ring-1 focus:ring-emerald-600 outline-none transition-all" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <Button variant="ghost" size="sm" className="h-10 px-4 gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">
          <Filter className="h-3.5 w-3.5" /> {t('filter')}
        </Button>
      </div>

      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 pl-8 h-12">
                  <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} />
                </TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 h-12 pl-4">Receipt Details</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 h-12">Customer</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 h-12">Invoice Link</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 h-12 text-center">Method</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 h-12 text-right pr-8">Amount Collected</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-slate-500 text-right pr-8 sticky right-0 bg-white/95 h-12 w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="h-64 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-200" /></TableCell></TableRow>
              ) : filteredPayments?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-64 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] italic">No records found</TableCell></TableRow>
              ) : (
                filteredPayments?.map((p, idx) => (
                  <TableRow key={p.id} className={cn("h-20 hover:bg-muted/5 transition-colors group border-slate-50", selectedIds.includes(p.id) && "bg-blue-50/30")}>
                    <TableCell className="pl-8 py-3">
                      <Checkbox checked={selectedIds.includes(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                    </TableCell>
                    <TableCell className="pl-4">
                       <span className="text-[11px] font-black text-emerald-600 font-mono uppercase tracking-tighter">{p.receiptNumber}</span>
                       <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase flex items-center gap-1">
                         <Calendar className="h-2.5 w-2.5" /> {new Date(p.paymentDate).toLocaleDateString()}
                       </p>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-700 truncate max-w-[180px] uppercase">{p.customerName}</TableCell>
                    <TableCell>
                       <Link href={`/sales/${p.invoiceId}/view`} className="text-[10px] font-black text-blue-600 hover:underline flex items-center gap-1">
                         <FileText className="h-3 w-3" /> {p.invoiceNumber}
                       </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[8px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full border-none uppercase">{p.paymentMethod}</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <span className="text-sm font-black text-slate-900 tabular-nums">৳{p.amount?.toLocaleString()}</span>
                       <p className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase">Reference: {p.reference || 'N/A'}</p>
                    </TableCell>
                    <TableCell className="text-right pr-8 sticky right-0 bg-white group-hover:bg-slate-50/90 transition-colors z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => router.push(`/sales/payments/receipt/${p.id}`)}><Printer className="h-4 w-4" /></Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl p-2 border-slate-100">
                            <DropdownMenuItem onClick={() => router.push(`/sales/payments/receipt/${p.id}`)} className="rounded-xl h-10 text-xs font-bold py-1.5"><Eye className="mr-2 h-4 w-4" /> View Receipt</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/sales/payments/history/${p.invoiceId}`)} className="rounded-xl h-10 text-xs font-bold py-1.5"><History className="mr-2 h-4 w-4" /> Payment History</DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1 bg-slate-50" />
                            <DropdownMenuItem onClick={() => { setSelectedRecord(p); setIsDeleteAlertOpen(true); }} className="rounded-xl h-10 text-red-600 text-xs font-bold py-1.5 focus:bg-red-50 focus:text-red-700"><Trash2 className="mr-2 h-4 w-4" /> Reverse Payment</DropdownMenuItem>
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
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900">Reverse Payment?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-bold text-slate-500">This will revert the invoice balance and remove the corresponding journal entry. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-6">
            <AlertDialogCancel className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest" onClick={handleDelete}>Delete Record</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
