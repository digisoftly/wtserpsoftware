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
  LineChart
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { KPICard } from "@/components/dashboard/kpi-card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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

  const stats = React.useMemo(() => ({
    total: projects?.length || 0,
    running: projects?.filter(p => ['Pending', 'Processing', 'In Progress'].includes(p.status)).length || 0,
    completed: projects?.filter(p => ['Completed', 'completed'].includes(p.status)).length || 0,
    totalBudget: projects?.reduce((s, p) => s + (Number(p.budget) || 0), 0) || 0,
    paidAmount: projects?.reduce((s, p) => s + (Number(p.paidAmount) || 0), 0) || 0,
    totalExpenses: expenses?.reduce((s, e) => s + (Number(e.amount) || 0), 0) || 0,
  }), [projects, expenses]);

  const filteredProjects = projects?.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10 w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-teal-600 uppercase tracking-tight">{t('projectAndBilling')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 rounded-full px-6 md:px-8 shadow-xl shadow-indigo-100 h-9 md:h-10 text-[10px] uppercase font-black transition-all active:scale-95" asChild>
             <Link href="/projects/payment">
               <Receipt className="h-4 w-4" /> <span className="hidden sm:inline">{t('receiveCombined')}</span><span className="sm:hidden">Pay</span>
             </Link>
           </Button>
           <Button className="bg-teal-600 hover:bg-teal-700 gap-2 rounded-full px-6 md:px-8 shadow-xl shadow-teal-100 h-9 md:h-10 text-[10px] uppercase font-black transition-all active:scale-95" asChild>
             <Link href="/projects/new">
               <Plus className="h-4 w-4" /> <span className="hidden sm:inline">{t('addProject')}</span><span className="sm:hidden">Add</span>
             </Link>
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('running')} value={stats.running} icon={TrendingUp} colorClass="bg-teal-600" />
        <KPICard title={t('totalBilling')} value={`৳${stats.totalBudget.toLocaleString()}`} icon={DollarSign} colorClass="bg-blue-600" />
        <KPICard title={t('paidAmount')} value={`৳${stats.paidAmount.toLocaleString()}`} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title={t('profit')} value={`৳${(stats.paidAmount - stats.totalExpenses).toLocaleString()}`} icon={LineChart} colorClass="bg-purple-600" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="relative">
          <TabsList className="bg-white border p-1 rounded-2xl shadow-sm mb-6 flex h-auto overflow-x-auto no-scrollbar ring-1 ring-slate-100 justify-start">
            <TabsTrigger value="list" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] uppercase font-black tracking-widest min-w-[120px] md:min-w-[140px] data-[state=active]:bg-teal-50 data-[state=active]:text-teal-600">
              <ClipboardCheck className="h-4 w-4" /> {t('project')}
            </TabsTrigger>
            <TabsTrigger value="billing" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] uppercase font-black tracking-widest min-w-[120px] md:min-w-[140px] data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
              <Receipt className="h-4 w-4" /> {t('billingAndInvoices')}
            </TabsTrigger>
            <TabsTrigger value="payments" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] uppercase font-black tracking-widest min-w-[120px] md:min-w-[140px] data-[state=active]:bg-green-50 data-[state=active]:text-green-600">
              <Wallet className="h-4 w-4" /> {t('payments')}
            </TabsTrigger>
            <TabsTrigger value="expenses" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] uppercase font-black tracking-widest min-w-[120px] md:min-w-[140px] data-[state=active]:bg-red-50 data-[state=active]:text-red-600">
              <Truck className="h-4 w-4" /> {t('expenses')}
            </TabsTrigger>
            <TabsTrigger value="progress" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] uppercase font-black tracking-widest min-w-[120px] md:min-w-[140px] data-[state=active]:bg-amber-50 data-[state=active]:text-amber-600">
              <Wrench className="h-4 w-4" /> {t('progress')}
            </TabsTrigger>
            <TabsTrigger value="reports" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] uppercase font-black tracking-widest min-w-[120px] md:min-w-[140px] data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">
              <BarChart3 className="h-4 w-4" /> {t('reports')}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="space-y-4">
          <div className="flex gap-2 bg-white p-3 rounded-2xl border shadow-sm ring-1 ring-slate-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input 
                placeholder={t('search')} 
                className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs focus:ring-2 focus:ring-teal-500 outline-none" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          {isProjectsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
          ) : (
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white ring-1 ring-slate-100">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="h-12 text-[10px] uppercase font-black pl-8">{t('project')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">{t('customer')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black text-center">{t('status')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black text-right">{t('budget')}</TableHead>
                      <TableHead className="h-12 text-right pr-8 sticky right-0 bg-white/95 backdrop-blur-sm z-20 w-[120px]">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects?.map((p) => (
                      <TableRow key={p.id} className="h-20 hover:bg-muted/5 transition-colors group">
                        <TableCell className="pl-8">
                          <div className="flex flex-col min-w-[120px]">
                            <span className="font-black text-xs uppercase tracking-tight text-slate-900 truncate">{p.name}</span>
                            <span className="text-[9px] font-mono text-muted-foreground uppercase mt-1">{p.projectCode}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{p.customerName}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("text-[8px] h-5 uppercase border-none px-2 font-black", 
                            p.status === 'Completed' ? "bg-green-50 text-green-700" : "bg-teal-50 text-teal-700")}>
                            {t(p.status?.toLowerCase().replace(' ', '_') as any) || p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-black text-xs">৳{p.budget?.toLocaleString()}</TableCell>
                        <TableCell className="text-right pr-8 sticky right-0 bg-white/90 backdrop-blur-sm group-hover:bg-slate-50/90 transition-colors z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                           <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600"><Eye className="h-4 w-4" /></Button>
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

        <TabsContent value="billing" className="space-y-4">
           <div className="p-20 text-center bg-white rounded-3xl border border-dashed ring-1 ring-slate-100">
             <Receipt className="h-10 w-10 text-blue-200 mx-auto mb-4" />
             <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Invoicing terminal is being synchronized with the project list.</p>
           </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white ring-1 ring-slate-100">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="h-12 text-[10px] uppercase font-black pl-8">{t('date')}</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black">Receipt #</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black">{t('customer')}</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black text-right">{t('amount')}</TableHead>
                    <TableHead className="text-right pr-8">{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments?.map((pay) => (
                    <TableRow key={pay.id} className="h-16 hover:bg-muted/5 transition-colors">
                      <TableCell className="pl-8 text-[10px] font-bold text-slate-500 uppercase">{new Date(pay.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-mono text-[10px] font-black text-indigo-600 uppercase">{pay.receiptNumber}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{pay.customerName}</TableCell>
                      <TableCell className="text-right font-black text-xs text-green-600">৳{pay.totalPaid?.toLocaleString()}</TableCell>
                      <TableCell className="text-right pr-8">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-indigo-600 hover:bg-indigo-50"><Eye className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-end">
            <Button className="bg-red-600 hover:bg-red-700 rounded-full h-9 px-6 text-[10px] uppercase font-black">Record Expense</Button>
          </div>
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white ring-1 ring-slate-100">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="h-12 text-[10px] uppercase font-black pl-8">{t('date')}</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black">{t('project')}</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black">{t('type')}</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black text-right">{t('amount')}</TableHead>
                    <TableHead className="text-right pr-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses?.map((e) => (
                    <TableRow key={e.id} className="h-16 hover:bg-muted/5 transition-colors">
                      <TableCell className="pl-8 text-[10px] font-bold text-slate-500 uppercase">{new Date(e.createdAt?.toDate()).toLocaleDateString()}</TableCell>
                      <TableCell className="text-xs font-bold truncate max-w-[120px]">{projects?.find(p => p.id === e.projectId)?.name}</TableCell>
                      <TableCell className="text-[10px] font-black uppercase text-slate-400">{e.type}</TableCell>
                      <TableCell className="text-right font-black text-xs text-red-600">৳{e.amount?.toLocaleString()}</TableCell>
                      <TableCell className="text-right pr-8"><Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {projects?.filter(p => p.status !== 'Completed').map(p => (
               <Card key={p.id} className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 p-6 space-y-4">
                 <div className="flex justify-between items-start gap-2">
                   <h3 className="font-black text-sm uppercase tracking-tight truncate">{p.name}</h3>
                   <Badge className="bg-teal-50 text-teal-600 text-[8px] uppercase border-none font-black shrink-0">{p.status}</Badge>
                 </div>
                 <div className="space-y-2">
                   <div className="flex justify-between text-[9px] font-bold uppercase text-muted-foreground">
                     <span>Deployment Progress</span>
                     <span>{p.progress || 0}%</span>
                   </div>
                   <Progress value={p.progress || 0} className="h-2 bg-slate-100" />
                 </div>
                 <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex -space-x-2">
                       {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold">U{i}</div>)}
                    </div>
                    <Button variant="ghost" size="sm" className="h-7 px-3 text-[9px] font-black uppercase text-teal-600 hover:bg-teal-50 rounded-full">Update <ChevronRight className="h-3 w-3 ml-1" /></Button>
                 </div>
               </Card>
             ))}
           </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
           <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white ring-1 ring-slate-100">
             <div className="p-20 text-center text-muted-foreground italic text-[10px] uppercase font-black tracking-widest">
               Intelligence reports and profitability analysis will load here.
             </div>
           </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-6 md:p-10 shadow-2xl w-[90vw] max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl md:text-2xl font-black font-headline uppercase tracking-tight text-slate-900">{t('delete')}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">{t('projectArchived')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3 flex-col sm:flex-row">
            <AlertDialogCancel className="rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest w-full sm:w-auto">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest w-full sm:w-auto" onClick={() => { if(selectedRecord) { deleteDocumentNonBlocking(doc(db!, "companies", companyId!, "branches", branchId!, "projects", selectedRecord.id)); setIsDeleteAlertOpen(false); toast({ title: t('success') }); } }}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
