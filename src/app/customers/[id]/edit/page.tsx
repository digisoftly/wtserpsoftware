
"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
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
  Tag,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const [customerType, setCustomerType] = React.useState<"individual" | "company" | "organization">("individual");
  
  const customerRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return doc(db, "companies", companyId, "branches", branchId, "customers", id as string);
  }, [db, companyId, branchId, id]);

  const { data: customer, isLoading } = useDoc(customerRef);

  React.useEffect(() => {
    if (customer) {
      setCustomerType(customer.customerType || "individual");
    }
  }, [customer]);

  const handleSaveCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customerRef || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const fullName = (formData.get("fullName") as string) || "";
    const companyName = (formData.get("companyName") as string) || "";
    const contactPerson = (formData.get("contactPerson") as string) || "";

    const customerData = {
      customerType,
      fullName: customerType === 'individual' ? fullName : companyName,
      companyName,
      contactPerson,
      phoneNumber: formData.get("phoneNumber") as string,
      email: formData.get("email") as string || "",
      address: formData.get("address") as string || "",
      
      // Account & CRM
      creditLimit: Number(formData.get("creditLimit") || 0),
      openingDue: Number(formData.get("openingDue") || 0),
      paymentTerms: formData.get("paymentTerms") || "Cash",
      category: formData.get("category") || "Retail",
      priority: formData.get("priority") || "Normal",
      
      updatedAt: serverTimestamp(),
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

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg md:text-xl font-black font-headline uppercase tracking-tight text-slate-900">Edit Identity</h1>
            <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest mt-1">Ref: {customer?.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden sm:inline-flex rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" form="customer-edit-form" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-10 h-11 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-100 gap-2 transition-all active:scale-95" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full p-4 md:p-8">
        <form id="customer-edit-form" onSubmit={handleSaveCustomer} className="space-y-8">
          
          {/* Identity Section */}
          <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-[2rem] bg-white overflow-hidden">
            <div className="p-6 md:p-8 space-y-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Update Account Type</Label>
                <div className="flex flex-wrap gap-2">
                  {["individual", "company", "organization"].map((type) => (
                    <Button 
                      key={type}
                      type="button" 
                      variant={customerType === type ? 'default' : 'outline'} 
                      className={cn("h-10 rounded-xl text-[10px] font-black uppercase px-8 transition-all", 
                        customerType === type ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" : "text-slate-500 border-slate-200 hover:bg-slate-50")} 
                      onClick={() => setCustomerType(type as any)}
                    >
                      {type === 'individual' ? <User className="h-3.5 w-3.5 mr-2" /> : <Building className="h-3.5 w-3.5 mr-2" />}
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {customerType === 'individual' ? (
                  <>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Full Name *</Label>
                      <Input name="fullName" required defaultValue={customer?.fullName} className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-bold" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Company/Organization Name</Label>
                      <Input name="companyName" defaultValue={customer?.companyName} className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-bold" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Company/Organization Name *</Label>
                      <Input name="companyName" required defaultValue={customer?.companyName} className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-bold uppercase" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Contact Person Name</Label>
                      <Input name="contactPerson" defaultValue={customer?.contactPerson} className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-bold" />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Contact Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input name="phoneNumber" required defaultValue={customer?.phoneNumber} className="h-11 pl-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-bold" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">E-mail Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input name="email" type="email" defaultValue={customer?.email} className="h-11 pl-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-bold" />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Full Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 h-3.5 w-3.5 text-slate-400" />
                    <textarea name="address" defaultValue={customer?.address} className="w-full min-h-[100px] pl-11 p-4 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-bold text-xs resize-none outline-none" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Account & CRM Section */}
          <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-[2rem] bg-white overflow-hidden">
            <div className="p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                  <CreditCard className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest">Account & CRM Settings</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Credit Limit (৳)</Label>
                  <Input name="creditLimit" type="number" defaultValue={customer?.creditLimit} className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-black text-blue-600" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Opening Due (৳)</Label>
                  <Input name="openingDue" type="number" defaultValue={customer?.openingDue} className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-black text-red-600" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Payment Terms</Label>
                  <Select name="paymentTerms" defaultValue={customer?.paymentTerms || "Cash"}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {["Cash", "Advance", "7 Days", "15 Days", "30 Days"].map(m => <SelectItem key={m} value={m} className="text-xs font-bold">{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Category</Label>
                  <Select name="category" defaultValue={customer?.category || "Retail"}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {["Corporate", "Government", "Retail", "Dealer", "VIP"].map(c => <SelectItem key={c} value={c} className="text-xs font-bold">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Priority Level</Label>
                  <Select name="priority" defaultValue={customer?.priority || "Normal"}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {["Low", "Normal", "High", "VIP"].map(p => <SelectItem key={p} value={p} className="text-xs font-bold uppercase">{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          <div className="pt-8 flex justify-center">
            <Button type="submit" disabled={isSubmitting} className="w-full max-w-md h-16 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 group">
              {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : <CheckCircle2 className="h-6 w-6 mr-3 group-hover:scale-110 transition-transform" />}
              Update Records
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
