"use client"

import * as React from "react"
import { 
  Plus, 
  Loader2, 
  MoreVertical, 
  ReceiptText, 
  Users, 
  CreditCard, 
  Calculator, 
  History, 
  ChevronRight, 
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy, doc, runTransaction, increment } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
  const [isPaymentModalOpen, setIsPaymentModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Core Data
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

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>("");
  const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([]);
  const [totalPaymentAmount, setTotalPaymentAmount] = React.useState<number>(0);
  const [isAutoAllocation, setIsAutoAllocation] = React.useState<boolean>(true);
  const [manualAllocations, setManualAllocations] = React.useState<Record<string, number>>({});

  // Calculations
  const availableProjects = React.useMemo(() => {
    if (!selectedCustomerId || !allProjects) return [];
    return allProjects.filter(p => p.customerId === selectedCustomerId && (p.budget - (p.paidAmount || 0)) > 0);
  }, [selectedCustomerId, allProjects]);

  const selectedProjectsData = React.useMemo(() => {
    return availableProjects.filter(p => selectedProjectIds.includes(p.id));
  }, [availableProjects, selectedProjectIds]);

  const combinedDue = selectedProjectsData.reduce((sum, p) => sum + (p.budget - (p.paidAmount || 0)), 0);

  // Allocation Logic
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
        totalAmount: p.budget,
        currentDue: due,
        amountAllocated: allocated
      };
    });
  }, [selectedProjectsData, totalPaymentAmount, isAutoAllocation, manualAllocations]);

  const allocatedTotal = allocations.reduce((sum, a) => sum + a.amountAllocated, 0);

  const handleProcessPayment = async () => {
    if (!selectedCustomerId || allocatedTotal <= 0) {
      toast({ variant: "destructive", title: "Invalid Payment", description: "Please select projects and enter a valid amount." });
      return;
    }

    setIsSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const paymentRef = doc(collection(db, "companies", companyId!, "branches", branchId!, "project_payments"));
        
        // 1. Create top-level payment record
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

        // 2. Update each project balance
        for (const alloc of allocations) {
          if (alloc.amountAllocated <= 0) continue;
          const projectRef = doc(db, "companies", companyId!, "branches", branchId!, "projects", alloc.projectId);
          transaction.update(projectRef, {
            paidAmount: increment(alloc.amountAllocated),
            updatedAt: serverTimestamp()
          });
        }
      });

      toast({ title: "Payment Processed", description: `৳${allocatedTotal.toLocaleString()} distributed successfully.` });
      resetForm();
      setIsPaymentModalOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Transaction Error", description: e.message });
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
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-indigo-600">Combined Project Billing</h1>
          <p className="text-sm text-muted-foreground mt-1">Settle multiple project dues in one transaction</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 rounded-full px-8 shadow-lg shadow-indigo-100" onClick={() => setIsPaymentModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Receive Combined Payment
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Collected" value={`৳${payments?.reduce((s, p) => s + (p.totalPaid || 0), 0).toLocaleString()}`} icon={CreditCard} colorClass="bg-green-500" />
        <KPICard title="Payment Events" value={payments?.length || 0} icon={History} colorClass="bg-blue-500" />
        <KPICard title="Clients Active" value={new Set(allProjects?.filter(p => (p.budget - (p.paidAmount || 0)) > 0).map(p => p.customerId)).size} icon={Users} colorClass="bg-purple-500" />
        <KPICard title="Outstanding Due" value={`৳${allProjects?.reduce((s, p) => s + (p.budget - (p.paidAmount || 0)), 0).toLocaleString()}`} icon={Calculator} colorClass="bg-orange-500" />
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold font-headline flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          Recent Payment History
        </h2>
        
        {isPaymentsLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
        ) : payments && payments.length > 0 ? (
          <Card className="border-none shadow-sm rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total Paid</TableHead>
                  <TableHead>Allocations</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/30">
                    <TableCell className="text-xs">{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-bold">{customers?.find(c => c.id === p.customerId)?.firstName || "Unknown"}</TableCell>
                    <TableCell className="font-bold text-green-600">৳{p.totalPaid?.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {p.allocations?.map((a: any, i: number) => (
                          <Badge key={i} variant="secondary" className="text-[9px] px-1 bg-indigo-50 text-indigo-700">
                            {a.projectName}: ৳{a.amountAllocated}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <div className="p-16 bg-white rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center">
            <ReceiptText className="h-12 w-12 text-indigo-200 mb-4" />
            <h3 className="text-xl font-headline font-bold">No Payments Yet</h3>
            <p className="text-muted-foreground max-w-sm mt-2">Process your first combined project billing to see records here.</p>
          </div>
        )}
      </div>

      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-indigo-600 text-white">
            <DialogTitle className="text-2xl font-headline flex items-center gap-3">
              <Calculator className="h-6 w-6" />
              Combined Billing & Payment Engine
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Config */}
              <div className="lg:col-span-4 space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-indigo-600 tracking-wider">Step 1: Select Customer</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="rounded-xl border-2 border-indigo-50 h-12">
                      <SelectValue placeholder="Identify client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs uppercase font-bold text-indigo-600 tracking-wider">Step 2: Payment Amount</Label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-indigo-600">৳</span>
                    <Input 
                      type="number" 
                      className="pl-8 h-12 text-lg font-bold rounded-xl border-2 border-indigo-50 focus:border-indigo-500" 
                      placeholder="0.00"
                      value={totalPaymentAmount || ''}
                      onChange={(e) => setTotalPaymentAmount(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="p-4 bg-indigo-50 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold text-indigo-900">Auto-Allocate (FIFO)</Label>
                    <Switch checked={isAutoAllocation} onCheckedChange={setIsAutoAllocation} />
                  </div>
                  <p className="text-[10px] text-indigo-700 leading-relaxed italic">
                    {isAutoAllocation 
                      ? "System will distribute payment across selected projects starting from the oldest due date first."
                      : "Manual mode: You specify the exact amount to pay toward each selected project."}
                  </p>
                </div>
              </div>

              {/* Right Column: Project Selection & Distribution */}
              <div className="lg:col-span-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase font-bold text-indigo-600 tracking-wider">Step 3: Select Projects & Allocations</Label>
                    <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                      Selected Due: ৳{combinedDue.toLocaleString()}
                    </Badge>
                  </div>

                  {!selectedCustomerId ? (
                    <div className="h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                      <Users className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-sm">Select a customer to load active projects</p>
                    </div>
                  ) : availableProjects.length === 0 ? (
                    <div className="h-64 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                      <CheckCircle2 className="h-8 w-8 mb-2 text-green-500" />
                      <p className="text-sm">No outstanding dues for this customer</p>
                    </div>
                  ) : (
                    <div className="border rounded-2xl overflow-hidden shadow-sm">
                      <Table>
                        <TableHeader className="bg-indigo-50/50">
                          <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Project Name</TableHead>
                            <TableHead>Current Due</TableHead>
                            <TableHead className="text-right">Allocation</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {availableProjects.map((p) => {
                            const isSelected = selectedProjectIds.includes(p.id);
                            const allocation = allocations.find(a => a.projectId === p.id);
                            const due = p.budget - (p.paidAmount || 0);

                            return (
                              <TableRow key={p.id} className={cn(isSelected ? "bg-indigo-50/20" : "opacity-60")}>
                                <TableCell>
                                  <Checkbox 
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      if (checked) setSelectedProjectIds([...selectedProjectIds, p.id]);
                                      else setSelectedProjectIds(selectedProjectIds.filter(id => id !== p.id));
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="font-bold text-sm">{p.name}</div>
                                  <div className="text-[10px] text-muted-foreground font-mono">Budget: ৳{p.budget}</div>
                                </TableCell>
                                <TableCell className="font-bold text-red-600">৳{due.toLocaleString()}</TableCell>
                                <TableCell className="text-right">
                                  {isAutoAllocation ? (
                                    <div className="text-indigo-600 font-bold">
                                      ৳{allocation?.amountAllocated.toLocaleString() || "0"}
                                    </div>
                                  ) : (
                                    <Input 
                                      type="number" 
                                      disabled={!isSelected}
                                      className="w-24 ml-auto h-8 text-right font-bold text-indigo-600"
                                      value={manualAllocations[p.id] || ''}
                                      onChange={(e) => setManualAllocations({...manualAllocations, [p.id]: Number(e.target.value)})}
                                    />
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
          </div>

          <div className="p-6 bg-muted/20 border-t flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-8">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Total Allocation</p>
                <p className={cn("text-2xl font-headline font-bold", allocatedTotal > totalPaymentAmount ? "text-red-600" : "text-indigo-600")}>
                  ৳{allocatedTotal.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1 border-l pl-8">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Remaining Balance</p>
                <p className="text-2xl font-headline font-bold text-muted-foreground">
                  ৳{Math.max(0, totalPaymentAmount - allocatedTotal).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button variant="outline" className="rounded-full px-8 h-12" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 rounded-full px-12 h-12 font-bold shadow-xl shadow-indigo-100 gap-2 flex-1 md:flex-none"
                disabled={isSubmitting || allocatedTotal <= 0 || allocatedTotal > totalPaymentAmount}
                onClick={handleProcessPayment}
              >
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                Post Payment Record
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
