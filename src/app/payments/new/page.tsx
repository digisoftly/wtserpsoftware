
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Calculator, 
  User, 
  CreditCard, 
  Calendar,
  FileText,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { PaymentService } from "@/lib/payment-service"

export default function NewPaymentCollectionPage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>("");
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState<string>("");
  const [paymentAmount, setPaymentAmount] = React.useState<number>(0);
  const [paymentMethod, setPaymentMethod] = React.useState("Cash");
  const [reference, setReference] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [paymentDate, setPaymentDate] = React.useState(new Date().toISOString().split('T')[0]);

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
      where("status", "in", ["due", "partial"])
    );
  }, [db, companyId, branchId, selectedCustomerId]);
  const { data: invoices } = useCollection(invoicesQuery);

  const methodsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_data"), where("type", "==", "paymentMethods"));
  }, [db, companyId]);
  const { data: methods } = useCollection(methodsQuery);

  const selectedInvoice = React.useMemo(() => {
    return invoices?.find(i => i.id === selectedInvoiceId);
  }, [invoices, selectedInvoiceId]);

  const currentDue = selectedInvoice ? (Number(selectedInvoice.totalAmount || 0) - Number(selectedInvoice.paidAmount || 0)) : 0;

  const handleSave = async () => {
    if (!db || !companyId || !branchId || !selectedInvoice || paymentAmount <= 0) return;

    setIsSubmitting(true);
    try {
      const result = await PaymentService.processPayment(db, companyId, branchId, {
        invoiceId: selectedInvoiceId,
        amount: paymentAmount,
        customerId: selectedCustomerId,
        paymentMethod,
        reference,
        paymentDate,
        notes,
        receivedBy: "System User"
      });

      toast({ title: t('success'), description: `Receipt generated: ${result.receiptNumber}` });
      router.push("/payments");
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between border-b pb-4 bg-white sticky top-0 z-50 px-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{t('collectPayment')}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cross-Module Settlement</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="font-bold text-xs" onClick={() => router.back()}>{t('cancel')}</Button>
          <Button size="sm" className="font-bold text-xs gap-2 bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting || paymentAmount <= 0} onClick={handleSave}>
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {t('postTransaction')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="bg-slate-50/50 border-b py-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">Transaction Source</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">{t('customer')}</Label>
                    <Select value={selectedCustomerId} onValueChange={(val) => { setSelectedCustomerId(val); setSelectedInvoiceId(""); }}>
                      <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue placeholder="Select Client" /></SelectTrigger>
                      <SelectContent className="max-h-[300px] rounded-xl shadow-2xl">
                        {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold">{c.firstName} {c.lastName}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Active Invoice</Label>
                    <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId} disabled={!selectedCustomerId}>
                      <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue placeholder={!selectedCustomerId ? "Select customer first" : "Choose Invoice"} /></SelectTrigger>
                      <SelectContent className="max-h-[300px] rounded-xl shadow-2xl">
                        {invoices?.map(inv => <SelectItem key={inv.id} value={inv.id} className="text-xs font-bold">{inv.invoiceNumber} (Due: ৳{((inv.totalAmount || 0) - (inv.paidAmount || 0)).toLocaleString()})</SelectItem>)}
                        {selectedCustomerId && invoices?.length === 0 && <div className="p-4 text-center text-[10px] uppercase font-bold text-slate-400">No pending invoices found</div>}
                      </SelectContent>
                    </Select>
                  </div>
               </div>

               {selectedInvoice && (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">{t('paymentDate')}</Label>
                      <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="h-12 rounded-xl font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">{t('paymentMethod')}</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                         <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                         <SelectContent>
                           {methods?.map(m => <SelectItem key={m.id} value={m.name} className="text-xs font-bold">{m.name}</SelectItem>)}
                           {!methods?.length && ["Cash", "Bank Transfer", "bKash"].map(m => <SelectItem key={m} value={m} className="text-xs font-bold">{m}</SelectItem>)}
                         </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Reference / Trans. ID</Label>
                      <Input value={reference} onChange={e => setReference(e.target.value)} className="h-12 rounded-xl font-mono text-xs uppercase" placeholder="e.g. TXN-123456" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Amount to Receive (৳)</Label>
                      <Input 
                        type="number" 
                        value={paymentAmount || ''} 
                        onChange={e => setPaymentAmount(Math.min(currentDue, Number(e.target.value)))} 
                        className="h-12 rounded-xl font-black text-lg text-emerald-600 border-2 border-emerald-50 focus:border-emerald-200" 
                        placeholder="0.00"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">{t('notes')}</Label>
                      <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="rounded-xl min-h-[100px] text-xs font-medium" placeholder="Payment specific remarks..." />
                    </div>
                 </div>
               )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2rem] overflow-hidden">
             <CardHeader className="p-8 pb-0">
               <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-60">Balance Overview</CardTitle>
             </CardHeader>
             <CardContent className="p-8 space-y-6">
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase text-blue-400">Total Invoice</p>
                   <p className="text-2xl font-black">৳{selectedInvoice?.totalAmount?.toLocaleString() || '0'}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase text-red-400">Current Due</p>
                   <p className="text-2xl font-black text-red-400">৳{currentDue.toLocaleString()}</p>
                </div>
                <div className="pt-6 border-t border-white/10">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase opacity-60">Remaining After Pay</span>
                      <span className="text-xl font-black">৳{(currentDue - paymentAmount).toLocaleString()}</span>
                   </div>
                </div>
             </CardContent>
          </Card>

          <div className="bg-blue-50 p-6 rounded-[2rem] border-2 border-dashed border-blue-100 flex items-start gap-4">
             <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
             <div>
                <p className="text-xs font-black uppercase text-blue-900">Atomic Recalculation</p>
                <p className="text-[10px] text-blue-700 font-bold leading-relaxed mt-1 uppercase">
                  System will automatically update invoice status to Paid or Partial based on this collection.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
