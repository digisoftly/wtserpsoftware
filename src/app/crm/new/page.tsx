"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore } from "@/firebase"
import { collection, serverTimestamp, addDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"

export default function NewLeadPage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleAddLead = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const leadData = {
      companyId,
      branchId,
      name: formData.get("name") as string,
      company: formData.get("company") as string || "Individual",
      email: formData.get("email") as string || "",
      phone: formData.get("phone") as string || "",
      status: "new",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "companies", companyId, "branches", branchId, "leads"), leadData);
      toast({ title: t('success') });
      router.push("/crm");
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold font-headline text-rose-500 uppercase tracking-tight">{t('addLead')}</h1>
      </div>

      <Card className="p-8 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
        <form onSubmit={handleAddLead} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Prospect Name *</Label>
            <Input name="name" required className="h-12 rounded-xl border-none ring-1 ring-slate-200" placeholder="e.g. Rahim Ahmed" />
          </div>
          
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Organization / Company</Label>
            <Input name="company" className="h-12 rounded-xl border-none ring-1 ring-slate-200" placeholder="e.g. Tech Solutions" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('email')}</Label>
              <Input name="email" type="email" className="h-12 rounded-xl border-none ring-1 ring-slate-200" placeholder="rahim@example.com" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Phone Number</Label>
              <Input name="phone" className="h-12 rounded-xl border-none ring-1 ring-slate-200" placeholder="+880..." />
            </div>
          </div>

          <div className="pt-6">
            <Button type="submit" disabled={isSubmitting} className="w-full bg-rose-500 hover:bg-rose-600 h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-100">
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
              {t('save')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}