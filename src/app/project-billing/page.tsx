
"use client"

import * as React from "react"
import { 
  Plus, 
  Loader2, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  Eye, 
  Printer, 
  Calculator, 
  ArrowRight,
  ShieldCheck,
  ChevronRight
} from "lucide-react"
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
import { DocumentTemplate } from "@/components/documents/document-template"

interface ProjectAllocation {
  projectId: string;
  projectName: string;
  currentDue: number;
  amountAllocated: number;
}

export default function ProjectBillingPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [selectedPayment, setSelectedPayment] = React.useState<any>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Queries
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

  // Stats
  const stats = React.useMemo(() => ({
    paidAmount: payments?.reduce((s, p) => s + (p.totalPaid || 0), 0) || 0,
    dueAmount: allProjects?.reduce((s, p) => s + ((p.budget || 0) - (p.paidAmount || 0)), 0) || 0
  }), [payments, allProjects]);

  // Form State
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
      return { 
        projectId: p.id, 
        projectName: p.name, 
        currentDue: due, 
        amountAllocated: allocated 
      };
    });
  }, [selectedProjectsData, totalPaymentAmount, isAutoAllocation, manualAllocations]);

  const allocatedTotal = allocations.reduce((sum, a) => sum + a.amountAllocated, 0);

  const handleProcessPayment = async () => {
    if (!selectedCustomerId || allocatedTotal <= 0) return;
    setIsSubmitting(true);
    try {
      await runTransaction(db!, async (transaction) => {
        const paymentRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "project_payments"));
        const receiptNumber = `PAY-${Date.now().toString().slice(-6)}`;
        const customer = customers?.find(c => c.id === selectedCustomerId);
        
        transaction.set(paymentRef, {
          id: paymentRef.id,
          receiptNumber,
          companyId,
          branchId,
          customerId: selectedCustomerId,
          customerName: customer ? `${customer.firstName} ${customer.lastName}` : "Client",
          totalPaid: allocatedTotal,
          allocationType: isAutoAllocation ? "auto" : "manual",
          allocations: allocations.filter(a => a.amountAllocated > 0),
          paymentDate: new Date().toISOString(),
          createdAt: serverTimestamp(),
        });

        for (const alloc of allocations) {
          if (alloc.amountAllocated <= 0) continue;
          const projectRef = doc(db!, "companies", companyId!, "branches", branchId!, "projects", alloc.projectId);
          transaction.update(projectRef, { 
            paidAmount: increment(alloc.amountAllocated), 
            updatedAt: serverTimestamp() 
          });
        }
      });

      toast({ title: t('success'), description: t('successSub') });
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

  const openView = (p: any) => {
    setSelectedPayment(p);
    setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-headline text-indigo-600 uppercase tracking-tight">{t('billing')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 rounded-full px-8 shadow-xl shadow-indigo-100 h-10 text-[10px] uppercase font-black transition-all active:scale-95" onClick={() => setIsPaymentModalOpen(true)}>
          <Plus className="h-4 w-4" /> {t('receiveCombined')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard title={t('paidAmount')} value={`৳${stats.paidAmount.toLocaleString()}`} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title={t('dueAmount')} value={`৳${stats.dueAmount.toLocaleString()}`} icon={AlertCircle} colorClass="bg-red-600" />
      </div>

      <div className="space-y-4">
        <h2 className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2">
          <History className="h-3 w-3" /> {t('timeline')}
        </h2>
        
        {isPaymentsLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
        ) : payments && payments.length > 0 ? (
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-black h-12 pl-6">{t('date')}</TableHead>
                    <TableHead className="text-[10px] uppercase font-black h-12">Receipt #</TableHead>
                    <TableHead className="text-[10px] uppercase font-black h-12">{t('customer')}</TableHead>
                    <TableHead className="text-[10px] uppercase font-black h-12 text-right">{t('paid')}</TableHead>
                    <TableHead className="text-right h-12 pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id} className="h-16 hover:bg-muted/5 transition-colors group">
                      <TableCell className="pl-6 text-[10px] font-bold uppercase text-slate-500">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-mono text-[10px] font-black text-indigo-600">
                        {p.receiptNumber}
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-700">
                        {p.customerName}
                      </TableCell>
                      <TableCell className="text-right font-black text-xs text-green-600">
                        ৳{p.totalPaid?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-indigo-50 text-indigo-600 transition-colors" onClick={() => openView(p)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : (
          <div className="p-24 bg-white rounded-[3rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
            <History className="h-12 w-12 text-indigo-200 mb-6" />
            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]">{t('noSales')}</p>
          </div>
        )}
      </div>

      {/* COMBINED BILLING WORKSPACE */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-[95vw] w-[1200px] p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-slate-50">
          <DialogHeader className="bg-indigo-600 p-5 text-white flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                <Calculator className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-bold font-headline uppercase tracking-tight">{t('receiveCombined')}</DialogTitle>
                <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em] leading-none mt-1">Multi-Project Revenue Distribution</p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row h-[75vh] overflow-hidden">
            {/* Form Column */}
            <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('customer')}</Label>
                  <Select value={selectedCustomerId} onValueChange={(val) => { setSelectedCustomerId(val); setSelectedProjectIds([]); }}>
                    <SelectTrigger className="h-12 rounded-2xl bg-white border-none ring-1 ring-slate-200 shadow-sm transition-all focus:ring-2 focus:ring-indigo-600 font-bold text-xs">
                      <SelectValue placeholder={t('search')} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold">{c.firstName} {c.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('amount')} (৳)</Label>
                  <Input 
                    type="number" 
                    className="h-12 rounded-2xl bg-white border-none ring-1 ring-slate-200 text-sm font-black text-indigo-600 focus:ring-2 focus:ring-indigo-600" 
                    placeholder="0.00" 
                    value={totalPaymentAmount || ''} 
                    onChange={(e) => setTotalPaymentAmount(Number(e.target.value))} 
                  />
                </div>
              </div>

              {/* PROJECT GRID */}
              <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('projects')}</Label>
                  <Badge variant="outline" className="text-[9px] uppercase h-5 font-black bg-indigo-50 border-none text-indigo-600">Client Dues: ৳{combinedDue.toLocaleString()}</Badge>
                </div>

                <div className="flex-1 bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden flex flex-col border">
                  {!selectedCustomerId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-30 gap-4">
                      <ShieldCheck className="h-12 w-12" />
                      <p className="text-[10px] uppercase font-black tracking-[0.3em]">Select customer to load projects</p>
                    </div>
                  ) : (
                    <div className="overflow-auto flex-1 custom-scrollbar">
                      <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10">
                          <TableRow>
                            <TableHead className="w-[60px] pl-6 h-10"></TableHead>
                            <TableHead className="text-[10px] uppercase font-black h-10">{t('project')}</TableHead>
                            <TableHead className="text-[10px] uppercase font-black h-10 text-right">{t('dueAmount')}</TableHead>
                            <TableHead className="text-[10px] uppercase font-black h-10 text-right pr-6">{t('paid')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {availableProjects.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="h-48 text-center text-[10px] font-bold uppercase text-muted-foreground opacity-50 italic">
                                No active project dues for this client
                              </TableCell>
                            </TableRow>
                          ) : (
                            availableProjects.map((p) => {
                              const isSelected = selectedProjectIds.includes(p.id);
                              const allocation = allocations.find(a => a.projectId === p.id);
                              return (
                                <TableRow key={p.id} className={cn("h-14 transition-colors", isSelected ? "bg-indigo-50/30" : "opacity-40")}>
                                  <TableCell className="pl-6">
                                    <Checkbox 
                                      checked={isSelected} 
                                      onCheckedChange={(checked) => checked 
                                        ? setSelectedProjectIds([...selectedProjectIds, p.id]) 
                                        : setSelectedProjectIds(selectedProjectIds.filter(id => id !== p.id))
                                      } 
                                    />
                                  </TableCell>
                                  <TableCell className="font-black text-[11px] uppercase tracking-tighter text-slate-900">{p.name}</TableCell>
                                  <TableCell className="text-right font-black text-xs text-red-600">৳{(p.budget - (p.paidAmount || 0)).toLocaleString()}</TableCell>
                                  <TableCell className="text-right pr-6">
                                    {isAutoAllocation ? (
                                      <span className="text-indigo-600 font-black text-xs">৳{allocation?.amountAllocated.toLocaleString() || "0"}</span>
                                    ) : (
                                      <Input 
                                        type="number" 
                                        disabled={!isSelected} 
                                        className="w-24 ml-auto h-8 text-right font-black text-xs rounded-xl bg-slate-50 border-none" 
                                        value={manualAllocations[p.id] || ''} 
                                        onChange={(e) => setManualAllocations({...manualAllocations, [p.id]: Number(e.target.value)})} 
                                      />
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Summary */}
            <div className="w-full lg:w-[350px] bg-white border-l border-slate-100 p-8 space-y-8 flex flex-col shadow-2xl relative z-20 shrink-0">
              <div className="space-y-6">
                <div className="p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-100 space-y-4 text-center">
                  <p className="text-[10px] uppercase font-black opacity-60 tracking-[0.2em]">{t('total')}</p>
                  <h2 className="text-4xl font-headline font-black tracking-tighter">৳{allocatedTotal.toLocaleString()}</h2>
                </div>

                <div className="p-5 bg-slate-50 rounded-3xl space-y-4 border">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-black uppercase text-slate-900 tracking-tight">Auto Distribution</Label>
                      <p className="text-[8px] text-muted-foreground font-bold uppercase">FIFO Logic enabled</p>
                    </div>
                    <Switch checked={isAutoAllocation} onCheckedChange={setIsAutoAllocation} className="data-[state=checked]:bg-indigo-600" />
                  </div>
                  <div className="pt-3 border-t border-slate-200">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <span>Remainder</span>
                      <span className="text-slate-400">৳{Math.max(0, totalPaymentAmount - allocatedTotal).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <Button 
                  className="w-full h-16 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 transition-all active:scale-95" 
                  disabled={isSubmitting || allocatedTotal <= 0} 
                  onClick={handleProcessPayment}
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                  {t('postTransaction')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* VIEW RECEIPT MODAL */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-[21cm] w-[95vw] p-0 border-none bg-transparent shadow-none overflow-y-auto max-h-[95vh]">
          <div className="flex justify-end gap-3 mb-4 no-print fixed top-4 right-4 z-[100]">
            <Button onClick={() => window.print()} className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-2xl rounded-full font-black text-[10px] uppercase h-10 px-6 gap-2 border-none">
              <Printer className="h-4 w-4" /> {t('print')}
            </Button>
          </div>
          {selectedPayment && (
            <div className="bg-white shadow-2xl rounded-none md:rounded-[2rem] overflow-hidden">
              <DocumentTemplate
                title="Payment Receipt"
                type="agreement"
                docNumber={selectedPayment.receiptNumber}
                date={selectedPayment.paymentDate}
                customerName={selectedPayment.customerName}
                items={selectedPayment.allocations.map((a: any) => ({
                  name: `Allocation: ${a.projectName}`,
                  quantity: 1,
                  unitPrice: a.amountAllocated,
                  total: a.amountAllocated,
                  description: `Project ID: ${a.projectId.slice(-6)}`
                }))}
                subtotal={selectedPayment.totalPaid}
                grandTotal={selectedPayment.totalPaid}
                status="processed"
                notes="Lump-sum payment received and allocated to active project balances."
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
