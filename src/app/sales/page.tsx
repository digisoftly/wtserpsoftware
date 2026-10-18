
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
  ArrowRightLeft,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, limit, deleteDoc, runTransaction, increment, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { usePermissions } from "@/hooks/use-permissions"
import { AuditService } from "@/lib/audit-service"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function SalesPage() {
  const { companyId, branchId, userRole } = useTenant();
  const { can } = usePermissions();
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

  const groupedData = React.useMemo(() => {
    const groups: Record<string, any> = {};
    filteredInvoices.forEach(inv => {
      const cId = inv.customerId || 'unknown';
      const cName = inv.customerName || t('unknownCustomer');
      const pName = inv.projectName || t('generalNoProject');
      if (!groups[cId]) {
        groups[cId] = {
          id: cId, name: cName, totalDocs: 0, totalAmount: 0, totalDue: 0,
          lastDate: inv.invoiceDate, projects: {}
        };
      }
      if (!groups[cId].projects[pName]) groups[cId].projects[pName] = [];
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

    if (selectedRecord.paidAmount > 0) {
      toast({ 
        variant: "destructive", 
        title: "Deletion Restricted", 
        description: "Paid or partially paid invoices cannot be deleted. Please reverse payments first." 
      });
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const invoiceRef = doc(db, "companies", companyId, "branches", branchId, "sales_invoices", selectedRecord.id);
        
        // Restore Inventory Stock
        for (const item of (selectedRecord.items || [])) {
          if (!item.isCustom && item.productId) {
            const productRef = doc(db, "companies", companyId, "branches", branchId, "products", item.productId);
            transaction.update(productRef, { currentStock: increment(item.qty || item.quantity || 0) });
          }
        }

        // Delete Document
        transaction.delete(invoiceRef);

        // Audit Trail
        await AuditService.logAction(db, companyId, {
          userId: userRole?.id || "admin",
          userName: userRole?.name || "System Admin",
          action: 'DELETE',
          module: 'sales',
          recordId: selectedRecord.id,
          details: `Invoice Removed: ${selectedRecord.invoiceNumber} for ${selectedRecord.customerName}. Value: ${selectedRecord.totalAmount}`
        });
      });

      toast({ title: t('success'), description: "Record deleted and inventory restored." });
      setIsDeleteAlertOpen(false);
      setSelectedRecord(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
    }
  };

  const toggleCustomer = (id: string) => {
    setExpandedCustomers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 pb-20 touch-scroll">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t('sales')}</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 rounded-lg gap-2 text-[10px] font-black uppercase tracking-widest border-slate-200" onClick={() => router.push('/payments/bulk-collect')}>
            <CreditCard className="h-4 w-4" /> Multi Payment
          </Button>
          <Button size="sm" className="h-9 rounded-lg gap-2 px-6 font-black text-[10px] uppercase tracking-widest bg-blue-600 hover:bg-blue-700 shadow-xl" asChild>
            <Link href="/sales/new">
              <Plus className="h-4 w-4" /> {t('add')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard title="totalSales" value={formatCurrency(stats.totalSales)} icon={ShoppingCart} colorClass="bg-blue-600" />
        <KPICard title="todayIncome" value={formatCurrency(stats.collectedToday)} icon={TrendingUp} colorClass="bg-green-600" />
        <KPICard title="salesDue" value={formatCurrency(stats.receivable)} icon={AlertCircle} colorClass="bg-red-600" />
        <KPICard title="totalDocuments" value={stats.count} icon={Calendar} colorClass="bg-purple-600" />
      </div>

      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm ring-1 ring-slate-100">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <input 
            placeholder={t('search')} 
            className="pl-10 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs font-bold focus:ring-1 focus:ring-blue-600 outline-none transition-all" 
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
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 active:bg-slate-100"
                onClick={() => toggleCustomer(customer.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="overflow-hidden">
                    <h2 className="text-xs font-black uppercase text-slate-900 leading-tight truncate max-w-[150px] md:max-w-md">{customer.name}</h2>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">
                        {customer.totalDocs} Docs
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-red-600">{formatCurrency(customer.totalDue)}</p>
                  </div>
                  {expandedCustomers[customer.id] ? <ChevronDown className="h-4 w-4 text-slate-300" /> : <ChevronRight className="h-4 w-4 text-slate-300" />}
                </div>
              </div>

              {expandedCustomers[customer.id] && (
                <div className="p-3 bg-slate-50/30 space-y-2">
                  {Object.entries(customer.projects).map(([projectName, docs]: [string, any]) => (
                    <Collapsible key={projectName} defaultOpen={true}>
                      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                        <CollapsibleTrigger asChild>
                          <div className="p-2 px-3 flex items-center justify-between cursor-pointer hover:bg-slate-50/50">
                            <div className="flex items-center gap-2">
                              <Folder className="h-3 w-3 text-teal-500" />
                              <span className="text-[10px] font-black uppercase tracking-tight text-slate-600 truncate max-w-[120px]">{projectName}</span>
                            </div>
                            <ChevronDown className="h-3 w-3 text-slate-300" />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableBody>
                                {docs.map((inv: any) => (
                                  <TableRow key={inv.id} className="h-14 transition-all border-b border-white/50 active:bg-blue-50">
                                    <TableCell className="pl-4 py-2">
                                       <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{inv.invoiceNumber}</p>
                                       <p className="text-[8px] font-bold text-slate-400">{new Date(inv.invoiceDate).toLocaleDateString()}</p>
                                    </TableCell>
                                    <TableCell className="text-right py-2">
                                       <p className="text-[10px] font-black text-slate-900">{formatCurrency(inv.totalAmount)}</p>
                                       <p className="text-[9px] font-black text-red-500">{formatCurrency(inv.balanceDue)}</p>
                                    </TableCell>
                                    <TableCell className="text-right pr-4 py-2">
                                       <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:bg-slate-100">
                                              <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl p-2 border-slate-100">
                                            <DropdownMenuItem onClick={() => router.push(`/sales/${inv.id}/view`)} className="rounded-xl h-10 text-xs font-bold py-1.5">
                                              <Eye className="mr-2 h-4 w-4 text-blue-600" /> View Invoice
                                            </DropdownMenuItem>
                                            
                                            {can('sales', 'edit') && (
                                              <DropdownMenuItem onClick={() => router.push(`/sales/${inv.id}/edit`)} className="rounded-xl h-10 text-xs font-bold py-1.5">
                                                <Edit className="mr-2 h-4 w-4 text-amber-600" /> Edit Invoice
                                              </DropdownMenuItem>
                                            )}

                                            {can('payments', 'create') && inv.status !== 'paid' && (
                                              <DropdownMenuItem onClick={() => router.push(`/sales/payments/collect/${inv.id}`)} className="rounded-xl h-10 text-xs font-bold py-1.5">
                                                <CreditCard className="mr-2 h-4 w-4 text-emerald-600" /> Receive Payment
                                              </DropdownMenuItem>
                                            )}

                                            <DropdownMenuItem onClick={() => router.push(`/sales/payments/history/${inv.id}`)} className="rounded-xl h-10 text-xs font-bold py-1.5">
                                              <History className="mr-2 h-4 w-4 text-indigo-600" /> Payment History
                                            </DropdownMenuItem>

                                            <DropdownMenuSeparator className="my-1 bg-slate-50" />

                                            <DropdownMenuItem onClick={() => router.push(`/sales/${inv.id}/view?print=true`)} className="rounded-xl h-10 text-xs font-bold py-1.5">
                                              <Printer className="mr-2 h-4 w-4 text-slate-600" /> Print Invoice
                                            </DropdownMenuItem>

                                            <DropdownMenuItem onClick={() => router.push(`/sales/new?copyFrom=${inv.id}`)} className="rounded-xl h-10 text-xs font-bold py-1.5">
                                              <Copy className="mr-2 h-4 w-4 text-slate-600" /> Duplicate Invoice
                                            </DropdownMenuItem>

                                            {can('sales', 'delete') && (
                                              <>
                                                <DropdownMenuSeparator className="my-1 bg-slate-50" />
                                                <DropdownMenuItem 
                                                  onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setSelectedRecord(inv); 
                                                    setIsDeleteAlertOpen(true); 
                                                  }} 
                                                  className="rounded-xl h-10 text-red-600 text-xs font-bold py-1.5 focus:bg-red-50 focus:text-red-700"
                                                  disabled={inv.paidAmount > 0}
                                                >
                                                  <Trash2 className="mr-2 h-4 w-4" /> Delete Invoice
                                                </DropdownMenuItem>
                                              </>
                                            )}
                                          </DropdownMenuContent>
                                       </DropdownMenu>
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
        <AlertDialogContent className="rounded-[2.5rem] border-none p-8 md:p-10 shadow-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900">{t('confirmDelete')}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium text-slate-500 leading-relaxed">
              This action will permanently remove the invoice and restore inventory stock. Financial records will be archived in the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-6">
            <AlertDialogCancel className="h-10 rounded-xl font-black uppercase text-[10px] border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 h-10 text-[10px] font-black uppercase text-white" onClick={handleDelete}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
