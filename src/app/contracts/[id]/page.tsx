
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
  Check
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
  const { t } = useTranslation()

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

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-headline text-emerald-600 uppercase tracking-tighter">
                {contract.contractNumber}
              </h1>
              <Badge className={cn(
                "text-[9px] h-5 uppercase px-2 font-black border-none",
                contract.status === 'active' ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              )}>
                {t(`${contract.status}_status` as any)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-medium">{contract.serviceName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full gap-2 text-[10px] uppercase font-black h-10 px-6 border-none ring-1 ring-slate-200 bg-white">
            <Printer className="h-3.5 w-3.5" /> {t('print')}
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 rounded-full h-10 px-6 text-[10px] uppercase font-black shadow-xl shadow-red-100 gap-2" onClick={() => setIsDeleteAlertOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Termination
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-full h-10 px-8 text-[10px] uppercase font-black shadow-xl shadow-emerald-100">
            {t('edit')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title={t('fee')} 
          value={`৳${Number(contract.monthlyAmount || 0).toLocaleString()}`} 
          icon={DollarSign} 
          colorClass="bg-emerald-600" 
        />
        <KPICard 
          title={t('billingCycle')} 
          value={contract.billingCycle || "Monthly"} 
          icon={Clock} 
          colorClass="bg-blue-600" 
        />
        <KPICard 
          title={t('startDate')} 
          value={contract.startDate ? new Date(contract.startDate).toLocaleDateString() : "---"} 
          icon={Calendar} 
          colorClass="bg-purple-600" 
        />
        <KPICard 
          title={t('dueAmount')} 
          value={`৳${(invoices?.filter(i => i.status !== 'paid').reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0).toLocaleString()}`} 
          icon={AlertCircle} 
          colorClass="bg-orange-600" 
        />
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="bg-white border p-1 rounded-xl shadow-sm mb-6 flex h-11 ring-1 ring-slate-100">
          <TabsTrigger value="info" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-black h-9 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">
            <FileText className="h-3.5 w-3.5" /> {t('details')}
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-black h-9 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <CreditCard className="h-3.5 w-3.5" /> {t('billingHistory')}
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-black h-9 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">
            <History className="h-3.5 w-3.5" /> {t('timeline')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t('contractTerm')}</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-10">
                <div className="grid grid-cols-2 gap-10">
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">{t('service')}</p>
                    <p className="text-sm font-black text-slate-900 uppercase">{contract.serviceName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">{t('type')}</p>
                    <p className="text-sm font-black text-emerald-600 uppercase">{contract.serviceType}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">{t('startDate')}</p>
                    <p className="text-sm font-bold text-slate-700">{contract.startDate ? new Date(contract.startDate).toLocaleDateString() : "---"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-widest">{t('endDate')}</p>
                    <p className="text-sm font-bold text-slate-700">{contract.endDate ? new Date(contract.endDate).toLocaleDateString() : "Permanent / Rolling"}</p>
                  </div>
                </div>
                
                <div className="pt-8 border-t border-dashed">
                   <p className="text-[9px] uppercase font-black text-slate-400 mb-4 tracking-widest">{t('details')}</p>
                   <p className="text-xs leading-relaxed text-slate-600 bg-slate-50/50 p-6 rounded-2xl ring-1 ring-slate-100">
                     {contract.description || "Standard service level agreement for periodic maintenance and technical support for network infrastructure and security systems."}
                   </p>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4">
                   <div className="p-4 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-100">
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Billing Model</p>
                      <p className="text-xs font-black text-blue-700 uppercase">{contract.paymentType || "Advance Payment"}</p>
                   </div>
                   <div className="p-4 bg-purple-50 rounded-2xl border-2 border-dashed border-purple-100">
                      <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-1">Recurrence</p>
                      <p className="text-xs font-black text-purple-700 uppercase">{contract.billingCycle || "Monthly"}</p>
                   </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100 h-fit">
              <CardHeader className="bg-emerald-600 py-4 px-6 text-white">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80">{t('customer')}</CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-[2rem] bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-black mx-auto mb-6 border-2 border-emerald-100 shadow-inner">
                  {contract.customerName?.[0] || "C"}
                </div>
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-tight">{contract.customerName || "Organization Client"}</h3>
                <p className="text-[9px] text-muted-foreground uppercase font-black mt-2 tracking-widest">Client Identity: #{contract.customerId?.slice(-6)}</p>
                <Button variant="outline" className="w-full mt-8 rounded-full text-[10px] font-black uppercase h-10 border-emerald-100 text-emerald-600 hover:bg-emerald-50 tracking-widest" onClick={() => router.push('/customers')}>
                  {t('profile')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          {isInvoicesLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
          ) : invoices && invoices.length > 0 ? (
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase font-black h-12 pl-6">{t('date')}</TableHead>
                    <TableHead className="text-[10px] uppercase font-black h-12">Cycle Month</TableHead>
                    <TableHead className="text-[10px] uppercase font-black h-12 text-right">{t('amount')}</TableHead>
                    <TableHead className="text-[10px] uppercase font-black h-12 text-center">{t('status')}</TableHead>
                    <TableHead className="text-right h-12 pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} className="h-16 hover:bg-muted/10 transition-colors">
                      <TableCell className="pl-6 text-[10px] font-black uppercase text-slate-500">{inv.createdAt?.toDate ? new Date(inv.createdAt?.toDate()).toLocaleDateString() : '---'}</TableCell>
                      <TableCell className="font-black text-xs uppercase text-blue-600">{inv.billingMonth}</TableCell>
                      <TableCell className="text-right font-black text-xs text-slate-900">৳{Number(inv.amount || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn(
                          "text-[8px] h-5 uppercase border-none px-2 font-black",
                          inv.status === 'paid' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                        )}>
                          {t(`${inv.status}_status` as any)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1">
                          {inv.status !== 'paid' && (
                            <Button 
                              onClick={() => handlePayInvoice(inv.id)}
                              className="h-7 px-3 rounded-full bg-green-600 hover:bg-green-700 text-white font-black text-[9px] uppercase gap-1.5 shadow-lg shadow-green-100"
                            >
                              <Check className="h-3 w-3" /> {t('payNow')}
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl">
                              <DropdownMenuItem className="text-xs font-bold" onClick={() => handlePayInvoice(inv.id)}><Receipt className="mr-2 h-3.5 w-3.5" /> Mark as Paid</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-xs font-bold text-red-600"><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Record</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          ) : (
            <div className="p-20 bg-white rounded-[2rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
              <Receipt className="h-10 w-10 text-slate-200 mb-4" />
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">No billing history found.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
             <CardContent className="p-20 text-center">
               <History className="h-10 w-10 text-slate-200 mx-auto mb-4" />
               <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]">Contract activity log initializing...</p>
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tight text-slate-900">Terminate Contract?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">This action will stop all future billing and archive the agreement record.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest" onClick={handleDelete}>Terminate Now</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
