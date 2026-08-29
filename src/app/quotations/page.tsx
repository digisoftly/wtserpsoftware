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
  MessageSquare,
  Copy,
  User,
  Folder,
  ChevronDown,
  ChevronRight,
  Filter,
  ArrowRightLeft,
  FileDown
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
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function QuotationsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t, formatCurrency } = useTranslation();
  const router = useRouter();
  
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [expandedCustomers, setExpandedCustomers] = React.useState<Record<string, boolean>>({});

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

  const filteredQuotations = React.useMemo(() => {
    if (!quotations) return [];
    return quotations.filter(q => 
      q.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.projectName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [quotations, searchTerm]);

  // Hierarchical Grouping Logic
  const groupedData = React.useMemo(() => {
    const groups: Record<string, any> = {};

    filteredQuotations.forEach(q => {
      const cId = q.customerId || 'unknown';
      const cName = q.customerName || t('unknownCustomer');
      const pName = q.projectName || t('generalNoProject');

      if (!groups[cId]) {
        groups[cId] = {
          id: cId,
          name: cName,
          totalDocs: 0,
          totalAmount: 0,
          lastDate: q.quotationDate,
          projects: {}
        };
      }

      if (!groups[cId].projects[pName]) {
        groups[cId].projects[pName] = [];
      }

      groups[cId].projects[pName].push(q);
      groups[cId].totalDocs += 1;
      groups[cId].totalAmount += (Number(q.totalAmount) || 0);
      if (new Date(q.quotationDate) > new Date(groups[cId].lastDate)) {
        groups[cId].lastDate = q.quotationDate;
      }
    });

    return Object.values(groups);
  }, [filteredQuotations, t]);

  const handleShareWhatsApp = (q: any) => {
    const text = `Hello ${q.customerName}, here is your quotation ${q.quotationNumber} for ৳${q.totalAmount.toLocaleString()}. Status: ${q.status.toUpperCase()}.`;
    window.open(`https://wa.me/${q.customerPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const toggleCustomer = (id: string) => {
    setExpandedCustomers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 pb-10">
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
        <KPICard title="totalQuotations" value={stats.total} icon={FileText} colorClass="bg-blue-600" />
        <KPICard title="pendingQuotations" value={stats.draft} icon={Clock} colorClass="bg-orange-600" />
        <KPICard title="activeQuotations" value={stats.approved} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title="cancelledQuotations" value={stats.expired} icon={X} colorClass="bg-red-600" />
      </div>

      <div className="flex gap-2 bg-white p-3 rounded-xl border shadow-sm ring-1 ring-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input 
            placeholder={t('search')} 
            className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : groupedData.length > 0 ? (
        <div className="space-y-4">
          {groupedData.map((customer) => (
            <Card key={customer.id} className="border-none shadow-sm overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-slate-100">
              {/* CUSTOMER HEADER */}
              <div 
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50"
                onClick={() => toggleCustomer(customer.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase text-slate-900 leading-tight">{customer.name}</h2>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {customer.totalDocs} {t('documents')}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        • {Object.keys(customer.projects).length} {t('projectBilling')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('totalAmount')}</p>
                    <p className="text-sm font-black text-blue-600">{formatCurrency(customer.totalAmount)}</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('lastDocument')}</p>
                    <p className="text-[11px] font-bold text-slate-700">{new Date(customer.lastDate).toLocaleDateString()}</p>
                  </div>
                  {expandedCustomers[customer.id] ? <ChevronDown className="h-5 w-5 text-slate-300" /> : <ChevronRight className="h-5 w-5 text-slate-300" />}
                </div>
              </div>

              {/* PROJECT GROUPS */}
              {expandedCustomers[customer.id] && (
                <div className="p-4 bg-slate-50/30 space-y-3">
                  {Object.entries(customer.projects).map(([projectName, docs]: [string, any]) => (
                    <Collapsible key={projectName} defaultOpen={true}>
                      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50/50">
                            <div className="flex items-center gap-2">
                              <Folder className="h-3.5 w-3.5 text-amber-500" />
                              <span className="text-[11px] font-black uppercase tracking-tight text-slate-600">{projectName}</span>
                              <Badge className="bg-slate-100 text-slate-500 text-[8px] h-4 font-black border-none ml-2">
                                {docs.length}
                              </Badge>
                            </div>
                            <ChevronDown className="h-3.5 w-3.5 text-slate-300" />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader className="bg-slate-50/50">
                                <TableRow className="h-8">
                                  <TableHead className="h-8 text-[9px] uppercase font-black pl-6">{t('docNo')}</TableHead>
                                  <TableHead className="h-8 text-[9px] uppercase font-black">{t('date')}</TableHead>
                                  <TableHead className="h-8 text-[9px] uppercase font-black text-right">{t('amount')}</TableHead>
                                  <TableHead className="h-8 text-[9px] uppercase font-black text-center">{t('status')}</TableHead>
                                  <TableHead className="h-8 text-right pr-6 w-32">{t('actions')}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {docs.map((q: any, qIdx: number) => (
                                  <TableRow 
                                    key={q.id} 
                                    className={cn(
                                      "h-14 transition-all border-b border-white/50",
                                      qIdx % 2 === 0 ? "bg-[#EAF6FF] hover:bg-[#D9EFFF]" : "bg-[#EEF9F1] hover:bg-[#E1F2E6]"
                                    )}
                                  >
                                    <TableCell className="pl-6 font-black text-[10px] text-blue-600 uppercase tracking-tighter">{q.quotationNumber}</TableCell>
                                    <TableCell className="text-[10px] font-bold text-slate-500">{new Date(q.quotationDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right font-black text-[10px] text-slate-900">{formatCurrency(q.totalAmount)}</TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant="outline" className={cn("text-[8px] h-4 uppercase border-none px-2 font-black", 
                                        q.status === 'approved' ? "bg-green-50 text-green-700" : 
                                        q.status === 'sent' ? "bg-blue-50 text-blue-700" : 
                                        q.status === 'rejected' ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700")}>
                                        {q.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                      <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-blue-600" onClick={() => router.push(`/quotations/${q.id}/view`)}><Eye className="h-3.5 w-3.5" /></Button>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl p-2">
                                            <DropdownMenuItem onClick={() => router.push(`/sales/new?copyFrom=${q.id}&sourceType=quotation`)} className="rounded-xl h-10 text-xs font-bold text-green-600 focus:text-green-700 focus:bg-green-50">
                                              <ArrowRightLeft className="mr-2 h-4 w-4" /> Convert to Invoice
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="my-1" />
                                            <DropdownMenuItem className="text-xs font-bold rounded-xl h-10" onClick={() => router.push(`/quotations/new?copyFrom=${q.id}`)}><Copy className="mr-2 h-3.5 w-3.5 text-blue-600" /> Duplicate</DropdownMenuItem>
                                            <DropdownMenuItem className="text-xs font-bold rounded-xl h-10" onClick={() => router.push(`/quotations/${q.id}/edit`)}><Edit className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                                            <DropdownMenuItem className="text-xs font-bold rounded-xl h-10" onClick={() => router.push(`/quotations/${q.id}/view?print=true`)}><Printer className="mr-2 h-3.5 w-3.5" /> Print</DropdownMenuItem>
                                            <DropdownMenuItem className="text-xs font-bold rounded-xl h-10" onClick={() => handleShareWhatsApp(q)}><MessageSquare className="mr-2 h-3.5 w-3.5" /> WhatsApp</DropdownMenuItem>
                                            <DropdownMenuSeparator className="my-1" />
                                            <DropdownMenuItem className="text-xs font-bold text-red-600 rounded-xl h-10 focus:bg-red-50" onClick={() => { setSelectedRecord(q); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="p-24 bg-white rounded-3xl border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
          <FileText className="h-12 w-12 text-slate-200 mb-4" />
          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{t('noData')}</p>
        </div>
      )}

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tight text-slate-900">{t('confirmDelete')}?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed">This will permanently remove the proposal record.</AlertDialogDescription>
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
