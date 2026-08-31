
"use client"

import * as React from "react"
import { useRouter, useParams } from "next/navigation"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  User, 
  MapPin, 
  CreditCard, 
  Phone,
  Mail,
  Building,
  Tag
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  
  const [category, setCategory] = React.useState("Retail");
  const [priority, setPriority] = React.useState("Normal");
  const [paymentTerms, setPaymentTerms] = React.useState("Cash");
  const [paymentMethod, setPaymentMethod] = React.useState("Cash");

  const customerRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return doc(db, "companies", companyId, "branches", branchId, "customers", id as string);
  }, [db, companyId, branchId, id]);

  const { data: customer, isLoading } = useDoc(customerRef);

  React.useEffect(() => {
    if (customer) {
      setCustomerType(customer.customerType || "individual");
      setCategory(customer.category || "Retail");
      setPriority(customer.priority || "Normal");
      setPaymentTerms(customer.paymentTerms || "Cash");
      setPaymentMethod(customer.paymentMethod || "Cash");
    }
  }, [customer]);

  const handleSaveCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!customerRef || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const firstName = (formData.get("firstName") as string) || "";
    const lastName = (formData.get("lastName") as string) || "";
    const companyName = (formData.get("companyName") as string) || "";

    const customerData = {
      customerType,
      firstName,
      lastName,
      fullName: customerType === "individual" ? `${firstName} ${lastName}`.trim() : companyName,
      companyName: customerType !== "individual" ? companyName : "",
      contactPerson: (formData.get("contactPerson") as string) || "",
      contactPersonDesignation: (formData.get("contactPersonDesignation") as string) || "",
      
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
    <div className="flex flex-col h-full bg-[#F8FAFC] min-h-screen">
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b px-4 md:px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg md:text-xl font-black font-headline uppercase tracking-tight text-slate-900">Modify Identity</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden sm:inline-flex rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" form="customer-edit-form" className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-full px-10 h-11 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-cyan-100 gap-2 transition-all active:scale-95" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full p-4 md:p-8">
        <form id="customer-edit-form" onSubmit={handleSaveCustomer} className="space-y-6">
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
                    {customerType !== 'individual' ? (
                      <>
                        <div className="md:col-span-2 space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-slate-500">Legal Company Name *</Label>
                          <Input name="companyName" required defaultValue={customer?.companyName} className="h-11 rounded-xl" />
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-slate-500">Contact Person Name</Label>
                          <Input name="contactPerson" defaultValue={customer?.contactPerson} className="h-11 rounded-xl" placeholder="Key contact person" />
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-slate-500">Designation</Label>
                          <Input name="contactPersonDesignation" defaultValue={customer?.contactPersonDesignation} className="h-11 rounded-xl" placeholder="Manager, CEO, etc" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-slate-500">First Name *</Label>
                          <Input name="firstName" required defaultValue={customer?.firstName} className="h-11 rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-slate-500">Last Name *</Label>
                          <Input name="lastName" required defaultValue={customer?.lastName} className="h-11 rounded-xl" />
                        </div>
                        <div className="md:col-span-2 space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-slate-500">Reference / Nickname</Label>
                          <Input name="contactPerson" defaultValue={customer?.contactPerson} className="h-11 rounded-xl" placeholder="e.g. Home, Personal" />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="lg:col-span-4 bg-slate-50 p-6 rounded-3xl space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Phone className="h-4 w-4" /> Reach</h3>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black">Mobile *</Label>
                      <Input name="phoneNumber" required defaultValue={customer?.phoneNumber} className="h-10 bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black">WhatsApp</Label>
                      <Input name="whatsapp" defaultValue={customer?.whatsapp} className="h-10 bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black">Official Email</Label>
                      <Input name="email" type="email" defaultValue={customer?.email} className="h-10 bg-white" />
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
                    <textarea name="address" defaultValue={customer?.address} className="w-full min-h-[100px] rounded-xl bg-slate-50 p-4 text-xs font-bold outline-none" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label className="text-[10px] font-black">City</Label><Input name="city" defaultValue={customer?.city} className="h-10" /></div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black">District</Label><Input name="district" defaultValue={customer?.district} className="h-10" /></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px) font-black uppercase text-slate-500">Shipping / Service Address</Label>
                    <textarea name="shippingAddress" defaultValue={customer?.shippingAddress} className="w-full min-h-[100px] rounded-xl bg-slate-50 p-4 text-xs font-bold outline-none" />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label className="text-[10px] font-black">Area</Label><Input name="area" defaultValue={customer?.area} className="h-10" /></div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black">Postal Code</Label><Input name="postalCode" defaultValue={customer?.postalCode} className="h-10" /></div>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="legal" className="space-y-6">
              <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-white p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500">Industry</Label><Input name="industry" defaultValue={customer?.industry} className="h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500">Trade License No</Label><Input name="tradeLicense" defaultValue={customer?.tradeLicense} className="h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500">BIN (VAT)</Label><Input name="bin" defaultValue={customer?.bin} className="h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500">TIN Number</Label><Input name="tin" defaultValue={customer?.tin} className="h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500">Website</Label><Input name="website" defaultValue={customer?.website} className="h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-500">VAT Reg No</Label><Input name="vatReg" defaultValue={customer?.vatReg} className="h-11" /></div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-white p-8 space-y-6">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Account Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black">Credit Limit (৳)</Label><Input name="creditLimit" type="number" defaultValue={customer?.creditLimit} className="h-10 font-black text-blue-600" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black">Credit Days</Label><Input name="creditDays" type="number" defaultValue={customer?.creditDays} className="h-10" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black">Opening Due (৳)</Label><Input name="openingDue" type="number" defaultValue={customer?.openingDue} className="h-10 font-black text-red-600" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black">Opening Advance (৳)</Label><Input name="openingAdvance" type="number" defaultValue={customer?.openingAdvance} className="h-10 font-black text-green-600" /></div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black">Payment Terms</Label>
                      <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["Cash", "Advance", "7 Days", "15 Days", "30 Days", "Custom"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
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
                    <div className="space-y-1.5"><Label className="text-[10px] font-black">Lead Source</Label><Input name="leadSource" defaultValue={customer?.leadSource} className="h-10" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black">Segment</Label><Input name="segment" defaultValue={customer?.segment} className="h-10" /></div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="space-y-6">
              <Card className="border-none shadow-sm ring-1 ring-slate-100 rounded-3xl bg-white p-6 md:p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Customer Note (Public)</Label>
                    <textarea name="customerNote" defaultValue={customer?.customerNote} className="w-full min-h-[80px] rounded-xl bg-slate-50 p-4 text-[11px] font-medium" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Internal Note (Private)</Label>
                    <textarea name="internalNote" defaultValue={customer?.internalNote} className="w-full min-h-[80px] rounded-xl bg-red-50/20 p-4 text-[11px] font-medium border border-red-50" />
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </div>
  );
}
