
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
  ChevronRight,
  Target,
  User,
  MapPin,
  DollarSign,
  Wrench,
  AlertCircle,
  CheckCircle2,
  X,
  Package,
  FileSpreadsheet,
  Calculator,
  ArrowRight,
  History,
  ShieldCheck,
  Receipt,
  Layers,
  LineChart
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy, doc, setDoc, updateDoc, runTransaction, increment } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { KPICard } from "@/components/dashboard/kpi-card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"

interface ProjectAllocation {
  projectId: string;
  projectName: string;
  currentDue: number;
  amountAllocated: number;
}

export default function UnifiedProjectBillingPage() {
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

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "sales_invoices"), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: invoices } = useCollection(invoicesQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  // --- STATS CALCULATION ---
  const stats = React.useMemo(() => ({
    total: projects?.length || 0,
    running: projects?.filter(p => p.status === 'active').length || 0,
    completed: projects?.filter(p => p.status === 'completed').length || 0,
    totalBudget: projects?.reduce((s, p) => s + (Number(p.budget) || 0), 0) || 0,
    paidAmount: projects?.reduce((s, p) => s + (Number(p.paidAmount) || 0), 0) || 0,
    totalProfit: projects?.reduce((s, p) => s + ((Number(p.budget) || 0) - (Number(p.projectCost) || 0)), 0) || 0
  }), [projects]);

  // --- COMBINED BILLING STATE ---
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>("");
  const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([]);
  const [totalPaymentAmount, setTotalPaymentAmount] = React.useState<number>(0);
  const [isAutoAllocation, setIsAutoAllocation] = React.useState<boolean>(true);
  const [manualAllocations, setManualAllocations] = React.useState<Record<string, number>>({});

  const availableProjects = React.useMemo(() => {
    if (!selectedCustomerId || !projects) return [];
    return projects.filter(p => p.customerId === selectedCustomerId && (p.budget - (p.paidAmount || 0)) > 0);
  }, [selectedCustomerId, projects]);

  const allocations = React.useMemo((): ProjectAllocation[] => {
    let remainingPayment = totalPaymentAmount;
    const selectedData = availableProjects.filter(p => selectedProjectIds.includes(p.id));
    return selectedData.map(p => {
      const due = p.budget - (p.paidAmount || 0);
      let allocated = 0;
      if (isAutoAllocation) {
        allocated = Math.min(remainingPayment, due);
        remainingPayment -= allocated;
      } else {
        allocated = manualAllocations[p.id] || 0;
      }
      return { projectId: p.id, projectName: p.name, currentDue: due, amountAllocated: allocated };
    });
  }, [availableProjects, selectedProjectIds, totalPaymentAmount, isAutoAllocation, manualAllocations]);

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
      projectType: formData.get("projectType") || "CCTV",
      startDate: formData.get("startDate") as string,
      deadline: formData.get("deadline") as string,
      priority: formData.get("priority") || "Medium",
      budget: Number(formData.get("budget")),
      projectCost: Number(formData.get("projectCost") || 0),
      status: formData.get("status") || "pending",
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
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER & TOP KPIs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black font-headline text-teal-600 uppercase tracking-tight">{t('projectAndBilling')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <div className="flex gap-2">
           <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 rounded-full px-8 shadow-xl shadow-indigo-100 h-10 text-[10px] uppercase font-black transition-all" onClick={() => setIsPaymentModalOpen(true)}>
             <Receipt className="h-4 w-4" /> {t('receiveCombined')}
           </Button>
           <Button className="bg-teal-600 hover:bg-teal-700 gap-2 rounded-full px-8 shadow-xl shadow-teal-100 h-10 text-[10px] uppercase font-black transition-all" onClick={() => setIsAddModalOpen(true)}>
             <Plus className="h-4 w-4" /> {t('addProject')}
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('running')} value={stats.running} icon={TrendingUp} colorClass="bg-teal-600" />
        <KPICard title={t('totalBilling')} value={`৳${stats.totalBudget.toLocaleString()}`} icon={DollarSign} colorClass="bg-blue-600" />
        <KPICard title={t('paidAmount')} value={`৳${stats.paidAmount.toLocaleString()}`} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title={t('dueAmount')} value={`৳${(stats.totalBudget - stats.paidAmount).toLocaleString()}`} icon={AlertCircle} colorClass="bg-red-600" />
      </div>

      {/* TABS CONTAINER */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border p-1 rounded-2xl shadow-sm mb-6 flex overflow-x-auto no-scrollbar h-auto">
          <TabsTrigger value="list" className="rounded-xl gap-2 flex-1 py-3 text-[10px] uppercase font-black tracking-widest min-w-[140px] data-[state=active]:bg-teal-50 data-[state=active]:text-teal-600">
            <ClipboardCheck className="h-4 w-4" /> {t('projects')}
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-xl gap-2 flex-1 py-3 text-[10px] uppercase font-black tracking-widest min-w-[140px] data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <FileSpreadsheet className="h-4 w-4" /> {t('billingAndInvoices')}
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-xl gap-2 flex-1 py-3 text-[10px] uppercase font-black tracking-widest min-w-[140px] data-[state=active]:bg-green-50 data-[state=active]:text-green-600">
            <Wallet className="h-4 w-4" /> {t('payments')}
          </TabsTrigger>
          <TabsTrigger value="expenses" className="rounded-xl gap-2 flex-1 py-3 text-[10px] uppercase font-black tracking-widest min-w-[140px] data-[state=active]:bg-red-50 data-[state=active]:text-red-600">
            <Calculator className="h-4 w-4" /> {t('expenses')}
          </TabsTrigger>
          <TabsTrigger value="reports" className="rounded-xl gap-2 flex-1 py-3 text-[10px] uppercase font-black tracking-widest min-w-[140px] data-[state=active]:bg-violet-50 data-[state=active]:text-violet-600">
            <LineChart className="h-4 w-4" /> {t('reports')}
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PROJECT LIST */}
        <TabsContent value="list" className="space-y-4">
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
                      <TableHead className="h-12 text-right pr-8 sticky right-0 bg-white/95 backdrop-blur-sm z-20 w-[140px]">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects?.map((p) => (
                      <TableRow key={p.id} className="h-20 hover:bg-muted/5 transition-colors group">
                        <TableCell className="pl-8">
                          <div className="flex flex-col">
                            <span className="font-black text-xs uppercase tracking-tight text-slate-900">{p.name}</span>
                            <span className="text-[9px] font-mono text-muted-foreground uppercase mt-1">{p.projectCode}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-700">{p.customerName}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("text-[8px] h-5 uppercase border-none px-2 font-black", p.status === 'active' ? "bg-teal-50 text-teal-700" : "bg-orange-50 text-orange-700")}>{p.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-black text-xs">৳{p.budget?.toLocaleString()}</TableCell>
                        <TableCell className="text-right pr-8 sticky right-0 bg-white/90 backdrop-blur-sm z-20">
                           <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => setSelectedRecord(p)}><Eye className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-amber-600 hover:bg-amber-50" onClick={() => { setSelectedRecord(p); setIsEditModalOpen(true); }}><Edit className="h-4 w-4" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-600 hover:bg-red-50" onClick={() => { setSelectedRecord(p); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
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

        {/* TAB 2: BILLING & INVOICES */}
        <TabsContent value="billing">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-20 text-center text-muted-foreground italic text-[10px] uppercase font-black tracking-widest">
            {t('noSales')}
          </Card>
        </TabsContent>

        {/* TAB 3: PAYMENTS HISTORY */}
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
                      <TableCell className="text-xs font-bold text-slate-700">{pay.customerName}</TableCell>
                      <TableCell className="text-right font-black text-xs text-green-600">৳{pay.totalPaid?.toLocaleString()}</TableCell>
                      <TableCell className="text-right pr-8">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-indigo-50 text-indigo-600"><Eye className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 4: EXPENSES */}
        <TabsContent value="expenses">
          <div className="p-24 bg-white rounded-[3rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
            <Calculator className="h-12 w-12 text-red-200 mb-6" />
            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]">Project Expense Tracking Module</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* COMBINED BILLING WORKSPACE */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-[1200px] w-[95vw] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-slate-50">
          <DialogHeader className="bg-indigo-600 p-6 text-white flex-row items-center gap-4 space-y-0">
             <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md shrink-0"><Calculator className="h-6 w-6" /></div>
             <div><DialogTitle className="text-xl font-bold font-headline uppercase tracking-tight">{t('receiveCombined')}</DialogTitle></div>
          </DialogHeader>
          <div className="flex flex-col lg:flex-row h-[70vh]">
            <div className="flex-1 p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
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
                <Table>
                  <TableHeader className="bg-slate-50"><TableRow><TableHead className="w-[60px] pl-6 h-10"></TableHead><TableHead className="text-[10px] font-black uppercase">Project</TableHead><TableHead className="text-[10px] font-black uppercase text-right pr-6">Due</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {availableProjects.map(p => (
                      <TableRow key={p.id} className={cn("h-14 transition-colors", selectedProjectIds.includes(p.id) ? "bg-indigo-50/20" : "opacity-50")}>
                        <TableCell className="pl-6"><Checkbox checked={selectedProjectIds.includes(p.id)} onCheckedChange={checked => checked ? setSelectedProjectIds([...selectedProjectIds, p.id]) : setSelectedProjectIds(selectedProjectIds.filter(id => id !== p.id))} /></TableCell>
                        <TableCell className="font-black text-xs uppercase tracking-tight text-slate-800">{p.name}</TableCell>
                        <TableCell className="text-right pr-6 font-black text-xs text-red-600">৳{(p.budget - (p.paidAmount || 0)).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
            <div className="w-full lg:w-[350px] bg-white border-l p-8 flex flex-col shadow-2xl relative z-20">
               <div className="p-8 rounded-[2.5rem] bg-indigo-600 text-white text-center mb-8">
                 <p className="text-[10px] uppercase font-black opacity-60 mb-1">{t('grandTotal')}</p>
                 <h2 className="text-4xl font-headline font-black tracking-tighter">৳{allocatedTotal.toLocaleString()}</h2>
               </div>
               <div className="mt-auto pt-8 border-t"><Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl" onClick={handleProcessPayment} disabled={isSubmitting || allocatedTotal <= 0}>{isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : t('postTransaction')}</Button></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PROJECT ADD/EDIT MODAL */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-slate-50">
          <DialogHeader className="bg-teal-600 p-6 text-white flex-row items-center gap-4 space-y-0">
             <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md shrink-0"><Folder className="h-6 w-6" /></div>
             <div><DialogTitle className="text-xl font-bold font-headline uppercase tracking-tight">{isEditModalOpen ? t('edit') : t('addProject')}</DialogTitle></div>
          </DialogHeader>
          <form onSubmit={handleSaveProject} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('project')} Name *</Label><Input name="name" required defaultValue={selectedRecord?.name} className="h-11 rounded-xl border-none ring-1 ring-slate-200" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('customer')} *</Label>
                <Select name="customerId" required defaultValue={selectedRecord?.customerId}>
                  <SelectTrigger className="h-11 rounded-xl border-none ring-1 ring-slate-200"><SelectValue placeholder="Select Client" /></SelectTrigger>
                  <SelectContent>{customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold">{c.firstName} {c.lastName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('estimatedBudget')} (৳) *</Label><Input name="budget" type="number" required defaultValue={selectedRecord?.budget} className="h-11 rounded-xl border-none ring-1 ring-slate-200 font-black text-blue-600" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Progress %</Label><Input name="progress" type="number" defaultValue={selectedRecord?.progress || 0} className="h-11 rounded-xl border-none ring-1 ring-slate-200" /></div>
            </div>
            <div className="md:col-span-2 pt-6 border-t flex justify-end gap-3">
              <Button type="button" variant="ghost" className="rounded-full px-8 h-12 text-[10px] uppercase font-black" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>{t('cancel')}</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700 rounded-full px-12 h-12 text-[10px] uppercase font-black shadow-lg">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('save')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
