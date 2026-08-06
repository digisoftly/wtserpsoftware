"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, LifeBuoy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, addDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"

export default function NewTicketPage() {
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

  const handleAddTicket = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const ticketData = {
      companyId,
      branchId,
      subject: formData.get("subject") as string,
      customerId: formData.get("customerId") as string,
      priority: formData.get("priority") as string,
      description: formData.get("description") as string || "",
      status: "open",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "companies", companyId, "branches", branchId, "tickets"), ticketData);
      toast({ title: t('success') });
      router.push("/support");
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold font-headline text-indigo-600 uppercase tracking-tight">{t('addTicket')}</h1>
      </div>

      <Card className="p-8 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
        <form onSubmit={handleAddTicket} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('subject')} *</Label>
            <Input name="subject" required className="h-12 rounded-xl border-none ring-1 ring-slate-200" placeholder="e.g. Camera signal loss at site A" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Link Customer</Label>
              <Select name="customerId" required>
                <SelectTrigger className="h-12 rounded-xl bg-white border-none ring-1 ring-slate-200"><SelectValue placeholder="Select Client" /></SelectTrigger>
                <SelectContent className="rounded-xl max-h-[250px]">
                  {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-sm font-bold">{c.firstName} {c.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('priority')}</Label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger className="h-12 rounded-xl bg-white border-none ring-1 ring-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="low" className="text-xs font-bold text-slate-500">{t('low')}</SelectItem>
                  <SelectItem value="medium" className="text-xs font-bold text-blue-600">{t('medium')}</SelectItem>
                  <SelectItem value="high" className="text-xs font-bold text-red-600">{t('high')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Full Description</Label>
            <textarea name="description" className="w-full min-h-[120px] rounded-2xl bg-white border-none ring-1 ring-slate-200 p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Describe the issue in detail..." />
          </div>

          <div className="pt-6">
            <Button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100">
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
              {t('submitTicket')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}