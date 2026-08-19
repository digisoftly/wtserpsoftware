"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  User, 
  FileText, 
  Receipt, 
  Truck, 
  RotateCcw, 
  Folder, 
  Wrench, 
  Loader2, 
  Plus, 
  TrendingUp, 
  Wallet, 
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Building,
  CreditCard,
  Eye,
  Printer
} from "lucide-react"
import { useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, where, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { KPICard } from "@/components/dashboard/kpi-card"
import { cn } from "@/lib/utils"

export default function CustomerProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t, formatCurrency, formatDate } = useTranslation();

  // 1. Fetch Customer Core Profile
  const customerRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return doc(db, "companies", companyId, "branches", branchId, "customers", id as string);
  }, [db, companyId, branchId, id]);
  const { data: customer, isLoading: isProfileLoading } = useDoc(customerRef);

  // 2. Fetch All Linked Entities
  const getCustomerQuery = (col: string) => useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, col),
      where("customerId", "==", id),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId, id, col]);

  const { data: invoices } = useCollection(getCustomerQuery("sales_invoices"));
  const { data: quotations } = useCollection(getCustomerQuery("quotations"));
  const { data: challans } = useCollection(getCustomerQuery("delivery_challans"));
  const { data: returns } = useCollection(getCustomerQuery("sales_returns"));
  const { data: projects } = useCollection(getCustomerQuery("projects"));
  const { data: contracts } = useCollection(getCustomerQuery("service_contracts"));

  // 3. Financial Summary Logic
  const stats = React.useMemo(() => ({
    totalBilled: invoices?.reduce((s, i) => s + (i.totalAmount || 0), 0) || 0,
    totalPaid: invoices?.reduce((s, i) => s + (i.paidAmount || 0), 0) || 0,
    totalDue: invoices?.reduce((s, i) => s + (i.balanceDue || 0), 0) || 0,
    activeProjects: projects?.filter(p => p.status !== 'Completed').length || 0
  }), [invoices, projects]);

  if (isProfileLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-cyan-600" /></div>;
  if (!customer) return <div className="p-20 text-center uppercase font-black text-muted-foreground">{t('common.noData')}</div>;

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border shadow-sm ring-1 ring-slate-100">
        <div className="flex items-start gap-6">
           <div className="w-20 h-20 rounded-[2rem] bg-cyan-50 flex items-center justify-center text-cyan-600 shadow-inner border border-cyan-100 shrink-0">
              <User className="h-10 w-10" />
           </div>
           <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black font-headline uppercase tracking-tight text-slate-900">
                  {customer.customerType === 'company' ? customer.companyName : `${customer.firstName} ${customer.lastName}`}
                </h1>
                <Badge variant="outline" className="bg-slate-50 text-[9px] font-black uppercase border-none px-2">{customer.customerType}</Badge>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-bold text-slate-500 uppercase tracking-tighter mt-2">
                 <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-cyan-600" /> {customer.phoneNumber}</span>
                 <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-cyan-600" /> {customer.email || 'N/A'}</span>
                 <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-cyan-600" /> {customer.city}, {customer.country}</span>
              </div>
           </div>
        </div>
        <div className="flex flex-wrap gap-2">
           <Button variant="outline" className="rounded-full h-10 px-6 font-black text-[10px] uppercase gap-2 border-slate-200" onClick={() => router.push(`/sales/new?customerId=${id}`)}>
              <Plus className="h-3.5 w-3.5" /> {t('nav.sales')}
           </Button>
           <Button className="bg-cyan-600 hover:bg-cyan-700 rounded-full h-10 px-8 font-black text-[10px] uppercase gap-2 shadow-xl shadow-cyan-100" onClick={() => router.push(`/payments/new?customerId=${id}`)}>
              <CreditCard className="h-3.5 w-3.5" /> {t('nav.payments')}
           </Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('dashboard.totalRevenue')} value={formatCurrency(stats.totalBilled)} icon={TrendingUp} colorClass="bg-blue-600" />
        <KPICard title={t('forms.paidAmount')} value={formatCurrency(stats.totalPaid)} icon={Wallet} colorClass="bg-green-600" />
        <KPICard title={t('forms.balanceDue')} value={formatCurrency(stats.totalDue)} icon={AlertCircle} colorClass="bg-red-600" trend={{ value: (stats.totalDue/stats.totalBilled)*100 || 0, isPositive: false }} />
        <KPICard title={t('running')} value={stats.activeProjects} icon={Folder} colorClass="bg-purple-600" />
      </div>

      {/* TABS INTERFACE */}
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="bg-white border p-1 rounded-2xl shadow-sm mb-6 flex h-auto overflow-x-auto no-scrollbar ring-1 ring-slate-100">
          <TabsTrigger value="invoices" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] font-black uppercase tracking-widest min-w-[120px] data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <Receipt className="h-4 w-4" /> {t('nav.sales')}
          </TabsTrigger>
          <TabsTrigger value="quotes" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] font-black uppercase tracking-widest min-w-[120px] data-[state=active]:bg-amber-50 data-[state=active]:text-amber-600">
            <FileText className="h-4 w-4" /> {t('nav.quotations')}
          </TabsTrigger>
          <TabsTrigger value="dispatch" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] font-black uppercase tracking-widest min-w-[120px] data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-600">
            <Truck className="h-4 w-4" /> {t('nav.dispatch')}
          </TabsTrigger>
          <TabsTrigger value="projects" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] font-black uppercase tracking-widest min-w-[120px] data-[state=active]:bg-teal-50 data-[state=active]:text-teal-600">
            <Folder className="h-4 w-4" /> {t('nav.projectBilling')}
          </TabsTrigger>
          <TabsTrigger value="contracts" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] font-black uppercase tracking-widest min-w-[120px] data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600">
            <Wrench className="h-4 w-4" /> {t('nav.contracts')}
          </TabsTrigger>
          <TabsTrigger value="returns" className="rounded-xl gap-2 flex-none md:flex-1 py-3 text-[10px] font-black uppercase tracking-widest min-w-[120px] data-[state=active]:bg-red-50 data-[state=active]:text-red-600">
            <RotateCcw className="h-4 w-4" /> {t('nav.returns')}
          </TabsTrigger>
        </TabsList>

        {/* INVOICES TAB */}
        <TabsContent value="invoices">
          <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="h-12 pl-8 text-[10px] font-black uppercase">Ref #</TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase">{t('common.date')}</TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase text-right">{t('common.total')}</TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase text-right">{t('forms.balanceDue')}</TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase text-center">{t('common.status')}</TableHead>
                  <TableHead className="h-12 text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-40 text-center opacity-30 italic font-black uppercase text-[10px]">{t('common.noData')}</TableCell></TableRow>
                ) : (
                  invoices?.map(inv => (
                    <TableRow key={inv.id} className="h-16 hover:bg-muted/5 group">
                      <TableCell className="pl-8 font-black text-xs text-blue-600 uppercase">{inv.invoiceNumber}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-500">{formatDate(inv.invoiceDate)}</TableCell>
                      <TableCell className="text-right font-black text-xs">{formatCurrency(inv.totalAmount)}</TableCell>
                      <TableCell className="text-right font-black text-xs text-red-600">{formatCurrency(inv.balanceDue)}</TableCell>
                      <TableCell className="text-center">
                         <Badge className={cn("text-[8px] h-4 uppercase border-none px-2 font-black", inv.status === 'paid' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>
                           {inv.status}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                         <div className="flex justify-end gap-1">
                           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => router.push(`/sales/${inv.id}/view`)}><Eye className="h-4 w-4" /></Button>
                           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400" onClick={() => router.push(`/sales/${inv.id}/view?print=true`)}><Printer className="h-4 w-4" /></Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* QUOTATIONS TAB */}
        <TabsContent value="quotes">
          <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="h-12 pl-8 text-[10px] font-black uppercase">{t('forms.sl')}</TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase">{t('common.date')}</TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase text-right">{t('common.total')}</TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase text-center">{t('common.status')}</TableHead>
                  <TableHead className="h-12 text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotations?.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-40 text-center opacity-30 italic font-black uppercase text-[10px]">{t('common.noData')}</TableCell></TableRow>
                ) : (
                  quotations?.map(q => (
                    <TableRow key={q.id} className="h-16 hover:bg-muted/5">
                      <TableCell className="pl-8 font-black text-xs text-amber-600 uppercase">{q.quotationNumber}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-500">{formatDate(q.quotationDate)}</TableCell>
                      <TableCell className="text-right font-black text-xs">{formatCurrency(q.totalAmount)}</TableCell>
                      <TableCell className="text-center">
                         <Badge variant="outline" className="text-[8px] h-4 uppercase border-none px-2 font-black bg-slate-100">{q.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                         <div className="flex justify-end gap-1">
                           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => router.push(`/quotations/${q.id}/view`)}><Eye className="h-4 w-4" /></Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* PROJECTS TAB */}
        <TabsContent value="projects">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects?.length === 0 ? (
              <div className="col-span-full py-20 text-center opacity-30 italic font-black uppercase text-[10px]">{t('common.noData')}</div>
            ) : (
              projects?.map(p => (
                <Card key={p.id} className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-black text-xs uppercase tracking-tight text-slate-900 truncate max-w-[150px]">{p.name}</h3>
                      <p className="text-[9px] font-mono text-teal-600 font-black">{p.projectCode}</p>
                    </div>
                    <Badge className="bg-teal-50 text-teal-600 text-[8px] uppercase border-none font-black">{p.status}</Badge>
                  </div>
                  <div className="pt-4 border-t border-slate-50 flex justify-between items-end">
                     <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-slate-400 uppercase">Budget</p>
                        <p className="text-sm font-black text-slate-900">{formatCurrency(p.budget)}</p>
                     </div>
                     <Button variant="ghost" size="sm" className="h-8 rounded-full text-[9px] font-black uppercase text-blue-600" onClick={() => router.push(`/projects/${p.id}/view`)}>View Project</Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* OTHER TABS (Fallback Empty States) */}
        <TabsContent value="dispatch">
           <Card className="border-none shadow-sm rounded-[2rem] p-20 text-center ring-1 ring-slate-100 bg-white">
              <Truck className="h-10 w-10 text-slate-100 mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">{t('common.noData')}</p>
           </Card>
        </TabsContent>
        <TabsContent value="contracts">
           <Card className="border-none shadow-sm rounded-[2rem] p-20 text-center ring-1 ring-slate-100 bg-white">
              <Wrench className="h-10 w-10 text-slate-100 mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">{t('common.noData')}</p>
           </Card>
        </TabsContent>
        <TabsContent value="returns">
           <Card className="border-none shadow-sm rounded-[2rem] p-20 text-center ring-1 ring-slate-100 bg-white">
              <RotateCcw className="h-10 w-10 text-slate-100 mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.3em]">{t('common.noData')}</p>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

