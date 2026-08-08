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
  const remainingDue = Math.max(0, currentDue - paymentAmount);

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
            {t('postTransaction')}
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm ring-1 ring-slate-200 bg-white">
        <CardContent className="p-6 md:p-10 space-y-8">
          {/* SELECTION ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('customer')}</Label>
              <Select value={selectedCustomerId} onValueChange={(val) => { setSelectedCustomerId(val); setSelectedInvoiceId(""); }}>
                <SelectTrigger className="h-10 rounded-lg bg-slate-50/50 border-slate-200"><SelectValue placeholder="Select Customer" /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-medium">{c.firstName} {c.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('invoiceNumber')}</Label>
              <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId} disabled={!selectedCustomerId}>
                <SelectTrigger className="h-10 rounded-lg bg-slate-50/50 border-slate-200"><SelectValue placeholder={!selectedCustomerId ? "Select customer first" : "Choose Invoice"} /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {invoices?.map(inv => <SelectItem key={inv.id} value={inv.id} className="text-xs font-bold">{inv.invoiceNumber} (Due: ৳{((inv.totalAmount || 0) - (inv.paidAmount || 0)).toLocaleString()})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedInvoice && (
            <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
              {/* INVOICE INFO HEADER */}
              <div className="flex flex-wrap gap-x-8 gap-y-2 py-3 px-4 bg-slate-50 rounded-lg border border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                <div className="flex gap-2"><span>No:</span> <span className="text-slate-900">{selectedInvoice.invoiceNumber}</span></div>
                <div className="flex gap-2"><span>Date:</span> <span className="text-slate-900">{new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</span></div>
                <div className="flex gap-2"><span>Total:</span> <span className="text-blue-600">৳{selectedInvoice.totalAmount?.toLocaleString()}</span></div>
              </div>

              {/* PAYMENT SUMMARY BLOCK */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-xl border border-slate-100 bg-white">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Invoice Total</p>
                  <p className="text-lg font-black text-slate-900">৳{selectedInvoice.totalAmount?.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Previously Paid</p>
                  <p className="text-lg font-black text-emerald-600">৳{selectedInvoice.paidAmount?.toLocaleString() || '0'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Due</p>
                  <p className="text-lg font-black text-red-600">৳{currentDue.toLocaleString()}</p>
                </div>
              </div>

              {/* PAYMENT DETAILS FORM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
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
            </div>
          )}

          {!selectedInvoice && (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-3 opacity-20">
              <CreditCard className="h-12 w-12" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Select customer and invoice to load details</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
