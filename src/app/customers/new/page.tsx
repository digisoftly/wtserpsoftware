
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  User, 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore } from "@/firebase"
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs, limit } from "firebase/firestore"
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
  const [duplicateWarning, setDuplicateWarning] = React.useState<string | null>(null);
  
  // Controlled Select States
  const [category, setCategory] = React.useState("Retail");
  const [priority, setPriority] = React.useState("Normal");
  const [paymentMethod, setPaymentMethod] = React.useState("Cash");
  const [officeAddress, setOfficeAddress] = React.useState("");

  const handleDuplicateCheck = async (field: string, value: string) => {
    if (!value || value.length < 5 || !db || !companyId || !branchId) return;
    
    try {
      const q = query(
        collection(db, "companies", companyId, "branches", branchId, "customers"),
        where(field, "==", value),
        limit(1)
      );
      
      const snap = await getDocs(q);
      if (!snap.empty) {
        setDuplicateWarning(`Duplicate ${field} (${value}) detected.`);
      } else {
        setDuplicateWarning(null);
      }
    } catch (e) {
      console.error("Duplicate check failed", e);
    }
  };

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
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      fullName: `${formData.get("firstName")} ${formData.get("lastName")}`,
      companyName: customerType !== "individual" ? (formData.get("companyName") as string) : "",
      phoneNumber: formData.get("phoneNumber") as string,
      email: formData.get("email") as string || "",
      address: officeAddress,
      city: formData.get("city") as string || "",
      district: formData.get("district") as string || "",
      creditLimit: Number(formData.get("creditLimit") || 0),
      openingDue: Number(formData.get("openingDue") || 0),
      openingAdvance: Number(formData.get("openingAdvance") || 0),
      paymentMethod,
      priority,
      category,
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = doc(db, "companies", companyId, "branches", branchId, "customers", customerId);
      await setDoc(docRef, customerData);
      toast({ title: t('success') });
      router.push("/customers");
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] min-h-screen">
      {/* COMPACT HEADER */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg md:text-xl font-black font-headline uppercase tracking-tight text-slate-900">{t('addCustomer')}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden sm:inline-flex rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button 
            type="submit" 
            form="customer-form" 
            className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-full px-8 h-10 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-cyan-100 gap-2 transition-all active:scale-95" 
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            {t('save')}
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full p-4 md:p-8">
        <form id="customer-form" onSubmit={handleSaveCustomer} className="space-y-6">
          
          {duplicateWarning && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-[10px] font-black uppercase text-red-700">{duplicateWarning}</p>
            </div>
          )}

          {/* IDENTITY TYPE SELECTION */}
          <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-6 md:p-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Select Account Type</Label>
                <div className="flex flex-wrap gap-2">
                  {["individual", "company", "organization"].map((type) => (
                    <Button 
                      key={type}
                      type="button" 
                      variant={customerType === type ? 'default' : 'outline'} 
                      className={cn(
                        "h-10 rounded-xl text-[10px] font-black uppercase transition-all px-6",
                        customerType === type ? "bg-slate-900 text-white border-slate-900" : "text-slate-400 border-slate-200"
                      )} 
                      onClick={() => setCustomerType(type as any)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CORE INFORMATION */}
            <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-white p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <User className="h-4 w-4 text-cyan-600" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Personal Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customerType !== 'individual' && (
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Company Name *</Label>
                    <Input name="companyName" required className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200" onBlur={(e) => handleDuplicateCheck('companyName', e.target.value)} />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">{t('firstName')} *</Label>
                  <Input name="firstName" required className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">{t('lastName')} *</Label>
                  <Input name="lastName" required className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Mobile Number *</Label>
                  <Input name="phoneNumber" required className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200" placeholder="+880" onBlur={(e) => handleDuplicateCheck('phoneNumber', e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Email Address</Label>
                  <Input name="email" type="email" className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200" onBlur={(e) => handleDuplicateCheck('email', e.target.value)} />
                </div>
              </div>
            </Card>

            {/* LOCATION INFORMATION */}
            <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-white p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <MapPin className="h-4 w-4 text-orange-600" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Location</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Full Address</Label>
                  <textarea 
                    className="w-full min-h-[90px] rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-600 transition-all" 
                    value={officeAddress}
                    onChange={(e) => setOfficeAddress(e.target.value)}
                    placeholder="Enter street, area, house number..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">City</Label><Input name="city" className="h-10 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">District</Label><Input name="district" className="h-10 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200" /></div>
                </div>
              </div>
            </Card>

            {/* FINANCIAL RULES */}
            <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-white p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Financial Rules</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Credit Limit (৳)</Label>
                  <Input name="creditLimit" type="number" className="h-11 rounded-xl bg-blue-50/30 border-none ring-1 ring-blue-100 font-black text-blue-700" placeholder="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Opening Due (৳)</Label>
                  <Input name="openingDue" type="number" className="h-11 rounded-xl bg-red-50/30 border-none ring-1 ring-red-100 font-black text-red-600" placeholder="0" />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                   <Label className="text-[10px] font-black uppercase text-slate-500">Preferred Payment Method</Label>
                   <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-11 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 font-bold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {["Cash", "Bank", "bKash", "Nagad"].map(m => <SelectItem key={m} value={m} className="text-xs font-bold">{m}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>
              </div>
            </Card>

            {/* SEGMENTATION */}
            <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-white p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-3 border-b pb-4">
                <ShieldCheck className="h-4 w-4 text-purple-600" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Segmentation</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-10 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 font-bold text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {["Corporate", "Government", "Retail", "Dealer", "VIP"].map(c => <SelectItem key={c} value={c} className="text-xs font-bold">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-10 rounded-xl bg-slate-50/50 border-none ring-1 ring-slate-200 font-bold text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Low" className="text-xs font-bold">Low</SelectItem>
                      <SelectItem value="Normal" className="text-xs font-bold">Normal</SelectItem>
                      <SelectItem value="High" className="text-xs font-bold text-orange-600">High</SelectItem>
                      <SelectItem value="VIP" className="text-xs font-bold text-purple-600">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </div>

          <div className="pt-10 flex justify-center">
             <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full max-w-sm h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95"
              >
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                Confirm Registration
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
