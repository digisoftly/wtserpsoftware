"use client"

import * as React from "react"
import { 
  Plus, 
  ShieldCheck, 
  Loader2, 
  MoreVertical, 
  Eye, 
  Trash2, 
  Edit, 
  Receipt, 
  Search,
  Handshake,
  Calendar,
  Clock,
  Zap,
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
import { KPICard } from "@/components/dashboard/kpi-card"

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

  const [genMonth, setGenMonth] = React.useState(String(new Date().getMonth() + 1));
  const [genYear, setGenYear] = React.useState(String(new Date().getFullYear()));

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
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-indigo-600 uppercase tracking-tight">{t('contracts')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Lifecycle Registry</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 h-10 px-6 rounded-full font-black text-[10px] uppercase shadow-xl transition-all active:scale-95 gap-2" asChild>
          <Link href="/contracts/new"><Plus className="h-4 w-4" /> {t('add')}</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Active" value={stats.active} icon={ShieldCheck} colorClass="bg-blue-600" />
        <KPICard title="MRR" value={formatCurrency(stats.mrr)} icon={Zap} colorClass="bg-indigo-600" />
        <KPICard title="Expiring" value={stats.expiring} icon={Clock} colorClass="bg-orange-600" />
        <KPICard title="Due" value={formatCurrency(stats.due)} icon={Receipt} colorClass="bg-red-600" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border p-1 rounded-2xl shadow-sm mb-6 flex h-14 ring-1 ring-slate-100">
          <TabsTrigger value="contracts" className="rounded-xl gap-2 flex-1 text-[10px] font-black uppercase h-full data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">
            <ShieldCheck className="h-3.5 w-3.5" /> All Contracts
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-xl gap-2 flex-1 text-[10px] font-black uppercase h-full data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">
            <Receipt className="h-3.5 w-3.5" /> Billing Cycle
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          <div className="bg-white p-3 rounded-2xl border flex gap-3 shadow-sm ring-1 ring-slate-100">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input 
                placeholder="Search contracts..." 
                className="pl-10 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs font-bold outline-none" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          {isContractsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
          ) : (
            <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="h-12 text-[10px] uppercase font-black pl-8">Ref No.</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">Customer</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black text-right">Monthly Fee</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black text-center">Status</TableHead>
                      <TableHead className="text-right h-12 pr-8 sticky right-0 bg-white/95 w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts?.map((c) => {
                      const status = getContractStatus(c);
                      return (
                        <TableRow 
                          key={c.id} 
                          className="h-16 border-b border-slate-50 cursor-pointer hover:bg-slate-50/50"
                          onClick={() => router.push(`/contracts/${c.id}`)}
                        >
                          <TableCell className="pl-8"><span className="font-mono text-[10px] font-black text-indigo-600">{c.contractNumber}</span></TableCell>
                          <TableCell>
                             <div className="flex flex-col">
                               <span className="font-black text-[11px] uppercase text-slate-900 truncate max-w-[200px]">{c.customerName}</span>
                               <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 truncate">{c.projectName || 'General'}</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-right font-black text-xs text-slate-900">{formatCurrency(c.monthlyAmount)}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("text-[8px] h-4 uppercase border-none px-2 font-black", 
                              status === 'active' ? "bg-green-600 text-white" : 
                              status === 'expiringSoon' ? "bg-orange-500 text-white" : "bg-slate-200 text-slate-700")}>
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8" onClick={e => e.stopPropagation()}>
                             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => router.push(`/contracts/${c.id}`)}><Eye className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
             <div className="flex items-center gap-4 text-white">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Receipt className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest">Billing Engine</h3>
                  <p className="text-[10px] font-bold text-white/40 uppercase">Automated periodic revenue cycle</p>
                </div>
             </div>

             <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10 w-full md:w-auto">
                <Select value={genMonth} onValueChange={setGenMonth}>
                  <SelectTrigger className="h-10 w-28 border-none bg-transparent text-white font-black text-xs uppercase"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                      <SelectItem key={m} value={String(i + 1)} className="text-xs font-bold">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleRunManualCycle} 
                  disabled={isRunningCycle}
                  className="bg-emerald-600 hover:bg-emerald-700 h-10 rounded-xl px-6 gap-2 text-[10px] font-black uppercase"
                >
                  {isRunningCycle ? <Loader2 className="animate-spin h-4 w-4" /> : <Zap className="h-4 w-4" />}
                  Generate
                </Button>
             </div>
          </div>

          <div className="bg-white border rounded-[2rem] overflow-hidden shadow-sm ring-1 ring-slate-100">
             <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="h-12 text-[10px] font-black uppercase pl-8">Cycle</TableHead>
                      <TableHead className="h-12 text-[10px] font-black uppercase">Customer</TableHead>
                      <TableHead className="h-12 text-[10px] font-black uppercase text-right">Amount</TableHead>
                      <TableHead className="h-12 text-[10px] font-black uppercase text-center">Status</TableHead>
                      <TableHead className="text-right h-12 pr-8"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices?.map((inv) => (
                      <TableRow key={inv.id} className="h-14 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="pl-8"><span className="font-black text-[10px] uppercase text-indigo-600">{inv.billingMonth}</span></TableCell>
                        <TableCell className="text-[11px] font-bold text-slate-900 uppercase">{inv.customerName}</TableCell>
                        <TableCell className="text-right font-black text-xs text-slate-900">{formatCurrency(inv.amount)}</TableCell>
                        <TableCell className="text-center">
                           <Badge variant="outline" className={cn("text-[8px] h-4 uppercase border-none px-2 font-black", inv.status === 'paid' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>{inv.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => router.push(`/contracts/invoices/${inv.id}/view`)}><Eye className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </div>
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase text-slate-900">Delete?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-bold text-slate-500">Record will be permanently archived.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2">
            <AlertDialogCancel className="h-11 rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 h-11 rounded-xl font-black uppercase text-[10px] text-white" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
