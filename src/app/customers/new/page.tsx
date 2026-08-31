
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  UserPlus, 
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
  FileText, 
  Globe, 
  Plus, 
  AlertCircle,
  Smartphone,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
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
  const [isSameAddress, setIsSameAddress] = React.useState(false);
  const [duplicateWarning, setDuplicateWarning] = React.useState<string | null>(null);

  // Address State for "Same as" logic
  const [officeAddress, setOfficeAddress] = React.useState("");

  const handleDuplicateCheck = async (field: string, value: string) => {
    if (!value || value.length < 5 || !db || !companyId || !branchId) return;
    
    const q = query(
      collection(db, "companies", companyId, "branches", branchId, "customers"),
      where(field, "==", value),
      limit(1)
    );
    
    const snap = await getDocs(q);
    if (!snap.empty) {
      setDuplicateWarning(`Potential duplicate detected with this ${field}: ${value}`);
    } else {
      setDuplicateWarning(null);
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
      contactPerson: formData.get("contactPerson") as string || "",
      contactPersonDesignation: formData.get("designation") as string || "",
      
      // Contact
      phoneNumber: formData.get("phoneNumber") as string,
      altMobile: formData.get("altMobile") as string || "",
      whatsapp: formData.get("whatsapp") as string || "",
      email: formData.get("email") as string || "",
      website: formData.get("website") as string || "",

      // Address
      address: officeAddress,
      permanentAddress: formData.get("permanentAddress") as string || "",
      billingAddress: formData.get("billingAddress") as string || "",
      shippingAddress: isSameAddress ? officeAddress : (formData.get("shippingAddress") as string || ""),
      city: formData.get("city") as string || "",
      district: formData.get("district") as string || "",
      country: formData.get("country") as string || "Bangladesh",

      // Business
      industry: formData.get("industry") as string || "",
      businessType: formData.get("businessType") as string || "",
      tradeLicense: formData.get("tradeLicense") as string || "",
      bin: formData.get("bin") as string || "",
      tin: formData.get("tin") as string || "",

      // Account
      creditLimit: Number(formData.get("creditLimit") || 0),
      creditDays: Number(formData.get("creditDays") || 0),
      openingDue: Number(formData.get("openingDue") || 0),
      openingAdvance: Number(formData.get("openingAdvance") || 0),
      paymentTerms: formData.get("paymentTerms") as string || "Cash",
      preferredPaymentMethod: formData.get("paymentMethod") as string || "Cash",

      // CRM
      leadSource: formData.get("leadSource") as string || "Direct",
      priority: formData.get("priority") as string || "Normal",
      category: formData.get("category") as string || "Retail",
      
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
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
    <div className="flex flex-col h-full bg-[#F8FAFC] min-h-screen pb-20">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-black font-headline uppercase tracking-tight text-cyan-600">{t('addCustomer')}</h1>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Enterprise Client Provisioning</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button type="submit" form="customer-form" className="bg-cyan-600 hover:bg-cyan-700 rounded-full px-10 h-11 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-cyan-100 gap-2 transition-all active:scale-95" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            {t('save')} Identity
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full p-4 md:p-10">
        <form id="customer-form" onSubmit={handleSaveCustomer} className="space-y-8">
          
          {/* DUPLICATE WARNING */}
          {duplicateWarning && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <p className="text-xs font-bold text-amber-800 uppercase">{duplicateWarning}</p>
            </div>
          )}

          {/* SECTION 1: BASIC INFORMATION */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-600">
                  <User className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">Basic Identity</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Customer Type</Label>
                  <div className="flex gap-3">
                    {["individual", "company", "organization"].map((type) => (
                      <Button 
                        key={type}
                        type="button" 
                        variant={customerType === type ? 'default' : 'outline'} 
                        className={cn(
                          "flex-1 h-12 rounded-xl text-[10px] font-black uppercase transition-all",
                          customerType === type ? "bg-cyan-600 text-white shadow-lg" : "text-slate-400"
                        )} 
                        onClick={() => setCustomerType(type as any)}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Customer ID</Label>
                  <Input disabled value="AUTO-GENERATED" className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-mono text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customerType !== 'individual' && (
                  <div className="lg:col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Legal Company Name *</Label>
                    <Input name="companyName" required className="h-12 rounded-xl" onBlur={(e) => handleDuplicateCheck('companyName', e.target.value)} />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">First Name *</Label>
                  <Input name="firstName" required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Last Name *</Label>
                  <Input name="lastName" required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Contact Person (For B2B)</Label>
                  <Input name="contactPerson" className="h-12 rounded-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2 & 3: CONTACT & ADDRESS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* CONTACT */}
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white ring-1 ring-slate-100">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <Phone className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">Contact Channels</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Primary Mobile *</Label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input name="phoneNumber" required className="h-11 pl-9 rounded-xl" placeholder="+880" onBlur={(e) => handleDuplicateCheck('phoneNumber', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500">WhatsApp No</Label>
                    <Input name="whatsapp" className="h-11 rounded-xl" placeholder="+880" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input name="email" type="email" className="h-11 pl-9 rounded-xl" onBlur={(e) => handleDuplicateCheck('email', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input name="website" className="h-11 pl-9 rounded-xl" placeholder="https://..." />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ADDRESS */}
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white ring-1 ring-slate-100">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">Location Details</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Primary Office Address</Label>
                  <textarea 
                    className="w-full min-h-[80px] rounded-xl border-none ring-1 ring-slate-200 p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-600 transition-all" 
                    value={officeAddress}
                    onChange={(e) => setOfficeAddress(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">City</Label><Input name="city" className="h-10 rounded-lg" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">District</Label><Input name="district" className="h-10 rounded-lg" /></div>
                </div>
                <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl">
                  <Checkbox id="same-address" checked={isSameAddress} onCheckedChange={(val) => setIsSameAddress(val as boolean)} />
                  <label htmlFor="same-address" className="text-[10px] font-black uppercase text-slate-600 cursor-pointer">Shipping Address same as Office</label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SECTION 6: ACCOUNT & CREDIT */}
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CreditCard className="h-5 w-5" />
                </div>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">Financial Rules</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Credit Limit (৳)</Label>
                  <Input name="creditLimit" type="number" className="h-11 rounded-xl font-black text-blue-600" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Credit Days</Label>
                  <Input name="creditDays" type="number" className="h-11 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Opening Due (৳)</Label>
                  <Input name="openingDue" type="number" className="h-11 rounded-xl text-red-600 font-bold" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Opening Advance (৳)</Label>
                  <Input name="openingAdvance" type="number" className="h-11 rounded-xl text-green-600 font-bold" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 4 & 5: BUSINESS & CRM */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 p-8 space-y-6">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                 <Briefcase className="h-4 w-4" /> Business Intelligence
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Trade License</Label><Input name="tradeLicense" className="h-11 rounded-xl" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">TIN Number</Label><Input name="tin" className="h-11 rounded-xl" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">BIN / VAT Reg</Label><Input name="bin" className="h-11 rounded-xl" /></div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase">Industry</Label>
                    <Select name="industry">
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select Industry" /></SelectTrigger>
                      <SelectContent>
                        {["Garments", "Real Estate", "Financial", "Retail", "Tech", "Hospitality"].map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
               </div>
            </Card>

            <Card className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 p-8 space-y-6">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                 <ShieldCheck className="h-4 w-4" /> CRM Metadata
               </h3>
               <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase">Priority</Label>
                    <Select name="priority" defaultValue="Normal">
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Normal">Normal</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="VIP">VIP Platinum</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase">Customer Category</Label>
                    <Select name="category" defaultValue="Retail">
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Corporate", "Government", "Dealer", "Retail", "VIP"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
               </div>
            </Card>
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
             <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <CheckCircle2 className="h-8 w-8 text-cyan-400" />
                </div>
                <div>
                   <h3 className="text-lg font-black uppercase tracking-tight">Finalize Registration</h3>
                   <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Verify all information before system sync</p>
                </div>
             </div>
             <Button type="submit" disabled={isSubmitting} className="bg-cyan-500 hover:bg-cyan-600 text-slate-900 h-14 px-12 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl shadow-cyan-900/40">
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Plus className="h-5 w-5" />}
                Confirm & Create Client
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

