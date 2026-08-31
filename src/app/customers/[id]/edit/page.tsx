
"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  CreditCard, 
  Briefcase, 
  ShieldCheck, 
  Smartphone,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function EditCustomerPage() {
  const { id } = useParams();
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSameAddress, setIsSameAddress] = React.useState(false);

  const customerRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return doc(db, "companies", companyId, "branches", branchId, "customers", id as string);
  }, [db, companyId, branchId, id]);

  const { data: customer, isLoading } = useDoc(customerRef);

  const handleSaveCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customerRef || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const customerData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      fullName: `${formData.get("firstName")} ${formData.get("lastName")}`,
      companyName: formData.get("companyName") as string || "",
      contactPerson: formData.get("contactPerson") as string || "",
      
      // Contact
      phoneNumber: formData.get("phoneNumber") as string,
      altMobile: formData.get("altMobile") as string || "",
      whatsapp: formData.get("whatsapp") as string || "",
      email: formData.get("email") as string || "",
      website: formData.get("website") as string || "",

      // Address
      address: formData.get("address") as string || "",
      billingAddress: formData.get("billingAddress") as string || "",
      shippingAddress: formData.get("shippingAddress") as string || "",
      city: formData.get("city") as string || "",
      district: formData.get("district") as string || "",

      // Account
      creditLimit: Number(formData.get("creditLimit") || 0),
      openingDue: Number(formData.get("openingDue") || 0),
      openingAdvance: Number(formData.get("openingAdvance") || 0),
      paymentTerms: formData.get("paymentTerms") as string || "Cash",

      // CRM
      priority: formData.get("priority") as string || "Normal",
      category: formData.get("category") as string || "Retail",
      
      updatedAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
    };

    try {
      await updateDoc(customerRef, customerData);
      toast({ title: t('success') });
      router.push(`/customers/${id}/view`);
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-cyan-600" /></div>;

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] min-h-screen pb-20">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-black font-headline uppercase tracking-tight text-cyan-600">Modify Identity</h1>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">{customer?.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" form="customer-edit-form" className="bg-cyan-600 hover:bg-cyan-700 rounded-full px-10 h-11 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-cyan-100 gap-2" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full p-4 md:p-10">
        <form id="customer-edit-form" onSubmit={handleSaveCustomer} className="space-y-8">
          
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-600">
                  <User className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">Core Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-3 space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Legal Company Name</Label>
                  <Input name="companyName" defaultValue={customer?.companyName} className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">First Name *</Label>
                  <Input name="firstName" defaultValue={customer?.firstName} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Last Name *</Label>
                  <Input name="lastName" defaultValue={customer?.lastName} required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Contact Person</Label>
                  <Input name="contactPerson" defaultValue={customer?.contactPerson} className="h-12 rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white ring-1 ring-slate-100 p-8 space-y-6">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Phone className="h-4 w-4" /> Reach Details</h3>
               <div className="space-y-4">
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Mobile</Label><Input name="phoneNumber" defaultValue={customer?.phoneNumber} className="h-11 rounded-xl" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">WhatsApp</Label><Input name="whatsapp" defaultValue={customer?.whatsapp} className="h-11 rounded-xl" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Email</Label><Input name="email" defaultValue={customer?.email} className="h-11 rounded-xl" /></div>
               </div>
            </Card>

            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white ring-1 ring-slate-100 p-8 space-y-6">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><MapPin className="h-4 w-4" /> Location</h3>
               <div className="space-y-4">
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Address</Label><textarea name="address" defaultValue={customer?.address} className="w-full min-h-[100px] rounded-xl ring-1 ring-slate-200 p-4 text-xs font-bold" /></div>
               </div>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}

