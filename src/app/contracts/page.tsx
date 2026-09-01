
"use client"

import * as React from "react"
import { Plus, ShieldCheck, Loader2, MoreVertical, AlertCircle, TrendingUp, Eye, Trash2, Edit, Receipt, Check, Calculator, PlayCircle, Printer, Download, MapPin, Search } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, serverTimestamp, updateDoc } from "firebase/firestore"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { runBillingCycle } from "@/lib/billing-service"

export default function ContractsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t, formatCurrency } = useTranslation();
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
    mrr: contracts?.filter(c => c.status === 'active').reduce((s, c) => s + (Number(c.monthlyAmount) || 0), 0) || 0,
    due: invoices?.filter(i => i.status !== 'paid').reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0
  }), [contracts, invoices]);

  const filteredContracts = contracts?.filter(c => 
    c.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.serviceType?.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-headline text-emerald-600 uppercase tracking-tight">Monthly Services</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">SLA & Recurring Revenue Management</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2 rounded-full h-10 px-8 text-[11px] uppercase font-black shadow-xl shadow-emerald-100 transition-all active:scale-95" asChild>
          <Link href="/contracts/new">
            <Plus className="h-4 w-4" /> {t('addContract')}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Total Active Services" value={stats.active} icon={ShieldCheck} colorClass="bg-blue-600" />
        <KPICard title="Monthly Recurring Revenue" value={formatCurrency(stats.mrr)} icon={TrendingUp} colorClass="bg-emerald-600" />
        <KPICard title="Outstanding Receivable" value={formatCurrency(stats.due)} icon={AlertCircle} colorClass="bg-rose-600" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border p-1 rounded-2xl shadow-sm mb-6 flex h-14 ring-1 ring-slate-100">
          <TabsTrigger value="contracts" className="rounded-xl gap-2 flex-1 text-[10px] font-black uppercase h-full data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">
            <ShieldCheck className="h-4 w-4" /> Service Agreements
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-xl gap-2 flex-1 text-[10px] font-black uppercase h-full data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <Receipt className="h-4 w-4" /> Billing Terminal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          <div className="bg-white p-3 rounded-2xl border ring-1 ring-slate-100 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input 
                placeholder="Search services, clients or agreement IDs..." 
                className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs font-bold transition-all outline-none" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
          </div>

          {isContractsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
          ) : filteredContracts && filteredContracts.length > 0 ? (
            <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50 border-b">
                    <TableRow>
                      <TableHead className="h-12 text-[10px] uppercase font-black pl-8">Service No</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">{t('customer')}</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">Classification</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black text-center">Points</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black text-right">Fee (৳)</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black text-center">Status</TableHead>
                      <TableHead className="text-right h-12 pr-8 sticky right-0 bg-slate-50 w-24">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContracts.map((c) => {
                      const totalPoints = c.groups?.reduce((acc: number, g: any) => acc + (g.points?.length || 0), 0) || 0;
                      return (
                        <TableRow key={c.id} className="h-16 hover:bg-slate-50/50 transition-colors group cursor-pointer border-slate-50" onClick={() => router.push(`/contracts/${c.id}`)}>
                          <TableCell className="pl-8 font-mono text-[10px] font-black text-emerald-600 uppercase tracking-tighter">{c.contractNumber}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-black text-xs uppercase text-slate-900 tracking-tight">{c.customerName}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{c.agreementNo}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[8px] font-black uppercase border-slate-200 text-slate-500 bg-slate-50 px-2 h-5">
                              {c.serviceType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                             <div className="flex items-center justify-center gap-1">
                               <MapPin className="h-3 w-3 text-blue-500" />
                               <span className="text-xs font-black text-slate-700">{totalPoints}</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-right font-black text-xs text-blue-600 tabular-nums">{Number(c.monthlyAmount || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("text-[8px] font-black uppercase px-2 h-4 border-none", 
                              c.status === 'active' ? "bg-green-600 text-white" : "bg-red-50 text-red-700")}>
                              {c.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-emerald-600" onClick={() => router.push(`/contracts/${c.id}`)}><Eye className="h-4 w-4" /></Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl p-2 border-slate-100">
                                  <DropdownMenuItem onClick={() => router.push(`/contracts/${c.id}`)} className="h-10 rounded-lg text-xs font-bold"><Eye className="mr-2 h-4 w-4" /> {t('view')}</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => router.push(`/contracts/${c.id}/edit`)} className="h-10 rounded-lg text-xs font-bold"><Edit className="mr-2 h-4 w-4" /> Modify SLA</DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-slate-50 my-1" />
                                  <DropdownMenuItem className="h-10 rounded-lg text-red-600 text-xs font-bold" onClick={() => { setSelectedRecord(c); setIsDeleteAlertOpen(true); }}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Terminate Service
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <div className="p-24 bg-white rounded-[3rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
              <ShieldCheck className="h-12 w-12 text-emerald-200 mb-4" />
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">No service agreements found</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-blue-50/30 ring-1 ring-blue-100 overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between p-6 gap-6">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                    <Calculator className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-blue-900">Billing Generation Terminal</h3>
                    <p className="text-[10px] font-bold text-blue-600 uppercase opacity-60">Generate Monthly Service Invoices</p>
                  </div>
               </div>

               <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-blue-100 shadow-inner">
                  <div className="flex flex-col px-3">
                    <Label className="text-[8px] font-black uppercase text-slate-400 mb-0.5">Billing Month</Label>
                    <Select value={genMonth} onValueChange={setGenMonth}>
                      <SelectTrigger className="h-8 w-32 border-none bg-transparent font-bold text-xs p-0 focus:ring-0 shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                          <SelectItem key={m} value={String(i + 1)} className="text-xs font-bold">{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-px h-8 bg-slate-100" />
                  <div className="flex flex-col px-3">
                    <Label className="text-[8px] font-black uppercase text-slate-400 mb-0.5">Billing Year</Label>
                    <Select value={genYear} onValueChange={setGenYear}>
                      <SelectTrigger className="h-8 w-24 border-none bg-transparent font-bold text-xs p-0 focus:ring-0 shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {["2024", "2025", "2026", "2027"].map(y => (
                          <SelectItem key={y} value={y} className="text-xs font-bold">{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleRunManualCycle} 
                    disabled={isRunningCycle}
                    className="bg-blue-600 hover:bg-blue-700 h-10 rounded-xl px-8 gap-2 text-[10px] font-black uppercase shadow-xl shadow-blue-100 ml-4 transition-all active:scale-95"
                  >
                    {isRunningCycle ? <Loader2 className="animate-spin h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                    Generate Statements
                  </Button>
               </div>
            </div>
          </Card>

          {isInvoicesLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
          ) : (
            <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
              <div className="overflow-x-auto custom-scrollbar">
                <Table>
                  <TableHeader className="bg-slate-50 border-b">
                    <TableRow>
                      <TableHead className="h-12 text-[10px] font-black uppercase pl-8">Billing Period</TableHead>
                      <TableHead className="h-12 text-[10px] font-black uppercase">Client Entity</TableHead>
                      <TableHead className="h-12 text-[10px] font-black uppercase text-right">Amount Due (৳)</TableHead>
                      <TableHead className="h-12 text-[10px] font-black uppercase text-center">Status</TableHead>
                      <TableHead className="text-right h-12 pr-8 sticky right-0 bg-slate-50 w-24">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="h-64 text-center opacity-30 italic text-xs font-bold uppercase tracking-widest">No statements generated for selected period</TableCell></TableRow>
                    ) : (
                      invoices?.map((inv) => (
                        <TableRow key={inv.id} className="h-16 hover:bg-slate-50/50 transition-colors group border-slate-50">
                          <TableCell className="pl-8">
                             <div className="flex flex-col">
                               <span className="font-black text-[11px] uppercase text-blue-600 tracking-tight">{inv.billingMonth}</span>
                               <span className="text-[9px] font-bold text-slate-400 uppercase">{inv.contractNumber}</span>
                             </div>
                          </TableCell>
                          <TableCell className="text-xs font-black text-slate-900 uppercase tracking-tight">{inv.customerName}</TableCell>
                          <TableCell className="text-right font-black text-xs tabular-nums">৳{inv.amount?.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={cn(
                              "text-[8px] h-4 uppercase border-none px-2 font-black",
                              inv.status === 'paid' ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"
                            )}>
                              {inv.status || 'UNPAID'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8 sticky right-0 bg-white group-hover:bg-slate-50 transition-colors">
                             <div className="flex justify-end gap-1">
                               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-blue-600" onClick={() => router.push(`/contracts/invoices/${inv.id}/view`)}><Eye className="h-4 w-4" /></Button>
                               <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl p-2 border-slate-100">
                                  <DropdownMenuItem onClick={() => router.push(`/contracts/invoices/${inv.id}/view`)} className="h-10 rounded-xl text-xs font-bold py-1.5"><Eye className="mr-2 h-4 w-4" /> View Statement</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => router.push(`/contracts/invoices/${inv.id}/view?print=true`)} className="h-10 rounded-xl text-xs font-bold py-1.5"><Printer className="mr-2 h-4 w-4" /> Print PDF</DropdownMenuItem>
                                  <DropdownMenuSeparator className="my-1 bg-slate-50" />
                                  <DropdownMenuItem className="h-10 rounded-xl text-red-600 text-xs font-bold py-1.5 focus:bg-red-50 focus:text-red-700" onClick={() => { setSelectedRecord(inv); setIsDeleteAlertOpen(true); }}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Cancel Invoice
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                             </div>
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

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase text-slate-900 tracking-tight">Revoke Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">This action is permanent and will remove the record from the ledger history.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-11 rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 h-11 rounded-xl font-black uppercase text-[10px] tracking-widest" onClick={handleDelete}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
