"use client"

import * as React from "react"
import { Plus, Loader2, MoreVertical, Calculator, History, CheckCircle2, AlertCircle, DollarSign, FileSpreadsheet } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy, doc, runTransaction, increment } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { KPICard } from "@/components/dashboard/kpi-card"
import { cn } from "@/lib/utils"
import { useTranslation } from "@/hooks/use-translation"

interface ProjectAllocation {
  projectId: string;
  projectName: string;
  totalAmount: number;
  currentDue: number;
  amountAllocated: number;
}

export default function ProjectBillingPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const paymentsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "project_payments"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);
  const { data: payments, isLoading: isPaymentsLoading } = useCollection(paymentsQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  const projectsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "projects");
  }, [db, companyId, branchId]);
  const { data: allProjects } = useCollection(projectsQuery);

  const stats = React.useMemo(() => ({
    totalInvoices: payments?.length || 0,
    paidAmount: payments?.reduce((s, p) => s + (p.totalPaid || 0), 0) || 0,
    dueAmount: allProjects?.reduce((s, p) => s + ((p.budget || 0) - (p.paidAmount || 0)), 0) || 0
  }), [payments, allProjects]);

  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>("");
  const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([]);
  const [totalPaymentAmount, setTotalPaymentAmount] = React.useState<number>(0);
  const [isAutoAllocation, setIsAutoAllocation] = React.useState<boolean>(true);
  const [manualAllocations, setManualAllocations] = React.useState<Record<string, number>>({});

  const availableProjects = React.useMemo(() => {
    if (!selectedCustomerId || !allProjects) return [];
    return allProjects.filter(p => p.customerId === selectedCustomerId && (p.budget - (p.paidAmount || 0)) > 0);
  }, [selectedCustomerId, allProjects]);

  const selectedProjectsData = React.useMemo(() => {
    return availableProjects.filter(p => selectedProjectIds.includes(p.id));
  }, [availableProjects, selectedProjectIds]);

  const combinedDue = selectedProjectsData.reduce((sum, p) => sum + (p.budget - (p.paidAmount || 0)), 0);

  const allocations = React.useMemo((): ProjectAllocation[] => {
    let remainingPayment = totalPaymentAmount;
    return selectedProjectsData.map(p => {
      const due = p.budget - (p.paidAmount || 0);
      let allocated = 0;
      if (isAutoAllocation) {
        allocated = Math.min(remainingPayment, due);
        remainingPayment -= allocated;
      } else {
        allocated = manualAllocations[p.id] || 0;
      }
      return { projectId: p.id, projectName: p.name, totalAmount: p.budget, currentDue: due, amountAllocated: allocated };
    });
  }, [selectedProjectsData, totalPaymentAmount, isAutoAllocation, manualAllocations]);

  const allocatedTotal = allocations.reduce((sum, a) => sum + a.amountAllocated, 0);

  const handleProcessPayment = async () => {
    if (!selectedCustomerId || allocatedTotal <= 0) return;
    setIsSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const paymentRef = doc(collection(db, "companies", companyId!, "branches", branchId!, "project_payments"));
        transaction.set(paymentRef, {
          id: paymentRef.id,
          companyId,
          branchId,
          customerId: selectedCustomerId,
          totalPaid: allocatedTotal,
          allocationType: isAutoAllocation ? "auto" : "manual",
          allocations: allocations.filter(a => a.amountAllocated > 0),
          paymentDate: new Date().toISOString(),
          createdAt: serverTimestamp(),
        });
        for (const alloc of allocations) {
          if (alloc.amountAllocated <= 0) continue;
          const projectRef = doc(db, "companies", companyId!, "branches", branchId!, "projects", alloc.projectId);
          transaction.update(projectRef, { paidAmount: increment(alloc.amountAllocated), updatedAt: serverTimestamp() });
        }
      });
      toast({ title: t('success') });
      resetForm();
      setIsPaymentModalOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomerId("");
    setSelectedProjectIds([]);
    setTotalPaymentAmount(0);
    setManualAllocations({});
    setIsAutoAllocation(true);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-xl font-bold font-headline text-indigo-600">{t('billing')}</h1>
        <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 rounded-full px-8 shadow-lg h-9 text-[10px] uppercase font-bold shadow-indigo-100" onClick={() => setIsPaymentModalOpen(true)}>
          <Plus className="h-4 w-4" /> {t('receiveCombined')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title={t('totalRevenue')} value={stats.totalInvoices} icon={FileSpreadsheet} colorClass="bg-blue-600" />
        <KPICard title={t('paidAmount')} value={`৳${stats.paidAmount.toLocaleString()}`} icon={DollarSign} colorClass="bg-green-600" />
        <KPICard title={t('dueAmount')} value={`৳${stats.dueAmount.toLocaleString()}`} icon={AlertCircle} colorClass="bg-red-600" />
      </div>

      <div className="space-y-4">
        <h2 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
          <History className="h-3 w-3" /> {t('timeline')}
        </h2>
        
        {isPaymentsLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
        ) : payments && payments.length > 0 ? (
          <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white ring-1 ring-slate-100">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-bold h-9">{t('date')}</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9">{t('customer')}</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9">{t('paid')}</TableHead>
                  <TableHead className="text-right h-9"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id} className="h-12 hover:bg-muted/10 transition-colors">
                    <TableCell className="text-[10px] font-bold uppercase">{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs font-bold truncate max-w-[150px]">{customers?.find(c => c.id === p.customerId)?.firstName || "---"}</TableCell>
                    <TableCell className="font-black text-xs text-green-600">৳{p.totalPaid?.toLocaleString()}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-indigo-50 text-indigo-600 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <div className="p-16 bg-white rounded-[2rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
            <History className="h-10 w-10 text-indigo-200 mb-4" />
            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{t('noSales')}</p>
          </div>
        )}
      </div>

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-slate-50">
          <DialogHeader className="bg-indigo-600 p-6 text-white flex-row items-center gap-3">
            <Calculator className="h-6 w-6" />
            <DialogTitle className="text-xl font-bold font-headline uppercase">{t('receiveCombined')}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-6">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Step 1: {t('customer')}</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="h-11 rounded-xl bg-white border-none ring-1 ring-slate-200 shadow-sm font-bold text-xs"><SelectValue placeholder={t('search')} /></SelectTrigger>
                    <SelectContent>{customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold">{c.firstName} {c.lastName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Step 2: {t('total')} (৳)</Label>
                  <Input type="number" className="h-11 rounded-xl bg-white border-none ring-1 ring-slate-200 text-sm font-black text-indigo-600" placeholder="0.00" value={totalPaymentAmount || ''} onChange={(e) => setTotalPaymentAmount(Number(e.target.value))} />
                </div>
                <div className="p-5 bg-indigo-600 text-white rounded-3xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between"><Label className="text-xs font-bold uppercase tracking-wider">FIFO Auto-Distribute</Label><Switch checked={isAutoAllocation} onCheckedChange={setIsAutoAllocation} className="data-[state=checked]:bg-white" /></div>
                  <p className="text-[9px] opacity-70 leading-relaxed font-bold uppercase tracking-widest">System will distribute funds across projects automatically starting from the oldest due date.</p>
                </div>
              </div>
              <div className="lg:col-span-8 space-y-4">
                <div className="flex items-center justify-between"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Step 3: {t('agreements')}</Label><Badge variant="outline" className="text-[9px] uppercase h-5 font-black bg-indigo-50 border-none text-indigo-600">Due: ৳{combinedDue.toLocaleString()}</Badge></div>
                {!selectedCustomerId ? (
                  <div className="h-64 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center text-muted-foreground bg-white/50 ring-1 ring-slate-100">
                    <p className="text-[10px] uppercase font-black tracking-widest opacity-40">{t('initializeMarketLogic')}</p>
                  </div>
                ) : (
                  <div className="border rounded-2xl overflow-hidden shadow-sm bg-white ring-1 ring-slate-100">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead className="w-[40px] h-9"></TableHead>
                          <TableHead className="text-[10px] uppercase font-bold h-9">{t('project')}</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold h-9">{t('dueAmount')}</TableHead>
                          <TableHead className="text-right text-[10px] uppercase font-bold h-9">{t('paid')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {availableProjects.map((p) => {
                          const isSelected = selectedProjectIds.includes(p.id);
                          const allocation = allocations.find(a => a.projectId === p.id);
                          return (
                            <TableRow key={p.id} className={cn(isSelected ? "bg-indigo-50/30" : "opacity-60")}>
                              <TableCell className="py-2"><Checkbox checked={isSelected} onCheckedChange={(checked) => checked ? setSelectedProjectIds([...selectedProjectIds, p.id]) : setSelectedProjectIds(selectedProjectIds.filter(id => id !== p.id))} /></TableCell>
                              <TableCell className="py-2 font-bold text-xs">{p.name}</TableCell>
                              <TableCell className="py-2 font-black text-xs text-red-600">৳{(p.budget - (p.paidAmount || 0)).toLocaleString()}</TableCell>
                              <TableCell className="py-2 text-right">
                                {isAutoAllocation ? (
                                  <div className="text-indigo-600 font-black text-xs">৳{allocation?.amountAllocated.toLocaleString() || "0"}</div>
                                ) : (
                                  <Input type="number" disabled={!isSelected} className="w-20 ml-auto h-7 text-right font-black text-xs rounded-lg" value={manualAllocations[p.id] || ''} onChange={(e) => setManualAllocations({...manualAllocations, [p.id]: Number(e.target.value)})} />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="p-6 bg-white border-t flex items-center justify-between px-10">
            <div className="flex gap-8">
              <div className="space-y-0.5"><p className="text-[8px] uppercase font-black text-muted-foreground tracking-widest">Allocated</p><p className={cn("text-2xl font-headline font-black", allocatedTotal > totalPaymentAmount ? "text-red-600" : "text-indigo-600")}>৳{allocatedTotal.toLocaleString()}</p></div>
              <div className="space-y-0.5 border-l pl-8"><p className="text-[8px] uppercase font-black text-muted-foreground tracking-widest">Remainder</p><p className="text-2xl font-headline font-black text-slate-200">৳{Math.max(0, totalPaymentAmount - allocatedTotal).toLocaleString()}</p></div>
            </div>
            <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-2xl px-12 h-14 font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 active:scale-95 transition-all" disabled={isSubmitting || allocatedTotal <= 0 || allocatedTotal > totalPaymentAmount} onClick={handleProcessPayment}>
              {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : t('postTransaction')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
