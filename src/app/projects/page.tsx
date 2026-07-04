"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { 
  Folder, 
  Plus, 
  Search, 
  Loader2, 
  MoreVertical, 
  ClipboardCheck, 
  TrendingUp, 
  Calendar, 
  Clock, 
  Edit, 
  Trash2, 
  Eye, 
  DollarSign, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Package, 
  Calculator, 
  ArrowRight, 
  History, 
  Receipt, 
  Layers, 
  LineChart,
  Truck,
  Wrench,
  BarChart3,
  Download,
  Printer,
  ChevronRight,
  Wallet
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy, doc, setDoc, updateDoc, runTransaction, increment, where } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { KPICard } from "@/components/dashboard/kpi-card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface ProjectAllocation {
  projectId: string;
  projectName: string;
  currentDue: number;
  amountAllocated: number;
}

export default function ProjectBillingSystem() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  
  // UI State
  const [activeTab, setActiveTab] = React.useState("list");
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // --- DATA FETCHING ---
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

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  // --- STATS CALCULATION ---
  const stats = React.useMemo(() => ({
    total: projects?.length || 0,
    running: projects?.filter(p => ['Pending', 'Processing', 'In Progress'].includes(p.status)).length || 0,
    completed: projects?.filter(p => ['Completed', 'completed'].includes(p.status)).length || 0,
    totalBudget: projects?.reduce((s, p) => s + (Number(p.budget) || 0), 0) || 0,
    paidAmount: projects?.reduce((s, p) => s + (Number(p.paidAmount) || 0), 0) || 0,
    totalExpenses: expenses?.reduce((s, e) => s + (Number(e.amount) || 0), 0) || 0,
  }), [projects, expenses]);

  // --- COMBINED BILLING STATE ---
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>("");
  const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([]);
  const [totalPaymentAmount, setTotalPaymentAmount] = React.useState<number>(0);

  const availableProjects = React.useMemo(() => {
    if (!selectedCustomerId || !projects) return [];
    return projects.filter(p => p.customerId === selectedCustomerId && (p.budget - (p.paidAmount || 0)) > 0);
  }, [selectedCustomerId, projects]);

  const allocations = React.useMemo((): ProjectAllocation[] => {
    let remainingPayment = totalPaymentAmount;
    const selectedData = availableProjects.filter(p => selectedProjectIds.includes(p.id));
    return selectedData.map(p => {
      const due = p.budget - (p.paidAmount || 0);
      const allocated = Math.min(remainingPayment, due);
      remainingPayment -= allocated;
      return { projectId: p.id, projectName: p.name, currentDue: due, amountAllocated: allocated };
    });
  }, [availableProjects, selectedProjectIds, totalPaymentAmount]);

  const allocatedTotal = allocations.reduce((sum, a) => sum + a.amountAllocated, 0);

  // --- HANDLERS ---
  const handleSaveProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId || !branchId) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const custId = formData.get("customerId") as string;
    const customer = customers?.find(c => c.id === custId);

    const projectData = {
      name: formData.get("name") as string,
      projectCode: isEditModalOpen ? selectedRecord.projectCode : `PRJ-${Date.now().toString().slice(-6)}`,
      customerId: custId,
      customerName: customer ? `${customer.firstName} ${customer.lastName}` : "Client",
      startDate: formData.get("startDate") as string,
      deadline: formData.get("deadline") as string,
      budget: Number(formData.get("budget")),
      status: formData.get("status"),
      progress: Number(formData.get("progress") || 0),
      description: formData.get("description") || "",
      updatedAt: serverTimestamp(),
    };

    try {
      if (isEditModalOpen) {
        await updateDoc(doc(db, "companies", companyId, "branches", branchId, "projects", selectedRecord.id), projectData);
      } else {
        const newRef = doc(collection(db, "companies", companyId, "branches", branchId, "projects"));
        await setDoc(newRef, { ...projectData, id: newRef.id, companyId, branchId, paidAmount: 0, createdAt: serverTimestamp() });
      }
      toast({ title: t('success') });
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedCustomerId || allocatedTotal <= 0) return;
    setIsSubmitting(true);
    try {
      await runTransaction(db!, async (transaction) => {
        const paymentRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "project_payments"));
        const customer = customers?.find(c => c.id === selectedCustomerId);
        
        transaction.set(paymentRef, {
          id: paymentRef.id,
          receiptNumber: `PAY-${Date.now().toString().slice(-6)}`,
          companyId,
          branchId,
          customerId: selectedCustomerId,
          customerName: customer ? `${customer.firstName} ${customer.lastName}` : "Client",
          totalPaid: allocatedTotal,
          allocations: allocations.filter(a => a.amountAllocated > 0),
          paymentDate: new Date().toISOString(),
          createdAt: serverTimestamp(),
        });

        for (const alloc of allocations) {
          if (alloc.amountAllocated <= 0) continue;
          const projectRef = doc(db!, "companies", companyId!, "branches", branchId!, "projects", alloc.projectId);
          transaction.update(projectRef, { paidAmount: increment(alloc.amountAllocated), updatedAt: serverTimestamp() });
        }
      });
      toast({ title: t('success') });
      setIsPaymentModalOpen(false);
      resetBillingForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetBillingForm = () => {
    setSelectedCustomerId("");
    setSelectedProjectIds([]);
    setTotalPaymentAmount(0);
  };

  const filteredProjects = projects?.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-teal-600 uppercase tracking-tight">{t('projectAndBilling')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 rounded-full px-6 md:px-8 shadow-xl shadow-indigo-100 h-9 md:h-10 text-[10px] uppercase font-black transition-all active:scale-95" onClick={() => setIsPaymentModalOpen(true)}>
             <Receipt className="h-4 w-4" /> <span className="hidden sm:inline">{t('receiveCombined')}</span><span className="sm:hidden">Pay</span>
           </Button>
           <Button className="bg-teal-600 hover:bg-teal-700 gap-2 rounded-full px-6 md:px-8 shadow-xl shadow-teal-100 h-9 md:h-10 text-[10px] uppercase font-black transition-all active:scale-95" onClick={() => { setSelectedRecord(null); setIsAddModalOpen(true); }}>
             <Plus className="h-4 w-4" /> <span className="hidden sm:inline">{t('addProject')}</span><span className="sm:hidden">Add</span>
           </Button>
        </div>
      </div>

      {/* KPI Grid 1-2-4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('running')} value={stats.running} icon={TrendingUp} colorClass="bg-teal-600" />
        <KPICard title={t('totalBilling')} value={`৳${stats.totalBudget.toLocaleString()}`} icon={DollarSign} colorClass="bg-blue-600" />
        <KPICard title={t('paidAmount')} value={`৳${stats.paidAmount.toLocaleString()}`} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title={t('profit')} value={`৳${(stats.paidAmount - stats.totalExpenses).toLocaleString()}`} icon={LineChart} colorClass="bg-purple-600" />
      </div>

      {/* Tabs with Horizontal Scroll for Mobile */}
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
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-amber-600" onClick={() => { setSelectedRecord(p); setIsEditModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
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

      {/* MODALS - Updated for 3-2-1 Column Responsiveness */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedRecord(null); } }}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-slate-50 max-h-[96vh]">
          <DialogHeader className="bg-teal-600 p-6 text-white flex-row items-center gap-4 space-y-0">
             <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md shrink-0"><Folder className="h-6 w-6" /></div>
             <div>
               <DialogTitle className="text-xl font-bold font-headline uppercase tracking-tight">{isEditModalOpen ? t('edit') : t('addProject')}</DialogTitle>
               <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em] mt-0.5">Project Identity Terminal</p>
             </div>
          </DialogHeader>
          <form onSubmit={handleSaveProject} className="p-6 md:p-8 flex flex-col overflow-y-auto custom-scrollbar max-h-[calc(96vh-120px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="space-y-1.5 lg:col-span-2"><Label className="text-[10px] font-black uppercase text-muted-foreground">{t('project')} Name *</Label><Input name="name" required defaultValue={selectedRecord?.name} className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">{t('customer')} *</Label>
                <Select name="customerId" required defaultValue={selectedRecord?.customerId}>
                  <SelectTrigger className="h-11 rounded-xl bg-white"><SelectValue placeholder="Select Client" /></SelectTrigger>
                  <SelectContent>{customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold">{c.firstName} {c.lastName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">{t('startDate')}</Label><Input name="startDate" type="date" required defaultValue={selectedRecord?.startDate} className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">{t('deadline')}</Label><Input name="deadline" type="date" required defaultValue={selectedRecord?.deadline} className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">{t('estimatedBudget')} (৳) *</Label><Input name="budget" type="number" required defaultValue={selectedRecord?.budget} className="h-11 rounded-xl font-black text-blue-600" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">{t('status')}</Label>
                <Select name="status" defaultValue={selectedRecord?.status || "Pending"}>
                  <SelectTrigger className="h-11 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending" className="text-xs font-bold">{t('pending')}</SelectItem>
                    <SelectItem value="In Progress" className="text-xs font-bold">{t('in_progress')}</SelectItem>
                    <SelectItem value="On Hold" className="text-xs font-bold">{t('on_hold')}</SelectItem>
                    <SelectItem value="Completed" className="text-xs font-bold">{t('completed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">Progress %</Label><Input name="progress" type="number" defaultValue={selectedRecord?.progress || 0} className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5 lg:col-span-3"><Label className="text-[10px] font-black uppercase text-muted-foreground">Team Members / Engineers</Label><Input name="team" placeholder="e.g. Engr. Rahim, Tech. Karim..." defaultValue={selectedRecord?.team} className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5 lg:col-span-3"><Label className="text-[10px] font-black uppercase text-muted-foreground">{t('details')}</Label><textarea name="description" className="w-full min-h-[100px] rounded-xl bg-white border ring-1 ring-slate-200 p-4 text-xs resize-none" defaultValue={selectedRecord?.description} /></div>
            </div>
            
            <div className="pt-6 border-t flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0 bg-slate-50 mt-auto">
              <Button type="button" variant="ghost" className="rounded-full px-8 h-12 text-[10px] uppercase font-black" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>{t('cancel')}</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700 rounded-full px-12 h-12 text-[10px] uppercase font-black shadow-lg">
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : t('save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-[1200px] w-[95vw] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-slate-50">
          <DialogHeader className="bg-indigo-600 p-6 text-white flex-row items-center gap-4 space-y-0">
             <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md shrink-0"><Calculator className="h-6 w-6" /></div>
             <div><DialogTitle className="text-xl font-bold font-headline uppercase tracking-tight">{t('receiveCombined')}</DialogTitle></div>
          </DialogHeader>
          <div className="flex flex-col lg:flex-row h-[80vh] lg:h-[70vh]">
            <div className="flex-1 p-4 md:p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('customer')}</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="h-12 rounded-2xl bg-white border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue placeholder={t('search')} /></SelectTrigger>
                    <SelectContent>{customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold">{c.firstName} {c.lastName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('amount')} (৳)</Label>
                  <Input type="number" className="h-12 rounded-2xl bg-white border-none ring-1 ring-slate-200 text-sm font-black text-indigo-600" value={totalPaymentAmount || ''} onChange={e => setTotalPaymentAmount(Number(e.target.value))} />
                </div>
              </div>
              <div className="bg-white rounded-3xl border shadow-sm overflow-hidden flex flex-col min-h-[300px]">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50"><TableRow><TableHead className="w-[60px] pl-6 h-10"></TableHead><TableHead className="text-[10px] font-black uppercase">Project</TableHead><TableHead className="text-[10px] font-black uppercase text-right pr-6">Due</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {availableProjects.map(p => (
                        <TableRow key={p.id} className={cn("h-14 transition-colors", selectedProjectIds.includes(p.id) ? "bg-indigo-50/20" : "opacity-50")}>
                          <TableCell className="pl-6"><Checkbox checked={selectedProjectIds.includes(p.id)} onCheckedChange={checked => checked ? setSelectedProjectIds([...selectedProjectIds, p.id]) : setSelectedProjectIds(selectedProjectIds.filter(id => id !== p.id))} /></TableCell>
                          <TableCell className="font-black text-xs uppercase tracking-tight text-slate-800 truncate max-w-[150px]">{p.name}</TableCell>
                          <TableCell className="text-right pr-6 font-black text-xs text-red-600">৳{(p.budget - (p.paidAmount || 0)).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-[350px] bg-white border-t lg:border-t-0 lg:border-l p-6 md:p-8 flex flex-col shadow-2xl relative z-20 shrink-0">
               <div className="p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-indigo-600 text-white text-center mb-6 md:mb-8">
                 <p className="text-[10px] uppercase font-black opacity-60 mb-1">{t('grandTotal')}</p>
                 <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tighter">৳{allocatedTotal.toLocaleString()}</h2>
               </div>
               <div className="mt-auto pt-6 border-t"><Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl" onClick={handleProcessPayment} disabled={isSubmitting || allocatedTotal <= 0}>{isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : t('postTransaction')}</Button></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
