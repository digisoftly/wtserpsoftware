"use client"

import * as React from "react"
import { Plus, Wrench, ShieldCheck, Loader2, MoreVertical, AlertCircle, TrendingUp, Eye, Trash2, Calendar, DollarSign } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import Link from "next/link"

export default function ContractsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const router = useRouter();
  
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);

  const contractsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "service_contracts"), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: contracts, isLoading: isContractsLoading } = useCollection(contractsQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "contract_invoices"), orderBy("billingMonth", "desc"));
  }, [db, companyId, branchId]);
  const { data: invoices } = useCollection(invoicesQuery);

  const stats = React.useMemo(() => ({
    active: contracts?.filter(c => c.status === 'active').length || 0,
    revenue: contracts?.filter(c => c.status === 'active').reduce((s, c) => s + (Number(c.monthlyAmount) || 0), 0) || 0,
    due: invoices?.filter(i => i.status !== 'paid').reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0
  }), [contracts, invoices]);

  const handleDelete = () => {
    if (!selectedRecord || !db || !companyId || !branchId) return;
    const docRef = doc(db, "companies", companyId, "branches", branchId, "service_contracts", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: t('success') });
    setIsDeleteAlertOpen(false);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-headline text-emerald-600 uppercase tracking-tight">{t('contracts')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2 rounded-full px-8 shadow-xl shadow-emerald-100 h-10 text-[10px] uppercase font-black transition-all active:scale-95" asChild>
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

      <Tabs defaultValue="contracts" className="w-full">
        <TabsList className="bg-white border p-1 rounded-xl shadow-sm mb-6 flex h-11 ring-1 ring-slate-100">
          <TabsTrigger value="contracts" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-black h-9 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">{t('agreements')}</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-black h-9 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">{t('billingCycle')}</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          {isContractsLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
          ) : contracts && contracts.length > 0 ? (
            <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
              <Table>
                <TableHeader className="bg-muted/10">
                  <TableRow>
                    <TableHead className="h-12 text-[10px] uppercase font-black pl-6">ID</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black">{t('service')}</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black">{t('customer')}</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black">{t('fee')}</TableHead>
                    <TableHead className="text-right h-12 pr-6"></TableHead>
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
            </Card>
          ) : (
            <div className="p-24 bg-white rounded-[3rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
              <Wrench className="h-12 w-12 text-emerald-200 mb-6" />
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]">{t('allHealthy')}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="billing">
           <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
             <div className="p-20 text-center text-muted-foreground italic text-[10px] uppercase font-black tracking-widest">
               {t('loading')}
             </div>
           </Card>
        </TabsContent>
      </Tabs>

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
