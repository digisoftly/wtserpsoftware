
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  PlusCircle,
  ShieldCheck,
  Building,
  User,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, setDoc, serverTimestamp, query, where, orderBy } from "firebase/firestore"
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

export default function NewServiceContractPage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [selectedProjectId, setSelectedProjectId] = React.useState("");
  const [agreementNo, setAgreementNo] = React.useState("");
  const [contractName, setContractName] = React.useState("");
  const [serviceType, setServiceType] = React.useState("internetService");
  const [startDate, setStartDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = React.useState("");
  const [billingCycle, setBillingCycle] = React.useState("Monthly");
  const [billingDay, setBillingDay] = React.useState(1);
  const [vatPercent, setVatPercent] = React.useState(0);
  const [discountAmount, setDiscountAmount] = React.useState(0);
  const [notes, setNotes] = React.useState("");

  const [serviceGroups, setServiceGroups] = React.useState<ServiceGroup[]>([
    { 
      id: 'g1', 
      serviceName: '', 
      amount: 0, 
      points: Array.from({ length: 13 }, (_, i) => ({ id: `p${i+1}-${Date.now()}`, location: '', description: '' }))
    }
  ]);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: rawCustomers } = useCollection(customersQuery);

  const customers = React.useMemo(() => {
    if (!rawCustomers) return [];
    return [...rawCustomers].sort((a, b) => {
      const nameA = a.companyName || a.fullName || "";
      const nameB = b.companyName || b.fullName || "";
      return nameA.localeCompare(nameB);
    });
  }, [rawCustomers]);

  const projectsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !selectedCustomerId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "projects"), where("customerId", "==", selectedCustomerId));
  }, [db, companyId, branchId, selectedCustomerId]);
  const { data: rawProjects } = useCollection(projectsQuery);

  const projects = React.useMemo(() => {
    if (!rawProjects) return [];
    return [...rawProjects].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
  }, [rawProjects]);

  const addGroup = () => {
    setServiceGroups([...serviceGroups, { 
      id: Math.random().toString(36).substr(2, 9), 
      serviceName: '', 
      amount: 0, 
      points: Array.from({ length: 13 }, (_, i) => ({ id: `p-new-${i+1}-${Date.now()}`, location: '', description: '' }))
    }]);
  };

  const updateGroup = (groupId: string, field: keyof ServiceGroup, val: any) => {
    setServiceGroups(serviceGroups.map(g => g.id === groupId ? { ...g, [field]: val } : g));
  };

  const updatePoint = (groupId: string, pointId: string, field: keyof ServicePoint, val: any) => {
    setServiceGroups(serviceGroups.map(g => g.id === groupId ? { ...g, points: g.points.map(p => p.id === pointId ? { ...p, [field]: val } : p) } : g));
  };

  const grossSubtotal = React.useMemo(() => serviceGroups.reduce((s, g) => s + (Number(g.amount) || 0), 0), [serviceGroups]);
  const vatAmount = (Number(grossSubtotal) * vatPercent) / 100;
  const netMonthlyTotal = Number(grossSubtotal) + vatAmount - discountAmount;

  const handleAddContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || !selectedCustomerId || isSubmitting) return;

    setIsSubmitting(true);
    const customer = customers?.find(c => c.id === selectedCustomerId);
    const project = projects?.find(p => p.id === selectedProjectId);
    
    // Resolve clean customer name
    const customerName = customer ? (customer.companyName || customer.fullName || "Unknown Client") : "Client";
    
    const cleanedGroups = serviceGroups.map(g => ({
      ...g,
      points: g.points.filter(p => p.location.trim() !== "")
    })).filter(g => g.serviceName.trim() !== "" || g.points.length > 0);

    const contractData = {
      companyId, branchId,
      contractNumber: `SC-${Date.now().toString().slice(-6)}`,
      contractName: contractName || `${customerName} - ${t(serviceType).toUpperCase()}`,
      agreementNo, 
      customerId: selectedCustomerId, 
      customerName,
      customerAddress: customer?.address || "",
      customerPhone: customer?.phoneNumber || "",
      customerEmail: customer?.email || "",
      projectId: selectedProjectId || "standalone",
      projectName: project?.name || "Standalone Agreement",
      serviceType, 
      startDate, 
      endDate,
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
        toast({ title: t('success') });
        router.push("/contracts");
      })
      .catch(() => setIsSubmitting(false));
  };

  return (
    <div className="max-w-full mx-auto space-y-6 pb-20">
      <div className="bg-white border p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ring-1 ring-slate-100 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-xl md:text-2xl font-black font-headline uppercase tracking-tight text-slate-900">New Service Contract</h1>
            <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mt-0.5">Deployment Terminal</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="rounded-xl h-11 px-6 font-black text-[10px] uppercase tracking-widest" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={handleAddContract} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-10 h-11 font-black text-[10px] uppercase shadow-xl transition-all active:scale-95 gap-2">
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} Save
          </Button>
        </div>
      </div>

      <div className="bg-white border rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 shadow-sm ring-1 ring-slate-100 space-y-12">
        <section className="space-y-6">
           <h3 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] border-b pb-2">1. Identity & Scope</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5 lg:col-span-2">
                <Label className="text-[10px] font-black uppercase text-slate-400">Target Client Account</Label>
                <Select value={selectedCustomerId} onValueChange={(v) => { setSelectedCustomerId(v); setSelectedProjectId(""); }}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-xs"><SelectValue placeholder="Search Client" /></SelectTrigger>
                  <SelectContent className="max-h-[300px] rounded-xl shadow-2xl">
                    {customers.map(c => {
                      const cName = c.companyName || c.fullName || "Unnamed Client";
                      return <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">{cName}</SelectItem>
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Linked Project</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={!selectedCustomerId}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue placeholder="Standalone or Project" /></SelectTrigger>
                  <SelectContent className="max-h-[300px] rounded-xl shadow-2xl"><SelectItem value="standalone" className="text-xs font-bold">STANDALONE</SelectItem>{projects.map(p => <SelectItem key={p.id} value={p.id} className="text-xs font-bold uppercase">{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Service Category</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-xs uppercase"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl shadow-2xl">
                    <SelectItem value="internetService" className="text-xs font-bold uppercase">{t('internetService')}</SelectItem>
                    <SelectItem value="cctvService" className="text-xs font-bold uppercase">{t('cctvService')}</SelectItem>
                    <SelectItem value="amcService" className="text-xs font-bold uppercase">{t('amcService')}</SelectItem>
                    <SelectItem value="networkService" className="text-xs font-bold uppercase">{t('networkService')}</SelectItem>
                    <SelectItem value="itSupportService" className="text-xs font-bold uppercase">{t('itSupportService')}</SelectItem>
                    <SelectItem value="accessControlService" className="text-xs font-bold uppercase">{t('accessControlService')}</SelectItem>
                    <SelectItem value="pabxService" className="text-xs font-bold uppercase">{t('pabxService')}</SelectItem>
                    <SelectItem value="otherService" className="text-xs font-bold uppercase">{t('otherService')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Reference No.</Label><Input value={agreementNo} onChange={e => setAgreementNo(e.target.value)} required className="h-11 rounded-xl font-black uppercase" placeholder="WTS/AMC/26/001" /></div>
           </div>
        </section>

        <section className="space-y-6">
           <h3 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] border-b pb-2">2. Term & Schedule</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Start Date</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="h-11 rounded-xl font-bold" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">End Date</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="h-11 rounded-xl font-bold" /></div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Billing Cycle</Label>
                <Select value={billingCycle} onValueChange={setBillingCycle}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-xs uppercase"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl shadow-2xl"><SelectItem value="Monthly" className="text-xs font-bold">MONTHLY</SelectItem><SelectItem value="Quarterly" className="text-xs font-bold">QUARTERLY</SelectItem><SelectItem value="Yearly" className="text-xs font-bold">YEARLY</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Cycle Day</Label><Input type="number" min={1} max={28} value={billingDay} onChange={e => setBillingDay(Number(e.target.value))} className="h-11 rounded-xl font-black" /></div>
           </div>
        </section>

        <section className="space-y-6">
           <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-2">
              <h3 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em]">3. Service Matrix</h3>
              <Button type="button" onClick={addGroup} variant="outline" className="h-9 px-5 rounded-lg font-black text-[10px] uppercase gap-2 border-indigo-100 text-indigo-600 bg-white"><PlusCircle className="h-3.5 w-3.5" /> New Row</Button>
           </div>
           
           <div className="grid grid-cols-1 gap-8">
              {serviceGroups.map((group, gIdx) => (
                <div key={group.id} className="border rounded-2xl overflow-hidden bg-slate-50/30 ring-1 ring-slate-100">
                   <div className="p-5 border-b bg-white flex flex-col md:flex-row gap-4 items-center justify-between">
                      <div className="flex-1 w-full space-y-1.5">
                         <Label className="text-[9px] font-black uppercase text-slate-400">Service Category</Label>
                         <Input value={group.serviceName} onChange={e => updateGroup(group.id, 'serviceName', e.target.value)} className="h-10 rounded-xl bg-slate-50/50" placeholder="e.g. CCTV Maintenance" />
                      </div>
                      <div className="w-full md:w-40 space-y-1.5">
                         <Label className="text-[9px] font-black uppercase text-slate-400">Rate (৳)</Label>
                         <Input type="number" value={group.amount || ''} onChange={e => updateGroup(group.id, 'amount', Number(e.target.value))} className="h-10 rounded-xl font-black text-indigo-600" />
                      </div>
                      <Button variant="ghost" size="icon" className="text-red-300 hover:text-red-600 h-10 w-10 mt-5" onClick={() => setServiceGroups(serviceGroups.filter(g => g.id !== group.id))} disabled={serviceGroups.length === 1}><Trash2 className="h-4 w-4" /></Button>
                   </div>
                   <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {group.points.map((point, pIdx) => (
                        <div key={point.id} className="relative group">
                           <Input value={point.location} onChange={e => updatePoint(group.id, point.id, 'location', e.target.value)} className="h-9 pl-8 text-[10px] font-bold uppercase rounded-lg border-none bg-white ring-1 ring-slate-200 focus:ring-1 focus:ring-indigo-600" placeholder={`Point ${pIdx+1}`} />
                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">{(pIdx+1).toString().padStart(2, '0')}</span>
                        </div>
                      ))}
                   </div>
                </div>
              ))}
           </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-10 border-t">
           <div className="space-y-6">
              <h3 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] border-b pb-2">4. Financial Tuning</h3>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">VAT %</Label><Input type="number" value={vatPercent} onChange={e => setVatPercent(Number(e.target.value))} className="h-11 rounded-xl" /></div>
                 <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Discount (৳)</Label><Input type="number" value={discountAmount} onChange={e => setDiscountAmount(Number(e.target.value))} className="h-11 rounded-xl" /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Ledger Remarks</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} className="min-h-[120px] rounded-xl p-4 text-xs font-medium" /></div>
           </div>
           <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col justify-center items-center text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
              <p className="text-[10px] font-black uppercase opacity-50 tracking-[0.4em]">Net Periodic Receivable</p>
              <h2 className="text-5xl font-headline font-black text-emerald-400 tracking-tighter">৳{netMonthlyTotal.toLocaleString()}</h2>
              <div className="pt-6 border-t border-white/10 w-full grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest">
                 <div className="text-left space-y-1"><p className="opacity-40">Gross Base</p><p>৳{grossSubtotal.toLocaleString()}</p></div>
                 <div className="text-right space-y-1"><p className="opacity-40">Cycle</p><Badge className="bg-emerald-600 text-white border-none px-3 h-5">{billingCycle}</Badge></div>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
}

function Badge({ className, children }: { className?: string, children: React.ReactNode }) {
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium", className)}>{children}</span>;
}
