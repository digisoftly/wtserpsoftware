"use client"

import * as React from "react"
import { Plus, ShieldCheck, Loader2, MoreVertical, AlertCircle, TrendingUp, Eye, Trash2, Edit, Receipt, Check, Calculator, PlayCircle, Printer } from "lucide-react"
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
  const { t } = useTranslation();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = React.useState("contracts");
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [isRunningCycle, setIsRunningCycle] = React.useState(false);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-slate-900">{t('contracts')}</h1>
        <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2 rounded-lg h-9 px-6 text-[11px] uppercase font-black transition-all active:scale-95" asChild>
          <Link href="/contracts/new">
            <Plus className="h-4 w-4" /> {t('addContract')}
          </Link>
        </Button>
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
            <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white ring-1 ring-slate-100">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50 border-b">
                    <TableRow>
                      <TableHead className="h-10 text-[10px] uppercase font-black pl-6">ID</TableHead>
                      <TableHead className="h-10 text-[10px] uppercase font-black">{t('service')}</TableHead>
                      <TableHead className="h-10 text-[10px] uppercase font-black">{t('customer')}</TableHead>
                      <TableHead className="h-10 text-[10px] uppercase font-black">{t('fee')}</TableHead>
                      <TableHead className="text-right h-10 pr-6 sticky right-0 bg-slate-50 w-24">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contracts.map((c) => (
                      <TableRow key={c.id} className="h-14 hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => router.push(`/contracts/${c.id}`)}>
                        <TableCell className="pl-6 font-mono text-[10px] font-black text-emerald-600 uppercase">{c.contractNumber}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-xs uppercase text-slate-900">{c.serviceName}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{c.serviceType}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-600">{c.customerName}</TableCell>
                        <TableCell className="font-black text-xs text-slate-900">৳{Number(c.monthlyAmount || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-emerald-600" onClick={() => router.push(`/contracts/${c.id}`)}><Eye className="h-4 w-4" /></Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
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
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          ) : (
            <div className="p-24 bg-white rounded-3xl border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
              <ShieldCheck className="h-12 w-12 text-emerald-200 mb-4" />
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{t('allHealthy')}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          {/* STATIC BILL GENERATOR TERMINAL */}
          <Card className="border-none shadow-sm rounded-xl bg-indigo-50/30 ring-1 ring-indigo-100 overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between p-4 gap-6">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-indigo-900">Billing Terminal</h3>
                    <p className="text-[9px] font-bold text-indigo-600 uppercase opacity-60">Generate SLA Monthly Invoices</p>
                  </div>
               </div>

               <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-indigo-100 shadow-inner">
                  <div className="flex flex-col px-2">
                    <Label className="text-[8px] font-black uppercase text-slate-400 mb-0.5">Month</Label>
                    <Select value={genMonth} onValueChange={setGenMonth}>
                      <SelectTrigger className="h-8 w-28 border-none bg-transparent font-bold text-xs p-0 focus:ring-0 shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                          <SelectItem key={m} value={String(i + 1)} className="text-xs font-bold">{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-px h-6 bg-slate-100" />
                  <div className="flex flex-col px-2">
                    <Label className="text-[8px] font-black uppercase text-slate-400 mb-0.5">Year</Label>
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
                    className="bg-indigo-600 hover:bg-indigo-700 h-9 rounded-lg px-6 gap-2 text-[10px] font-black uppercase shadow-lg shadow-indigo-100 ml-2"
                  >
                    {isRunningCycle ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
                    {t('generateNow')}
                  </Button>
               </div>
            </div>
          </Card>

          {isInvoicesLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
          ) : invoices && invoices.length > 0 ? (
            <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white ring-1 ring-slate-100">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50 border-b">
                    <TableRow>
                      <TableHead className="h-10 text-[10px] uppercase font-black pl-6">{t('date')}</TableHead>
                      <TableHead className="h-10 text-[10px] uppercase font-black">Cycle Month</TableHead>
                      <TableHead className="h-10 text-[10px] uppercase font-black">{t('customer')}</TableHead>
                      <TableHead className="h-10 text-[10px] uppercase font-black text-right">{t('amount')}</TableHead>
                      <TableHead className="text-[10px] uppercase font-black text-center">Status</TableHead>
                      <TableHead className="text-right h-10 pr-6 sticky right-0 bg-slate-50 w-24">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id} className="h-14 hover:bg-slate-50/50 transition-colors group">
                        <TableCell className="pl-6 text-[10px] font-bold text-slate-500 uppercase">{inv.createdAt?.toDate ? new Date(inv.createdAt?.toDate()).toLocaleDateString() : '---'}</TableCell>
                        <TableCell className="font-bold text-xs uppercase text-blue-600">{inv.billingMonth}</TableCell>
                        <TableCell className="text-xs font-medium text-slate-600">{inv.customerName}</TableCell>
                        <TableCell className="text-right font-black text-xs">৳{inv.amount?.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={cn(
                            "text-[8px] h-4 uppercase border-none px-2 font-black",
                            inv.status === 'paid' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                          )}>
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 sticky right-0 bg-white group-hover:bg-slate-50 transition-colors">
                           <div className="flex justify-end gap-1">
                             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-blue-600" onClick={() => router.push(`/contracts/invoices/${inv.id}/view`)}><Eye className="h-4 w-4" /></Button>
                             <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                                <DropdownMenuItem className="text-xs font-bold" onClick={() => router.push(`/contracts/invoices/${inv.id}/view`)}><Eye className="mr-2 h-3.5 w-3.5" /> {t('view')}</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold" onClick={() => router.push(`/contracts/invoices/${inv.id}/edit`)}><Edit className="mr-2 h-3.5 w-3.5" /> {t('edit')}</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold" onClick={() => handlePayInvoice(inv)}><Check className="mr-2 h-3.5 w-3.5" /> Mark Paid</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600 text-xs font-bold" onClick={() => { setSelectedRecord(inv); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
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
            <div className="p-24 bg-white rounded-3xl border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
              <Receipt className="h-12 w-12 text-blue-200 mb-4" />
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">No billing records found.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-2xl border-none p-8 shadow-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase text-slate-900 tracking-tight">Delete Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">This action is permanent and cannot be reversed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2">
            <AlertDialogCancel className="h-11 rounded-xl font-black uppercase text-[10px] tracking-widest">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 h-11 rounded-xl font-black uppercase text-[10px] tracking-widest" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
