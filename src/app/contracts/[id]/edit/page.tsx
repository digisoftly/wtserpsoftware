
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Trash2,
  ShieldCheck,
  Building,
  GitPullRequest
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, updateDoc, serverTimestamp, query, where } from "firebase/firestore"
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

export default function EditServiceContractPage() {
  const { id } = useParams();
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fully Controlled Form State
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [selectedProjectId, setSelectedProjectId] = React.useState("");
  const [contractName, setContractName] = React.useState("");
  const [agreementNo, setAgreementNo] = React.useState("");
  const [serviceType, setServiceType] = React.useState("");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [renewalNoticeDays, setRenewalNoticeDays] = React.useState("30");
  const [billingCycle, setBillingCycle] = React.useState("Monthly");
  const [billingDay, setBillingDay] = React.useState(1);
  const [serviceGroups, setServiceGroups] = React.useState<ServiceGroup[]>([]);
  const [vatPercent, setVatPercent] = React.useState(0);
  const [discountAmount, setDiscountAmount] = React.useState(0);
  const [notes, setNotes] = React.useState("");
  const [status, setStatus] = React.useState("active");

  // Queries
  const contractRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return doc(db, "companies", companyId, "branches", branchId, "service_contracts", id as string);
  }, [db, companyId, branchId, id]);

  const { data: contract, isLoading: isContractLoading } = useDoc(contractRef);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: rawCustomers } = useCollection(customersQuery);

  const customers = React.useMemo(() => {
    if (!rawCustomers) return [];
    return [...rawCustomers].sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
  }, [rawCustomers]);

  const projectsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !selectedCustomerId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "projects"), 
      where("customerId", "==", selectedCustomerId)
    );
  }, [db, companyId, branchId, selectedCustomerId]);
  const { data: rawProjects } = useCollection(projectsQuery);

  const projects = React.useMemo(() => {
    if (!rawProjects) return [];
    return [...rawProjects].sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  }, [rawProjects]);

  // Sync state with contract data
  React.useEffect(() => {
    if (contract) {
      setSelectedCustomerId(contract.customerId || "");
      setSelectedProjectId(contract.projectId || "standalone");
      setContractName(contract.contractName || "");
      setAgreementNo(contract.agreementNo || "");
      setServiceType(contract.serviceType || "amc");
      setStartDate(contract.startDate || "");
      setEndDate(contract.endDate || "");
      setRenewalNoticeDays(String(contract.renewalNoticeDays || 30));
      setBillingCycle(contract.billingCycle || "Monthly");
      setBillingDay(contract.billingDay || 1);
      setVatPercent(contract.vatPercent || 0);
      setDiscountAmount(contract.discountAmount || 0);
      setNotes(contract.notes || "");
      setStatus(contract.status || "active");

      const mappedGroups = (contract.groups || []).map((g: any) => {
        const pts = g.points || [];
        const needed = Math.max(0, 13 - pts.length);
        const emptyPoints = Array.from({ length: needed }, (_, i) => ({
          id: `extra-${i}-${Date.now()}`,
          location: '',
          description: ''
        }));
        return { ...g, points: [...pts, ...emptyPoints] };
      });

      if (mappedGroups.length === 0) {
        mappedGroups.push({
          id: 'g1',
          serviceName: '',
          amount: 0,
          points: Array.from({ length: 13 }, (_, i) => ({ id: `p${i+1}-${Date.now()}`, location: '', description: '' }))
        });
      }

      setServiceGroups(mappedGroups);
    }
  }, [contract]);

  const updateGroup = (groupId: string, field: keyof ServiceGroup, val: any) => {
    setServiceGroups(serviceGroups.map(g => g.id === groupId ? { ...g, [field]: val } : g));
  };

  const updatePoint = (groupId: string, pointId: string, field: keyof ServicePoint, val: any) => {
    setServiceGroups(serviceGroups.map(g => g.id === groupId ? { ...g, points: g.points.map(p => p.id === pointId ? { ...p, [field]: val } : p) } : g));
  };

  const grossSubtotal = React.useMemo(() => serviceGroups.reduce((s, g) => s + (Number(g.amount) || 0), 0), [serviceGroups]);
  const vatAmount = (grossSubtotal * vatPercent) / 100;
  const netMonthlyTotal = grossSubtotal + vatAmount - discountAmount;

  const handleUpdateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractRef || !selectedCustomerId || isSubmitting) return;

    setIsSubmitting(true);
    const customer = customers?.find(c => c.id === selectedCustomerId);
    const project = projects?.find(p => p.id === selectedProjectId);
    const customerName = customer ? (customer.customerType !== 'individual' ? customer.companyName : `${customer.firstName} ${customer.lastName}`) : (contract?.customerName || "Client");

    const cleanedGroups = serviceGroups.map(g => ({
      ...g,
      points: g.points.filter(p => p.location.trim() !== "")
    })).filter(g => g.serviceName.trim() !== "" || g.points.length > 0);

    const updateData = {
      contractName: contractName || `${customerName} - ${serviceType.toUpperCase()}`,
      agreementNo, 
      customerId: selectedCustomerId, 
      customerName,
      projectId: selectedProjectId,
      projectName: project?.name || "Standalone Agreement",
      serviceType, 
      startDate, 
      endDate, 
      renewalNoticeDays: Number(renewalNoticeDays),
      billingCycle,
      billingDay: Number(billingDay), 
      groups: cleanedGroups,
      monthlyAmount: grossSubtotal, 
      vatPercent: Number(vatPercent), 
      vatAmount,
      discountAmount: Number(discountAmount), 
      netMonthlyAmount: netMonthlyTotal,
      status, 
      notes,
      updatedAt: serverTimestamp(),
    };

    updateDoc(contractRef, updateData)
      .then(() => {
        toast({ title: t('success') });
        router.push(`/contracts/${id}`);
      })
      .catch(() => setIsSubmitting(false));
  };

  if (isContractLoading || !contract) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 animate-spin text-indigo-600" /></div>;

  return (
    <div className="max-w-full mx-auto space-y-6 pb-20 px-2 md:px-0">
      <div className="bg-white border p-6 rounded-2xl md:rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ring-1 ring-slate-100 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-xl md:text-2xl font-black font-headline uppercase tracking-tight text-slate-900">Modify Agreement</h1>
            <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest mt-0.5">{contract.contractNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="rounded-xl h-11 px-6 font-black text-[10px] uppercase tracking-widest" onClick={() => router.back()}>{t('cancel')}</Button>
          <Button onClick={handleUpdateContract} disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 h-11 font-black text-[10px] uppercase shadow-xl">
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4 mr-2" />} Sync & Save
          </Button>
        </div>
      </div>

      <div className="bg-white border rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 shadow-sm ring-1 ring-slate-100 space-y-12">
        <div className="space-y-6">
           <h3 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] border-b pb-2">1. Identity Mapping</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Client Entity</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-[300px] rounded-xl">{customers.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold uppercase">{c.customerType === 'company' ? c.companyName : `${c.firstName} ${c.lastName}`}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Linked Project</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-[300px] rounded-xl"><SelectItem value="standalone" className="text-xs font-bold">STANDALONE</SelectItem>{projects.map(p => <SelectItem key={p.id} value={p.id} className="text-xs font-bold uppercase">{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Agreement Name</Label>
                <Input value={contractName} onChange={e => setContractName(e.target.value)} className="h-11 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Agreement No.</Label>
                <Input value={agreementNo} onChange={e => setAgreementNo(e.target.value)} required className="h-11 rounded-xl font-black uppercase" />
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <h3 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] border-b pb-2">2. Term & Status</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Commencement</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="h-11 rounded-xl font-bold uppercase" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Termination</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="h-11 rounded-xl font-bold uppercase" /></div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Manual Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-black text-xs uppercase"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                     <SelectItem value="active" className="text-green-600 font-black">ACTIVE</SelectItem>
                     <SelectItem value="suspended" className="text-red-600 font-black">SUSPENDED</SelectItem>
                     <SelectItem value="cancelled" className="text-slate-400 font-black">CANCELLED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <h3 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] border-b pb-2">3. Technical Matrix Configuration</h3>
           <div className="grid grid-cols-1 gap-8">
              {serviceGroups.map((group) => (
                <div key={group.id} className="border rounded-2xl overflow-hidden bg-slate-50/30 ring-1 ring-slate-100">
                   <div className="p-5 border-b bg-white flex flex-col md:flex-row gap-4 items-center justify-between">
                      <div className="flex-1 w-full space-y-1.5">
                         <Label className="text-[9px] font-black uppercase text-slate-400">Service Group Category</Label>
                         <Input value={group.serviceName} onChange={e => updateGroup(group.id, 'serviceName', e.target.value)} className="h-10 rounded-xl bg-slate-50/50" />
                      </div>
                      <div className="w-full md:w-40 space-y-1.5">
                         <Label className="text-[9px] font-black uppercase text-slate-400">Monthly Fee (৳)</Label>
                         <Input type="number" value={group.amount || ''} onChange={e => updateGroup(group.id, 'amount', Number(e.target.value))} className="h-10 rounded-xl font-black text-indigo-600" />
                      </div>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pt-10 border-t">
           <div className="space-y-6">
              <h3 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] border-b pb-2">4. Financial Adjustments</h3>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">VAT %</Label><Input type="number" value={vatPercent} onChange={e => setVatPercent(Number(e.target.value))} className="h-11 rounded-xl" /></div>
                 <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Adjustment (৳)</Label><Input type="number" value={discountAmount} onChange={e => setDiscountAmount(Number(e.target.value))} className="h-11 rounded-xl" /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Contractual Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} className="min-h-[120px] rounded-xl p-4 text-[11px] font-medium" /></div>
           </div>
           <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col justify-center items-center text-center space-y-6">
              <p className="text-[10px] font-black uppercase opacity-50 tracking-[0.4em]">Net Periodic Receivable</p>
              <h2 className="text-5xl font-headline font-black text-emerald-400 tracking-tighter">৳{netMonthlyTotal.toLocaleString()}</h2>
              <div className="pt-6 border-t border-white/10 w-full grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest">
                 <div className="text-left space-y-1"><p className="opacity-40">Gross Base</p><p>৳{grossSubtotal.toLocaleString()}</p></div>
                 <div className="text-right space-y-1"><p className="opacity-40">Frequency</p><Badge className="bg-emerald-600 text-white border-none px-3 h-5">{billingCycle}</Badge></div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
