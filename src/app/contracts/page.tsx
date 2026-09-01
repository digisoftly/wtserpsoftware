
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
  Search,
  Handshake,
  Calendar,
  Clock,
  LayoutDashboard,
  Zap,
  BarChart3,
  Filter,
  ArrowRight
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useTranslation } from "@/hooks/use-translation"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { runBillingCycle } from "@/lib/billing-service"

export default function ServiceContractsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t, formatCurrency, formatDate } = useTranslation();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = React.useState("contracts");
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
    return query(collection(db, "companies", companyId, "branches", branchId, "service_contracts"));
  }, [db, companyId, branchId]);
  const { data: rawContracts, isLoading: isContractsLoading } = useCollection(contractsQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "contract_invoices"));
  }, [db, companyId, branchId]);
  const { data: invoices } = useCollection(invoicesQuery);

  // Sorting in memory to prevent index error
  const contracts = React.useMemo(() => {
    if (!rawContracts) return [];
    return [...rawContracts].sort((a, b) => {
      const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return timeB - timeA;
    });
  }, [rawContracts]);

  const getContractStatus = (contract: any) => {
    const now = new Date();
    const start = new Date(contract.startDate);
    const end = new Date(contract.endDate);
    if (contract.status === 'cancelled' || contract.status === 'suspended') return contract.status;
    if (now < start) return 'upcoming';
    if (now > end) return 'expired';
    const noticeDays = Number(contract.renewalNoticeDays || 30);
    const noticeDate = new Date(end);
    noticeDate.setDate(noticeDate.getDate() - noticeDays);
    if (now >= noticeDate && now <= end) return 'expiringSoon';
    return 'active';
  };

  const stats = React.useMemo(() => {
    if (!contracts) return { active: 0, mrr: 0, due: 0, expiring: 0 };
    const activeContracts = contracts.filter(c => ['active', 'expiringSoon'].includes(getContractStatus(c)));
    const totalDue = invoices?.filter(i => i.status !== 'paid').reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0;
    return {
      active: activeContracts.length,
      expiring: contracts.filter(c => getContractStatus(c) === 'expiringSoon').length,
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
    <div className="max-w-full mx-auto space-y-4 md:space-y-6 pb-20 px-2 md:px-0">
      {/* COMPACT STATIC HEADER */}
      <div className="bg-white border p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <Handshake className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black font-headline text-slate-900 uppercase tracking-tight">{t('contracts')}</h1>
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">SLA Management System</p>
          </div>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 h-11 px-8 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95" asChild>
          <Link href="/contracts/new"><Plus className="h-4 w-4 mr-2" /> {t('addContract')}</Link>
        </Button>
      </div>

      {/* STATIC STATS BAR - NO ROUNDED BLOCKS */}
      <div className="bg-white border divide-y md:divide-y-0 md:divide-x grid grid-cols-2 md:grid-cols-4 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 md:p-6 text-center space-y-1">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Active SLAs</p>
          <p className="text-xl font-black text-slate-900">{stats.active}</p>
        </div>
        <div className="p-4 md:p-6 text-center space-y-1">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Monthly MRR</p>
          <p className="text-xl font-black text-indigo-600">{formatCurrency(stats.mrr)}</p>
        </div>
        <div className="p-4 md:p-6 text-center space-y-1">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Expiring Soon</p>
          <p className="text-xl font-black text-orange-600">{stats.expiring}</p>
        </div>
        <div className="p-4 md:p-6 text-center space-y-1">
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total Outstanding</p>
          <p className="text-xl font-black text-red-600">{formatCurrency(stats.due)}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border p-1 rounded-xl shadow-sm mb-6 flex h-12 overflow-x-auto no-scrollbar ring-1 ring-slate-100">
          <TabsTrigger value="contracts" className="rounded-lg gap-2 flex-1 text-[10px] font-black uppercase h-full data-[state=active]:bg-slate-900 data-[state=active]:text-white">
            <ShieldCheck className="h-3.5 w-3.5" /> All Agreements
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg gap-2 flex-1 text-[10px] font-black uppercase h-full data-[state=active]:bg-slate-900 data-[state=active]:text-white">
            <Receipt className="h-3.5 w-3.5" /> Billing Terminal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          <div className="bg-white p-2 md:p-3 rounded-xl border flex gap-3 shadow-sm ring-1 ring-slate-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
              <input 
                placeholder="Search by contract #, client or project..." 
                className="pl-9 h-10 w-full rounded-lg bg-slate-50/50 border-none text-xs font-bold transition-all outline-none focus:ring-1 focus:ring-slate-200" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg text-slate-400"><Filter className="h-4 w-4" /></Button>
          </div>

          {isContractsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
          ) : (
            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm ring-1 ring-slate-100">
              <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader className="bg-slate-50/50 border-b">
                    <TableRow>
                      <TableHead className="h-11 text-[9px] uppercase font-black pl-6">Ref No.</TableHead>
                      <TableHead className="h-11 text-[9px] uppercase font-black">Customer Entity</TableHead>
                      <TableHead className="h-11 text-[9px] uppercase font-black hidden md:table-cell">End Date</TableHead>
                      <TableHead className="h-11 text-[9px] uppercase font-black text-right">Value</TableHead>
                      <TableHead className="h-11 text-[9px] uppercase font-black text-center">Status</TableHead>
                      <TableHead className="text-right h-11 pr-6 sticky right-0 bg-white/95 backdrop-blur-sm z-20 w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts?.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="h-64 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest">No data detected</TableCell></TableRow>
                    ) : (
                      filteredContracts?.map((c, idx) => {
                        const status = getContractStatus(c);
                        return (
                          <TableRow 
                            key={c.id} 
                            className={cn(
                              "h-16 transition-all border-b border-slate-50 cursor-pointer active:bg-slate-50 group",
                              idx % 2 === 0 ? "bg-white" : "bg-slate-50/20"
                            )}
                            onClick={() => router.push(`/contracts/${c.id}`)}
                          >
                            <TableCell className="pl-6">
                               <span className="font-mono text-[10px] font-black text-indigo-600">{c.contractNumber}</span>
                            </TableCell>
                            <TableCell>
                               <div className="flex flex-col max-w-[150px] md:max-w-md">
                                 <span className="font-black text-[11px] uppercase text-slate-900 truncate tracking-tight">{c.customerName}</span>
                                 <span className="text-[9px] font-bold text-slate-400 uppercase truncate mt-0.5">{c.projectName || 'General'}</span>
                               </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell font-bold text-[10px] text-slate-500">{formatDate(c.endDate)}</TableCell>
                            <TableCell className="text-right font-black text-[11px] text-slate-900">{formatCurrency(c.monthlyAmount)}</TableCell>
                            <TableCell className="text-center">
                              <Badge className={cn("text-[8px] h-4 uppercase border-none px-2 font-black shadow-sm", 
                                status === 'active' ? "bg-green-600 text-white" : 
                                status === 'expiringSoon' ? "bg-orange-500 text-white" : 
                                status === 'expired' ? "bg-red-600 text-white" : "bg-slate-200 text-slate-700")}>
                                {t(status as any)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6 sticky right-0 bg-transparent" onClick={e => e.stopPropagation()}>
                               <DropdownMenu>
                                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:bg-slate-100"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-2xl p-2">
                                    <DropdownMenuItem className="h-9 rounded-lg text-xs font-bold" onClick={() => router.push(`/contracts/${c.id}`)}><Eye className="mr-2 h-3.5 w-3.5" /> View Matrix</DropdownMenuItem>
                                    <DropdownMenuItem className="h-9 rounded-lg text-xs font-bold" onClick={() => router.push(`/contracts/${c.id}/edit`)}><Edit className="mr-2 h-3.5 w-3.5" /> Modify</DropdownMenuItem>
                                    <DropdownMenuSeparator className="my-1" />
                                    <DropdownMenuItem className="h-9 rounded-lg text-red-600 text-xs font-bold focus:bg-red-50 focus:text-red-700" onClick={() => { setSelectedRecord(c); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-3.5 w-3.5" /> Terminate</DropdownMenuItem>
                                  </DropdownMenuContent>
                               </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="bg-slate-900 p-6 md:p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
             <div className="flex items-center gap-4 text-white">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Receipt className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">SLA Billing Engine</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase">Automated periodic revenue cycle</p>
                </div>
             </div>

             <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 w-full md:w-auto">
                <div className="flex flex-1 items-center gap-2 px-3">
                  <Select value={genMonth} onValueChange={setGenMonth}>
                    <SelectTrigger className="h-9 w-full sm:w-28 border-none bg-transparent text-white font-black text-xs uppercase p-0 focus:ring-0 shadow-none"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl shadow-2xl">
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                        <SelectItem key={m} value={String(i + 1)} className="text-xs font-bold">{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="w-px h-6 bg-white/10 hidden sm:block" />
                  <Select value={genYear} onValueChange={setGenYear}>
                    <SelectTrigger className="h-9 w-full sm:w-20 border-none bg-transparent text-white font-black text-xs p-0 focus:ring-0 shadow-none"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl shadow-2xl">
                      {["2024", "2025", "2026"].map(y => <SelectItem key={y} value={y} className="text-xs font-bold">{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={handleRunManualCycle} 
                  disabled={isRunningCycle}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 h-10 rounded-xl px-6 gap-2 text-[10px] font-black uppercase shadow-lg transition-all active:scale-95"
                >
                  {isRunningCycle ? <Loader2 className="animate-spin h-4 w-4" /> : <Zap className="h-4 w-4" />}
                  Execute Run
                </Button>
             </div>
          </div>

          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm ring-1 ring-slate-100">
             <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="h-11 text-[9px] uppercase font-black pl-6">Billing Cycle</TableHead>
                      <TableHead className="h-11 text-[9px] uppercase font-black">Customer Account</TableHead>
                      <TableHead className="h-11 text-[9px] uppercase font-black text-right">Amount</TableHead>
                      <TableHead className="h-11 text-[9px] uppercase font-black text-center">Status</TableHead>
                      <TableHead className="text-right h-11 pr-6 sticky right-0 bg-white/95 w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="h-64 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest">No statements issued</TableCell></TableRow>
                    ) : (
                      invoices?.map((inv) => (
                        <TableRow key={inv.id} className="h-14 hover:bg-slate-50/50 transition-colors">
                          <TableCell className="pl-6"><span className="font-black text-[10px] uppercase text-indigo-600">{inv.billingMonth}</span></TableCell>
                          <TableCell className="text-[11px] font-bold text-slate-900 uppercase truncate max-w-[200px]">{inv.customerName}</TableCell>
                          <TableCell className="text-right font-black text-[11px] text-slate-900">{formatCurrency(inv.amount)}</TableCell>
                          <TableCell className="text-center">
                             <Badge variant="outline" className={cn("text-[8px] h-4 uppercase border-none px-2 font-black", inv.status === 'paid' ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700")}>{inv.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right pr-6 sticky right-0 bg-transparent">
                             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => router.push(`/contracts/invoices/${inv.id}/view`)}><Eye className="h-3.5 w-3.5" /></Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
             </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* DELETE DIALOG */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2rem] border-none p-8 md:p-10 shadow-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase text-slate-900">Revoke Agreement?</AlertDialogTitle>
            <AlertDialogDescription className="text-[11px] font-bold text-slate-500 leading-relaxed">This action will stop all future billing cycles and permanently archive the record. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2">
            <AlertDialogCancel className="h-11 rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 h-11 rounded-xl font-black uppercase text-[10px] tracking-widest text-white" onClick={handleDelete}>Confirm Terminate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
