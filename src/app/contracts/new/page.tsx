"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  ShieldCheck, 
  ArrowLeft, 
  Save, 
  Loader2, 
  Plus,
  Trash2,
  MapPin,
  LayoutGrid,
  PlusCircle,
  X
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
  item: string;
  description: string;
  location: string;
  siteCode: string;
  contactPerson: string;
  contactNumber: string;
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
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [selectedProjectId, setSelectedProjectId] = React.useState("none");
  const [serviceGroups, setServiceGroups] = React.useState<ServiceGroup[]>([
    { id: 'g1', serviceName: 'MRC for Data', amount: 0, points: [{ id: 'p1', item: 'MRC for Data', description: '', location: '', siteCode: '', contactPerson: '', contactNumber: '' }] }
  ]);

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

  const addGroup = () => {
    setServiceGroups([...serviceGroups, { 
      id: Math.random().toString(36).substr(2, 9), 
      serviceName: '', 
      amount: 0, 
      points: [{ id: Math.random().toString(36).substr(2, 9), item: '', description: '', location: '', siteCode: '', contactPerson: '', contactNumber: '' }] 
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
          item: g.serviceName, 
          description: '', 
          location: '', 
          siteCode: '', 
          contactPerson: '', 
          contactNumber: '' 
        }]
      };
    }));
  };

  const updateGroup = (groupId: string, field: string, val: any) => {
    setServiceGroups(serviceGroups.map(g => g.id === groupId ? { ...g, [field]: val } : g));
  };

  const updatePoint = (groupId: string, pointId: string, field: string, val: any) => {
    setServiceGroups(serviceGroups.map(g => {
      if (g.id !== groupId) return g;
      return {
        ...g,
        points: g.points.map(p => p.id === pointId ? { ...p, [field]: val } : p)
      };
    }));
  };

  const totalAmount = serviceGroups.reduce((s, g) => s + Number(g.amount || 0), 0);

  const handleAddContract = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || !selectedCustomerId || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const customer = customers?.find(c => c.id === selectedCustomerId);

    const contractData = {
      companyId,
      branchId,
      contractNumber: `SLA-${Date.now().toString().slice(-6)}`,
      agreementNo: formData.get("agreementNo") as string,
      customerId: selectedCustomerId,
      customerCode: customer?.id || "",
      customerName: customer ? (customer.customerType !== 'individual' ? customer.companyName : `${customer.firstName} ${customer.lastName}`) : "Client",
      projectId: selectedProjectId,
      serviceType: formData.get("serviceType"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      billingCycle: formData.get("billingCycle"),
      billingDay: Number(formData.get("billingDay") || 1),
      groups: serviceGroups,
      monthlyAmount: totalAmount,
      vatPercent: Number(formData.get("vatPercent") || 0),
      discountAmount: Number(formData.get("discountAmount") || 0),
      netMonthlyAmount: totalAmount + (totalAmount * Number(formData.get("vatPercent") || 0) / 100) - Number(formData.get("discountAmount") || 0),
      paymentTerms: formData.get("paymentTerms"),
      status: "active",
      notes: formData.get("notes") as string,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const contractRef = doc(collection(db, "companies", companyId, "branches", branchId, "service_contracts"));
      await setDoc(contractRef, { ...contractData, id: contractRef.id });
      toast({ title: t('success') });
      router.push("/contracts");
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen pb-20">
      <div className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
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
          <Button type="submit" form="contract-form" className="bg-emerald-600 hover:bg-emerald-700 rounded-full px-8 h-10 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 gap-2" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            Provision Service
          </Button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto w-full p-4 md:p-8">
        <form id="contract-form" onSubmit={handleAddContract} className="space-y-8">
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
                <Input name="agreementNo" required className="h-11 rounded-xl border-none ring-1 ring-slate-200 font-bold" placeholder="e.g. SLA-2024-001" />
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
                <Select name="serviceType" defaultValue="CCTV Maintenance">
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {SERVICE_TYPES.map(type => <SelectItem key={type} value={type} className="text-xs font-bold">{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Billing Cycle</Label>
                <Select name="billingCycle" defaultValue="Monthly">
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl"><SelectItem value="Monthly">Monthly</SelectItem><SelectItem value="Quarterly">Quarterly</SelectItem><SelectItem value="Half-Yearly">Half-Yearly</SelectItem><SelectItem value="Yearly">Yearly</SelectItem></SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Billing Day (Date)</Label>
                <Input name="billingDay" type="number" min="1" max="31" defaultValue="1" className="h-11 rounded-xl border-none ring-1 ring-slate-200 font-bold" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Start Date</Label>
                <Input name="startDate" type="date" required className="h-11 rounded-xl border-none ring-1 ring-slate-200 font-bold uppercase" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">End Date (Optional)</Label>
                <Input name="endDate" type="date" className="h-11 rounded-xl border-none ring-1 ring-slate-200 font-bold uppercase" />
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
                       <Label className="text-[9px] font-black uppercase text-slate-400">Group Name (e.g. Internet Connectivity)</Label>
                       <Input 
                         value={group.serviceName} 
                         onChange={e => updateGroup(group.id, 'serviceName', e.target.value)} 
                         className="h-10 rounded-xl bg-white border-none ring-1 ring-slate-200 font-black uppercase text-xs" 
                         placeholder="Item Name"
                       />
                    </div>
                    <div className="space-y-1 w-40">
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
                       <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> Service Points / Locations</p>
                       <Button type="button" size="sm" onClick={() => addPoint(group.id)} className="h-8 rounded-lg gap-2 text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none transition-all">
                         <Plus className="h-3.5 w-3.5" /> Add Point
                       </Button>
                    </div>
                    
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-inner bg-slate-50/20">
                      <table className="w-full border-collapse">
                        <thead className="bg-slate-50/50">
                          <tr className="h-10">
                            <th className="w-12 text-center text-[9px] font-black uppercase text-slate-400">SL</th>
                            <th className="text-left text-[9px] font-black uppercase text-slate-400 pl-4">Location / Site Name</th>
                            <th className="text-left text-[9px] font-black uppercase text-slate-400 pl-4">Description / Points</th>
                            <th className="text-left text-[9px] font-black uppercase text-slate-400 pl-4">Contact Person</th>
                            <th className="w-12"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.points.map((point, pIdx) => (
                            <tr key={point.id} className="border-t border-slate-50 h-14 group">
                              <td className="text-center text-[10px] font-black text-slate-300">{(pIdx + 1).toString().padStart(2, '0')}</td>
                              <td className="pl-4">
                                <Input 
                                  value={point.location} 
                                  onChange={e => updatePoint(group.id, point.id, 'location', e.target.value)} 
                                  className="h-9 border-none bg-white/50 text-[11px] font-bold uppercase rounded-lg focus:ring-1 focus:ring-emerald-500" 
                                  placeholder="Site Location"
                                />
                              </td>
                              <td className="pl-4">
                                <Input 
                                  value={point.description} 
                                  onChange={e => updatePoint(group.id, point.id, 'description', e.target.value)} 
                                  className="h-9 border-none bg-white/50 text-[11px] font-bold rounded-lg focus:ring-1 focus:ring-emerald-500" 
                                  placeholder="Service Specifics"
                                />
                              </td>
                              <td className="pl-4">
                                <Input 
                                  value={point.contactPerson} 
                                  onChange={e => updatePoint(group.id, point.id, 'contactPerson', e.target.value)} 
                                  className="h-9 border-none bg-white/50 text-[11px] font-bold rounded-lg focus:ring-1 focus:ring-emerald-500" 
                                  placeholder="Name/Phone"
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
              <Textarea name="notes" className="min-h-[120px] rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 p-4 text-[11px] font-bold text-slate-600" placeholder="Special billing instructions or contract terms..." />
            </Card>

            <Card className="p-8 rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white space-y-6">
               <div className="flex justify-between items-end pb-4 border-b border-white/10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em]">Gross Monthly Fee</p>
                    <h2 className="text-4xl font-black tracking-tighter text-emerald-400">৳{totalAmount.toLocaleString()}</h2>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black uppercase opacity-60">Billing Cycle</p>
                    <Badge className="bg-emerald-600 text-white border-none font-black text-[10px] h-6 px-4">MONTHLY</Badge>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 gap-6 pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase opacity-40">VAT %</Label>
                    <Input name="vatPercent" type="number" defaultValue="0" className="h-10 bg-white/5 border-none ring-1 ring-white/10 font-black text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase opacity-40">Extra Discount (৳)</Label>
                    <Input name="discountAmount" type="number" defaultValue="0" className="h-10 bg-white/5 border-none ring-1 ring-white/10 font-black text-white" />
                  </div>
               </div>

               <div className="pt-6 flex items-center gap-4">
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