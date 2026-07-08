"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  AlertCircle,
  Calculator,
  Calendar,
  CreditCard
} from "lucide-react"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"

export default function EditContractInvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const invoiceRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return doc(db, "companies", companyId, "branches", branchId, "contract_invoices", id as string);
  }, [db, companyId, branchId, id]);

  const { data: invoice, isLoading } = useDoc(invoiceRef);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!invoiceRef || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const updates = {
      amount: Number(formData.get("amount")),
      billingMonth: formData.get("billingMonth") as string,
      status: formData.get("status") as string,
      updatedAt: serverTimestamp(),
    };

    try {
      await updateDoc(invoiceRef, updates);
      toast({ title: t('success') });
      router.back();
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

  if (!invoice) return <div className="p-20 text-center uppercase font-black text-muted-foreground tracking-widest">{t('dataNotFound')}</div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen pb-20">
      <div className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-blue-600">Modify SLA Invoice</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{invoice.contractNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button type="submit" form="edit-invoice-form" className="bg-blue-600 hover:bg-blue-700 rounded-full px-8 h-10 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 gap-2" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            {t('save')}
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full p-4 md:p-10">
        <form id="edit-invoice-form" onSubmit={handleSave}>
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-8">
            <div className="space-y-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Billing Month</Label>
                <Input name="billingMonth" defaultValue={invoice.billingMonth} required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Invoice Amount (৳)</Label>
                <Input name="amount" type="number" defaultValue={invoice.amount} required className="h-12 rounded-xl font-black text-blue-600" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Payment Status</Label>
                <Select name="status" defaultValue={invoice.status}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="due" className="text-xs font-bold uppercase">DUE</SelectItem>
                    <SelectItem value="paid" className="text-xs font-bold uppercase text-green-600">PAID</SelectItem>
                    <SelectItem value="cancelled" className="text-xs font-bold uppercase text-red-600">CANCELLED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0"><Calculator className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-black uppercase tracking-tight text-slate-900">Audit Trail Active</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold leading-relaxed">Adjustments to this invoice will be recorded in the system audit logs.</p>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
