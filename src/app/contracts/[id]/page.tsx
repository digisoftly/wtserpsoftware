
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  ShieldCheck, 
  Calendar, 
  DollarSign, 
  Loader2, 
  AlertCircle,
  Receipt,
  Check,
  Eye,
  Trash2,
  Wrench,
  MapPin,
  LayoutGrid,
  Building,
  User,
  GitPullRequest,
  Briefcase,
  History,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Box,
  Ticket
} from "lucide-react"
import { useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, where, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export default function ServiceContractDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { companyId, branchId } = useTenant()
  const db = useFirestore()
  const { t, formatCurrency, formatDate } = useTranslation()

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);

  const contractRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null
    return doc(db, "companies", companyId, "branches", branchId, "service_contracts", id as string)
  }, [db, companyId, branchId, id])

  const { data: contract, isLoading } = useDoc(contractRef)

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null
    return query(
      collection(db, "companies", companyId, "branches", branchId, "contract_invoices"),
      where("contractId", "==", id)
    )
  }, [db, companyId, branchId, id])

  const { data: rawInvoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery)

  const sortedInvoices = React.useMemo(() => {
    if (!rawInvoices) return []
    return [...rawInvoices].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0)
      return dateB.getTime() - dateA.getTime()
    })
  }, [rawInvoices])

  // Lifecycle Status Logic
  const getContractStatus = (c: any) => {
    const now = new Date();
    const end = new Date(c.endDate);
    if (c.status === 'cancelled' || c.status === 'suspended') return c.status;
    if (now > end) return 'expired';
    const noticeDays = Number(c.renewalNoticeDays || 30);
    const noticeDate = new Date(end);
    noticeDate.setDate(noticeDate.getDate() - noticeDays);
    if (now >= noticeDate) return 'expiringSoon';
    return 'active';
  };

  const handleDelete = () => {
    if (!contractRef) return;
    deleteDoc(contractRef)
      .then(() => {
        toast({ title: t('success') });
        router.push("/contracts");
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: contractRef.path,
          operation: 'delete'
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handlePayInvoice = (invoiceId: string) => {
    if (!db || !companyId || !branchId) return;
    const docRef = doc(db, "companies", companyId, "branches", branchId, "contract_invoices", invoiceId);
    updateDoc(docRef, { status: "paid", paidAt: serverTimestamp(), updatedAt: serverTimestamp() })
      .then(() => toast({ title: t('success'), description: "Invoice marked as paid." }))
      .catch(async () => toast({ variant: "destructive", title: t('error') }));
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 animate-spin text-indigo-600" /></div>;
  if (!contract) return <div className="p-20 text-center uppercase font-black text-muted-foreground">{t('noData')}</div>;

  const totalPoints = contract.groups?.reduce((acc: number, g: any) => acc + (g.points?.length || 0), 0) || 0;
  const currentStatus = getContractStatus(contract);

  return (
    <div className="space-y-6 pb-20">
      {/* PREMIUM HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10 shrink-0"><ArrowLeft className="h-5 w-5" /></Button>
          <div className="overflow-hidden">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black font-headline text-slate-900 uppercase tracking-tight truncate">{contract.contractName}</h1>
              <Badge className={cn("text-[9px] h-5 uppercase px-2 font-black border-none shadow-sm", 
                currentStatus === 'active' ? "bg-green-600 text-white" : 
                currentStatus === 'expiringSoon' ? "bg-orange-500 text-white" : "bg-rose-600 text-white")}>
                {t(currentStatus as any)}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
              <ShieldCheck className="h-3 w-3 text-indigo-500" /> {contract.contractNumber} • {contract.customerName}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full h-10 px-6 text-[10px] uppercase font-black gap-2 border-slate-200 bg-white" onClick={() => router.push(`/contracts/${id}/edit`)}>
            <Edit className="h-3.5 w-3.5" /> Modify SLA
          </Button>
          <Button className="bg-rose-600 hover:bg-rose-700 text-white rounded-full h-10 px-8 text-[10px] uppercase font-black shadow-xl shadow-rose-100 gap-2 transition-all active:scale-95" onClick={() => setIsDeleteAlertOpen(true)}>
            <Trash2 className="h-4 w-4" /> Terminate
          </Button>
        </div>
      </div>

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KPICard title="Monthly Fee" value={formatCurrency(contract.monthlyAmount)} icon={DollarSign} colorClass="bg-emerald-600" />
        <KPICard title="Service Points" value={totalPoints} icon={MapPin} colorClass="bg-blue-600" />
        <KPICard title="Commencement" value={formatDate(contract.startDate)} icon={Calendar} colorClass="bg-purple-600" />
        <KPICard title="Outstanding Due" value={formatCurrency(sortedInvoices?.filter(i => i.status !== 'paid').reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0)} icon={AlertCircle} colorClass="bg-rose-600" />
      </div>

      {/* NAVIGATION TABS */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white border p-1 rounded-2xl shadow-sm mb-8 flex h-auto md:h-14 ring-1 ring-slate-100 overflow-x-auto no-scrollbar">
          <TabsTrigger value="overview" className="rounded-xl gap-2 flex-1 min-w-[120px] py-3 text-[10px] uppercase font-black data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">
            <LayoutDashboard className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="services" className="rounded-xl gap-2 flex-1 min-w-[120px] py-3 text-[10px] uppercase font-black data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <Wrench className="h-4 w-4" /> Service Matrix
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-xl gap-2 flex-1 min-w-[120px] py-3 text-[10px] uppercase font-black data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">
            <Receipt className="h-4 w-4" /> Billing History
          </TabsTrigger>
          <TabsTrigger value="assets" className="rounded-xl gap-2 flex-1 min-w-[120px] py-3 text-[10px] uppercase font-black data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">
            <Box className="h-4 w-4" /> Linked Assets
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-xl gap-2 flex-1 min-w-[120px] py-3 text-[10px] uppercase font-black data-[state=active]:bg-slate-50 data-[state=active]:text-slate-600">
            <History className="h-4 w-4" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="animate-in fade-in slide-in-from-bottom-2">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                 <Card className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 p-8 space-y-8">
                    <div className="flex items-center gap-3 border-b pb-4">
                       <GitPullRequest className="h-5 w-5 text-indigo-600" />
                       <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Contractual Topology</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                       <div className="space-y-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0"><User className="h-6 w-6" /></div>
                             <div><p className="text-[10px] font-black text-slate-400 uppercase">Customer Profile</p><p className="text-sm font-black text-slate-900 uppercase">{contract.customerName}</p></div>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0"><Briefcase className="h-6 w-6" /></div>
                             <div><p className="text-[10px] font-black text-slate-400 uppercase">Linked Project</p><p className="text-sm font-black text-slate-900 uppercase">{contract.projectName || 'Standalone'}</p></div>
                          </div>
                       </div>
                       <div className="space-y-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600 shrink-0"><Calendar className="h-6 w-6" /></div>
                             <div><p className="text-[10px] font-black text-slate-400 uppercase">Agreement Period</p><p className="text-sm font-black text-slate-900 uppercase">{formatDate(contract.startDate)} - {formatDate(contract.endDate)}</p></div>
                          </div>
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0"><ShieldCheck className="h-6 w-6" /></div>
                             <div><p className="text-[10px] font-black text-slate-400 uppercase">SLA Type</p><p className="text-sm font-black text-slate-900 uppercase">{t(contract.serviceType as any)}</p></div>
                          </div>
                       </div>
                    </div>
                 </Card>

                 {contract.notes && (
                   <Card className="border-none shadow-sm rounded-[2rem] bg-slate-50 p-8">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Internal Notes & Terms</p>
                      <p className="text-sm font-bold text-slate-600 leading-relaxed italic">{contract.notes}</p>
                   </Card>
                 )}
              </div>

              <div className="space-y-6">
                 <Card className="border-none shadow-xl rounded-[2.5rem] bg-indigo-600 text-white p-8 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp className="h-24 w-24" /></div>
                    <div className="space-y-1 relative z-10">
                       <p className="text-[10px] font-black uppercase opacity-60 tracking-[0.2em]">Net Contract Value (Annual)</p>
                       <h2 className="text-4xl font-black tracking-tighter tabular-nums">৳{(contract.monthlyAmount * 12).toLocaleString()}</h2>
                    </div>
                    <div className="pt-6 border-t border-white/10 space-y-4 relative z-10">
                       <div className="flex justify-between text-[11px] font-bold uppercase"><span>Monthly MRR</span><span className="font-black">৳{contract.monthlyAmount.toLocaleString()}</span></div>
                       <div className="flex justify-between text-[11px] font-bold uppercase opacity-60"><span>Billing Day</span><span className="font-black">DAY {contract.billingDay || 1}</span></div>
                    </div>
                 </Card>

                 <Button className="w-full h-14 rounded-[2rem] bg-white border border-slate-200 text-indigo-600 font-black text-[10px] uppercase shadow-sm gap-2" onClick={() => router.push(`/projects/${contract.projectId}`)}>
                    <ExternalLink className="h-4 w-4" /> View Full Project Radar
                 </Button>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
           {contract.groups?.map((group: any, gIdx: number) => (
             <Card key={gIdx} className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
                <CardHeader className="bg-slate-50/50 p-6 border-b flex flex-row items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-indigo-600 shadow-sm"><Wrench className="h-5 w-5" /></div>
                      <div><h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">{group.serviceName}</h3><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{group.points?.length || 0} Service Nodes Mapped</p></div>
                   </div>
                   <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase">Block Revenue</p><p className="text-lg font-black text-blue-600">৳{Number(group.amount || 0).toLocaleString()}</p></div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/30">
                         <TableRow>
                            <TableHead className="w-16 text-center text-[9px] font-black uppercase pl-8">SL</TableHead>
                            <TableHead className="text-[9px] font-black uppercase pl-4">Physical Endpoint / Location Details</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {group.points?.map((point: any, pIdx: number) => (
                           <TableRow key={pIdx} className="h-14 hover:bg-slate-50/50 border-slate-50">
                              <TableCell className="text-center text-[10px] font-black text-slate-300 pl-8">{(pIdx + 1).toString().padStart(2, '0')}</TableCell>
                              <TableCell className="pl-4"><div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-indigo-400" /><span className="text-[11px] font-bold uppercase text-slate-700 tracking-tight">{point.location}</span></div></TableCell>
                           </TableRow>
                         ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
             </Card>
           ))}
        </TabsContent>

        <TabsContent value="billing" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          {isInvoicesLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
          ) : sortedInvoices.length > 0 ? (
            <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="h-12 pl-8 text-[10px] font-black uppercase">Billing Cycle</TableHead>
                    <TableHead className="h-12 text-[10px] font-black uppercase text-right">Settlement (৳)</TableHead>
                    <TableHead className="h-12 text-[10px] font-black uppercase text-center">Status</TableHead>
                    <TableHead className="text-right h-12 pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedInvoices.map((inv) => (
                    <TableRow key={inv.id} className="h-16 hover:bg-slate-50/50 transition-colors group border-slate-50">
                      <TableCell className="pl-8 text-[11px] font-black text-indigo-600 uppercase tracking-tight">{inv.billingMonth}</TableCell>
                      <TableCell className="text-right font-black text-xs tabular-nums">৳{Number(inv.amount || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn("text-[8px] h-5 uppercase border-none px-2 font-black", inv.status === 'paid' ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700")}>{inv.status?.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => router.push(`/contracts/invoices/${inv.id}/view`)}><Eye className="h-4 w-4" /></Button>
                          {inv.status !== 'paid' && (
                            <Button onClick={() => handlePayInvoice(inv.id)} className="h-7 px-4 rounded-full bg-green-600 hover:bg-green-700 text-white font-black text-[9px] uppercase gap-1.5 shadow-lg transition-all active:scale-95"><Check className="h-3 w-3" /> Mark Settled</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="p-24 bg-white rounded-[3rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
              <Receipt className="h-12 w-12 text-slate-200 mb-4" /><p className="text-[10px] font-black uppercase text-muted-foreground">No periodic statements issued</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="assets" className="animate-in fade-in slide-in-from-bottom-2">
           <div className="p-24 bg-white rounded-[3rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
              <Box className="h-12 w-12 text-purple-200 mb-4" />
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.3em]">Asset Registry Interface Initializing...</p>
           </div>
        </TabsContent>

        <TabsContent value="activity" className="animate-in fade-in slide-in-from-bottom-2">
           <Card className="border-none shadow-sm rounded-3xl p-8 bg-white ring-1 ring-slate-100">
             <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">Contractual History & Audit</h3>
             <div className="relative border-l-2 border-slate-100 ml-4 pl-8 space-y-8 pb-4">
                <div className="relative">
                  <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-indigo-600 border-4 border-white shadow-sm" />
                  <p className="text-[9px] font-black text-indigo-600 uppercase">Service Provisioned</p>
                  <p className="text-xs font-bold text-slate-900">{formatDate(contract.createdAt)}</p>
                </div>
             </div>
           </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tight text-slate-900 leading-tight">Terminate Service Agreement?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-bold text-slate-500 mt-2 leading-relaxed">This will stop all future automated billing cycles. Access to historic statements will remain. This operation is permanent.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest shadow-xl" onClick={handleDelete}>Terminate Now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
