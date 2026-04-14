
"use client"

import * as React from "react"
import { 
  Plus, 
  Wrench, 
  ShieldCheck, 
  Loader2, 
  Search, 
  MoreVertical, 
  Calendar, 
  FileCheck, 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  UserPlus, 
  ArrowRight,
  Zap,
  Receipt,
  Edit,
  Trash2,
  Eye,
  Download,
  FilePlus,
  ArrowUpDown
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy, doc, runTransaction, increment, setDoc, where, getDocs, updateDoc, deleteDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { KPICard } from "@/components/dashboard/kpi-card"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"

export default function ContractsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  
  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = React.useState(false);
  const [isEditInvoiceModalOpen, setIsEditInvoiceModalOpen] = React.useState(false);
  const [isManualInvoiceModalOpen, setIsManualInvoiceModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [isDeleteInvoiceAlertOpen, setIsDeleteInvoiceAlertOpen] = React.useState(false);
  
  // Selection States
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = React.useState<any>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [customerMode, setCustomerType] = React.useState<"select" | "new">("select");

  // Reactive calculation states for Contracts
  const [formTotalAmount, setFormTotalAmount] = React.useState<number>(0);
  const [formMonthlyAmount, setFormMonthlyAmount] = React.useState<number>(0);
  const [formDuration, setFormDuration] = React.useState<number>(12);

  // Manual Invoice Form State
  const [manualInvoiceContractId, setManualInvoiceContractId] = React.useState<string>("");
  const [manualInvoiceAmount, setManualInvoiceAmount] = React.useState<number>(0);

  // OPTIMIZATION: Sync state effect refined to avoid redundant updates
  React.useEffect(() => {
    if (isEditModalOpen && selectedRecord) {
      setFormTotalAmount(Number(selectedRecord.totalAmount) || 0);
      setFormDuration(Number(selectedRecord.durationMonths) || 12);
      setFormMonthlyAmount(Number(selectedRecord.monthlyAmount) || 0);
    } else if (isAddModalOpen) {
      setFormTotalAmount(0);
      setFormDuration(12);
      setFormMonthlyAmount(0);
    }
  }, [isEditModalOpen, isAddModalOpen, selectedRecord?.id]); // Only run on ID change or modal toggle

  const handleTotalChange = (val: number) => {
    const amount = Number(val);
    setFormTotalAmount(amount);
    if (formDuration > 0) {
      setFormMonthlyAmount(Number((amount / formDuration).toFixed(2)));
    }
  };

  const handleMonthlyChange = (val: number) => {
    const amount = Number(val);
    setFormMonthlyAmount(amount);
    setFormTotalAmount(Number((amount * formDuration).toFixed(2)));
  };

  const handleDurationChange = (val: number) => {
    const duration = Math.max(1, Number(val));
    setFormDuration(duration);
    setFormTotalAmount(Number((formMonthlyAmount * duration).toFixed(2)));
  };

  // --- DATA QUERIES ---
  const contractsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "service_contracts"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);
  const { data: contracts, isLoading: isContractsLoading } = useCollection(contractsQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "contract_invoices"),
      orderBy("billingMonth", "desc")
    );
  }, [db, companyId, branchId]);
  const { data: invoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  // OPTIMIZATION: Memoized KPI stats
  const stats = React.useMemo(() => {
    const activeSubs = contracts?.filter(c => c.status === 'active').length || 0;
    const totalValue = contracts?.reduce((s, c) => s + (Number(c.totalAmount) || 0), 0) || 0;
    const totalDue = invoices?.reduce((s, i) => s + ((Number(i.amount) || 0) - (Number(i.paidAmount) || 0)), 0) || 0;
    return { activeSubs, totalValue, totalDue };
  }, [contracts, invoices]);

  // --- ACTIONS ---
  const handleAddContract = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) {
      toast({ variant: "destructive", title: "Error", description: "Database context not ready." });
      return;
    }

    setIsSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        let finalCustomerId = formData.get("customerId") as string;

        if (customerMode === "new") {
          const custRef = doc(collection(db, "companies", companyId, "branches", branchId, "customers"));
          const custData = {
            id: custRef.id,
            companyId,
            branchId,
            firstName: formData.get("firstName") as string,
            lastName: formData.get("lastName") as string,
            email: formData.get("email") as string || "",
            phoneNumber: formData.get("phone") as string || "",
            customerType: "individual",
            createdAt: serverTimestamp(),
          };
          transaction.set(custRef, custData);
          finalCustomerId = custRef.id;
        }

        if (!finalCustomerId && customerMode === "select") throw new Error("Please select a customer.");

        const contractRef = doc(collection(db, "companies", companyId, "branches", branchId, "service_contracts"));
        const paymentType = formData.get("paymentType") as string;

        const contractData = {
          id: contractRef.id,
          companyId,
          branchId,
          contractNumber: `AMC-${Date.now().toString().slice(-6)}`,
          customerId: finalCustomerId,
          serviceType: formData.get("serviceType") as string,
          serviceName: formData.get("serviceName") as string,
          totalAmount: Number(formTotalAmount),
          durationMonths: Number(formDuration),
          paymentType,
          monthlyAmount: Number(formMonthlyAmount),
          startDate: formData.get("startDate") as string,
          endDate: formData.get("endDate") as string,
          status: "active",
          isFullyPaid: paymentType === 'advance',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        transaction.set(contractRef, contractData);

        if (paymentType === 'advance') {
          const paymentRef = doc(collection(db, "companies", companyId, "branches", branchId, "contract_payments"));
          transaction.set(paymentRef, {
            id: paymentRef.id,
            companyId,
            branchId,
            contractId: contractRef.id,
            customerId: finalCustomerId,
            amount: Number(formTotalAmount),
            paymentDate: new Date().toISOString(),
            notes: "Full advance payment for contract",
            createdAt: serverTimestamp(),
          });
        }
      });

      toast({ title: "Contract Active", description: "Service agreement has been registered successfully." });
      setIsAddModalOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateContract = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || !selectedRecord) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const docRef = doc(db, "companies", companyId, "branches", branchId, "service_contracts", selectedRecord.id);
      await updateDoc(docRef, {
        serviceType: formData.get("serviceType"),
        serviceName: formData.get("serviceName"),
        totalAmount: Number(formTotalAmount),
        durationMonths: Number(formDuration),
        paymentType: formData.get("paymentType"),
        monthlyAmount: Number(formMonthlyAmount),
        startDate: formData.get("startDate"),
        endDate: formData.get("endDate"),
        updatedAt: serverTimestamp()
      });
      
      toast({ title: "Contract Updated" });
      setIsEditModalOpen(false);
      resetForm();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContract = () => {
    if (!db || !companyId || !branchId || !selectedRecord) return;
    const docRef = doc(db, "companies", companyId, "branches", branchId, "service_contracts", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Contract Removed" });
    setIsDeleteAlertOpen(false);
    resetForm();
  };

  const handleRunBillingEngine = async () => {
    if (!db || !companyId || !branchId || !contracts) return;
    setIsGenerating(true);
    const currentMonth = new Date().toISOString().slice(0, 7); 

    try {
      let createdCount = 0;
      for (const contract of contracts) {
        if (contract.paymentType !== 'monthly' || contract.status !== 'active') continue;

        const q = query(
          collection(db, "companies", companyId, "branches", branchId, "contract_invoices"),
          where("contractId", "==", contract.id),
          where("billingMonth", "==", currentMonth)
        );
        const existing = await getDocs(q);
        
        if (existing.empty) {
          const invRef = doc(collection(db, "companies", companyId, "branches", branchId, "contract_invoices"));
          await setDoc(invRef, {
            id: invRef.id,
            companyId,
            branchId,
            contractId: contract.id,
            customerId: contract.customerId,
            invoiceNumber: `INV-${contract.contractNumber.split('-')[1]}-${currentMonth.replace('-', '')}`,
            amount: Number(contract.monthlyAmount),
            paidAmount: 0,
            billingMonth: currentMonth,
            status: "unpaid",
            createdAt: serverTimestamp(),
          });
          createdCount++;
        }
      }
      toast({ title: "Billing Complete", description: `${createdCount} monthly invoices generated.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Engine Error", description: err.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateManualInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) return;

    const contractId = manualInvoiceContractId;
    const billingMonth = formData.get("billingMonth") as string;
    const amount = Number(formData.get("amount"));

    if (!contractId || !billingMonth || amount <= 0) {
      toast({ variant: "destructive", title: "Incomplete Data", description: "Please fill all required fields." });
      return;
    }

    setIsSubmitting(true);
    try {
      const q = query(
        collection(db, "companies", companyId, "branches", branchId, "contract_invoices"),
        where("contractId", "==", contractId),
        where("billingMonth", "==", billingMonth)
      );
      const existing = await getDocs(q);

      if (!existing.empty) {
        throw new Error("An invoice for this contract and month already exists.");
      }

      const contract = contracts?.find(c => c.id === contractId);
      const invRef = doc(collection(db, "companies", companyId, "branches", branchId, "contract_invoices"));
      
      await setDoc(invRef, {
        id: invRef.id,
        companyId,
        branchId,
        contractId,
        customerId: contract?.customerId,
        invoiceNumber: `M-INV-${contract?.contractNumber?.split('-')[1] || 'MAN'}-${billingMonth.replace('-', '')}`,
        amount,
        paidAmount: 0,
        billingMonth,
        status: "unpaid",
        createdAt: serverTimestamp(),
      });

      toast({ title: "Invoice Created", description: `Manual invoice for ${billingMonth} registered.` });
      setIsManualInvoiceModalOpen(false);
      setManualInvoiceContractId("");
      setManualInvoiceAmount(0);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Failed", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateInvoiceEntry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId || !selectedInvoice) return;

    setIsSubmitting(true);
    try {
      const newAmount = Number(formData.get("amount"));
      const paidAmount = Number(selectedInvoice.paidAmount) || 0;
      
      // Determine status based on adjusted amount
      const status = paidAmount >= newAmount ? "paid" : (paidAmount > 0 ? "partial" : "unpaid");

      const invRef = doc(db, "companies", companyId, "branches", branchId, "contract_invoices", selectedInvoice.id);
      await updateDoc(invRef, {
        amount: newAmount,
        status,
        updatedAt: serverTimestamp()
      });

      toast({ title: "Invoice Corrected", description: "The billed amount has been adjusted." });
      setIsEditInvoiceModalOpen(false);
      setSelectedInvoice(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Error", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInvoiceEntry = async () => {
    if (!db || !companyId || !branchId || !selectedInvoice) return;
    setIsSubmitting(true);
    try {
      const invRef = doc(db, "companies", companyId, "branches", branchId, "contract_invoices", selectedInvoice.id);
      await deleteDoc(invRef);
      toast({ title: "Invoice Deleted", description: "The incorrect entry has been removed." });
      setIsDeleteInvoiceAlertOpen(false);
      setSelectedInvoice(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete Error", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId || !selectedInvoice) return;

    setIsSubmitting(true);
    try {
      const payAmount = Number(formData.get("amount"));
      await runTransaction(db, async (transaction) => {
        const invRef = doc(db, "companies", companyId, "branches", branchId, "contract_invoices", selectedInvoice.id);
        const invSnap = await transaction.get(invRef);
        
        if (!invSnap.exists()) throw new Error("Invoice record lost.");
        const invData = invSnap.data();

        const paymentRef = doc(collection(db, "companies", companyId, "branches", branchId, "contract_payments"));

        const newPaidTotal = (Number(invData.paidAmount) || 0) + payAmount;
        const status = newPaidTotal >= Number(invData.amount) ? "paid" : "partial";

        transaction.update(invRef, {
          paidAmount: newPaidTotal,
          status,
          updatedAt: serverTimestamp()
        });

        transaction.set(paymentRef, {
          id: paymentRef.id,
          companyId,
          branchId,
          invoiceId: selectedInvoice.id,
          contractId: invData.contractId,
          amount: payAmount,
          paymentDate: new Date().toISOString(),
          createdAt: serverTimestamp(),
        });
      });

      toast({ title: "Payment Recorded", description: `৳${payAmount.toLocaleString()} settled.` });
      setIsPayModalOpen(false);
      setSelectedInvoice(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Payment Error", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedRecord(null);
    setCustomerType("select");
    setFormTotalAmount(0);
    setFormMonthlyAmount(0);
    setFormDuration(12);
  };

  const openEdit = (c: any) => {
    setSelectedRecord(c);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-emerald-600 flex items-center gap-2">
            <Wrench className="h-6 w-6 md:h-8 md:w-8" />
            Service Agreements
          </h1>
          <p className="text-sm text-muted-foreground mt-1">AMC, Internet & Recurring Maintenance</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button 
            variant="outline" 
            className="rounded-full gap-2 border-emerald-200 hover:bg-emerald-50 text-emerald-700 h-11"
            onClick={handleRunBillingEngine}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Run Billing Engine
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2 rounded-full shadow-lg shadow-emerald-100 px-6 h-11" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
            <Plus className="h-4 w-4" />
            New Contract
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Active Subs" value={stats.activeSubs} icon={ShieldCheck} colorClass="bg-emerald-500" />
        <KPICard title="Contract Value" value={`৳${stats.totalValue.toLocaleString()}`} icon={TrendingUp} colorClass="bg-blue-500" />
        <KPICard title="Outstanding Due" value={`৳${stats.totalDue.toLocaleString()}`} icon={AlertCircle} colorClass="bg-red-500" />
        <KPICard title="Billing Cycle" value="Monthly" icon={Calendar} colorClass="bg-purple-500" />
      </div>

      <Tabs defaultValue="contracts" className="w-full">
        <TabsList className="bg-white border p-1 rounded-xl shadow-sm mb-6 flex h-auto overflow-x-auto">
          <TabsTrigger value="contracts" className="rounded-lg gap-2 flex-1 py-2 h-10">
            <FileCheck className="h-4 w-4" /> Agreements
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg gap-2 flex-1 py-2 h-10">
            <Receipt className="h-4 w-4" /> Billing / Invoices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          {isContractsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
          ) : contracts && contracts.length > 0 ? (
            <Card className="border-none shadow-sm rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Contract #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Payment Mode</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((c) => (
                      <TableRow key={c.id} className="hover:bg-muted/30">
                        <TableCell className="font-bold text-emerald-700">{c.contractNumber}</TableCell>
                        <TableCell className="text-sm">
                          {customers?.find(cust => cust.id === c.customerId)?.firstName || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-medium">{c.serviceName}</div>
                          <Badge variant="secondary" className="text-[9px] uppercase">{c.serviceType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-[10px] capitalize", c.paymentType === 'advance' ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-purple-50 text-purple-700 border-purple-200")}>
                            {c.paymentType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">
                          {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right font-bold">৳{Number(c.totalAmount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toast({ title: "View Details" })}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(c)}><Edit className="mr-2 h-4 w-4" /> Edit Record</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.print()}><Download className="mr-2 h-4 w-4" /> Download PDF</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedRecord(c); setIsDeleteAlertOpen(true); }}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Contract
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <div className="p-16 bg-white rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center">
              <ShieldCheck className="h-12 w-12 text-emerald-200 mb-4" />
              <h2 className="text-xl font-headline font-bold">No Service Agreements</h2>
              <p className="text-sm text-muted-foreground">Start tracking recurring revenue by adding your first contract.</p>
              <Button className="mt-6 bg-emerald-600 rounded-full h-11" onClick={() => setIsAddModalOpen(true)}>New Agreement</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-800 leading-relaxed">
                <p className="font-bold mb-1">Billing Management</p>
                Run the batch engine for automated monthly dues, or create a specific manual invoice for adjustments.
              </div>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full gap-2 px-6 h-10 shadow-lg"
              onClick={() => setIsManualInvoiceModalOpen(true)}
            >
              <FilePlus className="h-4 w-4" /> Manual Invoice
            </Button>
          </div>

          {isInvoicesLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
          ) : invoices && invoices.length > 0 ? (
            <Card className="border-none shadow-sm rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id} className="hover:bg-muted/30">
                        <TableCell className="font-bold text-[10px] uppercase">{inv.invoiceNumber}</TableCell>
                        <TableCell className="text-xs">
                          {customers?.find(c => c.id === inv.customerId)?.firstName || "Client"}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{inv.billingMonth}</TableCell>
                        <TableCell className="font-bold text-xs">৳{Number(inv.amount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-green-600">৳{Number(inv.paidAmount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge className={cn("text-[9px] uppercase px-2", 
                            inv.status === 'paid' ? "bg-green-50 text-green-700 border-green-200" : 
                            inv.status === 'partial' ? "bg-orange-50 text-orange-700 border-orange-200" : 
                            "bg-red-50 text-red-700 border-red-200")}>
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedInvoice(inv); setIsPayModalOpen(true); }} disabled={inv.status === 'paid'}>
                                <CreditCard className="mr-2 h-4 w-4 text-emerald-600" /> Settle Payment
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedInvoice(inv); setIsEditInvoiceModalOpen(true); }}>
                                <Edit className="mr-2 h-4 w-4 text-blue-600" /> Correct Amount
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedInvoice(inv); setIsDeleteInvoiceAlertOpen(true); }}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Entry
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <div className="p-16 text-center bg-white rounded-2xl border-2 border-dashed">
              <Receipt className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold">No Monthly Invoices</h3>
              <p className="text-sm text-muted-foreground">Run the Billing Engine to generate dues for the current cycle.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ADD/EDIT CONTRACT MODAL */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className={cn("p-6 text-white", isEditModalOpen ? "bg-blue-600" : "bg-emerald-600")}>
            <DialogTitle className="text-2xl font-headline flex items-center gap-3">
              <ShieldCheck className="h-6 w-6" /> {isEditModalOpen ? `Adjust Agreement ${selectedRecord?.contractNumber}` : "New Service Agreement"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={isEditModalOpen ? handleUpdateContract : handleAddContract} className="p-6 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-4 p-4 bg-muted/20 rounded-2xl border border-dashed">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Customer Entity</Label>
                    {!isEditModalOpen && (
                      <div className="flex bg-white rounded-lg p-1 border shadow-sm">
                        <Button type="button" size="sm" variant={customerMode === 'select' ? 'default' : 'ghost'} className="h-7 text-[9px] rounded-md px-2" onClick={() => setCustomerType('select')}>Existing</Button>
                        <Button type="button" size="sm" variant={customerMode === 'new' ? 'default' : 'ghost'} className="h-7 text-[9px] rounded-md px-2" onClick={() => setCustomerType('new')}>Register New</Button>
                      </div>
                    )}
                  </div>

                  {isEditModalOpen ? (
                    <div className="p-3 bg-white rounded-xl border font-bold text-sm shadow-sm">
                      {customers?.find(c => c.id === selectedRecord?.customerId)?.firstName} {customers?.find(c => c.id === selectedRecord?.customerId)?.lastName}
                    </div>
                  ) : customerMode === "select" ? (
                    <Select name="customerId" required defaultValue={selectedRecord?.customerId}>
                      <SelectTrigger className="h-12 rounded-xl bg-white shadow-sm border-none ring-1 ring-input focus:ring-2 focus:ring-emerald-500"><SelectValue placeholder="Identify client directory..." /></SelectTrigger>
                      <SelectContent>
                        {customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Input name="firstName" placeholder="First Name" className="h-10 text-xs rounded-lg" required />
                        <Input name="lastName" placeholder="Last Name" className="h-10 text-xs rounded-lg" required />
                      </div>
                      <Input name="phone" placeholder="Contact Phone" className="h-10 text-xs rounded-lg" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Service Category</Label>
                    <Select name="serviceType" defaultValue={selectedRecord?.serviceType || "cctv"}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cctv">CCTV Maintenance</SelectItem>
                        <SelectItem value="internet">Internet / ISP</SelectItem>
                        <SelectItem value="software">Software SaaS</SelectItem>
                        <SelectItem value="other">General Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Contract Label</Label>
                    <Input name="serviceName" required defaultValue={selectedRecord?.serviceName} placeholder="e.g. Annual Maintenance" className="h-11 rounded-xl" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-emerald-600">Monthly Fee (৳)</Label>
                    <Input 
                      type="number" 
                      step="0.01"
                      required 
                      value={formMonthlyAmount}
                      onChange={(e) => handleMonthlyChange(Number(e.target.value))}
                      className="h-11 rounded-xl font-bold border-emerald-100 focus:border-emerald-500 shadow-sm" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Duration (Months)</Label>
                    <Input 
                      type="number" 
                      value={formDuration}
                      onChange={(e) => handleDurationChange(Number(e.target.value))}
                      required 
                      className="h-11 rounded-xl shadow-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-blue-600">Total Contract Budget (৳)</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    required 
                    value={formTotalAmount}
                    onChange={(e) => handleTotalChange(Number(e.target.value))}
                    className="h-11 rounded-xl font-bold border-blue-100 focus:border-blue-500 bg-blue-50/20 shadow-sm" 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Billing Schedule</Label>
                  <Select name="paymentType" defaultValue={selectedRecord?.paymentType || "monthly"}>
                    <SelectTrigger className="h-11 rounded-xl shadow-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly Recurring (Installments)</SelectItem>
                      <SelectItem value="advance">Full Advance (Upfront Payment)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Start Date</Label>
                    <Input name="startDate" type="date" required defaultValue={selectedRecord?.startDate} className="h-11 rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Expiry Date</Label>
                    <Input name="endDate" type="date" required defaultValue={selectedRecord?.endDate} className="h-11 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-emerald-50 rounded-2xl border-2 border-dashed border-emerald-200">
              <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-600">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-900">Billing Activation</p>
                  <p className="text-[10px] text-emerald-700 max-w-xs">Initializing this contract will enable automated recurring billing for the selected customer.</p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Button type="button" variant="outline" className="flex-1 md:flex-none rounded-full px-8 h-12" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); resetForm(); }}>Cancel</Button>
                <Button type="submit" className={cn("flex-1 md:flex-none rounded-full px-12 h-12 font-bold shadow-lg gap-2", isEditModalOpen ? "bg-blue-600 hover:bg-blue-700 shadow-blue-100" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100")} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  {isEditModalOpen ? "Save Changes" : "Activate Contract"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT INVOICE MODAL */}
      <Dialog open={isEditInvoiceModalOpen} onOpenChange={setIsEditInvoiceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" /> Correct Entry Amount
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateInvoiceEntry} className="space-y-4 pt-4">
            <div className="p-4 bg-blue-50 rounded-xl space-y-1">
              <p className="text-[10px] uppercase font-bold text-blue-800 tracking-widest">Target Billing Month</p>
              <p className="text-lg font-headline font-bold text-blue-900">{selectedInvoice?.billingMonth}</p>
              <div className="text-[10px] text-blue-700 mt-2">
                Original amount was ৳{selectedInvoice?.amount?.toLocaleString()}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Corrected Amount (৳)</Label>
              <Input 
                name="amount" 
                type="number" 
                step="0.01" 
                required 
                defaultValue={selectedInvoice?.amount}
                className="h-12 text-xl font-bold rounded-xl" 
              />
            </div>

            <p className="text-[10px] text-muted-foreground italic">
              Adjusting this amount will automatically update the "DUE" status if payments were already recorded.
            </p>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setIsEditInvoiceModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-full px-8 shadow-lg" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Update Entry"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE MANUAL INVOICE MODAL */}
      <Dialog open={isManualInvoiceModalOpen} onOpenChange={setIsManualInvoiceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl flex items-center gap-2">
              <FilePlus className="h-5 w-5 text-blue-600" /> Manual Billing Entry
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateManualInvoice} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Contract</Label>
              <Select 
                value={manualInvoiceContractId} 
                onValueChange={(id) => {
                  setManualInvoiceContractId(id);
                  const c = contracts?.find(c => c.id === id);
                  if (c) setManualInvoiceAmount(Number(c.monthlyAmount) || 0);
                }}
              >
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue placeholder="Select active agreement..." />
                </SelectTrigger>
                <SelectContent>
                  {contracts?.filter(c => c.status === 'active' && c.paymentType === 'monthly').map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.contractNumber} - {c.serviceName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Billing Month</Label>
                <Input name="billingMonth" type="month" required className="h-11 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase">Amount (৳)</Label>
                <Input 
                  name="amount" 
                  type="number" 
                  step="0.01" 
                  required 
                  value={manualInvoiceAmount}
                  onChange={(e) => setManualInvoiceAmount(Number(e.target.value))}
                  className="h-11 rounded-xl font-bold" 
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-blue-800 italic">Manual invoices are useful for partial month billing or extra service charges linked to an AMC.</p>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setIsManualInvoiceModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-full px-8 shadow-lg" disabled={isSubmitting || !manualInvoiceContractId}>
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Generate Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* RECORD PAYMENT MODAL */}
      <Dialog open={isPayModalOpen} onOpenChange={(open) => { if(!open) { setIsPayModalOpen(false); setSelectedInvoice(null); } }}>
        <DialogContent className="sm:max-w-md w-[95vw]">
          <DialogHeader><DialogTitle className="font-headline">Settle Recurring Bill</DialogTitle></DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4 pt-4">
            <div className="p-4 bg-muted/20 rounded-xl space-y-1 border border-dashed">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Billing Cycle</p>
              <p className="text-lg font-headline font-bold">{selectedInvoice?.billingMonth}</p>
              <div className="flex justify-between text-xs mt-3 pt-3 border-t border-dashed">
                <span>Monthly Due:</span>
                <span className="font-bold">৳{Number(selectedInvoice?.amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-red-600 font-medium">
                <span>Remaining Balance:</span>
                <span className="font-bold">৳{(Number(selectedInvoice?.amount || 0) - (Number(selectedInvoice?.paidAmount) || 0)).toLocaleString()}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-emerald-600">Payment Amount (৳)</Label>
              <Input 
                name="amount" 
                type="number" 
                step="0.01" 
                required 
                max={Number(selectedInvoice?.amount || 0) - (Number(selectedInvoice?.paidAmount) || 0)}
                defaultValue={Number(selectedInvoice?.amount || 0) - (Number(selectedInvoice?.paidAmount) || 0)}
                className="h-12 text-xl font-bold text-emerald-600 border-emerald-100 rounded-xl shadow-sm" 
              />
            </div>

            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-14 font-bold text-lg shadow-lg shadow-emerald-100" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : "Confirm Receipt"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONTRACT CONFIRMATION */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate Service Agreement?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to remove the contract for {customers?.find(c => c.id === selectedRecord?.customerId)?.firstName}? This will immediately cease all recurring invoice generation.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteContract}>Confirm Termination</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* DELETE INVOICE CONFIRMATION */}
      <AlertDialog open={isDeleteInvoiceAlertOpen} onOpenChange={setIsDeleteInvoiceAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Billing Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently remove this invoice? This will also disconnect any payments linked to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteInvoiceEntry}>Delete Permanently</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
