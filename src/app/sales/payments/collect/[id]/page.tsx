
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
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
import { useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, where, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { PaymentService } from "@/lib/payment-service"

export default function CollectPaymentPage() {
  const { id } = useParams();
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [paymentAmount, setPaymentAmount] = React.useState<number>(0);
  const [paymentMethod, setPaymentMethod] = React.useState("Cash");
  const [reference, setReference] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [paymentDate, setPaymentDate] = React.useState(new Date().toISOString().split('T')[0]);

  // Queries
  const invoiceRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return doc(db, "companies", companyId, "branches", branchId, "sales_invoices", id as string);
  }, [db, companyId, branchId, id]);

  const { data: invoice, isLoading } = useDoc(invoiceRef);

  const methodsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_data"), where("type", "==", "paymentMethods"));
  }, [db, companyId]);
  const { data: methods } = useCollection(methodsQuery);

  const handleSave = async () => {
    if (!db || !companyId || !branchId || !invoice || paymentAmount <= 0) return;

    setIsSubmitting(true);
    try {
      const result = await PaymentService.processPayment(db, companyId, branchId, {
        invoiceId: id,
        amount: paymentAmount,
        customerId: invoice.customerId,
        paymentMethod,
        reference,
        paymentDate,
        notes,
        receivedBy: "System Admin"
      });

      toast({ title: t('success'), description: `Payment collected. Receipt: ${result.receiptNumber}` });
      router.push(`/sales/payments/history/${id}`);
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  if (!invoice) return <div className="p-20 text-center uppercase font-black text-muted-foreground">{t('dataNotFound')}</div>;

  const currentDue = Number(invoice.totalAmount || 0) - Number(invoice.paidAmount || 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between border-b pb-4 bg-white sticky top-0 z-50 px-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Collect Payment</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{invoice.invoiceNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="font-bold text-xs" onClick={() => router.back()}>{t('cancel')}</Button>
          <Button size="sm" className="font-bold text-xs gap-2 bg-green-600 hover:bg-green-700" disabled={isSubmitting || paymentAmount <= 0} onClick={handleSave}>
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Confirm Payment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm ring-1 ring-slate-200">
            <CardHeader className="bg-slate-50/50 border-b py-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">Transaction Details</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
               <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-slate-400">Customer</Label>
                    <p className="text-sm font-black uppercase text-slate-900">{invoice.customerName}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-slate-400">Invoice Amount</Label>
                    <p className="text-sm font-black text-slate-900">৳{invoice.totalAmount?.toLocaleString()}</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Payment Date</Label>
                    <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="h-12 rounded-xl font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Payment Method</Label>
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
                      className="h-12 rounded-xl font-black text-lg text-green-600 border-2 border-green-50 focus:border-green-200" 
                      placeholder="0.00"
                    />
                  </div>
               </div>

               <div className="space-y-2 pt-4">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Notes</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="rounded-xl min-h-[100px] text-xs font-medium" placeholder="Additional payment remarks..." />
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2rem] overflow-hidden">
             <CardHeader className="p-8 pb-0">
               <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-60">Balance Reconciliation</CardTitle>
             </CardHeader>
             <CardContent className="p-8 space-y-6">
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase text-blue-400">Initial Due</p>
                   <p className="text-3xl font-black tracking-tighter">৳{currentDue.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black uppercase text-green-400">Paying Now</p>
                   <p className="text-3xl font-black tracking-tighter text-green-400">৳{paymentAmount.toLocaleString()}</p>
                </div>
                <div className="pt-6 border-t border-white/10">
                   <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black uppercase opacity-60">Remaining Balance</span>
                      <span className="text-xl font-black">৳{(currentDue - paymentAmount).toLocaleString()}</span>
                   </div>
                </div>
             </CardContent>
          </Card>

          <div className="bg-blue-50 p-6 rounded-[2rem] border-2 border-dashed border-blue-100 flex items-start gap-4">
             <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
             <div>
                <p className="text-xs font-black uppercase text-blue-900">Ledger Integration</p>
                <p className="text-[10px] text-blue-700 font-bold leading-relaxed mt-1 uppercase">
                  This transaction will automatically be recorded in your accounting journals and customer payment history.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
