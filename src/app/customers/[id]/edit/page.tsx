
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
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
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
  const [formData, setFormData] = React.useState({
    customerType: "individual",
    fullName: "",
    companyName: "",
    contactPerson: "",
    phoneNumber: "",
    email: "",
    address: "",
    creditLimit: 0,
    openingDue: 0,
    paymentTerms: "Cash",
    category: "Retail",
    priority: "Normal"
  });
  
  const customerRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return doc(db, "companies", companyId, "branches", branchId, "customers", id as string);
  }, [db, companyId, branchId, id]);

  const { data: customer, isLoading } = useDoc(customerRef);

  // Sync data to state once it loads
  React.useEffect(() => {
    if (customer) {
      setFormData({
        customerType: customer.customerType || "individual",
        fullName: customer.fullName || "",
        companyName: customer.companyName || "",
        contactPerson: customer.contactPerson || "",
        phoneNumber: customer.phoneNumber || "",
        email: customer.email || "",
        address: customer.address || "",
        creditLimit: Number(customer.creditLimit || 0),
        openingDue: Number(customer.openingDue || 0),
        paymentTerms: customer.paymentTerms || "Cash",
        category: customer.category || "Retail",
        priority: customer.priority || "Normal"
      });
    }
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerRef || isSubmitting) return;

    setIsSubmitting(true);
    const updateData = {
      ...formData,
      fullName: formData.customerType === 'individual' ? formData.fullName : formData.companyName,
      updatedAt: serverTimestamp(),
    };

    try {
      await updateDoc(customerRef, updateData);
      toast({ title: t('success') });
      router.push(`/customers/${id}/view`);
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
      setIsSubmitting(false);
    }
  };

  if (isLoading || !customer) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] min-h-screen pb-20">
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg md:text-xl font-black font-headline uppercase tracking-tight text-slate-900">Edit Identity</h1>
            <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest mt-1">Ref: {id}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden sm:inline-flex rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={handleSaveCustomer} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-10 h-11 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-blue-100 gap-2 transition-all active:scale-95" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full p-4 md:p-8">
        <form onSubmit={handleSaveCustomer} className="space-y-8">
          
          <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-[2rem] bg-white overflow-hidden">
            <div className="p-6 md:p-8 space-y-8">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Update Account Type</Label>
                <div className="flex flex-wrap gap-2">
                  {["individual", "company", "organization"].map((type) => (
                    <Button 
                      key={type}
                      type="button" 
                      variant={formData.customerType === type ? 'default' : 'outline'} 
                      className={cn("h-10 rounded-xl text-[10px] font-black uppercase px-8 transition-all", 
                        formData.customerType === type ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" : "text-slate-500 border-slate-200 hover:bg-slate-50")} 
                      onClick={() => handleSelectChange('customerType', type)}
                    >
                      {type === 'individual' ? <User className="h-3.5 w-3.5 mr-2" /> : <Building className="h-3.5 w-3.5 mr-2" />}
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formData.customerType === 'individual' ? (
                  <>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Full Name *</Label>
                      <Input name="fullName" value={formData.fullName} onChange={handleChange} required className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-bold" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Company/Organization Name</Label>
                      <Input name="companyName" value={formData.companyName} onChange={handleChange} className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-bold" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Company/Organization Name *</Label>
                      <Input name="companyName" value={formData.companyName} onChange={handleChange} required className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-bold uppercase" />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Contact Person Name</Label>
                      <Input name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-bold" />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Contact Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required className="h-11 pl-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-bold" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">E-mail Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input name="email" type="email" value={formData.email} onChange={handleChange} className="h-11 pl-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-bold" />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Full Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 h-3.5 w-3.5 text-slate-400" />
                    <textarea name="address" value={formData.address} onChange={handleChange} className="w-full min-h-[100px] pl-11 p-4 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-bold text-xs resize-none outline-none" />
                  </div>
                </div>
              </div>
            </div>
          </Card>

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
                  <Input name="creditLimit" type="number" value={formData.creditLimit} onChange={handleChange} className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-black text-blue-600" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Opening Due (৳)</Label>
                  <Input name="openingDue" type="number" value={formData.openingDue} onChange={handleChange} className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-black text-red-600" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Payment Terms</Label>
                  <Select value={formData.paymentTerms} onValueChange={(v) => handleSelectChange('paymentTerms', v)}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {["Cash", "Advance", "7 Days", "15 Days", "30 Days"].map(m => <SelectItem key={m} value={m} className="text-xs font-bold">{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Category</Label>
                  <Select value={formData.category} onValueChange={(v) => handleSelectChange('category', v)}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {["Corporate", "Government", "Retail", "Dealer", "VIP"].map(c => <SelectItem key={c} value={c} className="text-xs font-bold">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Priority Level</Label>
                  <Select value={formData.priority} onValueChange={(v) => handleSelectChange('priority', v)}>
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
