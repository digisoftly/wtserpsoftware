"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, Receipt } from "lucide-react"
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

export default function NewExpensePage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleAddExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const expenseData = {
      companyId,
      branchId,
      description: formData.get("description") as string,
      amount: Number(formData.get("amount")),
      category: formData.get("category") as string,
      paymentMethod: formData.get("paymentMethod") as string,
      expenseDate: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "companies", companyId, "branches", branchId, "expenses"), expenseData);
      toast({ title: t('success') });
      router.push("/expenses");
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
        <h1 className="text-xl font-bold font-headline text-red-600 uppercase tracking-tight">{t('addExpense')}</h1>
      </div>

      <Card className="p-8 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
        <form onSubmit={handleAddExpense} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('label')}</Label>
            <Input name="description" required className="h-12 rounded-xl border-none ring-1 ring-slate-200" placeholder="e.g. Internet Bill" />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('amount')} (৳)</Label>
              <Input name="amount" type="number" step="0.01" required className="h-12 rounded-xl border-none ring-1 ring-slate-200 font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('type')}</Label>
              <Select name="category" defaultValue="utility">
                <SelectTrigger className="h-12 rounded-xl bg-white border-none ring-1 ring-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                    <SelectItem value="utility" className="text-xs font-bold">{t('utility')}</SelectItem>
                    <SelectItem value="rent" className="text-xs font-bold">{t('rent')}</SelectItem>
                    <SelectItem value="salary" className="text-xs font-bold">{t('salary')}</SelectItem>
                    <SelectItem value="transport" className="text-xs font-bold">Transport</SelectItem>
                    <SelectItem value="others" className="text-xs font-bold">Others</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Payment Method</Label>
            <Select name="paymentMethod" defaultValue="cash">
              <SelectTrigger className="h-12 rounded-xl bg-white border-none ring-1 ring-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="cash" className="text-xs font-bold">Cash</SelectItem>
                <SelectItem value="bank" className="text-xs font-bold">Bank</SelectItem>
                <SelectItem value="bkash" className="text-xs font-bold">bKash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-6">
            <Button type="submit" disabled={isSubmitting} className="w-full bg-red-500 hover:bg-red-600 h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-red-100">
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
              {t('save')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}