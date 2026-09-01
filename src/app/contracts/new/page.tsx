
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

const SERVICE_TYPES = [
  "Monthly Internet Service",
  "CCTV Maintenance",
  "Data Connectivity",
  "AMC",
  "IT Support",
  "Network Maintenance",
  "Security System Maintenance",
  "Other Monthly Service"
];

export default function NewContractPage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Header Info State
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [agreementNo, setAgreementNo] = React.useState("");
  const [selectedProjectId, setSelectedProjectId] = React.useState("none");
  const [serviceType, setServiceType] = React.useState("CCTV Maintenance");
  const [startDate, setStartDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = React.useState("");
  const [billingCycle, setBillingCycle] = React.useState("Monthly");
  const [billingDay, setBillingDay] = React.useState(1);
  const [paymentTerms, setPaymentTerms] = React.useState("COD");

  // Dynamic Service Matrix State
  const [serviceGroups, setServiceGroups] = React.useState<ServiceGroup[]>([
    { 
      id: 'g1', 
      serviceName: 'MRC for Data', 
      amount: 0, 
      points: [
        { id: 'p1', location: 'Main Site Connection', description: '' }
      ] 
    }
  ]);

  // Financial State
  const [vatPercent, setVatPercent] = React.useState(0);
  const [discountAmount, setDiscountAmount] = React.useState(0);
  const [notes, setNotes] = React.useState("");

  // Queries
  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  const projectsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "projects");
  }, [db, companyId, branchId]);
  const { data: projects } = useCollection(projectsQuery);

  // Group & Point Logic
  const addGroup = () => {
    setServiceGroups([...serviceGroups, { 
      id: Math.random().toString(36).substr(2, 9), 
      serviceName: '', 
      amount: 0, 
      points: [{ id: Math.random().toString(36).substr(2, 9), location: '', description: '' }] 
    }]);
  };

  const removeGroup = (groupId: string) => {
    if (serviceGroups.length > 1) {
      setServiceGroups(serviceGroups.filter(g => g.id !== groupId));
    }
  };

  const addPoint = (groupId: string) => {
    setServiceGroups(serviceGroups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        points: [...g.points, { 
          id: Math.random().toString(36).substr(2, 9), 
          location: '', 
          description: '' 
        }]
      };
    }));
  };

  const updateGroup = (groupId: string, field: keyof ServiceGroup, val: any) => {
    setServiceGroups(serviceGroups.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, [field]: val };
    }));
  };

  const updatePoint = (groupId: string, pointId: string, field: keyof ServicePoint, val: any) => {
    setServiceGroups(serviceGroups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        points: g.points.map(p => p.id === pointId ? { ...p, [field]: val } : p)
      };
    }));
  };

  // Calculations
  const grossSubtotal = React.useMemo(() => serviceGroups.reduce((s, g) => s + (Number(g.amount) || 0), 0), [serviceGroups]);
  const vatAmount = (grossSubtotal * vatPercent) / 100;
  const netMonthlyTotal = grossSubtotal + vatAmount - discountAmount;

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || !selectedCustomerId || isSubmitting) {
      toast({ variant: "destructive", title: "Missing Data", description: "Please select a client and add service details." });
      return;
    }

    setIsSubmitting(true);
    const customer = customers?.find(c => c.id === selectedCustomerId);

    const contractData = {
      companyId,
      branchId,
      contractNumber: `SLA-${Date.now().toString().slice(-6)}`,
      agreementNo: agreementNo,
      customerId: selectedCustomerId,
      customerCode: customer?.id || "",
      customerName: customer ? (customer.customerType !== 'individual' ? customer.companyName : `${customer.firstName} ${customer.lastName}`) : "Client",
      projectId: selectedProjectId,
      serviceType,
      startDate,
      endDate,
      billingCycle,
      billingDay: Number(billingDay),
      groups: serviceGroups,
      monthlyAmount: grossSubtotal,
      vatPercent: Number(vatPercent),
      vatAmount: vatAmount,
      discountAmount: Number(discountAmount),
      netMonthlyAmount: netMonthlyTotal,
      paymentTerms,
      status: "active",
      notes,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const contractRef = doc(collection(db, "companies", companyId, "branches", branchId, "service_contracts"));
      await setDoc(contractRef, { ...contractData, id: contractRef.id });
      toast({ title: t('success'), description: "Monthly service agreement provisioned successfully." });
      router.push("/contracts");
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen pb-20">
      <div className="sticky top-0 z-30 bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-emerald-600">New Monthly Service</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">SLA Lifecycle Provisioning</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button onClick={handleAddContract} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 rounded-full px-10 h-11 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 gap-2">
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            Provision Service
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
                  <SelectContent className="max-h-[300px] rounded-xl">
                    {customers?.map(c => (
                      <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">
                        {c.customerType !== 'individual' ? c.companyName : `${c.firstName} ${c.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Agreement / Service No.</Label>
                <Input value={agreementNo} onChange={e => setAgreementNo(e.target.value)} required className="h-11 rounded-xl border-none ring-1 ring-slate-200 font-bold" placeholder="e.g. SLA-2024-001" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Project Link</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">No Project Linked</SelectItem>
                    {projects?.map(p => <SelectItem key={p.id} value={p.id} className="text-xs font-bold uppercase">{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Service Classification</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {SERVICE_TYPES.map(type => <SelectItem key={type} value={type} className="text-xs font-bold">{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Billing Cycle</Label>
                <Select value={billingCycle} onValueChange={setBillingCycle}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl"><SelectItem value="Monthly">Monthly</SelectItem><SelectItem value="Quarterly">Quarterly</SelectItem><SelectItem value="Half-Yearly">Half-Yearly</SelectItem><SelectItem value="Yearly">Yearly</SelectItem></SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Billing Day (Date)</Label>
                <Input type="number" min="1" max="31" value={billingDay} onChange={e => setBillingDay(Number(e.target.value))} className="h-11 rounded-xl border-none ring-1 ring-slate-200 font-bold" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Start Date</Label>
                <Input type="date" required value={startDate} onChange={e => setStartDate(e.target.value)} className="h-11 rounded-xl border-none ring-1 ring-slate-200 font-bold uppercase" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">End Date (Optional)</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-11 rounded-xl border-none ring-1 ring-slate-200 font-bold uppercase" />
              </div>
            </div>
          </Card>

          {/* SERVICE GROUPS & POINTS */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-emerald-600" /> Service Manifest</h3>
               <Button type="button" onClick={addGroup} variant="outline" className="rounded-full gap-2 border-emerald-100 text-emerald-700 bg-white h-9 px-6 font-black text-[10px] uppercase shadow-sm transition-all hover:bg-emerald-50">
                 <PlusCircle className="h-4 w-4" /> Add Service Group
               </Button>
            </div>

            {serviceGroups.map((group, gIdx) => (
              <Card key={group.id} className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 overflow-hidden">
                <div className="p-6 bg-slate-50/50 border-b flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                    <div className="space-y-1 flex-1">
                       <Label className="text-[9px] font-black uppercase text-slate-400">Service Name (e.g. Internet Connectivity)</Label>
                       <Input 
                         value={group.serviceName} 
                         onChange={e => updateGroup(group.id, 'serviceName', e.target.value)} 
                         className="h-10 rounded-xl bg-white border-none ring-1 ring-slate-200 font-black uppercase text-xs" 
                         placeholder="Item Name"
                       />
                    </div>
                    <div className="space-y-1 w-44">
                       <Label className="text-[9px] font-black uppercase text-slate-400">Monthly Group Fee (৳)</Label>
                       <Input 
                         type="number"
                         value={group.amount || ''} 
                         onChange={e => updateGroup(group.id, 'amount', Number(e.target.value))} 
                         className="h-10 rounded-xl bg-white border-none ring-1 ring-slate-200 font-black text-xs text-blue-600" 
                         placeholder="0.00"
                       />
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="text-red-300 hover:text-red-600 h-10 w-10 rounded-full" onClick={() => removeGroup(group.id)} disabled={serviceGroups.length === 1}>
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> Description / Locations</p>
                       <Button type="button" size="sm" onClick={() => addPoint(group.id)} className="h-8 rounded-lg gap-2 text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none transition-all px-4">
                         <Plus className="h-3.5 w-3.5" /> Add Location
                       </Button>
                    </div>
                    
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-inner bg-slate-50/20">
                      <table className="w-full border-collapse">
                        <thead className="bg-slate-50/50">
                          <tr className="h-10">
                            <th className="w-12 text-center text-[9px] font-black uppercase text-slate-400">SL</th>
                            <th className="text-left text-[9px] font-black uppercase text-slate-400 pl-4">Location / Specific Details</th>
                            <th className="text-left text-[9px] font-black uppercase text-slate-400 pl-4">Remarks</th>
                            <th className="w-12"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.points.map((point, pIdx) => (
                            <tr key={point.id} className="border-t border-slate-50 h-14 group bg-white/40">
                              <td className="text-center text-[10px] font-black text-slate-300">{(pIdx + 1).toString().padStart(2, '0')}</td>
                              <td className="pl-4">
                                <Input 
                                  value={point.location} 
                                  onChange={e => updatePoint(group.id, point.id, 'location', e.target.value)} 
                                  className="h-9 border-none bg-white/50 text-[11px] font-bold uppercase rounded-lg focus:ring-1 focus:ring-emerald-500" 
                                  placeholder="e.g. Uttara Sector 4 Control Room"
                                />
                              </td>
                              <td className="pl-4">
                                <Input 
                                  value={point.description} 
                                  onChange={e => updatePoint(group.id, point.id, 'description', e.target.value)} 
                                  className="h-9 border-none bg-white/50 text-[11px] font-bold rounded-lg focus:ring-1 focus:ring-emerald-500" 
                                  placeholder="Internal remarks (Optional)"
                                />
                              </td>
                              <td className="text-center">
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all" onClick={() => {
                                  const nextPoints = group.points.filter(p => p.id !== point.id);
                                  if (nextPoints.length > 0) {
                                    setServiceGroups(serviceGroups.map(g => g.id === group.id ? { ...g, points: nextPoints } : g));
                                  }
                                }}>
                                  <X className="h-4 w-4" />
                                </Button>
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

          {/* FINANCIAL SUMMARY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Additional Remarks</h3>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="min-h-[120px] rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 p-4 text-[11px] font-bold text-slate-600" placeholder="Special billing instructions or contract terms..." />
            </Card>

            <Card className="p-8 rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white space-y-6">
               <div className="flex justify-between items-end pb-4 border-b border-white/10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em]">Gross Monthly Fee</p>
                    <h2 className="text-4xl font-black tracking-tighter text-emerald-400">৳{grossSubtotal.toLocaleString()}</h2>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black uppercase opacity-60">Billing Cycle</p>
                    <Badge className="bg-emerald-600 text-white border-none font-black text-[10px] h-6 px-4 uppercase">{billingCycle}</Badge>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-6 pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase opacity-40">VAT %</Label>
                    <Input type="number" value={vatPercent || ''} onChange={e => setVatPercent(Number(e.target.value))} className="h-10 bg-white/5 border-none ring-1 ring-white/10 font-black text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase opacity-40">Extra Discount (৳)</Label>
                    <Input type="number" value={discountAmount || ''} onChange={e => setDiscountAmount(Number(e.target.value))} className="h-10 bg-white/5 border-none ring-1 ring-white/10 font-black text-white" />
                  </div>
               </div>

               <div className="pt-6 flex justify-between items-center border-t border-white/10">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Net Payable</p>
                  <p className="text-2xl font-black text-blue-400">৳{netMonthlyTotal.toLocaleString()}</p>
               </div>

               <div className="pt-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-6 w-6 text-emerald-400" />
                  </div>
                  <p className="text-[10px] font-bold leading-relaxed opacity-60 uppercase">System will automatically calculate VAT and Net Payable during each billing cycle generation.</p>
               </div>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
