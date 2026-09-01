
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  ShieldCheck, 
  Calendar, 
  DollarSign, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  CreditCard,
  History,
  MoreVertical,
  Printer,
  Trash2,
  Wrench,
  Receipt,
  Check,
  Eye,
  Edit,
  MapPin,
  ChevronDown,
  LayoutGrid
} from "lucide-react"
import { useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, where, orderBy, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function ContractDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { companyId, branchId } = useTenant()
  const db = useFirestore()
  const { t, formatCurrency } = useTranslation()

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
      where("contractId", "==", id),
      orderBy("createdAt", "desc")
    )
  }, [db, companyId, branchId, id])

  const { data: invoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery)

  const handleDelete = async () => {
    if (!contractRef) return;
    try {
      await deleteDoc(contractRef);
      toast({ title: t('success') });
      router.push("/contracts");
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    }
  };

  const handlePayInvoice = async (invoiceId: string) => {
    if (!db || !companyId || !branchId) return;
    try {
      const docRef = doc(db, "companies", companyId, "branches", branchId, "contract_invoices", invoiceId);
      await updateDoc(docRef, {
        status: "paid",
        paidAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast({ title: t('success'), description: "Invoice marked as paid." });
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
  }

  if (!contract) {
    return (
      <div className="p-16 text-center">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <p className="text-sm font-bold uppercase text-muted-foreground">{t('error')}</p>
        <Button variant="link" onClick={() => router.back()}>{t('back')}</Button>
      </div>
    )
  }

  const totalPoints = contract.groups?.reduce((acc: number, g: any) => acc + (g.points?.length || 0), 0) || 0;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black font-headline text-emerald-600 uppercase tracking-tighter">
                {contract.contractNumber}
              </h1>
              <Badge className={cn(
                "text-[9px] h-5 uppercase px-2 font-black border-none shadow-sm",
                contract.status === 'active' ? "bg-green-600 text-white" : "bg-rose-600 text-white"
              )}>
                {contract.status?.toUpperCase()}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{contract.serviceType} • {contract.customerName}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-full gap-2 text-[10px] font-black uppercase h-10 px-6 border-none ring-1 ring-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <Printer className="h-4 w-4 text-blue-600" /> {t('print')}
          </Button>
          <Button className="bg-rose-600 hover:bg-rose-700 text-white rounded-full h-10 px-8 text-[10px] uppercase font-black shadow-xl shadow-rose-100 gap-2 transition-all active:scale-95" onClick={() => setIsDeleteAlertOpen(true)}>
            <Trash2 className="h-4 w-4" /> Terminate
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full h-10 px-10 font-black text-[10px] uppercase shadow-xl shadow-emerald-100 transition-all active:scale-95" onClick={() => router.push(`/contracts/${id}/edit`)}>
            <Edit className="h-4 w-4" /> Edit SLA
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Monthly Fee" value={formatCurrency(contract.monthlyAmount)} icon={DollarSign} colorClass="bg-emerald-600" />
        <KPICard title="Service Points" value={totalPoints} icon={MapPin} colorClass="bg-blue-600" />
        <KPICard title="Commencement" value={contract.startDate ? new Date(contract.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "---"} icon={Calendar} colorClass="bg-purple-600" />
        <KPICard title="Outstanding Due" value={formatCurrency(invoices?.filter(i => i.status !== 'paid').reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0)} icon={AlertCircle} colorClass="bg-rose-600" />
      </div>

      <Tabs defaultValue="matrix" className="w-full">
        <TabsList className="bg-white border p-1 rounded-2xl shadow-sm mb-8 flex h-14 ring-1 ring-slate-100">
          <TabsTrigger value="matrix" className="rounded-xl gap-2 flex-1 text-[10px] uppercase font-black h-full data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">
            <LayoutGrid className="h-4 w-4" /> Service Matrix
          </TabsTrigger>
          <TabsTrigger value="info" className="rounded-xl gap-2 flex-1 text-[10px] uppercase font-black h-full data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <FileText className="h-4 w-4" /> Client Info
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-xl gap-2 flex-1 text-[10px] uppercase font-black h-full data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">
            <Receipt className="h-4 w-4" /> Billing History
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl gap-2 flex-1 text-[10px] uppercase font-black h-full data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600">
            <History className="h-4 w-4" /> Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="matrix" className="space-y-6">
           {contract.groups?.map((group: any, gIdx: number) => (
             <Card key={gIdx} className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
                <CardHeader className="bg-slate-50/50 p-6 border-b flex flex-row items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-emerald-600 shadow-sm"><Wrench className="h-5 w-5" /></div>
                      <div>
                        <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">{group.serviceName}</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{group.points?.length || 0} Service Points Distributed</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black uppercase text-slate-400">Monthly Group Fee</p>
                      <p className="text-lg font-black text-blue-600">৳{Number(group.amount || 0).toLocaleString()}</p>
                   </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50/30">
                       <TableRow>
                          <TableHead className="w-16 text-center text-[9px] font-black uppercase pl-8">SL</TableHead>
                          <TableHead className="text-[9px] font-black uppercase pl-4">Location / Site Name</TableHead>
                          <TableHead className="text-[9px] font-black uppercase pl-4">Description / Points</TableHead>
                          <TableHead className="text-[9px] font-black uppercase pl-4">Contact Info</TableHead>
                       </TableRow>
                    </TableHeader>
                    <TableBody>
                       {group.points?.map((point: any, pIdx: number) => (
                         <TableRow key={pIdx} className="h-16 hover:bg-slate-50/50 border-slate-50">
                            <TableCell className="text-center text-[10px] font-black text-slate-300 pl-8">{(pIdx + 1).toString().padStart(2, '0')}</TableCell>
                            <TableCell className="pl-4">
                               <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3 text-blue-400" />
                                  <span className="text-[11px] font-black uppercase text-slate-700 tracking-tight">{point.location}</span>
                               </div>
                            </TableCell>
                            <TableCell className="pl-4 text-[10px] font-bold text-slate-500 uppercase">{point.description}</TableCell>
                            <TableCell className="pl-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter">{point.contactPerson || '---'}</TableCell>
                         </TableRow>
                       ))}
                    </TableBody>
                  </Table>
                </CardContent>
             </Card>
           ))}
        </TabsContent>

        <TabsContent value="info">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Card className="lg:col-span-8 border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 p-10 space-y-10">
               <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-1.5"><p className="text-[10px] font-black uppercase text-slate-400">Legal Agreement No</p><p className="text-sm font-black text-slate-900 uppercase">{contract.agreementNo || '---'}</p></div>
                  <div className="space-y-1.5"><p className="text-[10px] font-black uppercase text-slate-400">Service Category</p><p className="text-sm font-black text-emerald-600 uppercase">{contract.serviceType}</p></div>
                  <div className="space-y-1.5"><p className="text-[10px] font-black uppercase text-slate-400">Start Date</p><p className="text-sm font-bold text-slate-700 uppercase">{contract.startDate ? new Date(contract.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : '---'}</p></div>
                  <div className="space-y-1.5"><p className="text-[10px] font-black uppercase text-slate-400">End Date</p><p className="text-sm font-bold text-slate-700 uppercase">{contract.endDate ? new Date(contract.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Lifetime / Rolling'}</p></div>
               </div>
               
               <div className="pt-10 border-t border-dashed border-slate-100">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Internal Notes & Terms</h4>
                  <p className="text-xs font-bold text-slate-500 leading-relaxed bg-slate-50 p-6 rounded-3xl ring-1 ring-slate-100 italic">
                    {contract.notes || "No special administrative remarks added for this SLA."}
                  </p>
               </div>
            </Card>

            <Card className="lg:col-span-4 border-none shadow-sm rounded-[2.5rem] bg-slate-900 text-white p-8 text-center h-fit">
               <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 text-2xl font-black text-emerald-400 shadow-inner">
                  {contract.customerName?.[0]}
               </div>
               <h3 className="text-lg font-black uppercase tracking-tight leading-none mb-2">{contract.customerName}</h3>
               <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Client Identity: #{contract.customerCode}</p>
               
               <div className="mt-10 pt-10 border-t border-white/5 grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-1"><p className="text-[8px] font-black uppercase opacity-40">Payment Terms</p><p className="text-[11px] font-black uppercase">{contract.paymentTerms || 'Net 30'}</p></div>
                  <div className="space-y-1"><p className="text-[8px] font-black uppercase opacity-40">Billing Day</p><p className="text-[11px] font-black uppercase">{contract.billingDay || 1}st of Month</p></div>
               </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          {isInvoicesLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
          ) : invoices && invoices.length > 0 ? (
            <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="h-12 pl-8 text-[10px] font-black uppercase">Billing Month</TableHead>
                    <TableHead className="h-12 text-[10px] font-black uppercase">Invoice ID</TableHead>
                    <TableHead className="h-12 text-[10px] font-black uppercase text-right">Amount (৳)</TableHead>
                    <TableHead className="h-12 text-[10px] font-black uppercase text-center">Status</TableHead>
                    <TableHead className="text-right h-12 pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} className="h-16 hover:bg-slate-50/50 transition-colors group border-slate-50">
                      <TableCell className="pl-8 text-[11px] font-black text-blue-600 uppercase tracking-tight">{inv.billingMonth}</TableCell>
                      <TableCell className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{inv.contractNumber}</TableCell>
                      <TableCell className="text-right font-black text-xs tabular-nums">৳{Number(inv.amount || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn(
                          "text-[8px] h-5 uppercase border-none px-2 font-black",
                          inv.status === 'paid' ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"
                        )}>
                          {inv.status?.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => router.push(`/contracts/invoices/${inv.id}/view`)}><Eye className="h-4 w-4" /></Button>
                          {inv.status !== 'paid' && (
                            <Button onClick={() => handlePayInvoice(inv.id)} className="h-7 px-4 rounded-full bg-green-600 hover:bg-green-700 text-white font-black text-[9px] uppercase gap-1.5 shadow-lg shadow-green-100 transition-all active:scale-95">
                              <Check className="h-3 w-3" /> Mark Paid
                            </Button>
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
              <Receipt className="h-12 w-12 text-slate-200 mb-4" />
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">No statements issued for this contract</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-none shadow-sm rounded-[2rem] p-20 bg-white ring-1 ring-slate-100 text-center">
             <History className="h-12 w-12 text-slate-200 mx-auto mb-4" />
             <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.4em]">Audit Trail Initializing...</p>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tight text-slate-900 leading-tight">Terminate Service Agreement?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-bold text-slate-500 mt-2 leading-relaxed">This will stop all future automated billing cycles and move the SLA to archives. This operation is permanent.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-rose-600 hover:bg-rose-700 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-100" onClick={handleDelete}>Terminate Now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
