"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  UserPlus, 
  ArrowLeft, 
  Save, 
  Loader2, 
  User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore } from "@/firebase"
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"

export default function NewCustomerPage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [customerType, setCustomerType] = React.useState<"individual" | "company">("individual");

  const handleSaveCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const customerData = {
      companyId,
      branchId,
      customerType,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string || "",
      phoneNumber: formData.get("phoneNumber") as string || "",
      companyName: customerType === "company" ? (formData.get("companyName") as string) : "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const colRef = collection(db, "companies", companyId, "branches", branchId, "customers");
      const newDocRef = doc(colRef);
      await setDoc(newDocRef, { ...customerData, id: newDocRef.id });
      toast({ title: t('success') });
      router.push("/customers");
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
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-cyan-600">{t('addCustomer')}</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Client Identity Provisioning</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button type="submit" form="customer-form" className="bg-cyan-600 hover:bg-cyan-700 rounded-full px-8 h-10 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-cyan-100 gap-2" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            {t('save')}
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full p-4 md:p-10">
        <form id="customer-form" onSubmit={handleSaveCustomer} className="space-y-8">
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Customer Type</Label>
                <div className="flex gap-4">
                  <Button type="button" variant={customerType === 'individual' ? 'default' : 'outline'} className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase" onClick={() => setCustomerType('individual')}>Individual</Button>
                  <Button type="button" variant={customerType === 'company' ? 'default' : 'outline'} className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase" onClick={() => setCustomerType('company')}>Company / Corp</Button>
                </div>
              </div>
              {customerType === 'company' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Company Name *</Label>
                  <Input name="companyName" required className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
               <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">First Name *</Label><Input name="firstName" required className="h-12 rounded-xl" /></div>
               <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Last Name *</Label><Input name="lastName" required className="h-12 rounded-xl" /></div>
               <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Email Address</Label><Input name="email" type="email" className="h-12 rounded-xl" /></div>
               <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Phone Number *</Label><Input name="phoneNumber" required className="h-12 rounded-xl" placeholder="+880..." /></div>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-cyan-600 shadow-sm shrink-0"><User className="h-6 w-6" /></div>
              <div>
                <p className="text-xs font-black uppercase tracking-tight text-slate-900">CRM Synchronization</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold leading-relaxed">This client will be available globally for Sales, Support, and Project modules.</p>
              </div>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
