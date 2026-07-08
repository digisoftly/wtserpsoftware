"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  Calculator, 
  ArrowLeft, 
  Save, 
  Loader2, 
  ArrowRight,
  User,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, runTransaction, serverTimestamp, increment, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface ProjectAllocation {
  projectId: string;
  projectName: string;
  currentDue: number;
  amountAllocated: number;
}

export default function CombinedPaymentPage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>("");
  const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([]);
  const [totalPaymentAmount, setTotalPaymentAmount] = React.useState<number>(0);

  // Queries
  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  const projectsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "projects"), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: projects } = useCollection(projectsQuery);

  // Logic
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

  const handleProcessPayment = async () => {
    if (!db || !companyId || !branchId || !selectedCustomerId || allocatedTotal <= 0) return;

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
      router.push("/projects");
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen pb-20">
      <div className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-indigo-600">{t('receiveCombined')}</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Financial Settlement Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button onClick={handleProcessPayment} disabled={isSubmitting || allocatedTotal <= 0} className="bg-indigo-600 hover:bg-indigo-700 rounded-full px-12 h-10 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 gap-2">
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            {t('postTransaction')}
          </Button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto w-full p-4 md:p-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                  <User className="h-3 w-3 text-indigo-600" /> {t('customer')}
                </Label>
                <Select value={selectedCustomerId} onValueChange={(val) => { setSelectedCustomerId(val); setSelectedProjectIds([]); }}>
                  <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs">
                    <SelectValue placeholder={t('search')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] rounded-xl">
                    {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold">{c.firstName} {c.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                  <Calculator className="h-3 w-3 text-indigo-600" /> {t('amount')} (৳)
                </Label>
                <Input type="number" className="h-12 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 text-sm font-black text-indigo-600" value={totalPaymentAmount || ''} onChange={e => setTotalPaymentAmount(Number(e.target.value))} />
              </div>
            </div>

            <div className="rounded-3xl border shadow-sm overflow-hidden flex flex-col min-h-[400px]">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[60px] pl-8 h-12"></TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400">Project Identification</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right pr-8">Current Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!selectedCustomerId ? (
                    <TableRow><TableCell colSpan={3} className="h-64 text-center opacity-30 italic text-xs uppercase font-bold tracking-widest">Select a client to list active projects</TableCell></TableRow>
                  ) : availableProjects.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="h-64 text-center opacity-30 italic text-xs uppercase font-bold tracking-widest">No active dues for this client</TableCell></TableRow>
                  ) : (
                    availableProjects.map(p => (
                      <TableRow key={p.id} className={cn("h-16 transition-colors group", selectedProjectIds.includes(p.id) ? "bg-indigo-50/20" : "opacity-60")}>
                        <TableCell className="pl-8">
                          <Checkbox checked={selectedProjectIds.includes(p.id)} onCheckedChange={checked => checked ? setSelectedProjectIds([...selectedProjectIds, p.id]) : setSelectedProjectIds(selectedProjectIds.filter(id => id !== p.id))} className="data-[state=checked]:bg-indigo-600" />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-black text-xs uppercase tracking-tight text-slate-900">{p.name}</span>
                            <span className="text-[9px] font-mono text-muted-foreground uppercase">{p.projectCode}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <span className="font-black text-xs text-red-600">৳{(p.budget - (p.paidAmount || 0)).toLocaleString()}</span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <div className="w-full lg:w-[380px] space-y-6">
          <Card className="p-8 rounded-[2.5rem] shadow-2xl space-y-6 text-center text-white bg-indigo-600">
             <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em]">Allocated Transaction Total</p>
             <h2 className="text-4xl md:text-5xl font-headline font-black tracking-tighter">৳{allocatedTotal.toLocaleString()}</h2>
             <div className="pt-6 space-y-3 border-t border-white/10 text-[10px] font-bold uppercase tracking-widest">
                <div className="flex justify-between items-center opacity-70">
                   <span>Gross Received</span>
                   <span>৳{totalPaymentAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-indigo-100">
                   <span>Remaining Wallet</span>
                   <span>৳{Math.max(0, totalPaymentAmount - allocatedTotal).toLocaleString()}</span>
                </div>
             </div>
          </Card>

          <Card className="p-6 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-4">
             <div className="flex items-center gap-3 text-indigo-600 p-2">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Allocation Distribution</span>
             </div>
             <div className="space-y-2">
                {allocations.filter(a => a.amountAllocated > 0).map((a, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                     <span className="text-[9px] font-bold text-slate-500 uppercase truncate max-w-[150px]">{a.projectName}</span>
                     <span className="text-[10px] font-black text-indigo-600">৳{a.amountAllocated.toLocaleString()}</span>
                  </div>
                ))}
             </div>
             {totalPaymentAmount > allocatedTotal && (
               <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-[9px] font-bold text-amber-700 uppercase leading-relaxed">
                    Surplus amount of ৳{(totalPaymentAmount - allocatedTotal).toLocaleString()} will be credited to client wallet.
                  </p>
               </div>
             )}
          </Card>
        </div>
      </div>
    </div>
  );
}
