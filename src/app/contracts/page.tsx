
"use client"

import * as React from "react"
import { Plus, Wrench, ShieldCheck, Loader2, MoreVertical, AlertCircle, TrendingUp, Eye, Trash2, Calendar, DollarSign } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, setDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"

export default function ContractsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const router = useRouter();
  
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Queries
  const contractsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "service_contracts"), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: contracts, isLoading: isContractsLoading } = useCollection(contractsQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "contract_invoices"), orderBy("billingMonth", "desc"));
  }, [db, companyId, branchId]);
  const { data: invoices } = useCollection(invoicesQuery);

  const stats = React.useMemo(() => ({
    active: contracts?.filter(c => c.status === 'active').length || 0,
    revenue: contracts?.filter(c => c.status === 'active').reduce((s, c) => s + (Number(c.monthlyAmount) || 0), 0) || 0,
    due: invoices?.filter(i => i.status !== 'paid').reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0
  }), [contracts, invoices]);

  const handleAddContract = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId || !branchId) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const customerId = formData.get("customerId") as string;
    const customer = customers?.find(c => c.id === customerId);

    const contractRef = doc(collection(db, "companies", companyId, "branches", branchId, "service_contracts"));
    const contractData = {
      id: contractRef.id,
      companyId,
      branchId,
      contractNumber: `SLA-${Date.now().toString().slice(-6)}`,
      customerId,
      customerName: customer ? `${customer.firstName} ${customer.lastName}` : "Client",
      serviceName: formData.get("serviceName"),
      serviceType: formData.get("serviceType"),
      startDate: formData.get("startDate"),
      monthlyAmount: Number(formData.get("monthlyAmount")),
      billingCycle: formData.get("billingCycle"),
      paymentType: formData.get("paymentType"),
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(contractRef, contractData);
      toast({ title: t('success'), description: t('addContract') });
      setIsAddModalOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    if (!db || !companyId || !branchId) return;
    const docRef = doc(db, "companies", companyId, "branches", branchId, "service_contracts", id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: t('success') });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-headline text-emerald-600 uppercase tracking-tight">{t('contracts')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2 rounded-full px-8 shadow-xl shadow-emerald-100 h-10 text-[10px] uppercase font-black transition-all active:scale-95" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" /> {t('addContract')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title={t('activeContracts')} value={stats.active} icon={ShieldCheck} colorClass="bg-blue-600" />
        <KPICard title={t('monthlyRevenue')} value={`৳${stats.revenue.toLocaleString()}`} icon={TrendingUp} colorClass="bg-green-600" />
        <KPICard title={t('dueAmount')} value={`৳${stats.due.toLocaleString()}`} icon={AlertCircle} colorClass="bg-red-600" />
      </div>

      <Tabs defaultValue="contracts" className="w-full">
        <TabsList className="bg-white border p-1 rounded-xl shadow-sm mb-6 flex h-11 ring-1 ring-slate-100">
          <TabsTrigger value="contracts" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-black h-9 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">{t('agreements')}</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-black h-9 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">{t('billingCycle')}</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          {isContractsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
          ) : contracts && contracts.length > 0 ? (
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="h-12 text-[10px] uppercase font-black pl-6">ID</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black">{t('service')}</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black">{t('customer')}</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black">{t('fee')}</TableHead>
                    <TableHead className="text-right h-12 pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((c) => (
                    <TableRow key={c.id} className="h-16 hover:bg-muted/5 transition-colors group cursor-pointer" onClick={() => router.push(`/contracts/${c.id}`)}>
                      <TableCell className="pl-6 font-mono text-[10px] font-black text-emerald-600 uppercase">{c.contractNumber}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-black text-xs uppercase tracking-tight text-slate-900">{c.serviceName}</span>
                          <span className="text-[9px] font-bold text-muted-foreground uppercase">{c.serviceType}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-700">{c.customerName}</TableCell>
                      <TableCell className="font-black text-xs text-slate-900">৳{Number(c.monthlyAmount || 0).toLocaleString()}/mo</TableCell>
                      <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-emerald-50 text-emerald-600 transition-colors"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl">
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => router.push(`/contracts/${c.id}`)}>
                              <Eye className="mr-2 h-3.5 w-3.5" /> {t('details')}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 text-xs font-bold" onClick={() => handleDelete(c.id)}>
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="p-24 bg-white rounded-[3rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
              <Wrench className="h-12 w-12 text-emerald-200 mb-6" />
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]">{t('allHealthy')}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="billing">
           <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
             <div className="p-20 text-center text-muted-foreground italic text-[10px] uppercase font-black tracking-widest">
               {t('loading')}
             </div>
           </Card>
        </TabsContent>
      </Tabs>

      {/* ADD CONTRACT DIALOG */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-slate-50">
          <DialogHeader className="bg-emerald-600 p-6 text-white flex-row items-center gap-4 space-y-0">
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold font-headline uppercase tracking-tight">{t('addContract')}</DialogTitle>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Service Level Agreement</p>
            </div>
          </DialogHeader>
          
          <form onSubmit={handleAddContract} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('customer')}</Label>
                  <Select name="customerId" required>
                    <SelectTrigger className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white shadow-sm">
                      <SelectValue placeholder={t('search')} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold">{c.firstName} {c.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('service')}</Label>
                  <Input name="serviceName" required className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white" placeholder="e.g. 4K CCTV Maintenance" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('type')}</Label>
                  <Select name="serviceType" defaultValue="CCTV">
                    <SelectTrigger className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CCTV" className="text-xs font-bold">CCTV Support</SelectItem>
                      <SelectItem value="Internet" className="text-xs font-bold">ISP Subscription</SelectItem>
                      <SelectItem value="AMC" className="text-xs font-bold">Annual Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('fee')} (৳)</Label>
                    <Input name="monthlyAmount" type="number" required className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white font-black" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('billingCycle')}</Label>
                    <Select name="billingCycle" defaultValue="Monthly">
                      <SelectTrigger className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white text-[11px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('startDate')}</Label>
                  <Input name="startDate" type="date" required className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('type')}</Label>
                  <Select name="paymentType" defaultValue="Advance">
                    <SelectTrigger className="h-11 rounded-xl border-none ring-1 ring-slate-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Advance">Advance Payment</SelectItem>
                      <SelectItem value="Postpaid">Post-paid Billing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t gap-3 flex-col sm:flex-row">
              <Button type="button" variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-8" onClick={() => setIsAddModalOpen(false)}>{t('cancel')}</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 rounded-full px-12 h-12 font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100 transition-all active:scale-95">
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
