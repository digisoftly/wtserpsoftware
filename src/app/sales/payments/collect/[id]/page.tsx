"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  User, 
  CreditCard, 
  Calendar,
  FileText,
  Calculator,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
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
  const remainingDue = Math.max(0, currentDue - paymentAmount);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* COMPACT HEADER */}
      <div className="flex items-center justify-between border-b pb-4 bg-white sticky top-0 z-50 px-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{t('collectPayment')}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Invoice-wise Payment Collection</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="font-bold text-xs px-4" onClick={() => router.back()}>{t('cancel')}</Button>
          <Button size="sm" className="font-bold text-xs gap-2 px-6 h-9 rounded-lg" disabled={isSubmitting || paymentAmount <= 0} onClick={handleSave}>
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Confirm Payment
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white">
        <CardContent className="p-6 md:p-10 space-y-8">
          {/* CUSTOMER & INVOICE HEADER INFO */}
          <div className="flex flex-col gap-1 border-b pb-6">
            <h2 className="text-sm font-black uppercase text-slate-900">{invoice.customerName}</h2>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
              <div className="flex gap-2"><span>Invoice:</span> <span className="text-blue-600">{invoice.invoiceNumber}</span></div>
              <div className="flex gap-2"><span>Date:</span> <span className="text-slate-700">{new Date(invoice.invoiceDate).toLocaleDateString()}</span></div>
              <div className="flex gap-2"><span>Gross Total:</span> <span className="text-slate-700">৳{invoice.totalAmount?.toLocaleString()}</span></div>
            </div>
          </div>

          {/* PAYMENT SUMMARY BLOCK */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-xl border border-slate-100 bg-slate-50/30">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoice Total</p>
              <p className="text-lg font-black text-slate-900">৳{invoice.totalAmount?.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Previously Paid</p>
              <p className="text-lg font-black text-emerald-600">৳{invoice.paidAmount?.toLocaleString() || '0'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Due</p>
              <p className="text-lg font-black text-red-600">৳{currentDue.toLocaleString()}</p>
            </div>
          </div>

          {/* PAYMENT DETAILS FORM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('paymentAmount')} (৳)</Label>
              <Input 
                type="number" 
                value={paymentAmount || ''} 
                onChange={e => setPaymentAmount(Math.min(currentDue, Number(e.target.value)))} 
                className="h-11 rounded-lg font-black text-blue-600 border-slate-200 bg-slate-50/30" 
                placeholder="0.00"
              />
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Remaining Due: <span className="text-red-600">৳{remainingDue.toLocaleString()}</span>
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('paymentDate')}</Label>
              <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="h-11 rounded-lg font-bold border-slate-200" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('paymentMethod')}</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-11 rounded-lg border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {methods?.map(m => <SelectItem key={m.id} value={m.name} className="text-xs font-bold">{m.name}</SelectItem>)}
                  {!methods?.length && ["Cash", "Bank Transfer", "bKash"].map(m => <SelectItem key={m} value={m} className="text-xs font-bold">{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Transaction / Reference ID</Label>
              <Input value={reference} onChange={e => setReference(e.target.value)} className="h-11 rounded-lg font-mono text-xs border-slate-200" placeholder="e.g. TXN-123456" />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('notes')}</Label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="rounded-lg min-h-[80px] text-xs font-medium border-slate-200" placeholder="Additional remarks..." />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
