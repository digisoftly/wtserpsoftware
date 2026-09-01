"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  User, 
  Building, 
  Phone,
  Mail,
  MapPin,
  CreditCard,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFirestore } from "@/firebase"
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function NewCustomerPage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [customerType, setCustomerType] = React.useState<"individual" | "company" | "organization">("individual");
  
  const handleSaveCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const customerId = `CUST-${Date.now().toString().slice(-6)}`;
    
    const customerData = {
      id: customerId,
      companyId,
      branchId,
      customerType,
      fullName: customerType === 'individual' ? (formData.get("fullName") as string) : (formData.get("companyName") as string),
      companyName: formData.get("companyName") as string || "",
      contactPerson: formData.get("contactPerson") as string || "",
      phoneNumber: formData.get("phoneNumber") as string,
      email: formData.get("email") as string || "",
      address: formData.get("address") as string || "",
      creditLimit: Number(formData.get("creditLimit") || 0),
      openingDue: Number(formData.get("openingDue") || 0),
      paymentTerms: formData.get("paymentTerms") || "Cash",
      category: formData.get("category") || "Retail",
      priority: formData.get("priority") || "Normal",
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, "companies", companyId, "branches", branchId, "customers", customerId), customerData);
      toast({ title: t('success') });
      router.push("/customers");
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between border-b pb-4 px-1 sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md py-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-black font-headline uppercase tracking-tight text-slate-900">{t('addCustomer')}</h1>
            <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Global Identity Terminal</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 overflow-hidden">
        <form onSubmit={handleSaveCustomer} className="p-6 md:p-10 space-y-10">
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <Label className="text-[11px] font-black uppercase text-slate-400 tracking-widest">{t('customerType')}</Label>
              <div className="flex gap-2 p-1 bg-slate-50 rounded-2xl w-fit border border-slate-100">
                {["individual", "company", "organization"].map((type) => (
                  <button 
                    key={type}
                    type="button" 
                    className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all", 
                      customerType === type ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200" : "text-slate-400 hover:text-slate-600")} 
                    onClick={() => setCustomerType(type as any)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {customerType === 'individual' ? (
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Full Legal Name *</Label>
                  <Input name="fullName" required className="h-12 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-bold" />
                </div>
              ) : (
                <>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Organization Name *</Label>
                    <Input name="companyName" required className="h-12 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-bold uppercase" />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Key Contact Person</Label>
                    <Input name="contactPerson" className="h-12 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-bold" />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500">Contact Number *</Label>
                <Input name="phoneNumber" required className="h-12 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-bold" placeholder="+880" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-500">Email Identity</Label>
                <Input name="email" type="email" className="h-12 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-bold" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-[10px] font-black uppercase text-slate-500">Full Shipping & Billing Address</Label>
                <textarea name="address" className="w-full min-h-[100px] p-4 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-bold text-xs resize-none outline-none" />
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-10 border-t border-slate-50">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <CreditCard className="h-4 w-4" />
               </div>
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">CRM & Financial Matrix</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Credit Limit</Label><Input name="creditLimit" type="number" defaultValue="0" className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 font-black text-blue-600" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Opening Due</Label><Input name="openingDue" type="number" defaultValue="0" className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 font-black text-red-600" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Payment Terms</Label><Input name="paymentTerms" defaultValue="Cash" className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 font-bold" /></div>
             </div>
          </div>

          <div className="pt-10 flex justify-center">
            <Button type="submit" disabled={isSubmitting} className="w-full max-w-md h-16 rounded-[2rem] bg-slate-900 hover:bg-black text-white font-black uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 group">
              {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : <CheckCircle2 className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />}
              Finalize Registration
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}