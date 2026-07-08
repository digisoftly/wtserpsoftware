"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  ShieldCheck, 
  ArrowLeft, 
  Save, 
  Loader2, 
  Calculator,
  Calendar,
  CreditCard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"

export default function NewContractPage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  const handleAddContract = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const customerId = formData.get("customerId") as string;
    const customer = customers?.find(c => c.id === customerId);

    const contractData = {
      companyId,
      branchId,
      contractNumber: `SLA-${Date.now().toString().slice(-6)}`,
      customerId,
      customerName: customer ? `${customer.firstName} ${customer.lastName}` : "Client",
      serviceName: formData.get("serviceName"),
      serviceType: formData.get("serviceType"),
      startDate: formData.get("startDate"),
      monthlyAmount: Number(formData.get("monthlyAmount")),
      billingCycle: formData.get("billingCycle"),
      paymentType: formData.get("paymentType"),
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const contractRef = doc(collection(db, "companies", companyId, "branches", branchId, "service_contracts"));
      await setDoc(contractRef, { ...contractData, id: contractRef.id });
      toast({ title: t('success') });
      router.push("/contracts");
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
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
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-emerald-600">{t('addContract')}</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">SLA Lifecycle Provisioning</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button type="submit" form="contract-form" className="bg-emerald-600 hover:bg-emerald-700 rounded-full px-8 h-10 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 gap-2" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            {t('save')}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full p-4 md:p-10">
        <form id="contract-form" onSubmit={handleAddContract} className="space-y-8">
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Target Client</Label>
                  <Select name="customerId" required>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue placeholder={t('search')} /></SelectTrigger>
                    <SelectContent className="max-h-[300px] rounded-xl">{customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold">{c.firstName} {c.lastName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Service Identification</Label>
                  <Input name="serviceName" required className="h-12 rounded-xl border-none ring-1 ring-slate-200" placeholder="e.g. Corporate CCTV Maintenance" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Service Category</Label>
                  <Select name="serviceType" defaultValue="CCTV">
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="CCTV" className="text-xs font-bold">CCTV Support</SelectItem>
                      <SelectItem value="Internet" className="text-xs font-bold">ISP Subscription</SelectItem>
                      <SelectItem value="AMC" className="text-xs font-bold">Annual Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Service Fee (৳)</Label>
                    <Input name="monthlyAmount" type="number" required className="h-12 rounded-xl font-black text-blue-600 border-none ring-1 ring-slate-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Billing Cycle</Label>
                    <Select name="billingCycle" defaultValue="Monthly">
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl"><SelectItem value="Monthly">Monthly</SelectItem><SelectItem value="Yearly">Yearly</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Commencement Date</Label>
                  <Input name="startDate" type="date" required className="h-12 rounded-xl border-none ring-1 ring-slate-200 font-black uppercase" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Billing Model</Label>
                  <Select name="paymentType" defaultValue="Advance">
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl"><SelectItem value="Advance">Advance Payment</SelectItem><SelectItem value="Postpaid">Post-paid Billing</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 p-6 rounded-3xl border-2 border-dashed border-emerald-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm shrink-0"><ShieldCheck className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-black uppercase tracking-tight text-emerald-900">Governance & Compliance</p>
                <p className="text-[10px] text-emerald-700 mt-1 uppercase font-bold leading-relaxed">This agreement will automatically generate periodic invoices based on the selected billing cycle.</p>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
