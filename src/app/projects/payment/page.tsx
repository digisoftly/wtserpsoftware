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
  AlertCircle,
  History,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
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
  const [paymentDate, setPaymentDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = React.useState("Cash");
  const [reference, setReference] = React.useState("");

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
      const due = Number(p.budget || 0) - Number(p.paidAmount || 0);
      const allocated = Math.min(remainingPayment, due);
      remainingPayment -= allocated;
      return { 
        projectId: p.id, 
        projectName: p.name, 
        currentDue: due, 
        amountAllocated: allocated 
      };
    });
  }, [availableProjects, selectedProjectIds, totalPaymentAmount]);

  const allocatedTotal = allocations.reduce((sum, a) => sum + a.amountAllocated, 0);

  const handleProcessPayment = async () => {
    if (!db || !companyId || !branchId || !selectedCustomerId || allocatedTotal <= 0) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please select customer, projects and enter payment amount." });
      return;
    }

    setIsSubmitting(true);
    try {
      await runTransaction(db!, async (transaction) => {
        const paymentRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "project_payments"));
        const customer = customers?.find(c => c.id === selectedCustomerId);
        
        const receiptNumber = `RCP-PJ-${Date.now().toString().slice(-6)}`;

        transaction.set(paymentRef, {
          id: paymentRef.id,
          receiptNumber,
          companyId,
          branchId,
          customerId: selectedCustomerId,
          customerName: customer ? (customer.customerType === 'company' ? customer.companyName : `${customer.firstName} ${customer.lastName}`) : "Client",
          totalPaid: allocatedTotal,
          paymentMethod,
          reference,
          allocations: allocations.filter(a => a.amountAllocated > 0),
          paymentDate,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Update each project's paid amount
        for (const alloc of allocations) {
          if (alloc.amountAllocated <= 0) continue;
          const projectRef = doc(db!, "companies", companyId!, "branches", branchId!, "projects", alloc.projectId);
          transaction.update(projectRef, { 
            paidAmount: increment(alloc.amountAllocated), 
            updatedAt: serverTimestamp() 
          });
        }

        // Add to global accounting ledger
        const ledgerRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "transactions"));
        transaction.set(ledgerRef, {
          id: ledgerRef.id,
          description: `Combined Project Payment (${receiptNumber})`,
          amount: allocatedTotal,
          transactionType: "income",
          category: "Project Revenue",
          paymentMethod,
          reference,
          transactionDate: paymentDate,
          createdAt: serverTimestamp()
        });
      });

      toast({ title: t('common.success'), description: "Financial records synchronized successfully." });
      router.push("/projects");
    } catch (e: any) {
      toast({ variant: "destructive", title: t('common.error'), description: e.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen pb-20">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-30 bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-indigo-600">Combined Project Collection</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Multi-allocation Ledger Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleProcessPayment} disabled={isSubmitting || allocatedTotal <= 0} className="bg-indigo-600 hover:bg-indigo-700 rounded-full px-12 h-11 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 gap-2 transition-all active:scale-95">
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            {t('common.save')}
          </Button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: SELECTION & FORM */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-indigo-600" /> {t('forms.customer')}
                </Label>
                <Select value={selectedCustomerId} onValueChange={(val) => { setSelectedCustomerId(val); setSelectedProjectIds([]); }}>
                  <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs">
                    <SelectValue placeholder={t('common.search')} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] rounded-xl shadow-2xl">
                    {customers?.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">
                        {c.customerType === 'company' ? c.companyName : `${c.firstName} ${c.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                  <Calculator className="h-3.5 w-3.5 text-indigo-600" /> {t('common.amount')} (৳)
                </Label>
                <Input 
                  type="number" 
                  className="h-12 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 text-sm font-black text-indigo-600" 
                  placeholder="0.00"
                  value={totalPaymentAmount || ''} 
                  onChange={e => setTotalPaymentAmount(Number(e.target.value))} 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                  <History className="h-3.5 w-3.5 text-indigo-600" /> {t('common.date')}
                </Label>
                <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="h-12 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 font-black uppercase text-[10px]" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-indigo-600" /> {t('forms.paymentMethod')}
                </Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                   <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs uppercase"><SelectValue /></SelectTrigger>
                   <SelectContent className="rounded-xl">
                      <SelectItem value="Cash" className="text-xs font-bold">CASH</SelectItem>
                      <SelectItem value="Bank" className="text-xs font-bold">BANK TRANSFER</SelectItem>
                      <SelectItem value="Bkash" className="text-xs font-bold">BKASH / DIGITAL</SelectItem>
                   </SelectContent>
                </Select>
              </div>
            </div>

            {/* PROJECT SELECTION TABLE */}
            <div className="space-y-4">
               <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Projects for Allocation</h3>
               <div className="rounded-[2rem] border shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="w-[60px] pl-8 h-12"></TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400">Project Identification</TableHead>
                      <TableHead className="text-[10px] font-black uppercase text-slate-400 text-right pr-8">Current Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!selectedCustomerId ? (
                      <TableRow><TableCell colSpan={3} className="h-64 text-center opacity-30 italic text-xs uppercase font-bold tracking-widest">Select a client to list active project dues</TableCell></TableRow>
                    ) : availableProjects.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="h-64 text-center opacity-30 italic text-xs uppercase font-bold tracking-widest">This client has no active outstanding projects</TableCell></TableRow>
                    ) : (
                      availableProjects.map(p => (
                        <TableRow key={p.id} className={cn("h-16 transition-colors group", selectedProjectIds.includes(p.id) ? "bg-indigo-50/20" : "opacity-60")}>
                          <TableCell className="pl-8">
                            <Checkbox 
                              checked={selectedProjectIds.includes(p.id)} 
                              onCheckedChange={checked => {
                                if (checked) setSelectedProjectIds([...selectedProjectIds, p.id]);
                                else setSelectedProjectIds(selectedProjectIds.filter(id => id !== p.id));
                              }} 
                              className="data-[state=checked]:bg-indigo-600 border-slate-200" 
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-black text-[11px] uppercase tracking-tight text-slate-900">{p.name}</span>
                              <span className="text-[8px] font-mono text-muted-foreground uppercase">{p.projectCode}</span>
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
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: ALLOCATION SUMMARY */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-8 rounded-[2.5rem] shadow-2xl space-y-6 text-center text-white bg-indigo-600 ring-4 ring-indigo-500/20 border-none">
             <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em]">Validated Transaction Total</p>
             <h2 className="text-4xl md:text-5xl font-headline font-black tracking-tighter">৳{allocatedTotal.toLocaleString()}</h2>
             <div className="pt-6 space-y-3 border-t border-white/10 text-[10px] font-bold uppercase tracking-widest text-left">
                <div className="flex justify-between items-center opacity-70">
                   <span>Gross Cash Received</span>
                   <span>৳{totalPaymentAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-indigo-100 bg-white/10 p-2 rounded-xl">
                   <span>Remaining Surplus</span>
                   <span className="font-black">৳{Math.max(0, totalPaymentAmount - allocatedTotal).toLocaleString()}</span>
                </div>
             </div>
          </Card>

          <Card className="p-6 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-4">
             <div className="flex items-center gap-3 text-indigo-600 p-2 border-b pb-4">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Allocation Matrix</span>
             </div>
             <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {allocations.filter(a => a.amountAllocated > 0).map((a, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 animate-in fade-in zoom-in-95">
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-500 uppercase truncate max-w-[140px]">{a.projectName}</span>
                        <span className="text-[8px] font-bold text-slate-300">Net Balance Applied</span>
                     </div>
                     <span className="text-[11px] font-black text-indigo-600">৳{a.amountAllocated.toLocaleString()}</span>
                  </div>
                ))}
                {allocations.filter(a => a.amountAllocated > 0).length === 0 && (
                  <div className="py-10 text-center opacity-30 text-[9px] font-black uppercase">No Allocations Mapped</div>
                )}
             </div>
             {totalPaymentAmount > allocatedTotal && (
               <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 animate-pulse">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <p className="text-[9px] font-bold text-amber-700 uppercase leading-relaxed">
                    Surplus of ৳{(totalPaymentAmount - allocatedTotal).toLocaleString()} will be credited to client's global wallet.
                  </p>
               </div>
             )}
          </Card>
        </div>
      </div>
    </div>
  );
}
