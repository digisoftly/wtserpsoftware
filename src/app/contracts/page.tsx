"use client"

import * as React from "react"
import { Plus, ShieldCheck, Loader2, MoreVertical, AlertCircle, TrendingUp, Eye, Trash2, Edit, PlayCircle, Receipt, CheckCircle2, Sparkles, Check, Calculator, Calendar, Printer } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, getDocs, where, writeBatch, serverTimestamp, updateDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { format } from "date-fns"
import { runBillingCycle } from "@/lib/billing-service"

export default function ContractsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = React.useState("contracts");
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [isManualGenOpen, setIsManualGenOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [isRunningCycle, setIsRunningCycle] = React.useState(false);

  // Manual Gen State
  const [genMonth, setGenMonth] = React.useState(String(new Date().getMonth() + 1));
  const [genYear, setGenYear] = React.useState(String(new Date().getFullYear()));

  // Queries
  const contractsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "service_contracts"), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: contracts, isLoading: isContractsLoading } = useCollection(contractsQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "contract_invoices"), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: invoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery);

  // Stats
  const stats = React.useMemo(() => ({
    active: contracts?.filter(c => c.status === 'active').length || 0,
    revenue: contracts?.filter(c => c.status === 'active').reduce((s, c) => s + (Number(c.monthlyAmount) || 0), 0) || 0,
    due: invoices?.filter(i => i.status !== 'paid').reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0
  }), [contracts, invoices]);

  const handleRunManualCycle = async () => {
    if (!db || !companyId || !branchId) return;
    setIsRunningCycle(true);
    try {
      const result = await runBillingCycle(db, companyId, branchId, Number(genYear), Number(genMonth));
      if (result.success) {
        toast({ title: "Cycle Complete", description: result.message });
        setIsManualGenOpen(false);
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    } finally {
      setIsRunningCycle(false);
    }
  };

  const handleDelete = () => {
    if (!selectedRecord || !db || !companyId || !branchId) return;
    const col = activeTab === 'contracts' ? "service_contracts" : "contract_invoices";
    const docRef = doc(db, "companies", companyId, "branches", branchId, col, selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: t('success') });
    setIsDeleteAlertOpen(false);
  };

  const handlePayInvoice = async (invoice: any) => {
    if (!db || !companyId || !branchId) return;
    try {
      const docRef = doc(db, "companies", companyId, "branches", branchId, "contract_invoices", invoice.id);
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

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-headline text-emerald-600 uppercase tracking-tight">{t('contracts')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="rounded-full gap-2 px-6 h-10 text-[10px] uppercase font-black border-none ring-1 ring-emerald-100 bg-white hover:bg-emerald-50 text-emerald-700 shadow-sm transition-all"
            onClick={() => setIsManualGenOpen(true)}
          >
            <Calculator className="h-4 w-4" />
            {t('runMonthlyCycle')}
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2 rounded-full px-8 shadow-xl shadow-emerald-100 h-10 text-[10px] uppercase font-black transition-all active:scale-95" asChild>
            <Link href="/contracts/new">
              <Plus className="h-4 w-4" /> {t('addContract')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title={t('activeContracts')} value={stats.active} icon={ShieldCheck} colorClass="bg-blue-600" />
        <KPICard title={t('monthlyRevenue')} value={`৳${stats.revenue.toLocaleString()}`} icon={TrendingUp} colorClass="bg-green-600" />
        <KPICard title={t('dueAmount')} value={`৳${stats.due.toLocaleString()}`} icon={AlertCircle} colorClass="bg-red-600" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border p-1 rounded-xl shadow-sm mb-6 flex h-11 ring-1 ring-slate-100">
          <TabsTrigger value="contracts" className="rounded-lg gap-2 flex-1 text-[10px] font-black uppercase h-9 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">
            <ShieldCheck className="h-3.5 w-3.5" /> {t('agreements')}
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg gap-2 flex-1 text-[10px] font-black uppercase h-9 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <Receipt className="h-3.5 w-3.5" /> {t('billingCycle')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          {isContractsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
          ) : contracts && contracts.length > 0 ? (
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow>
                      <TableHead className="h-12 text-[10px] uppercase font-black pl-6">ID</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">{t('service')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">{t('customer')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">{t('fee')}</TableHead>
                      <TableHead className="h-12 text-right pr-6"></TableHead>
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
                              <DropdownMenuItem className="text-red-600 text-xs font-bold" onClick={() => { setSelectedRecord(c); setIsDeleteAlertOpen(true); }}>
                                <Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <div className="p-24 bg-white rounded-[3rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
              <ShieldCheck className="h-12 w-12 text-emerald-200 mb-6" />
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]">{t('allHealthy')}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          {isInvoicesLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
          ) : invoices && invoices.length > 0 ? (
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow>
                      <TableHead className="h-12 text-[10px] uppercase font-black pl-6">{t('date')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">Billing Month</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">{t('customer')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black text-right">{t('amount')}</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-center">{t('status')}</TableHead>
                      <TableHead className="text-right h-12 pr-6"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id} className="h-16 hover:bg-muted/5 transition-colors group">
                        <TableCell className="pl-6 text-[10px] font-bold text-slate-500 uppercase">{inv.createdAt?.toDate ? new Date(inv.createdAt?.toDate()).toLocaleDateString() : '---'}</TableCell>
                        <TableCell className="font-black text-xs uppercase text-blue-600">{inv.billingMonth}</TableCell>
                        <TableCell className="text-xs font-bold text-slate-700">{inv.customerName}</TableCell>
                        <TableCell className="text-right font-black text-xs">৳{inv.amount?.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={cn(
                            "text-[8px] h-5 uppercase border-none px-2 font-black",
                            inv.status === 'paid' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                          )}>
                            {inv.status?.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                           <div className="flex justify-end gap-1">
                             <Button 
                              variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50"
                              onClick={() => router.push(`/contracts/invoices/${inv.id}/view`)}
                             >
                               <Eye className="h-4 w-4" />
                             </Button>
                             {inv.status !== 'paid' && (
                               <Button 
                                onClick={() => handlePayInvoice(inv)}
                                className="h-7 px-3 rounded-full bg-green-600 hover:bg-green-700 text-white font-black text-[9px] uppercase gap-1.5 shadow-lg shadow-green-100"
                               >
                                 <Check className="h-3 w-3" /> {t('payNow')}
                               </Button>
                             )}
                             <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                                <DropdownMenuItem className="text-xs font-bold" onClick={() => router.push(`/contracts/invoices/${inv.id}/view`)}><Eye className="mr-2 h-3.5 w-3.5" /> {t('view')}</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold" onClick={() => router.push(`/contracts/invoices/${inv.id}/edit`)}><Edit className="mr-2 h-3.5 w-3.5" /> {t('edit')}</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold" onClick={() => router.push(`/contracts/invoices/${inv.id}/view`)}><Printer className="mr-2 h-3.5 w-3.5" /> {t('print')}</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-xs font-bold text-red-600" onClick={() => { setSelectedRecord(inv); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                           </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <div className="p-24 bg-white rounded-[3rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
              <Receipt className="h-12 w-12 text-blue-200 mb-6" />
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]">No billing records generated yet.</p>
              <Button 
                variant="outline" 
                className="mt-6 rounded-full text-[10px] font-black uppercase tracking-widest px-8"
                onClick={() => setIsManualGenOpen(true)}
              >
                Run Monthly Billing Cycle
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* MANUAL BILL GENERATOR MODAL */}
      <Dialog open={isManualGenOpen} onOpenChange={setIsManualGenOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-[2rem] bg-slate-50">
          <DialogHeader className="p-6 bg-emerald-600 text-white flex-row items-center gap-4 space-y-0">
             <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                <Calculator className="h-6 w-6" />
             </div>
             <div>
               <DialogTitle className="text-lg font-black uppercase tracking-tight">Billing Terminal</DialogTitle>
               <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mt-0.5">SLA Invoice Provisioning</p>
             </div>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Target Month</Label>
                <Select value={genMonth} onValueChange={setGenMonth}>
                  <SelectTrigger className="h-12 rounded-xl bg-white border-none ring-1 ring-slate-200 font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                      <SelectItem key={m} value={String(i + 1)} className="text-xs font-bold">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Target Year</Label>
                <Select value={genYear} onValueChange={setGenYear}>
                  <SelectTrigger className="h-12 rounded-xl bg-white border-none ring-1 ring-slate-200 font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {["2024", "2025", "2026", "2027"].map(y => (
                      <SelectItem key={y} value={y} className="text-xs font-bold">{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl ring-1 ring-slate-100 flex gap-4">
               <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
               <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">
                 This process will skip existing invoices and only generate new bills for active SLA contracts.
               </p>
            </div>

            <Button 
              className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 transition-all active:scale-95 gap-2"
              onClick={handleRunManualCycle}
              disabled={isRunningCycle}
            >
              {isRunningCycle ? <Loader2 className="animate-spin h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
              Generate Bills Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tight text-slate-900">{t('delete')}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">{t('errorSub')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest" onClick={handleDelete}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
