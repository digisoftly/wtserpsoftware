"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  ShieldCheck, 
  Loader2, 
  Eye, 
  Trash2, 
  Edit, 
  Receipt,
  FileText,
  Clock,
  History,
  TrendingUp,
  MapPin,
  Handshake,
  User,
  LayoutDashboard
} from "lucide-react"
import { useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, where, deleteDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

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
      const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return dateB - dateA;
    })
  }, [rawInvoices])

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
      .catch(() => toast({ variant: "destructive", title: t('error') }));
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-indigo-600" /></div>;
  if (!contract) return <div className="p-20 text-center uppercase font-black text-muted-foreground">{t('noData')}</div>;

  const currentStatus = getContractStatus(contract);

  return (
    <div className="max-w-full mx-auto space-y-6 pb-20">
      {/* UNIFIED HEADER BAR */}
      <div className="bg-white border p-6 rounded-2xl md:rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10 shrink-0"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-black font-headline text-slate-900 uppercase tracking-tight truncate">{contract.contractName}</h1>
              <Badge className={cn("text-[9px] h-5 uppercase px-2 font-black border-none", 
                currentStatus === 'active' ? "bg-green-600 text-white" : 
                currentStatus === 'expiringSoon' ? "bg-orange-500 text-white" : "bg-rose-600 text-white")}>
                {t(currentStatus as any)}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{contract.contractNumber} • {contract.customerName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 md:flex-none rounded-xl h-10 px-6 font-black text-[10px] uppercase border-slate-200 gap-2 bg-white" onClick={() => router.push(`/contracts/${id}/edit`)}>
            <Edit className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button className="flex-1 md:flex-none bg-rose-600 hover:bg-rose-700 text-white rounded-xl h-10 px-8 text-[10px] font-black uppercase shadow-xl transition-all active:scale-95 gap-2" onClick={() => setIsDeleteAlertOpen(true)}>
            <Trash2 className="h-4 w-4" /> Terminate
          </Button>
        </div>
      </div>

      {/* UNIFIED DETAIL CONTAINER */}
      <div className="bg-white border rounded-2xl md:rounded-[2.5rem] shadow-sm overflow-hidden ring-1 ring-slate-100">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-slate-50/50 p-2 h-auto flex flex-wrap md:flex-nowrap gap-2 border-b">
            <TabsTrigger value="overview" className="rounded-lg flex-1 py-3 text-[10px] uppercase font-black data-[state=active]:bg-white data-[state=active]:shadow-sm">Summary</TabsTrigger>
            <TabsTrigger value="services" className="rounded-lg flex-1 py-3 text-[10px] uppercase font-black data-[state=active]:bg-white data-[state=active]:shadow-sm">Matrix</TabsTrigger>
            <TabsTrigger value="billing" className="rounded-lg flex-1 py-3 text-[10px] uppercase font-black data-[state=active]:bg-white data-[state=active]:shadow-sm">Ledger</TabsTrigger>
          </TabsList>

          <div className="p-6 md:p-10">
            <TabsContent value="overview" className="mt-0 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                     <div className="space-y-4">
                        <h3 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] border-b pb-2">Client profile</h3>
                        <div className="space-y-2">
                           <p className="text-lg font-black uppercase text-slate-900">{contract.customerName}</p>
                           <p className="text-[11px] font-bold text-slate-500 leading-relaxed">{contract.customerAddress || 'Address not recorded'}</p>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <h3 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] border-b pb-2">Project detail</h3>
                        <p className="text-sm font-bold uppercase text-slate-700">{contract.projectName || 'Standalone Support Agreement'}</p>
                     </div>
                  </div>
                  <div className="bg-slate-50/50 p-8 rounded-3xl ring-1 ring-slate-100 space-y-6">
                     <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                        <span className="text-[10px] font-black uppercase text-slate-400">Monthly charge</span>
                        <span className="text-xl font-black text-indigo-600">{formatCurrency(contract.monthlyAmount)}</span>
                     </div>
                     <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                        <span className="text-[10px] font-black uppercase text-slate-400">Term period</span>
                        <span className="text-[11px] font-bold uppercase">{formatDate(contract.startDate)} - {formatDate(contract.endDate)}</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-slate-400">Billing Day</span>
                        <span className="text-[11px] font-black">DAY {contract.billingDay || 1}</span>
                     </div>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="services" className="mt-0 animate-in fade-in duration-500">
               <div className="space-y-6">
                  {contract.groups?.map((group: any, idx: number) => (
                    <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                       <div className="bg-slate-50/80 p-4 border-b flex justify-between items-center">
                          <h4 className="text-[11px] font-black uppercase text-slate-900 tracking-widest">{group.serviceName}</h4>
                          <span className="text-xs font-black text-indigo-600">{formatCurrency(group.amount)}</span>
                       </div>
                       <Table>
                          <TableBody>
                             {group.points?.map((p: any, pIdx: number) => (
                               <TableRow key={pIdx} className="h-12 border-slate-50 hover:bg-slate-50/30">
                                  <TableCell className="w-12 text-center text-[10px] font-black text-slate-300">{(pIdx+1).toString().padStart(2, '0')}</TableCell>
                                  <TableCell className="text-[11px] font-bold uppercase text-slate-700">{p.location}</TableCell>
                               </TableRow>
                             ))}
                          </TableBody>
                       </Table>
                    </div>
                  ))}
               </div>
            </TabsContent>

            <TabsContent value="billing" className="mt-0 animate-in fade-in duration-500">
               <div className="border rounded-2xl overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-slate-50">
                       <TableRow>
                          <TableHead className="h-11 pl-6 text-[9px] font-black uppercase">Billing Month</TableHead>
                          <TableHead className="h-11 text-[9px] uppercase font-black text-right">Settlement</TableHead>
                          <TableHead className="h-11 text-[9px] uppercase font-black text-center">Status</TableHead>
                          <TableHead className="h-11"></TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {sortedInvoices.map((inv) => (
                         <TableRow key={inv.id} className="h-16 hover:bg-slate-50/50 transition-colors border-slate-50">
                            <TableCell className="pl-6 font-black text-[11px] text-indigo-600 uppercase">{inv.billingMonth}</TableCell>
                            <TableCell className="text-right font-black text-[11px] text-slate-900">{formatCurrency(inv.amount)}</TableCell>
                            <TableCell className="text-center">
                               <Badge variant="outline" className={cn("text-[8px] h-4 uppercase border-none px-2 font-black", inv.status === 'paid' ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700")}>{inv.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => router.push(`/contracts/invoices/${inv.id}/view`)}><Eye className="h-4 w-4" /></Button>
                            </TableCell>
                         </TableRow>
                       ))}
                       {sortedInvoices.length === 0 && (
                         <TableRow><TableCell colSpan={4} className="h-40 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest">No periodic records detected</TableCell></TableRow>
                       )}
                    </TableBody>
                  </Table>
               </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase text-slate-900">Terminate?</AlertDialogTitle>
            <AlertDialogDescription className="text-[11px] font-bold text-slate-500 leading-relaxed">This operation will revoke all future service rights. This cannot be reversed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2">
            <AlertDialogCancel className="h-11 rounded-xl font-black uppercase text-[10px]">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 h-11 rounded-xl font-black uppercase text-[10px] text-white" onClick={handleDelete}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
