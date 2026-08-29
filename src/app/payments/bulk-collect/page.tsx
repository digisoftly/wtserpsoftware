
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  User, 
  CreditCard, 
  Calendar,
  Calculator,
  CheckCircle2,
  FileText,
  History,
  AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy, doc, runTransaction, serverTimestamp, increment } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface InvoiceAllocation {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  balanceDue: number;
  allocAmount: number;
  isSelected: boolean;
}

export default function BulkPaymentCollectionPage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>("");
  const [totalPaymentAmount, setTotalPaymentAmount] = React.useState<number>(0);
  const [paymentDate, setPaymentDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = React.useState("Cash");
  const [reference, setReference] = React.useState("");
  const [allocations, setAllocations] = React.useState<InvoiceAllocation[]>([]);

  // Queries
  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !selectedCustomerId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "sales_invoices"),
      where("customerId", "==", selectedCustomerId),
      where("status", "in", ["due", "partial"]),
      orderBy("createdAt", "asc")
    );
  }, [db, companyId, branchId, selectedCustomerId]);
  const { data: invoices } = useCollection(invoicesQuery);

  // Initialize Allocations when invoices load
  React.useEffect(() => {
    if (invoices) {
      setAllocations(invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        totalAmount: inv.totalAmount,
        balanceDue: inv.balanceDue,
        allocAmount: 0,
        isSelected: false
      })));
    } else {
      setAllocations([]);
    }
  }, [invoices]);

  // Auto-allocate logic (First In First Out)
  const handleAutoAllocate = () => {
    let remaining = totalPaymentAmount;
    const newAllocations = allocations.map(a => {
      if (!a.isSelected) return { ...a, allocAmount: 0 };
      const amountToPay = Math.min(remaining, a.balanceDue);
      remaining -= amountToPay;
      return { ...a, allocAmount: amountToPay };
    });
    setAllocations(newAllocations);
  };

  const updateAllocation = (id: string, amount: number) => {
    setAllocations(prev => prev.map(a => a.id === id ? { ...a, allocAmount: amount, isSelected: amount > 0 } : a));
  };

  const toggleSelect = (id: string) => {
    setAllocations(prev => prev.map(a => a.id === id ? { ...a, isSelected: !a.isSelected, allocAmount: !a.isSelected ? 0 : a.allocAmount } : a));
  };

  const handleSave = async () => {
    const finalAllocations = allocations.filter(a => a.isSelected && a.allocAmount > 0);
    if (!db || !companyId || !branchId || finalAllocations.length === 0) {
      toast({ variant: "destructive", title: "Action Required", description: "Enter payment amount and select invoices." });
      return;
    }

    setIsSubmitting(true);
    try {
      await runTransaction(db!, async (transaction) => {
        const paymentRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "payments"));
        const customer = customers?.find(c => c.id === selectedCustomerId);
        const receiptNumber = `RCP-BK-${Date.now().toString().slice(-6)}`;
        const totalPaid = finalAllocations.reduce((s, a) => s + a.allocAmount, 0);

        // 1. Save Bulk Payment Receipt
        transaction.set(paymentRef, {
          id: paymentRef.id,
          receiptNumber,
          customerId: selectedCustomerId,
          customerName: customer ? (customer.customerType === 'company' ? customer.companyName : `${customer.firstName} ${customer.lastName}`) : "Client",
          amount: totalPaid,
          paymentMethod,
          reference,
          paymentDate,
          isBulk: true,
          allocations: finalAllocations.map(a => ({ invoiceId: a.id, invoiceNumber: a.invoiceNumber, amount: a.allocAmount })),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // 2. Update each Invoice
        for (const alloc of finalAllocations) {
          const invRef = doc(db!, "companies", companyId!, "branches", branchId!, "sales_invoices", alloc.id);
          const invSnap = await transaction.get(invRef);
          if (invSnap.exists()) {
            const invData = invSnap.data();
            const newPaid = Number(invData.paidAmount || 0) + alloc.allocAmount;
            const newDue = Number(invData.totalAmount || 0) - newPaid;
            transaction.update(invRef, {
              paidAmount: newPaid,
              balanceDue: newDue,
              status: newDue <= 0 ? "paid" : "partial",
              lastPaymentDate: paymentDate,
              updatedAt: serverTimestamp()
            });
          }
        }

        // 3. Register Accounting Entry
        const ledgerRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "transactions"));
        transaction.set(ledgerRef, {
          id: ledgerRef.id,
          description: `Bulk Payment Received (${receiptNumber})`,
          amount: totalPaid,
          transactionType: "income",
          category: "Sales Revenue",
          paymentMethod,
          reference,
          transactionDate: paymentDate,
          createdAt: serverTimestamp()
        });
      });

      toast({ title: t('success'), description: "Multi-invoice payment synchronized." });
      router.push("/payments");
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
      setIsSubmitting(false);
    }
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + (a.isSelected ? a.allocAmount : 0), 0);

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between border-b pb-4 sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-black font-headline uppercase tracking-tight text-emerald-600">Bulk Payment Collection</h1>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Multi-Invoice Settlement Terminal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full h-11 px-6 font-black uppercase text-[10px] tracking-widest" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSubmitting || totalAllocated <= 0} className="bg-emerald-600 hover:bg-emerald-700 rounded-full h-11 px-12 font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-emerald-100 gap-2">
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            Confirm & Post Ledger
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 px-4">
        <div className="xl:col-span-8 space-y-6">
          <Card className="p-8 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Select Customer Entity</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue placeholder="Search Client" /></SelectTrigger>
                  <SelectContent className="max-h-[300px] rounded-xl shadow-2xl">
                    {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">{c.customerType === 'company' ? c.companyName : `${c.firstName} ${c.lastName}`}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Gross Payment Received (৳)</Label>
                <div className="flex gap-2">
                   <Input type="number" className="h-12 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 text-sm font-black text-emerald-600" value={totalPaymentAmount || ''} onChange={e => setTotalPaymentAmount(Number(e.target.value))} placeholder="0.00" />
                   <Button type="button" onClick={handleAutoAllocate} className="h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase px-4 shadow-lg shadow-indigo-100">Auto Distribute</Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Outstanding Invoice Matrix</h3>
               <div className="rounded-[2rem] border shadow-sm overflow-hidden min-h-[400px]">
                 <Table>
                    <TableHeader className="bg-slate-50">
                       <TableRow className="h-12">
                          <TableHead className="w-12 pl-8"></TableHead>
                          <TableHead className="text-[10px] font-black uppercase">Invoice Identity</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-right">Balance Due</TableHead>
                          <TableHead className="text-[10px] font-black uppercase text-right pr-8 w-40">Payment Applied</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {!selectedCustomerId ? (
                         <TableRow><TableCell colSpan={4} className="h-64 text-center opacity-30 italic text-xs font-bold tracking-widest">Select a customer to load outstanding bills</TableCell></TableRow>
                       ) : allocations.length === 0 ? (
                         <TableRow><TableCell colSpan={4} className="h-64 text-center opacity-30 italic text-xs font-bold tracking-widest">No outstanding bills for this customer</TableCell></TableRow>
                       ) : (
                         allocations.map(a => (
                           <TableRow key={a.id} className={cn("h-16 group transition-colors", a.isSelected ? "bg-emerald-50/20" : "opacity-60")}>
                             <TableCell className="pl-8">
                               <Checkbox checked={a.isSelected} onCheckedChange={() => toggleSelect(a.id)} className="data-[state=checked]:bg-emerald-600" />
                             </TableCell>
                             <TableCell>
                                <div className="flex flex-col">
                                   <span className="text-[11px] font-black uppercase text-slate-900">{a.invoiceNumber}</span>
                                   <span className="text-[9px] font-bold text-slate-400 uppercase">Total: ৳{a.totalAmount.toLocaleString()}</span>
                                </div>
                             </TableCell>
                             <TableCell className="text-right font-black text-xs text-red-600">৳{a.balanceDue.toLocaleString()}</TableCell>
                             <TableCell className="pr-8">
                                <Input 
                                  type="number" 
                                  className="h-9 text-right font-black text-xs rounded-xl bg-white border-slate-200" 
                                  value={a.allocAmount || ''} 
                                  max={a.balanceDue}
                                  onChange={e => updateAllocation(a.id, Math.min(a.balanceDue, Number(e.target.value)))} 
                                />
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

        <div className="xl:col-span-4 space-y-6">
           <Card className="p-8 rounded-[2.5rem] bg-slate-900 text-white shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.3em]">Total Collection Applied</p>
              <h2 className="text-5xl font-headline font-black tracking-tighter text-emerald-400">৳{totalAllocated.toLocaleString()}</h2>
              
              <div className="pt-6 border-t border-white/5 space-y-3">
                 <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                    <span>Cash / Bank Surplus</span>
                    <span className="text-emerald-400">৳{Math.max(0, totalPaymentAmount - totalAllocated).toLocaleString()}</span>
                 </div>
              </div>
           </Card>

           <Card className="p-6 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6">
              <div className="space-y-4">
                 <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Collection Date</Label><Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="h-11 rounded-2xl bg-slate-50 border-none font-bold text-xs uppercase" /></div>
                 <div className="space-y-1.5">
                   <Label className="text-[10px] font-black uppercase text-slate-400">Payment Method</Label>
                   <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-11 rounded-2xl bg-slate-50 border-none font-bold text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl"><SelectItem value="Cash" className="font-bold">CASH</SelectItem><SelectItem value="Bank" className="font-bold">BANK TRANSFER</SelectItem><SelectItem value="Bkash" className="font-bold">BKASH / DIGITAL</SelectItem></SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Reference / TXN ID</Label><Input value={reference} onChange={e => setReference(e.target.value)} className="h-11 rounded-2xl bg-slate-50 border-none font-bold text-xs uppercase" /></div>
              </div>

              <div className="bg-amber-50 p-5 rounded-[2rem] border border-amber-100 flex gap-3">
                 <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                 <p className="text-[9px] font-bold text-amber-800 uppercase leading-relaxed">System will automatically distribute payments to selected invoices and update their status to PAID or PARTIAL.</p>
              </div>

              <Button onClick={handleSave} disabled={isSubmitting || totalAllocated <= 0} className="w-full h-16 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-all active:scale-95 shadow-emerald-100">
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />} Post Transaction
              </Button>
           </Card>
        </div>
      </div>
    </div>
  );
}
