
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
  ShoppingCart, 
  CreditCard, 
  History, 
  Copy,
  User,
  Folder,
  ChevronDown,
  ChevronRight,
  Truck,
  ArrowRightLeft
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function SalesPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t, formatCurrency } = useTranslation();
  const router = useRouter();
  
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [expandedCustomers, setExpandedCustomers] = React.useState<Record<string, boolean>>({});

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "sales_invoices"), 
      orderBy("createdAt", "desc"),
      limit(200)
    );
  }, [db, companyId, branchId]);
  const { data: invoices, isLoading } = useCollection(invoicesQuery);

  const stats = React.useMemo(() => ({
    receivable: invoices?.reduce((s, i) => s + (i.balanceDue || 0), 0) || 0,
    collectedToday: invoices?.filter(i => i.lastPaymentDate === new Date().toISOString().split('T')[0]).reduce((s, i) => s + (i.paidAmount || 0), 0) || 0,
    totalSales: invoices?.reduce((s, i) => s + (i.totalAmount || 0), 0) || 0,
    count: invoices?.length || 0
  }), [invoices]);

  const filteredInvoices = React.useMemo(() => {
    if (!invoices) return [];
    return invoices.filter(inv => 
      inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.projectName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [invoices, searchTerm]);

  // Grouping Logic
  const groupedData = React.useMemo(() => {
    const groups: Record<string, any> = {};

    filteredInvoices.forEach(inv => {
      const cId = inv.customerId || 'unknown';
      const cName = inv.customerName || t('unknownCustomer');
      const pName = inv.projectName || t('generalNoProject');

      if (!groups[cId]) {
        groups[cId] = {
          id: cId,
          name: cName,
          totalDocs: 0,
          totalAmount: 0,
          totalDue: 0,
          lastDate: inv.invoiceDate,
          projects: {}
        };
      }

      if (!groups[cId].projects[pName]) {
        groups[cId].projects[pName] = [];
      }

      groups[cId].projects[pName].push(inv);
      groups[cId].totalDocs += 1;
      groups[cId].totalAmount += (Number(inv.totalAmount) || 0);
      groups[cId].totalDue += (Number(inv.balanceDue) || 0);
      if (new Date(inv.invoiceDate) > new Date(groups[cId].lastDate)) {
        groups[cId].lastDate = inv.invoiceDate;
      }
    });

    return Object.values(groups);
  }, [filteredInvoices, t]);

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

  const toggleCustomer = (id: string) => {
    setExpandedCustomers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{t('sales')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 rounded-lg gap-2 text-[11px] font-black uppercase tracking-widest border-slate-200" onClick={() => router.push('/payments/bulk-collect')}>
            <CreditCard className="h-4 w-4" /> Multiple Bill Payment
          </Button>
          <Button size="sm" className="h-9 rounded-lg gap-2 px-6 font-black text-[11px] uppercase tracking-widest bg-blue-600 hover:bg-blue-700" asChild>
            <Link href="/sales/new">
              <Plus className="h-4 w-4" /> {t('add')} {t('sales')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KPICard title="totalSales" value={formatCurrency(stats.totalSales)} icon={ShoppingCart} colorClass="bg-blue-600" />
        <KPICard title="todayIncome" value={formatCurrency(stats.collectedToday)} icon={TrendingUp} colorClass="bg-green-600" />
        <KPICard title="salesDue" value={formatCurrency(stats.receivable)} icon={AlertCircle} colorClass="bg-red-600" />
        <KPICard title="totalDocuments" value={stats.count} icon={Calendar} colorClass="bg-purple-600" />
      </div>

      <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between ring-1 ring-slate-100">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <input 
            placeholder={t('search')} 
            className="pl-10 h-10 w-full rounded-lg bg-slate-50/50 border-none text-xs font-bold focus:ring-1 focus:ring-blue-600 outline-none transition-all" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-slate-200" /></div>
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
                  <div className="text-right hidden sm:block">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('balanceDue')}</p>
                    <p className="text-sm font-black text-red-600">{formatCurrency(customer.totalDue)}</p>
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
                              <Folder className="h-3.5 w-3.5 text-teal-500" />
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
                                  <TableHead className="h-8 text-[9px] uppercase font-black text-right">{t('total')}</TableHead>
                                  <TableHead className="h-8 text-[9px] uppercase font-black text-right">{t('balanceDue')}</TableHead>
                                  <TableHead className="h-8 text-[9px] uppercase font-black text-center">{t('status')}</TableHead>
                                  <TableHead className="h-8 text-right pr-6 w-32">{t('actions')}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {docs.map((inv: any, invIdx: number) => (
                                  <TableRow 
                                    key={inv.id} 
                                    className={cn(
                                      "h-14 transition-all border-b border-white/50",
                                      invIdx % 2 === 0 ? "bg-[#EAF6FF] hover:bg-[#D9EFFF]" : "bg-[#EEF9F1] hover:bg-[#E1F2E6]"
                                    )}
                                  >
                                    <TableCell className="pl-6 font-black text-[10px] text-blue-600 uppercase tracking-tighter">{inv.invoiceNumber}</TableCell>
                                    <TableCell className="text-[10px] font-bold text-slate-500">{new Date(inv.invoiceDate).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right font-black text-[10px] text-slate-900">{formatCurrency(inv.totalAmount)}</TableCell>
                                    <TableCell className="text-right font-black text-[10px] text-red-600">{formatCurrency(inv.balanceDue)}</TableCell>
                                    <TableCell className="text-center">
                                      <Badge className={cn(
                                        "text-[8px] uppercase font-black px-2 h-4 border-none",
                                        inv.status === 'paid' ? "bg-green-50 text-green-700" : inv.status === 'partial' ? "bg-orange-50 text-orange-700" : "bg-red-50 text-red-700"
                                      )}>
                                        {inv.status || 'UNPAID'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                      <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-blue-600" onClick={() => router.push(`/sales/${inv.id}/view`)}><Eye className="h-3.5 w-3.5" /></Button>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-64 rounded-2xl shadow-2xl p-2 border-slate-100">
                                            <DropdownMenuItem onClick={() => router.push(`/sales/payments/collect/${inv.id}`)} className="rounded-xl h-10 text-xs font-bold py-1.5 text-green-600 focus:bg-green-50 focus:text-green-700"><CreditCard className="mr-2 h-4 w-4" /> Collect Payment</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => router.push(`/challans/new?fromInvoice=${inv.id}`)} className="rounded-xl h-10 text-xs font-bold py-1.5 text-blue-600 focus:bg-blue-50 focus:text-blue-700"><Truck className="mr-2 h-4 w-4" /> Generate Challan</DropdownMenuItem>
                                            <DropdownMenuSeparator className="my-1 bg-slate-50" />
                                            <DropdownMenuItem onClick={() => router.push(`/sales/payments/history/${inv.id}`)} className="rounded-xl h-10 text-xs font-bold py-1.5"><History className="mr-2 h-4 w-4" /> Payment History</DropdownMenuItem>
                                            <DropdownMenuSeparator className="my-1 bg-slate-50" />
                                            <DropdownMenuItem onClick={() => router.push(`/sales/new?copyFrom=${inv.id}`)} className="rounded-xl h-10 text-xs font-bold py-1.5"><Copy className="mr-2 h-4 w-4 text-blue-600" /> Duplicate</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => router.push(`/sales/${inv.id}/edit`)} className="rounded-xl h-10 text-xs font-bold py-1.5"><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => router.push(`/sales/${inv.id}/view?print=true`)} className="rounded-xl h-10 text-xs font-bold py-1.5"><Printer className="mr-2 h-4 w-4" /> Print</DropdownMenuItem>
                                            <DropdownMenuSeparator className="my-1 bg-slate-50" />
                                            <DropdownMenuItem onClick={() => { setSelectedRecord(inv); setIsDeleteAlertOpen(true); }} className="rounded-xl h-10 text-red-600 text-xs font-bold py-1.5 focus:bg-red-50 focus:text-red-700"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
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
        <div className="p-16 bg-white rounded-[2rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
          <ShoppingCart className="h-10 w-10 text-slate-200 mb-4" />
          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{t('noData')}</p>
        </div>
      )}

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900">{t('confirmDelete')}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-bold text-slate-500">This action is permanent and will remove all linked payment data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-6">
            <AlertDialogCancel className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-slate-200">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 h-12 text-[10px] font-black uppercase text-[10px] tracking-widest" onClick={handleDelete}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
