"use client"

import * as React from "react"
import { 
  Plus, 
  FileText, 
  Search, 
  Loader2, 
  MoreVertical, 
  Trash2, 
  CheckCircle2, 
  Eye, 
  Edit, 
  Printer,
  Clock,
  Download,
  Share2,
  X,
  MessageSquare
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, deleteDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { KPICard } from "@/components/dashboard/kpi-card"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function QuotationsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const router = useRouter();
  
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Queries
  const quotesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "quotations"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);
  const { data: quotations, isLoading } = useCollection(quotesQuery);

  const stats = React.useMemo(() => ({
    total: quotations?.length || 0,
    draft: quotations?.filter(q => q.status === 'draft').length || 0,
    approved: quotations?.filter(q => q.status === 'approved').length || 0,
    expired: quotations?.filter(q => q.status === 'expired').length || 0,
  }), [quotations]);

  const handleShareWhatsApp = (q: any) => {
    const text = `Hello ${q.customerName}, here is your quotation ${q.quotationNumber} for ৳${q.totalAmount.toLocaleString()}. Status: ${q.status.toUpperCase()}.`;
    window.open(`https://wa.me/${q.customerPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredQuotations = quotations?.filter(q => 
    q.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-blue-600 uppercase tracking-tight">{t('quotations')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Customized Proposal Terminal</p>
        </div>
        <Button className="rounded-full gap-2 h-10 px-8 bg-blue-600 hover:bg-blue-700 font-bold text-[10px] uppercase shadow-xl shadow-blue-100 transition-all active:scale-95 w-full md:w-auto" asChild>
          <Link href="/quotations/new">
            <Plus className="h-4 w-4" /> {t('createQuote')}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('totalQuotations')} value={stats.total} icon={FileText} colorClass="bg-blue-600" />
        <KPICard title={t('pendingQuotes')} value={stats.draft} icon={Clock} colorClass="bg-orange-600" />
        <KPICard title={t('approvedQuotes')} value={stats.approved} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title="Expired" value={stats.expired} icon={X} colorClass="bg-red-600" />
      </div>

      <div className="flex gap-2 bg-white p-3 rounded-xl border shadow-sm ring-1 ring-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input 
            placeholder={t('search')} 
            className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs focus:ring-2 focus:ring-blue-500 transition-all outline-none font-bold" 
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
                  <TableHead className="h-12 text-[10px] uppercase font-black pl-8">{t('quoteNumber')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('customer')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('amount')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black text-center">{t('status')}</TableHead>
                  <TableHead className="h-12 text-right pr-8 sticky right-0 bg-white/95 backdrop-blur-sm z-20 w-[180px]">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations?.map((q) => (
                  <TableRow key={q.id} className="h-16 hover:bg-muted/5 transition-colors group">
                    <TableCell className="pl-8">
                      <span className="font-black text-xs uppercase text-blue-600 tracking-tighter">{q.quotationNumber}</span>
                      <p className="text-[8px] text-muted-foreground font-bold mt-0.5">{new Date(q.quotationDate).toLocaleDateString()}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{q.customerName}</span>
                        <span className="text-[9px] text-muted-foreground font-bold">{q.customerPhone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-xs text-slate-900">৳{q.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("text-[8px] h-5 uppercase border-none px-2 font-black", 
                        q.status === 'approved' ? "bg-green-50 text-green-700" : 
                        q.status === 'sent' ? "bg-blue-50 text-blue-700" : 
                        q.status === 'rejected' ? "bg-red-50 text-red-700" : 
                        q.status === 'expired' ? "bg-slate-100 text-slate-600" : "bg-orange-50 text-orange-700")}>
                        {q.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8 sticky right-0 bg-white/90 backdrop-blur-sm group-hover:bg-slate-50/90 transition-colors z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-end items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => router.push(`/quotations/${q.id}/view`)}><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-amber-600 hover:bg-amber-50" onClick={() => router.push(`/quotations/${q.id}/edit`)}><Edit className="h-3.5 w-3.5" /></Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-blue-50 text-blue-600"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => {}}><Printer className="mr-2 h-3.5 w-3.5" /> {t('print')}</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => handleShareWhatsApp(q)}><MessageSquare className="mr-2 h-3.5 w-3.5" /> WhatsApp</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-xs font-bold text-red-600" onClick={() => { setSelectedRecord(q); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tight text-slate-900">{t('delete')}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">This will permanently remove the proposal record. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest" onClick={() => { if(selectedRecord) deleteDoc(doc(db!, "companies", companyId!, "branches", branchId!, "quotations", selectedRecord.id)); setIsDeleteAlertOpen(false); toast({ title: t('success') }); }}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
