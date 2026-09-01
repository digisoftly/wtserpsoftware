
"use client"

import * as React from "react"
import { 
  Plus, 
  ShieldCheck, 
  Loader2, 
  MoreVertical, 
  AlertCircle, 
  TrendingUp, 
  Eye, 
  Trash2, 
  Edit, 
  Receipt, 
  Check, 
  Calculator, 
  PlayCircle, 
  Printer, 
  Download, 
  MapPin, 
  Search,
  Handshake,
  Calendar,
  Clock,
  LayoutDashboard,
  Zap,
  BarChart3,
  Filter
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, serverTimestamp, updateDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { runBillingCycle } from "@/lib/billing-service"

export default function ServiceContractsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t, formatCurrency, formatDate } = useTranslation();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [isRunningCycle, setIsRunningCycle] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Billing Generator State
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

  // Status Logic Helper
  const getContractStatus = (contract: any) => {
    const now = new Date();
    const start = new Date(contract.startDate);
    const end = new Date(contract.endDate);
    
    if (contract.status === 'cancelled' || contract.status === 'suspended') return contract.status;
    if (now < start) return 'upcoming';
    if (now > end) return 'expired';
    
    // Renewal Notice Check
    const noticeDays = Number(contract.renewalNoticeDays || 30);
    const noticeDate = new Date(end);
    noticeDate.setDate(noticeDate.getDate() - noticeDays);
    
    if (now >= noticeDate && now <= end) return 'expiringSoon';
    
    return 'active';
  };

  // Stats Calculations
  const stats = React.useMemo(() => {
    if (!contracts) return { active: 0, mrr: 0, due: 0, expiring: 0, total: 0 };
    
    const activeContracts = contracts.filter(c => getContractStatus(c) === 'active' || getContractStatus(c) === 'expiringSoon');
    const expiringSoon = contracts.filter(c => getContractStatus(c) === 'expiringSoon');
    const totalDue = invoices?.filter(i => i.status !== 'paid').reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0;

    return {
      total: contracts.length,
      active: activeContracts.length,
      expiring: expiringSoon.length,
      mrr: activeContracts.reduce((s, c) => s + (Number(c.monthlyAmount) || 0), 0),
      due: totalDue
    };
  }, [contracts, invoices]);

  const filteredContracts = contracts?.filter(c => 
    c.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRunManualCycle = async () => {
    if (!db || !companyId || !branchId) return;
    setIsRunningCycle(true);
    try {
      const result = await runBillingCycle(db, companyId, branchId, Number(genYear), Number(genMonth));
      if (result.success) {
        toast({ title: "Cycle Complete", description: result.message });
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

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-indigo-600 uppercase tracking-tight flex items-center gap-3">
            <Handshake className="h-7 w-7" /> {t('contracts')}
          </h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">SLA Lifecycle & Recurring Revenue Matrix</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 rounded-full h-10 px-8 text-[11px] uppercase font-black shadow-xl shadow-indigo-100 transition-all active:scale-95" asChild>
          <Link href="/contracts/new">
            <Plus className="h-4 w-4" /> {t('addContract')}
          </Link>
        </Button>
      </div>

      {/* KPI SECTION */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <KPICard title="activeServiceContracts" value={stats.active} icon={ShieldCheck} colorClass="bg-blue-600" />
        <KPICard title="monthlyRecurringRevenue" value={formatCurrency(stats.mrr)} icon={TrendingUp} colorClass="bg-emerald-600" />
        <KPICard title="expiringSoon" value={stats.expiring} icon={Clock} colorClass="bg-orange-600" />
        <KPICard title="salesDue" value={formatCurrency(stats.due)} icon={AlertCircle} colorClass="bg-rose-600" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border p-1 rounded-2xl shadow-sm mb-6 flex h-14 ring-1 ring-slate-100 overflow-x-auto no-scrollbar">
          <TabsTrigger value="dashboard" className="rounded-xl gap-2 flex-1 text-[10px] font-black uppercase h-full data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">
            <LayoutDashboard className="h-4 w-4" /> {t('dashboard')}
          </TabsTrigger>
          <TabsTrigger value="contracts" className="rounded-xl gap-2 flex-1 text-[10px] font-black uppercase h-full data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <ShieldCheck className="h-4 w-4" /> {t('all')} {t('contracts')}
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-xl gap-2 flex-1 text-[10px] font-black uppercase h-full data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">
            <Receipt className="h-4 w-4" /> {t('billingMonth')} Port
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 p-8 space-y-6">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-indigo-600" /> Contract Valuation Analytics
                 </h3>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-6 rounded-3xl space-y-1">
                       <p className="text-[9px] font-black text-slate-400 uppercase">Total Contract Value</p>
                       <p className="text-xl font-black text-slate-900">{formatCurrency(stats.mrr * 12)}</p>
                    </div>
                    <div className="bg-indigo-50 p-6 rounded-3xl space-y-1">
                       <p className="text-[9px] font-black text-indigo-400 uppercase">Active MRR</p>
                       <p className="text-xl font-black text-indigo-600">{formatCurrency(stats.mrr)}</p>
                    </div>
                 </div>
              </Card>

              <Card className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 p-8 space-y-6">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-600" /> Action Required (Expiring)
                 </h3>
                 <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {contracts?.filter(c => getContractStatus(c) === 'expiringSoon').map(c => (
                      <div key={c.id} className="flex items-center justify-between p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                         <div className="flex flex-col">
                            <span className="text-[11px] font-black uppercase text-slate-900 truncate max-w-[150px]">{c.customerName}</span>
                            <span className="text-[9px] font-bold text-orange-600">Ends: {formatDate(c.endDate)}</span>
                         </div>
                         <Button size="sm" variant="outline" className="h-7 text-[8px] font-black uppercase rounded-full border-orange-200 text-orange-700 bg-white" onClick={() => router.push(`/contracts/${c.id}`)}>Review Renewal</Button>
                      </div>
                    ))}
                    {stats.expiring === 0 && (
                      <div className="py-10 text-center opacity-30 italic text-[10px] font-black uppercase">No immediate expirations detected</div>
                    )}
                 </div>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <div className="bg-white p-3 rounded-2xl border ring-1 ring-slate-100 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input 
                placeholder="Search by contract #, client or project name..." 
                className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs font-bold transition-all outline-none focus:ring-2 focus:ring-indigo-600" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl text-slate-400"><Filter className="h-4 w-4" /></Button>
          </div>

          {isContractsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
          ) : (
            <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
              <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="h-12 text-[10px] uppercase font-black pl-8">{t('contractNo')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">{t('customer')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">{t('project')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black text-center">{t('endDate')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black text-right">{t('contractValue')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black text-center">{t('status')}</TableHead>
                      <TableHead className="text-right h-12 pr-8 sticky right-0 bg-white/95 backdrop-blur-sm z-20 w-[120px]">{t('actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts?.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="h-64 text-center opacity-30 italic text-xs uppercase font-bold tracking-widest">{t('noData')}</TableCell></TableRow>
                    ) : (
                      filteredContracts?.map((c, idx) => {
                        const currentStatus = getContractStatus(c);
                        return (
                          <TableRow 
                            key={c.id} 
                            className={cn(
                              "h-20 transition-all border-b border-white/50 cursor-pointer active:bg-slate-100 group",
                              idx % 2 === 0 ? "bg-[#EAF6FF]/30" : "bg-white"
                            )}
                            onClick={() => router.push(`/contracts/${c.id}`)}
                          >
                            <TableCell className="pl-8">
                               <span className="font-mono text-[10px] font-black text-indigo-600 uppercase tracking-tighter bg-indigo-50 px-2 py-1 rounded">
                                 {c.contractNumber}
                               </span>
                            </TableCell>
                            <TableCell>
                               <div className="flex flex-col max-w-[150px]">
                                 <span className="font-black text-xs uppercase text-slate-900 truncate tracking-tight">{c.customerName}</span>
                                 <span className="text-[9px] font-bold text-slate-400 uppercase truncate mt-0.5">{c.agreementNo}</span>
                               </div>
                            </TableCell>
                            <TableCell>
                               <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 shrink-0"><MapPin className="h-3.5 w-3.5" /></div>
                                  <span className="text-[10px] font-black uppercase text-slate-600 truncate max-w-[120px]">{c.projectName || 'General Service'}</span>
                               </div>
                            </TableCell>
                            <TableCell className="text-center font-bold text-[10px] text-slate-500">{formatDate(c.endDate)}</TableCell>
                            <TableCell className="text-right">
                               <div className="flex flex-col">
                                  <span className="font-black text-xs text-slate-900">{formatCurrency(c.monthlyAmount)}</span>
                                  <span className="text-[8px] font-black uppercase text-slate-400">Monthly Billing</span>
                               </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge className={cn("text-[8px] h-5 uppercase border-none px-2 font-black shadow-sm", 
                                currentStatus === 'active' ? "bg-green-600 text-white" : 
                                currentStatus === 'expiringSoon' ? "bg-orange-500 text-white" : 
                                currentStatus === 'expired' ? "bg-red-600 text-white" : "bg-slate-200 text-slate-700")}>
                                {t(currentStatus as any)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-8 sticky right-0 bg-white/90 backdrop-blur-sm group-hover:bg-slate-50/90 transition-colors z-20">
                               <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => router.push(`/contracts/${c.id}`)}><Eye className="h-4 w-4" /></Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl p-2 border-slate-100">
                                      <DropdownMenuItem className="h-10 rounded-xl text-xs font-bold" onClick={() => router.push(`/contracts/${c.id}/edit`)}><Edit className="mr-2 h-4 w-4" /> Modify Agreement</DropdownMenuItem>
                                      <DropdownMenuItem className="h-10 rounded-xl text-xs font-bold"><Printer className="mr-2 h-4 w-4" /> Print PDF</DropdownMenuItem>
                                      <DropdownMenuSeparator className="my-1 bg-slate-50" />
                                      <DropdownMenuItem className="h-10 rounded-xl text-red-600 text-xs font-bold focus:bg-red-50 focus:text-red-700" onClick={() => { setSelectedRecord(c); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Terminate Contract</DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                               </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-indigo-50/30 ring-1 ring-indigo-100 overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between p-6 gap-6">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Calculator className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-indigo-900">SLA Billing Engine</h3>
                    <p className="text-[10px] font-bold text-indigo-600 uppercase opacity-60">Automated Monthly Invoice Generation</p>
                  </div>
               </div>

               <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-indigo-100 shadow-inner">
                  <div className="flex flex-col px-3">
                    <Label className="text-[8px] font-black uppercase text-slate-400 mb-0.5">Target Month</Label>
                    <Select value={genMonth} onValueChange={setGenMonth}>
                      <SelectTrigger className="h-8 w-32 border-none bg-transparent font-black text-xs p-0 focus:ring-0 shadow-none"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl shadow-2xl">
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                          <SelectItem key={m} value={String(i + 1)} className="text-xs font-bold">{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-px h-8 bg-slate-100" />
                  <div className="flex flex-col px-3">
                    <Label className="text-[8px] font-black uppercase text-slate-400 mb-0.5">Target Year</Label>
                    <Select value={genYear} onValueChange={setGenYear}>
                      <SelectTrigger className="h-8 w-24 border-none bg-transparent font-black text-xs p-0 focus:ring-0 shadow-none"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl shadow-2xl">
                        {["2024", "2025", "2026", "2027"].map(y => <SelectItem key={y} value={y} className="text-xs font-bold">{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleRunManualCycle} 
                    disabled={isRunningCycle}
                    className="bg-indigo-600 hover:bg-indigo-700 h-10 rounded-xl px-8 gap-2 text-[10px] font-black uppercase shadow-xl shadow-indigo-100 ml-4 transition-all active:scale-95"
                  >
                    {isRunningCycle ? <Loader2 className="animate-spin h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                    Execute Generation
                  </Button>
               </div>
            </div>
          </Card>

          {isInvoicesLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
          ) : (
            <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
               <div className="overflow-x-auto custom-scrollbar">
                  <Table>
                    <TableHeader className="bg-slate-50 border-b">
                      <TableRow>
                        <TableHead className="h-12 text-[10px] font-black uppercase pl-8">Period</TableHead>
                        <TableHead className="h-12 text-[10px] font-black uppercase">Client Entity</TableHead>
                        <TableHead className="h-12 text-[10px] font-black uppercase text-right">Amount Due</TableHead>
                        <TableHead className="h-12 text-[10px] font-black uppercase text-center">Status</TableHead>
                        <TableHead className="text-right h-12 pr-8 sticky right-0 bg-slate-50 w-24">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices?.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="h-64 text-center opacity-30 italic text-xs font-bold uppercase tracking-widest">No invoices detected for this period</TableCell></TableRow>
                      ) : (
                        invoices?.map((inv) => (
                          <TableRow key={inv.id} className="h-16 hover:bg-slate-50 transition-colors border-slate-50">
                            <TableCell className="pl-8">
                               <span className="font-black text-[11px] uppercase text-indigo-600">{inv.billingMonth}</span>
                            </TableCell>
                            <TableCell className="text-xs font-black text-slate-900 uppercase">{inv.customerName}</TableCell>
                            <TableCell className="text-right font-black text-xs text-slate-900">{formatCurrency(inv.amount)}</TableCell>
                            <TableCell className="text-center">
                               <Badge variant="outline" className={cn("text-[8px] h-4 uppercase border-none px-2 font-black", inv.status === 'paid' ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700")}>{inv.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right pr-8">
                               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => router.push(`/contracts/invoices/${inv.id}/view`)}><Eye className="h-4 w-4" /></Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
               </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* DELETE DIALOG */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase text-slate-900 tracking-tight">Revoke Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">This action is permanent and will remove the record from the ledger history.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-11 rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 h-11 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-red-100" onClick={handleDelete}>Confirm Reversal</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
