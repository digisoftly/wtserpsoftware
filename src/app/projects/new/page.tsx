"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  Folder, 
  ArrowLeft, 
  Save, 
  Loader2, 
  Plus
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

export default function NewProjectPage() {
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

  const handleSaveProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const custId = formData.get("customerId") as string;
    const customer = customers?.find(c => c.id === custId);

    const projectData = {
      name: formData.get("name") as string,
      projectCode: `PRJ-${Date.now().toString().slice(-6)}`,
      customerId: custId,
      customerName: customer ? `${customer.firstName} ${customer.lastName}` : "Client",
      startDate: formData.get("startDate") as string,
      deadline: formData.get("deadline") as string,
      budget: Number(formData.get("budget")),
      status: "Pending",
      progress: 0,
      paidAmount: 0,
      description: formData.get("description") || "",
      companyId,
      branchId,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    try {
      const newRef = doc(collection(db, "companies", companyId, "branches", branchId, "projects"));
      await setDoc(newRef, { ...projectData, id: newRef.id });
      toast({ title: t('success') });
      router.push("/projects");
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
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-teal-600">{t('addProject')}</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Project Identity Terminal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button type="submit" form="project-form" className="bg-teal-600 hover:bg-teal-700 rounded-full px-8 h-10 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-teal-100 gap-2" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            {t('save')}
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full p-4 md:p-10">
        <form id="project-form" onSubmit={handleSaveProject} className="space-y-8">
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('project')} Name *</Label>
                <Input name="name" required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('customer')} *</Label>
                <Select name="customerId" required>
                  <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue placeholder="Select Client" /></SelectTrigger>
                  <SelectContent>{customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold">{c.firstName} {c.lastName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('startDate')}</Label>
                <Input name="startDate" type="date" required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('deadline')}</Label>
                <Input name="deadline" type="date" required className="h-12 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('estimatedBudget')} (৳) *</Label>
                <Input name="budget" type="number" required className="h-12 rounded-xl font-black text-blue-600" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('details')}</Label>
              <textarea name="description" className="w-full min-h-[120px] rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 p-4 text-xs resize-none outline-none focus:ring-2 focus:ring-teal-500 transition-all" placeholder="Enter project scope and technical details..." />
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-teal-600 shadow-sm shrink-0"><Folder className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-black uppercase tracking-tight text-slate-900">Project Provisioning</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold leading-relaxed">This record will be the base for all progress tracking and billing operations.</p>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
