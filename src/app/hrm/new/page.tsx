"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, Users } from "lucide-react"
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

export default function NewStaffPage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleAddEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const employeeData = {
      companyId,
      branchId,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      jobTitle: formData.get("jobTitle") as string,
      department: formData.get("department") as string,
      employeeIdNumber: formData.get("idNumber") as string,
      employmentStatus: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "companies", companyId, "branches", branchId, "employees"), employeeData);
      toast({ title: t('success') });
      router.push("/hrm");
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
        <h1 className="text-xl font-bold font-headline text-purple-600 uppercase tracking-tight">{t('addStaff')}</h1>
      </div>

      <Card className="p-8 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
        <form onSubmit={handleAddEmployee} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">First Name *</Label>
              <Input name="firstName" required className="h-12 rounded-xl border-none ring-1 ring-slate-200" placeholder="Rahim" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Last Name *</Label>
              <Input name="lastName" required className="h-12 rounded-xl border-none ring-1 ring-slate-200" placeholder="Ahmed" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Job Title / Position *</Label>
              <Input name="jobTitle" required className="h-12 rounded-xl border-none ring-1 ring-slate-200" placeholder="Senior Engineer" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Employee ID #</Label>
              <Input name="idNumber" className="h-12 rounded-xl border-none ring-1 ring-slate-200 font-mono" placeholder="WTS-001" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Department</Label>
            <Select name="department" defaultValue="Technical">
              <SelectTrigger className="h-12 rounded-xl bg-white border-none ring-1 ring-slate-200"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="Technical" className="text-xs font-bold">Technical</SelectItem>
                <SelectItem value="Sales" className="text-xs font-bold">Sales</SelectItem>
                <SelectItem value="Accounts" className="text-xs font-bold">Accounts</SelectItem>
                <SelectItem value="Support" className="text-xs font-bold">Support</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-6">
            <Button type="submit" disabled={isSubmitting} className="w-full bg-purple-600 hover:bg-purple-700 h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-100">
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
              {t('save')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}