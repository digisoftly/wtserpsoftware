"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { 
  Plus, 
  Search, 
  Loader2, 
  MoreVertical, 
  ClipboardCheck, 
  TrendingUp, 
  Edit, 
  Trash2, 
  Eye, 
  DollarSign, 
  CheckCircle2, 
  Receipt, 
  Truck, 
  Wrench, 
  BarChart3, 
  ChevronRight,
  Wallet,
  LineChart,
  Filter
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, deleteDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { KPICard } from "@/components/dashboard/kpi-card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ProjectBillingSystem() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = React.useState("list");
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Queries
  const projectsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "projects"), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: projects, isLoading: isProjectsLoading } = useCollection(projectsQuery);

  const paymentsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "project_payments"), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: payments } = useCollection(paymentsQuery);

  const expensesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "project_expenses"), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: expenses } = useCollection(expensesQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "sales_invoices"), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: invoices } = useCollection(invoicesQuery);

  // Stats
  const stats = React.useMemo(() => ({
    total: projects?.length || 0,
    running: projects?.filter(p => ['Pending', 'In Progress', 'Processing'].includes(p.status)).length || 0,
    completed: projects?.filter(p => ['Completed', 'completed'].includes(p.status)).length || 0,
    totalBudget: projects?.reduce((s, p) => s + (Number(p.budget) || 0), 0) || 0,
    paidAmount: projects?.reduce((s, p) => s + (Number(p.paidAmount) || 0), 0) || 0,
    totalExpenses: expenses?.reduce((s, e) => s + (Number(e.amount) || 0), 0) || 0,
  }), [projects, expenses]);

  const filteredProjects = projects?.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.projectCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = () => {
    if (!selectedRecord || !db || !companyId || !branchId) return;
    const docRef = doc(db, "companies", companyId, "branches", branchId, "projects", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: t('common.success') });
    setIsDeleteAlertOpen(false);
    setSelectedRecord(null);
  };

  return (
    <div className="space-y-6 pb-10 w-full overflow-hidden">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-teal-600 uppercase tracking-tight">{t('nav.projectBilling')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('dashboard.happeningToday')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 rounded-full px-6 md:px-8 shadow-xl shadow-indigo-100 h-9 md:h-10 text-[10px] font-black uppercase transition-all active:scale-95" onClick={() => router.push('/projects/payment')}>
              <Receipt className="h-4 w-4" /> {t('common.add')} {t('nav.payments')}
           </Button>
           <Button className="bg-teal-600 hover:bg-teal-700 gap-2 rounded-full px-6 md:px-8 shadow-xl shadow-teal-100 h-9 md:h-10 text-[10px] font-black uppercase transition-all active:scale-95" asChild>
             <Link href="/projects/new">
               <Plus className="h-4 w-4" /> {t('inventory.addProduct')}
             </Link>
           </Button>
        </div>
      </div>

      {/* KPI SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('common.status')} value={stats.running} icon={TrendingUp} colorClass="bg-teal-600" />
        <KPICard title={t('forms.grandTotal')} value={`৳${stats.totalBudget.toLocaleString()}`} icon={DollarSign} colorClass="bg-blue-600" />
        <KPICard title={t('forms.paidAmount')} value={`৳${stats.paidAmount.toLocaleString()}`} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title="Revenue Net" value={`৳${(stats.paidAmount - stats.totalExpenses).toLocaleString()}`} icon={LineChart} colorClass="bg-purple-600" />
      </div>

      {/* TABS SECTION */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="relative">
          <TabsList className="bg-white border p-1 rounded-2xl shadow-sm mb-6 flex h-auto overflow-x-auto no-scrollbar ring-1 ring-slate-100 justify-start">
            <TabsTrigger value="list" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] uppercase font-black tracking-widest min-w-[130px] data-[state=active]:bg-teal-50 data-[state=active]:text-teal-600">
              <ClipboardCheck className="h-4 w-4" /> {t('nav.projectBilling')}
            </TabsTrigger>
            <TabsTrigger value="billing" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] uppercase font-black tracking-widest min-w-[130px] data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
              <Receipt className="h-4 w-4" /> {t('nav.sales')}
            </TabsTrigger>
            <TabsTrigger value="payments" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] uppercase font-black tracking-widest min-w-[130px] data-[state=active]:bg-green-50 data-[state=active]:text-green-600">
              <Wallet className="h-4 w-4" /> {t('nav.payments')}
            </TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] uppercase font-black tracking-widest min-w-[130px] data-[state=active]:bg-red-50 data-[state=active]:text-red-600">
              <Truck className="h-4 w-4" /> {t('nav.expenses')}
            </TabsTrigger>
            <TabsTrigger value="progress" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] uppercase font-black tracking-widest min-w-[130px] data-[state=active]:bg-amber-50 data-[state=active]:text-amber-600">
              <Wrench className="h-4 w-4" /> {t('nav.serialTracking')}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* PROJECTS LIST TAB */}
        <TabsContent value="list" className="space-y-4">
          <div className="flex gap-2 bg-white p-3 rounded-2xl border shadow-sm ring-1 ring-slate-100 items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input 
                placeholder={t('common.search')} 
                className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs focus:ring-2 focus:ring-teal-500 outline-none font-bold" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
            <Button variant="ghost" size="sm" className="h-10 px-4 gap-2 text-[10px] font-black uppercase text-slate-500">
               <Filter className="h-3.5 w-3.5" /> {t('common.actions')}
            </Button>
          </div>

          {isProjectsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
          ) : (
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white ring-1 ring-slate-100">
              <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="h-12 text-[10px] uppercase font-black pl-8">{t('forms.project')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">{t('forms.customer')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black text-center">{t('common.status')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black text-right">{t('common.amount')}</TableHead>
                      <TableHead className="h-12 text-right pr-8 sticky right-0 bg-white/95 backdrop-blur-sm z-20 w-[120px]">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects?.map((p) => (
                      <TableRow key={p.id} className="h-20 hover:bg-muted/5 transition-colors group border-slate-50">
                        <TableCell className="pl-8">
                          <div className="flex flex-col min-w-[150px]">
                            <span className="font-black text-xs uppercase tracking-tight text-slate-900 truncate">{p.name}</span>
                            <span className="text-[9px] font-mono text-teal-600 font-bold mt-1 uppercase">CODE: {p.projectCode}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-700 truncate max-w-[200px] uppercase">{p.customerName}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("text-[8px] h-5 uppercase border-none px-2 font-black shadow-sm", 
                            ['Completed', 'completed'].includes(p.status) ? "bg-green-600 text-white" : "bg-teal-50 text-teal-700")}>
                            {p.status?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-black text-xs text-slate-900 tabular-nums">৳{p.budget?.toLocaleString()}</TableCell>
                        <TableCell className="text-right pr-8 sticky right-0 bg-white/90 backdrop-blur-sm group-hover:bg-slate-50/90 transition-colors z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                           <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => router.push(`/projects/${p.id}/view`)}><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-amber-600" onClick={() => router.push(`/projects/${p.id}/edit`)}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-600" onClick={() => { setSelectedRecord(p); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                           </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* BILLING & INVOICES TAB */}
        <TabsContent value="billing" className="space-y-4">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white ring-1 ring-slate-100">
             <div className="overflow-x-auto">
               <Table>
                 <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="h-12 pl-8 text-[10px] font-black uppercase">Ref #</TableHead>
                      <TableHead className="h-12 text-[10px] font-black uppercase">Customer</TableHead>
                      <TableHead className="h-12 text-[10px] font-black uppercase text-right">Total</TableHead>
                      <TableHead className="h-12 text-[10px] font-black uppercase text-center">Status</TableHead>
                      <TableHead className="h-12 text-right pr-8">Actions</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {invoices?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="h-40 text-center opacity-30 italic text-xs uppercase font-bold tracking-widest">No project invoices generated</TableCell></TableRow>
                    ) : (
                      invoices?.map(inv => (
                        <TableRow key={inv.id} className="h-16 hover:bg-muted/5">
                           <TableCell className="pl-8 font-black text-xs text-blue-600 uppercase">{inv.invoiceNumber}</TableCell>
                           <TableCell className="text-xs font-bold text-slate-700">{inv.customerName}</TableCell>
                           <TableCell className="text-right font-black text-xs">৳{inv.totalAmount?.toLocaleString()}</TableCell>
                           <TableCell className="text-center">
                              <Badge className={cn("text-[8px] h-4 uppercase border-none px-2 font-black", inv.status === 'paid' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>
                                {inv.status}
                              </Badge>
                           </TableCell>
                           <TableCell className="text-right pr-8">
                             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => router.push(`/sales/${inv.id}/view`)}><Eye className="h-4 w-4" /></Button>
                           </TableCell>
                        </TableRow>
                      ))
                    )}
                 </TableBody>
               </Table>
             </div>
          </Card>
        </TabsContent>

        {/* PAYMENTS TAB */}
        <TabsContent value="payments" className="space-y-4">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white ring-1 ring-slate-100">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="h-12 text-[10px] uppercase font-black pl-8">{t('common.date')}</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black">Receipt #</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black">{t('forms.customer')}</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black text-right">{t('common.amount')}</TableHead>
                    <TableHead className="text-right pr-8">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments?.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="h-40 text-center opacity-30 italic text-xs uppercase font-bold tracking-widest">No payment records found</TableCell></TableRow>
                  ) : (
                    payments?.map((pay) => (
                      <TableRow key={pay.id} className="h-16 hover:bg-muted/5 transition-colors">
                        <TableCell className="pl-8 text-[10px] font-bold text-slate-500 uppercase">{new Date(pay.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell className="font-mono text-[10px] font-black text-indigo-600 uppercase">{pay.receiptNumber}</TableCell>
                        <TableCell className="text-xs font-bold text-slate-700 truncate max-w-[150px] uppercase">{pay.customerName}</TableCell>
                        <TableCell className="text-right font-black text-xs text-green-600 tabular-nums">৳{pay.totalPaid?.toLocaleString()}</TableCell>
                        <TableCell className="text-right pr-8">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-indigo-600 hover:bg-indigo-50"><Eye className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* PROGRESS TRACKING TAB */}
        <TabsContent value="progress" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {projects?.filter(p => p.status !== 'Completed').map(p => (
               <Card key={p.id} className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 p-6 space-y-4">
                 <div className="flex justify-between items-start gap-2">
                   <div className="space-y-0.5">
                     <h3 className="font-black text-sm uppercase tracking-tight truncate max-w-[180px]">{p.name}</h3>
                     <p className="text-[9px] font-mono text-teal-600 font-black">{p.projectCode}</p>
                   </div>
                   <Badge className="bg-teal-50 text-teal-600 text-[8px] uppercase border-none font-black shrink-0 shadow-sm">{p.status}</Badge>
                 </div>
                 <div className="space-y-2">
                   <div className="flex justify-between text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                     <span>Deployment Progress</span>
                     <span className="text-teal-600">{p.progress || 0}%</span>
                   </div>
                   <Progress value={p.progress || 0} className="h-2 bg-slate-100" />
                 </div>
                 <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex -space-x-2">
                       {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400">U{i}</div>)}
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 px-3 text-[9px] font-black uppercase text-teal-600 hover:bg-teal-50 rounded-full transition-all group" onClick={() => router.push(`/projects/${p.id}/edit`)}>
                      Update Status <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                 </div>
               </Card>
             ))}
             {projects?.filter(p => p.status !== 'Completed').length === 0 && (
               <div className="col-span-full py-20 text-center opacity-30 italic text-xs uppercase font-bold tracking-[0.3em]">No active deployments to track</div>
             )}
           </div>
        </TabsContent>
      </Tabs>

      {/* DELETE DIALOG */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl w-[95vw] max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tight text-slate-900">{t('common.confirmDelete')}?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed text-slate-500">
              This action will permanently remove the project record and its associated history. This operation is immutable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest flex-1 border-slate-200">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest flex-1 text-white shadow-xl shadow-red-100" onClick={handleDelete}>
              {t('common.delete')} Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
