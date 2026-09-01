
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Plus,
  Trash2,
  MapPin,
  LayoutGrid,
  PlusCircle,
  X,
  ShieldCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

interface ServicePoint {
  id: string;
  location: string;
  description: string;
}

interface ServiceGroup {
  id: string;
  serviceName: string;
  amount: number;
  points: ServicePoint[];
}

export default function NewContractPage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [agreementNo, setAgreementNo] = React.useState("");
  const [serviceType, setServiceType] = React.useState("Monthly Maintenance");
  const [startDate, setStartDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [billingCycle, setBillingCycle] = React.useState("Monthly");
  const [billingDay, setBillingDay] = React.useState(1);

  // Initialize with 1 group containing 13 empty points
  const [serviceGroups, setServiceGroups] = React.useState<ServiceGroup[]>([
    { 
      id: 'g1', 
      serviceName: '', 
      amount: 0, 
      points: Array.from({ length: 13 }, (_, i) => ({ id: `p${i+1}-${Date.now()}`, location: '', description: '' }))
    }
  ]);

  const [vatPercent, setVatPercent] = React.useState(0);
  const [discountAmount, setDiscountAmount] = React.useState(0);
  const [notes, setNotes] = React.useState("");

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  const addGroup = () => {
    setServiceGroups([...serviceGroups, { 
      id: Math.random().toString(36).substr(2, 9), 
      serviceName: '', 
      amount: 0, 
      points: Array.from({ length: 13 }, (_, i) => ({ id: `p-new-${i+1}-${Date.now()}`, location: '', description: '' }))
    }]);
  };

  const removeGroup = (groupId: string) => {
    if (serviceGroups.length > 1) setServiceGroups(serviceGroups.filter(g => g.id !== groupId));
  };

  const addPoint = (groupId: string) => {
    setServiceGroups(serviceGroups.map(g => g.id === groupId ? { ...g, points: [...g.points, { id: Math.random().toString(36).substr(2, 9), location: '', description: '' }] } : g));
  };

  const updateGroup = (groupId: string, field: keyof ServiceGroup, val: any) => {
    setServiceGroups(serviceGroups.map(g => g.id === groupId ? { ...g, [field]: val } : g));
  };

  const updatePoint = (groupId: string, pointId: string, field: keyof ServicePoint, val: any) => {
    setServiceGroups(serviceGroups.map(g => g.id === groupId ? { ...g, points: g.points.map(p => p.id === pointId ? { ...p, [field]: val } : p) } : g));
  };

  const grossSubtotal = React.useMemo(() => serviceGroups.reduce((s, g) => s + (Number(g.amount) || 0), 0), [serviceGroups]);
  const vatAmount = (grossSubtotal * vatPercent) / 100;
  const netMonthlyTotal = grossSubtotal + vatAmount - discountAmount;

  const handleAddContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || !selectedCustomerId || isSubmitting) return;

    setIsSubmitting(true);
    const customer = customers?.find(c => c.id === selectedCustomerId);
    
    const customerName = customer ? (customer.customerType !== 'individual' ? customer.companyName : `${customer.firstName} ${customer.lastName}`) : "Client";
    const customerAddress = customer?.address || "";
    const customerPhone = customer?.phoneNumber || "";
    const customerEmail = customer?.email || "";

    // Filter out groups with no service name OR filter points with no location before saving? 
    // Usually it's better to keep only non-empty points in DB.
    const cleanedGroups = serviceGroups.map(g => ({
      ...g,
      points: g.points.filter(p => p.location.trim() !== "")
    })).filter(g => g.serviceName.trim() !== "" || g.points.length > 0);

    const contractData = {
      companyId, branchId,
      contractNumber: `SLA-${Date.now().toString().slice(-6)}`,
      agreementNo, 
      customerId: selectedCustomerId, 
      customerName,
      customerAddress,
      customerPhone,
      customerEmail,
      serviceType, 
      startDate, 
      billingCycle,
      billingDay: Number(billingDay), 
      groups: cleanedGroups,
      monthlyAmount: grossSubtotal, 
      vatPercent: Number(vatPercent), 
      vatAmount,
      discountAmount: Number(discountAmount), 
      netMonthlyAmount: netMonthlyTotal,
      status: "active", 
      notes,
      createdAt: serverTimestamp(), 
      updatedAt: serverTimestamp(),
    };

    const contractRef = doc(collection(db, "companies", companyId, "branches", branchId, "service_contracts"));
    
    setDoc(contractRef, { ...contractData, id: contractRef.id })
      .then(() => {
        toast({ title: t('success') });
        router.push("/contracts");
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: contractRef.path,
          operation: 'create',
          requestResourceData: contractData,
        });
        errorEmitter.emit('permission-error', permissionError);
        setIsSubmitting(false);
      });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen pb-20">
      <div className="sticky top-0 z-30 bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-emerald-600">New Monthly Service</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">SLA Lifecycle Provisioning</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>{t('cancel')}</Button>
          <Button onClick={handleAddContract} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 rounded-full px-10 h-11 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 gap-2">
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} Provision Service
          </Button>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto w-full p-4 md:p-8">
        <form onSubmit={handleAddContract} className="space-y-8">
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Target Client</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId} required>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue placeholder={t('search')} /></SelectTrigger>
                  <SelectContent className="max-h-[300px] rounded-xl shadow-2xl border-none ring-1 ring-slate-100">
                    {customers?.map((c, idx) => (
                      <SelectItem key={`cust-sel-${c.id}-${idx}`} value={c.id} className="text-xs font-bold uppercase py-2.5">
                        {c.customerType !== 'individual' ? c.companyName : `${c.firstName} ${c.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Agreement / Service No.</Label>
                <Input value={agreementNo} onChange={e => setAgreementNo(e.target.value)} required className="h-11 rounded-xl font-bold" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Billing Cycle</Label>
                <Select value={billingCycle} onValueChange={setBillingCycle}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 font-bold text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl shadow-2xl border-none ring-1 ring-slate-100">
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Start Date</Label>
                <Input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="h-11 rounded-xl font-bold uppercase" />
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-emerald-600" /> Service Manifest</h3>
               <Button type="button" onClick={addGroup} variant="outline" className="rounded-full gap-2 border-emerald-100 text-emerald-700 bg-white h-9 px-6 font-black text-[10px] uppercase shadow-sm hover:bg-emerald-50">
                 <PlusCircle className="h-4 w-4" /> Add Service Group
               </Button>
            </div>

            {serviceGroups.map((group, gIdx) => (
              <Card key={group.id} className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 overflow-hidden">
                <div className="p-6 bg-slate-50/50 border-b flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                    <div className="space-y-1 flex-1">
                       <Label className="text-[9px] font-black uppercase text-slate-400">Service Name</Label>
                       <Input value={group.serviceName} onChange={e => updateGroup(group.id, 'serviceName', e.target.value)} className="h-10 rounded-xl bg-white font-black uppercase text-xs" placeholder="e.g. Monthly Maintenance Fee" />
                    </div>
                    <div className="space-y-1 w-44">
                       <Label className="text-[9px] font-black uppercase text-slate-400">Monthly Group Fee (৳)</Label>
                       <Input type="number" value={group.amount || ''} onChange={e => updateGroup(group.id, 'amount', Number(e.target.value))} className="h-10 rounded-xl bg-white font-black text-xs text-blue-600" />
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="text-red-300 hover:text-red-600 h-10 w-10 rounded-full" onClick={() => removeGroup(group.id)} disabled={serviceGroups.length === 1}><Trash2 className="h-5 w-5" /></Button>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> Locations / Points (Max 13 for A4 Fit)</p>
                       <Button type="button" size="sm" onClick={() => addPoint(group.id)} className="h-8 rounded-lg gap-2 text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border-none px-4"><Plus className="h-3.5 w-3.5" /> Add Row</Button>
                    </div>
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/20">
                      <table className="w-full border-collapse">
                        <thead className="bg-slate-50/50">
                          <tr className="h-10">
                            <th className="w-12 text-center text-[9px] font-black uppercase text-slate-400">SL</th>
                            <th className="text-left text-[9px] font-black uppercase text-slate-400 pl-4">Description / Location</th>
                            <th className="w-12"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.points.map((point, pIdx) => (
                            <tr key={point.id} className="border-t border-slate-50 h-14 group bg-white/40">
                              <td className="text-center text-[10px] font-black text-slate-300">{(pIdx + 1).toString().padStart(2, '0')}</td>
                              <td className="pl-4">
                                <Input value={point.location} onChange={e => updatePoint(group.id, point.id, 'location', e.target.value)} className="h-9 border-none bg-white/50 text-[11px] font-bold uppercase rounded-lg focus:ring-1 focus:ring-emerald-500" placeholder="Enter Location Details..." />
                              </td>
                              <td className="text-center">
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-200 hover:text-red-500" onClick={() => {
                                  if (group.points.length > 1) {
                                    setServiceGroups(serviceGroups.map(g => g.id === group.id ? { ...g, points: g.points.filter(p => p.id !== point.id) } : g));
                                  }
                                }}><X className="h-4 w-4" /></Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-8 rounded-[2.5rem] bg-white space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Compliance Notes</h3>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="min-h-[120px] rounded-2xl bg-slate-50 border-none p-4 text-[11px] font-bold text-slate-600" placeholder="Additional contract terms..." />
            </Card>

            <Card className="p-8 rounded-[2.5rem] bg-slate-900 text-white space-y-6 shadow-2xl">
               <div className="flex justify-between items-end pb-4 border-b border-white/10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em]">Gross Monthly Fee</p>
                    <h2 className="text-4xl font-black tracking-tighter text-emerald-400">৳{grossSubtotal.toLocaleString()}</h2>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black uppercase opacity-60">Cycle</p>
                    <Badge className="bg-emerald-600 text-white border-none font-black text-[10px] h-6 px-4 uppercase">{billingCycle}</Badge>
                  </div>
               </div>
               <div className="pt-4 flex items-center gap-4 bg-white/5 p-5 rounded-3xl">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0"><ShieldCheck className="h-6 w-6 text-emerald-400" /></div>
                  <p className="text-[10px] font-bold leading-relaxed opacity-60 uppercase">System will automatically calculate VAT and Net Payable during each billing cycle generation based on these master settings.</p>
               </div>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
