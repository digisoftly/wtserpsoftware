
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
  CheckCircle2,
  Phone,
  Mail,
  Building,
  FileText,
  Globe,
  Tag,
  Briefcase
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  
  const [category, setCategory] = React.useState("Retail");
  const [priority, setPriority] = React.useState("Normal");
  const [paymentTerms, setPaymentTerms] = React.useState("Cash");
  const [paymentMethod, setPaymentMethod] = React.useState("Cash");

  const handleDuplicateCheck = async (field: string, value: string) => {
    if (!value || value.length < 5 || !db || !companyId || !branchId) return;
    try {
      const q = query(
        collection(db, "companies", companyId, "branches", branchId, "customers"),
        where(field, "==", value),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) setDuplicateWarning(`Duplicate ${field} detected.`);
      else setDuplicateWarning(null);
    } catch (e) { console.error("Duplicate check failed", e); }
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
      contactPersonDesignation: formData.get("contactPersonDesignation") as string || "",
      
      // Contact
      phoneNumber: formData.get("phoneNumber") as string,
      altMobile: formData.get("altMobile") as string || "",
      whatsapp: formData.get("whatsapp") as string || "",
      email: formData.get("email") as string || "",
      website: formData.get("website") as string || "",

      // Address
      address: formData.get("address") as string || "",
      permanentAddress: formData.get("permanentAddress") as string || "",
      billingAddress: formData.get("billingAddress") as string || "",
      shippingAddress: formData.get("shippingAddress") as string || "",
      area: formData.get("area") as string || "",
      city: formData.get("city") as string || "",
      district: formData.get("district") as string || "",
      division: formData.get("division") as string || "",
      country: formData.get("country") as string || "Bangladesh",
      postalCode: formData.get("postalCode") as string || "",

      // Legal / Business
      industry: formData.get("industry") as string || "",
      businessType: formData.get("businessType") as string || "",
      tradeLicense: formData.get("tradeLicense") as string || "",
      bin: formData.get("bin") as string || "",
      tin: formData.get("tin") as string || "",
      vatReg: formData.get("vatReg") as string || "",
      companyReg: formData.get("companyReg") as string || "",

      // Financial
      creditLimit: Number(formData.get("creditLimit") || 0),
      creditDays: Number(formData.get("creditDays") || 0),
      openingBalance: Number(formData.get("openingBalance") || 0),
      openingDue: Number(formData.get("openingDue") || 0),
      openingAdvance: Number(formData.get("openingAdvance") || 0),
      paymentTerms,
      paymentMethod,

      // CRM
      priority,
      category,
      leadSource: formData.get("leadSource") as string || "Direct",
      segment: formData.get("segment") as string || "",
      tags: formData.get("tags") as string || "",

      // Notes
      customerNote: formData.get("customerNote") as string || "",
      internalNote: formData.get("internalNote") as string || "",
      specialInstructions: formData.get("specialInstructions") as string || "",
      
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
      createdBy: "authorized_user"
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
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg md:text-xl font-black font-headline uppercase tracking-tight text-slate-900">Add New Client</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden sm:inline-flex rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" form="customer-form" className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-full px-10 h-11 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-cyan-100 gap-2 transition-all active:scale-95" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            Save Record
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

          <Tabs defaultValue="general" className="w-full">
            <TabsList className="bg-white border p-1 rounded-2xl shadow-sm mb-6 flex h-auto overflow-x-auto no-scrollbar ring-1 ring-slate-100">
              <TabsTrigger value="general" className="rounded-xl flex-1 py-3 text-[10px] font-black uppercase tracking-widest">General</TabsTrigger>
              <TabsTrigger value="address" className="rounded-xl flex-1 py-3 text-[10px] font-black uppercase tracking-widest">Address</TabsTrigger>
              <TabsTrigger value="legal" className="rounded-xl flex-1 py-3 text-[10px] font-black uppercase tracking-widest">Legal & Business</TabsTrigger>
              <TabsTrigger value="account" className="rounded-xl flex-1 py-3 text-[10px] font-black uppercase tracking-widest">Account & CRM</TabsTrigger>
              <TabsTrigger value="notes" className="rounded-xl flex-1 py-3 text-[10px] font-black uppercase tracking-widest">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-white p-6 md:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-12 space-y-4">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Account Type</Label>
                    <div className="flex gap-2">
                      {["individual", "company", "organization"].map((type) => (
                        <Button 
                          key={type}
                          type="button" 
                          variant={customerType === type ? 'default' : 'outline'} 
                          className={cn("h-9 rounded-xl text-[10px] font-black uppercase px-6", customerType === type ? "bg-slate-900 text-white" : "text-slate-400 border-slate-200")} 
                          onClick={() => setCustomerType(type as any)}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customerType !== 'individual' && (
                      <div className="md:col-span-2 space-y-1.5">
                        <Label className="text-[10px] font-black uppercase text-slate-500">Legal Company Name *</Label>
                        <Input name="companyName" required className="h-11 rounded-xl" onBlur={(e) => handleDuplicateCheck('companyName', e.target.value)} />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-500">First Name *</Label>
                      <Input name="firstName" required className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Last Name *</Label>
                      <Input name="lastName" required className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Contact Person</Label>
                      <Input name="contactPerson" className="h-11 rounded-xl" placeholder="Key contact person" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Designation</Label>
                      <Input name="contactPersonDesignation" className="h-11 rounded-xl" placeholder="Manager, CEO, etc" />
                    </div>
                  </div>

                  <div className="lg:col-span-4 bg-slate-50 p-6 rounded-3xl space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Phone className="h-4 w-4" /> Reach</h3>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black">Mobile *</Label>
                      <Input name="phoneNumber" required className="h-10 bg-white" onBlur={(e) => handleDuplicateCheck('phoneNumber', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black">WhatsApp</Label>
                      <Input name="whatsapp" className="h-10 bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black">Official Email</Label>
                      <Input name="email" type="email" className="h-10 bg-white" onBlur={(e) => handleDuplicateCheck('email', e.target.value)} />
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="address" className="space-y-6">
              <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-white p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2"><MapPin className="h-4 w-4" /> Primary Address</Label>
                    <textarea name="address" className="w-full min-h-[100px] rounded-xl bg-slate-50 p-4 text-xs font-bold outline-none" placeholder="Office / Present Address" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label className="text-[10px] font-black">City</Label><Input name="city" className="h-10" /></div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black">District</Label><Input name="district" className="h-10" /></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Shipping / Service Address</Label>
                    <textarea name="shippingAddress" className="w-full min-h-[100px] rounded-xl bg-slate-50 p-4 text-xs font-bold outline-none" placeholder="Installation / Site Address" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label className="text-[10px] font-black">Area</Label><Input name="area" className="h-10" /></div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black">Postal Code</Label><Input name="postalCode" className="h-10" /></div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="legal" className="space-y-6">
              <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-white p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500">Industry</Label><Input name="industry" className="h-11" placeholder="e.g. IT, Manufacturing" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500">Trade License No</Label><Input name="tradeLicense" className="h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500">BIN (VAT)</Label><Input name="bin" className="h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500">TIN Number</Label><Input name="tin" className="h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500">Website</Label><Input name="website" className="h-11" placeholder="www.example.com" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500">VAT Reg No</Label><Input name="vatReg" className="h-11" /></div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-white p-8 space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Account Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black">Credit Limit (৳)</Label><Input name="creditLimit" type="number" className="h-10 font-black text-blue-600" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black">Credit Days</Label><Input name="creditDays" type="number" className="h-10" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black">Opening Due (৳)</Label><Input name="openingDue" type="number" className="h-10 font-black text-red-600" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black">Opening Advance (৳)</Label><Input name="openingAdvance" type="number" className="h-10 font-black text-green-600" /></div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black">Payment Terms</Label>
                      <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Cash", "Advance", "7 Days", "15 Days", "30 Days", "Custom"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black">Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Cash", "Bank", "bKash", "Nagad", "Cheque"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>

                <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-white p-8 space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Tag className="h-4 w-4" /> Segmentation</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>{["Corporate", "Government", "Retail", "Dealer", "VIP"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black">Priority</Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>{["Low", "Normal", "High", "VIP"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black">Lead Source</Label><Input name="leadSource" className="h-10" placeholder="e.g. Website" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black">Segment</Label><Input name="segment" className="h-10" /></div>
                    <div className="space-y-1.5 md:col-span-2"><Label className="text-[10px] font-black">Internal Tags</Label><Input name="tags" className="h-10" placeholder="Comma separated tags" /></div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-6">
              <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-white p-6 md:p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Customer Note (Public)</Label>
                    <textarea name="customerNote" className="w-full min-h-[80px] rounded-xl bg-slate-50 p-4 text-[11px] font-medium" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Internal Note (Private)</Label>
                    <textarea name="internalNote" className="w-full min-h-[80px] rounded-xl bg-red-50/20 p-4 text-[11px] font-medium border border-red-50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Special Instructions</Label>
                    <textarea name="specialInstructions" className="w-full min-h-[80px] rounded-xl bg-slate-50 p-4 text-[11px] font-medium" />
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="pt-10 flex justify-center no-print">
             <Button type="submit" disabled={isSubmitting} className="w-full max-w-sm h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95">
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                Confirm Registration
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
