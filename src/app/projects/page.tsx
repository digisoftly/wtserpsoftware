
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
    toast({ title: t('success') });
    setIsDeleteAlertOpen(false);
    setSelectedRecord(null);
  };

  return (
    <div className="space-y-6 pb-10 w-full overflow-hidden">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-teal-600 uppercase tracking-tight">{t('projectBilling')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 rounded-full px-6 md:px-8 shadow-xl shadow-indigo-100 h-9 md:h-10 text-[10px] font-black uppercase transition-all active:scale-95" onClick={() => router.push('/projects/payment')}>
              <Receipt className="h-4 w-4" /> {t('add')} {t('payments')}
           </Button>
           <Button className="bg-teal-600 hover:bg-teal-700 gap-2 rounded-full px-6 md:px-8 shadow-xl shadow-teal-100 h-9 md:h-10 text-[10px] font-black uppercase transition-all active:scale-95" asChild>
             <Link href="/projects/new">
               <Plus className="h-4 w-4" /> {t('addProduct')}
             </Link>
           </Button>
        </div>
      </div>

      {/* KPI SECTION - Updated for 2/3/4 grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KPICard title={t('status')} value={stats.running} icon={TrendingUp} colorClass="bg-teal-600" />
        <KPICard title={t('grandTotal')} value={`৳${stats.totalBudget.toLocaleString()}`} icon={DollarSign} colorClass="bg-blue-600" />
        <KPICard title={t('paidAmount')} value={`৳${stats.paidAmount.toLocaleString()}`} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title="Revenue Net" value={`৳${(stats.paidAmount - stats.totalExpenses).toLocaleString()}`} icon={LineChart} colorClass="bg-purple-600" />
      </div>

      {/* TABS SECTION */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="relative">
          <TabsList className="bg-white border p-1 rounded-2xl shadow-sm mb-6 flex h-auto overflow-x-auto no-scrollbar ring-1 ring-slate-100 justify-start">
            <TabsTrigger value="list" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] uppercase font-black tracking-widest min-w-[130px] data-[state=active]:bg-teal-50 data-[state=active]:text-teal-600">
              <ClipboardCheck className="h-4 w-4" /> {t('projectBilling')}
            </TabsTrigger>
            <TabsTrigger value="billing" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] uppercase font-black tracking-widest min-w-[130px] data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
              <Receipt className="h-4 w-4" /> {t('sales')}
            </TabsTrigger>
            <TabsTrigger value="payments" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] uppercase font-black tracking-widest min-w-[130px] data-[state=active]:bg-green-50 data-[state=active]:text-green-600">
              <Wallet className="h-4 w-4" /> {t('payments')}
            </TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] uppercase font-black tracking-widest min-w-[130px] data-[state=active]:bg-red-50 data-[state=active]:text-red-600">
              <Truck className="h-4 w-4" /> {t('expenses')}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* PROJECTS LIST TAB */}
        <TabsContent value="list" className="space-y-4">
          <div className="flex gap-2 bg-white p-3 rounded-2xl border shadow-sm ring-1 ring-slate-100 items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input 
                placeholder={t('search')} 
                className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs focus:ring-2 focus:ring-teal-500 outline-none font-bold" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          {isProjectsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
          ) : (
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white ring-1 ring-slate-100">
              <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="h-12 text-[10px] uppercase font-black pl-8">{t('project')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">{t('customer')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black text-center">{t('status')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black text-right">{t('amount')}</TableHead>
                      <TableHead className="h-12 text-right pr-8 sticky right-0 bg-white/95 backdrop-blur-sm z-20 w-[120px]">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects?.map((p) => (
                      <TableRow key={p.id} className="h-20 hover:bg-muted/5 transition-colors group border-slate-50">
                        <TableCell className="pl-8">
                          <div className="flex flex-col min-w-[150px]">
                            <span className="font-black text-xs uppercase tracking-tight text-slate-900 truncate">{p.name}</span>
                            <span className="text-[9px] font-mono text-teal-600 font-black mt-1 uppercase">CODE: {p.projectCode}</span>
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
      </Tabs>

      {/* DELETE DIALOG */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl w-[95vw] max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tight text-slate-900">{t('confirmDelete')}?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed text-slate-500">
              This action will permanently remove the project record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest flex-1 border-slate-200">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest flex-1 text-white shadow-xl shadow-red-100" onClick={handleDelete}>
              {t('delete')} Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
