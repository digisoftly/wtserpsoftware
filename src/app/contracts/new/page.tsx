
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
  ShieldCheck,
  Calendar,
  Building,
  User,
  GitPullRequest,
  Briefcase,
  FileSignature
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, setDoc, serverTimestamp, query, where, orderBy } from "firebase/firestore"
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

export default function NewServiceContractPage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  // Basic Info
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [selectedProjectId, setSelectedProjectId] = React.useState("");
  const [agreementNo, setAgreementNo] = React.useState("");
  const [contractName, setContractName] = React.useState("");
  const [serviceType, setServiceType] = React.useState("amc");
  
  // Period & Renewal
  const [startDate, setStartDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = React.useState("");
  const [renewalNoticeDays, setRenewalNoticeDays] = React.useState("30");
  const [billingCycle, setBillingCycle] = React.useState("Monthly");
  const [billingDay, setBillingDay] = React.useState(1);

  // Initialize with 1 group containing 13 empty points (as requested previously)
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

  // Queries
  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "customers"), orderBy("fullName"));
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  const projectsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !selectedCustomerId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "projects"), 
      where("customerId", "==", selectedCustomerId),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId, selectedCustomerId]);
  const { data: projects } = useCollection(projectsQuery);

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

  const updateGroup = (groupId: string, field: keyof ServiceGroup, val: any) => {
    setServiceGroups(serviceGroups.map(g => g.id === groupId ? { ...g, [field]: val } : g));
  };

  const updatePoint = (groupId: string, pointId: string, field: keyof ServicePoint, val: any) => {
    setServiceGroups(serviceGroups.map(g => g.id === groupId ? { ...g, points: g.points.map(p => p.id === pointId ? { ...p, [field]: val } : p) } : g));
  };

  const grossSubtotal = React.useMemo(() => serviceGroups.reduce((s, g) => s + (Number(g.amount) || 0), [serviceGroups]) as any, [serviceGroups]);
  const vatAmount = (Number(grossSubtotal) * vatPercent) / 100;
  const netMonthlyTotal = Number(grossSubtotal) + vatAmount - discountAmount;

  const handleAddContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || !selectedCustomerId || isSubmitting) return;

    setIsSubmitting(true);
    const customer = customers?.find(c => c.id === selectedCustomerId);
    const project = projects?.find(p => p.id === selectedProjectId);
    
    const customerName = customer ? (customer.customerType !== 'individual' ? customer.companyName : `${customer.firstName} ${customer.lastName}`) : "Client";
    
    // Filter out empty points before saving
    const cleanedGroups = serviceGroups.map(g => ({
      ...g,
      points: g.points.filter(p => p.location.trim() !== "")
    })).filter(g => g.serviceName.trim() !== "" || g.points.length > 0);

    const contractData = {
      companyId, branchId,
      contractNumber: `SC-${Date.now().toString().slice(-6)}`,
      contractName: contractName || `${customerName} - ${serviceType.toUpperCase()}`,
      agreementNo, 
      customerId: selectedCustomerId, 
      customerName,
      customerAddress: customer?.address || "",
      customerPhone: customer?.phoneNumber || "",
      projectId: selectedProjectId || "standalone",
      projectName: project?.name || "Standalone Agreement",
      serviceType, 
      startDate, 
      endDate,
      renewalNoticeDays: Number(renewalNoticeDays),
      billingCycle,
      billingDay: Number(billingDay), 
      groups: cleanedGroups,
      monthlyAmount: Number(grossSubtotal), 
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
        toast({ title: t('success'), description: "Service contract provisioned and activated." });
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
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-indigo-600">Provision Service Contract</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">SLA Lifecycle Terminal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>{t('cancel')}</Button>
          <Button onClick={handleAddContract} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 rounded-full px-10 h-11 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 gap-2">
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />} Provision & Activate
          </Button>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto w-full p-4 md:p-8 space-y-8">
        <form onSubmit={handleAddContract} className="space-y-8">
          
          {/* SECTION 1: IDENTITY & LINKS */}
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-8">
            <div className="flex items-center gap-3 border-b pb-4">
               <GitPullRequest className="h-5 w-5 text-indigo-600" />
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Contract Identity & Entity Mapping</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Customer Entity *</Label>
                <Select value={selectedCustomerId} onValueChange={(val) => { setSelectedCustomerId(val); setSelectedProjectId(""); }} required>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue placeholder="Search Client" /></SelectTrigger>
                  <SelectContent className="max-h-[300px] rounded-xl shadow-2xl border-none ring-1 ring-slate-100">
                    {customers?.map((c, idx) => (
                      <SelectItem key={`c-sel-${c.id}-${idx}`} value={c.id} className="text-xs font-bold uppercase py-2.5">
                        {c.customerType !== 'individual' ? c.companyName : `${c.firstName} ${c.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Linked Project</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={!selectedCustomerId}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue placeholder="Standalone or Select Project" /></SelectTrigger>
                  <SelectContent className="max-h-[300px] rounded-xl shadow-2xl">
                    <SelectItem value="standalone" className="text-xs font-bold">STANDALONE (NO PROJECT)</SelectItem>
                    {projects?.map((p, idx) => (
                      <SelectItem key={`p-sel-${p.id}-${idx}`} value={p.id} className="text-xs font-bold uppercase">{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Contract Name</Label>
                <Input value={contractName} onChange={e => setContractName(e.target.value)} className="h-11 rounded-xl font-bold uppercase text-xs" placeholder="e.g. HQ Security AMC 2026" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Agreement No *</Label>
                <Input value={agreementNo} onChange={e => setAgreementNo(e.target.value)} required className="h-11 rounded-xl font-black text-xs uppercase" placeholder="WTS/AMC/26/001" />
              </div>
            </div>
          </Card>

          {/* SECTION 2: DURATION & TYPE */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                   <Briefcase className="h-4 w-4 text-blue-600" />
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Agreement Specs</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase">Classification</Label>
                    <Select value={serviceType} onValueChange={setServiceType}>
                      <SelectTrigger className="h-10 rounded-xl bg-slate-50 font-bold text-[10px] uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="amc" className="text-xs font-bold uppercase">{t('amc')}</SelectItem>
                        <SelectItem value="serviceAgreement" className="text-xs font-bold uppercase">{t('serviceAgreement')}</SelectItem>
                        <SelectItem value="supportContract" className="text-xs font-bold uppercase">{t('supportContract')}</SelectItem>
                        <SelectItem value="warrantyService" className="text-xs font-bold uppercase">{t('warrantyService')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
             </Card>

             <Card className="lg:col-span-2 p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6">
                <div className="flex items-center gap-3 border-b pb-4">
                   <Calendar className="h-4 w-4 text-orange-600" />
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Validity Perimeter</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Commencement Date</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="h-10 rounded-xl font-bold uppercase text-[10px]" /></div>
                   <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Termination Date</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="h-10 rounded-xl font-bold uppercase text-[10px]" /></div>
                   <div className="space-y-1.5">
                     <Label className="text-[10px] font-black uppercase">Renewal Notice</Label>
                     <Select value={renewalNoticeDays} onValueChange={setRenewalNoticeDays}>
                        <SelectTrigger className="h-10 rounded-xl bg-slate-50 font-bold text-[10px] uppercase"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                           <SelectItem value="7" className="text-xs font-bold">7 DAYS NOTICE</SelectItem>
                           <SelectItem value="15" className="text-xs font-bold">15 DAYS NOTICE</SelectItem>
                           <SelectItem value="30" className="text-xs font-bold">30 DAYS NOTICE</SelectItem>
                           <SelectItem value="60" className="text-xs font-bold">60 DAYS NOTICE</SelectItem>
                           <SelectItem value="90" className="text-xs font-bold">90 DAYS NOTICE</SelectItem>
                        </SelectContent>
                     </Select>
                   </div>
                </div>
             </Card>
          </div>

          {/* SECTION 3: SERVICE MATRIX */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-indigo-600" /> Technical Service Manifest</h3>
               <Button type="button" onClick={addGroup} variant="outline" className="rounded-full gap-2 border-indigo-100 text-indigo-700 bg-white h-9 px-6 font-black text-[10px] uppercase shadow-sm hover:bg-indigo-50">
                 <PlusCircle className="h-4 w-4" /> Add Service Block
               </Button>
            </div>

            {serviceGroups.map((group, gIdx) => (
              <Card key={group.id} className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 overflow-hidden">
                <div className="p-6 bg-slate-50/50 border-b flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                    <div className="space-y-1 flex-1">
                       <Label className="text-[9px] font-black uppercase text-slate-400">Service Category Name</Label>
                       <Input value={group.serviceName} onChange={e => updateGroup(group.id, 'serviceName', e.target.value)} className="h-10 rounded-xl bg-white font-black uppercase text-xs" placeholder="e.g. Monthly CCTV Maintenance" />
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
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> Site Location Registry</p>
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/20">
                      <table className="w-full border-collapse">
                        <thead className="bg-slate-50/50">
                          <tr className="h-10">
                            <th className="w-12 text-center text-[9px] font-black uppercase text-slate-400">SL</th>
                            <th className="text-left text-[9px] font-black uppercase text-slate-400 pl-4">Description / Location Details</th>
                            <th className="w-12"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.points.map((point, pIdx) => (
                            <tr key={point.id} className="border-t border-slate-50 h-14 group bg-white/40">
                              <td className="text-center text-[10px] font-black text-slate-300">{(pIdx + 1).toString().padStart(2, '0')}</td>
                              <td className="pl-4">
                                <Input value={point.location} onChange={e => updatePoint(group.id, point.id, 'location', e.target.value)} className="h-9 border-none bg-white/50 text-[11px] font-bold uppercase rounded-lg focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Server Room Rack A-4" />
                              </td>
                              <td className="text-center">
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100" onClick={() => {
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

          {/* SECTION 4: FINANCIALS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-8 rounded-[2.5rem] bg-white space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Financial Tuning & Cycle</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">VAT %</Label><Input type="number" value={vatPercent} onChange={e => setVatPercent(Number(e.target.value))} className="h-11 rounded-xl bg-slate-50 border-none" /></div>
                 <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Adjustment (৳)</Label><Input type="number" value={discountAmount} onChange={e => setDiscountAmount(Number(e.target.value))} className="h-11 rounded-xl bg-slate-50 border-none" /></div>
                 <div className="space-y-1.5">
                   <Label className="text-[10px] font-black uppercase">Billing Cycle</Label>
                   <Select value={billingCycle} onValueChange={setBillingCycle}>
                      <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs uppercase"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl shadow-2xl">
                         <SelectItem value="Monthly" className="font-bold">MONTHLY</SelectItem>
                         <SelectItem value="Quarterly" className="font-bold">QUARTERLY</SelectItem>
                         <SelectItem value="Half-Yearly" className="font-bold">HALF-YEARLY</SelectItem>
                         <SelectItem value="Yearly" className="font-bold">YEARLY</SelectItem>
                      </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Billing Day</Label><Input type="number" min={1} max={28} value={billingDay} onChange={e => setBillingDay(Number(e.target.value))} className="h-11 rounded-xl bg-slate-50 border-none font-bold" /></div>
              </div>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="min-h-[100px] rounded-2xl bg-slate-50 border-none p-4 text-[11px] font-bold text-slate-600" placeholder="Internal remarks regarding this agreement..." />
            </Card>

            <Card className="p-8 rounded-[2.5rem] bg-slate-900 text-white space-y-6 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><FileSignature className="h-24 w-24" /></div>
               <div className="flex justify-between items-end pb-4 border-b border-white/10 relative z-10">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em]">Net Periodic Receivable</p>
                    <h2 className="text-4xl font-black tracking-tighter text-emerald-400">৳{netMonthlyTotal.toLocaleString()}</h2>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black uppercase opacity-60">Frequency</p>
                    <Badge className="bg-emerald-600 text-white border-none font-black text-[10px] h-6 px-4 uppercase">{billingCycle}</Badge>
                  </div>
               </div>
               <div className="pt-4 flex items-center gap-4 bg-white/5 p-5 rounded-3xl relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0"><ShieldCheck className="h-6 w-6 text-emerald-400" /></div>
                  <p className="text-[10px] font-bold leading-relaxed opacity-60 uppercase">System will automatically execute billing on Day {billingDay} of each cycle. Status mapping is automated based on ledger clearance.</p>
               </div>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
