
"use client"

import * as React from "react"
import { TrendingUp, ShoppingCart, Target, LifeBuoy, Loader2, ArrowRight, AlertCircle, DollarSign, Plus, Truck, FileText, Receipt, Layers, Wallet, Landmark } from "lucide-react"
import { KPICard } from "@/components/dashboard/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"

export default function Dashboard() {
  const { branchId, companyId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const shortcuts = [
    { label: t('sales'), icon: ShoppingCart, color: "bg-green-500", path: "/sales" },
    { label: t('purchases'), icon: Truck, color: "bg-orange-500", path: "/purchases" },
    { label: t('quotations'), icon: FileText, color: "bg-purple-500", path: "/quotations" },
    { label: t('invoiceShortcut'), icon: Receipt, color: "bg-blue-500", path: "/sales" },
    { label: t('billing'), icon: Layers, color: "bg-violet-500", path: "/project-billing" },
    { label: t('paymentShortcut'), icon: Wallet, color: "bg-indigo-500", path: "/project-billing" },
    { label: t('accounts'), icon: Landmark, color: "bg-cyan-500", path: "/accounts" },
  ];

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "sales_invoices"), orderBy("createdAt", "desc"), limit(5));
  }, [db, companyId, branchId]);
  const { data: recentInvoices, isLoading: invoicesLoading } = useCollection(invoicesQuery);

  const leadsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "leads");
  }, [db, companyId, branchId]);
  const { data: leads } = useCollection(leadsQuery);

  const allInvoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "sales_invoices");
  }, [db, companyId, branchId]);
  const { data: allInvoices } = useCollection(allInvoicesQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "products");
  }, [db, companyId, branchId]);
  const { data: products } = useCollection(productsQuery);

  const stats = React.useMemo(() => {
    const totalSales = allInvoices?.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0;
    const dues = allInvoices?.filter(i => i.status !== 'paid').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0;
    const lowStockCount = products?.filter(p => (p.currentStock || 0) <= (p.minStockLevel || 5)).length || 0;
    return { totalSales, dues, lowStockCount };
  }, [allInvoices, products]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline text-slate-900">{t('goodMorning')}, {t('admin')} 👋</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('happeningToday')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="this-month">
            <SelectTrigger className="w-[140px] h-9 text-[10px] uppercase font-bold bg-white rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">{t('thisMonth')}</SelectItem>
              <SelectItem value="last-month">{t('lastMonth')}</SelectItem>
              <SelectItem value="this-quarter">{t('thisQuarter')}</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="bg-primary rounded-lg px-4 gap-2 h-9 font-bold text-[11px] uppercase tracking-wider shadow-lg shadow-blue-100">
            <Plus className="h-4 w-4" /> {t('newInvoice')}
          </Button>
        </div>
      </div>

      {/* Bubble Shortcuts */}
      <div className="bg-white p-6 rounded-[2rem] border shadow-sm ring-1 ring-slate-100 overflow-x-auto no-scrollbar">
        <div className="flex justify-between items-center gap-4 min-w-[700px] md:min-w-0 md:grid md:grid-cols-7">
          {shortcuts.map((s, i) => (
            <Link key={i} href={s.path} className="flex flex-col items-center gap-3 group shrink-0">
              <div className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1 group-active:scale-95",
                s.color
              )}>
                <s.icon className="h-6 w-6" />
              </div>
              <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest group-hover:text-primary transition-colors text-center whitespace-nowrap">
                {s.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('totalRevenue')} value={`৳${stats.totalSales.toLocaleString()}`} icon={TrendingUp} colorClass="bg-green-600" subtext={t('revenueGrowth')} />
        <KPICard title={t('totalOrders')} value={allInvoices?.length || 0} icon={ShoppingCart} colorClass="bg-blue-600" subtext={t('orderGrowth')} />
        <KPICard title={t('pendingInvoices')} value={`৳${stats.dues.toLocaleString()}`} icon={AlertCircle} colorClass="bg-orange-600" subtext={t('overdueCount')} />
        <KPICard title={t('activeCustomers')} value="3,847" icon={Target} colorClass="bg-purple-600" subtext={t('newCustomers')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden rounded-2xl bg-white">
          <CardHeader className="flex flex-row items-center justify-between py-5 px-6 border-b border-slate-50">
            <div>
              <CardTitle className="text-sm font-bold font-headline uppercase tracking-tight text-slate-900">{t('recentTransactions')}</CardTitle>
              <p className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5">{t('lastActiveSales')}</p>
            </div>
            <Button variant="ghost" size="sm" className="h-8 rounded-full px-4 text-[10px] font-bold uppercase hover:bg-slate-50">{t('viewAll')}</Button>
          </CardHeader>
          <CardContent className="p-0">
            {invoicesLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : recentInvoices && recentInvoices.length > 0 ? (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="h-10 text-[10px] uppercase font-black text-slate-400 pl-6">{t('invoiceNumber')}</TableHead>
                    <TableHead className="h-10 text-[10px] uppercase font-black text-slate-400">{t('customer')}</TableHead>
                    <TableHead className="h-10 text-[10px] uppercase font-black text-slate-400">{t('amount')}</TableHead>
                    <TableHead className="h-10 text-[10px] uppercase font-black text-slate-400 text-right pr-6">{t('status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.map((inv) => (
                    <TableRow key={inv.id} className="h-14 hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-xs pl-6 text-blue-600">{inv.invoiceNumber}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-900">
                        {leads?.find(l => l.id === inv.customerId)?.name || inv.customerName || t('walkingClient')}
                      </TableCell>
                      <TableCell className="font-black text-xs">৳{inv.totalAmount?.toLocaleString()}</TableCell>
                      <TableCell className="text-right pr-6">
                        <Badge className={cn("text-[9px] h-5 uppercase px-2 font-black border-none", 
                          inv.status === "paid" ? "bg-green-50 text-green-700" : 
                          inv.status === "partial" ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700")}>
                          {t(`${inv.status}_status` as any)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-20 text-muted-foreground text-xs italic">{t('noSales')}</div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-2xl bg-white p-6">
            <CardTitle className="text-sm font-bold font-headline uppercase tracking-tight text-slate-900 mb-4">{t('quickActions')}</CardTitle>
            <div className="grid grid-cols-1 gap-3">
              <Button variant="outline" className="justify-start h-12 rounded-xl gap-3 font-bold border-slate-100 hover:bg-blue-50 transition-all">
                <Plus className="h-4 w-4 text-blue-600" /> {t('newInvoice')}
              </Button>
              <Button variant="outline" className="justify-start h-12 rounded-xl gap-3 font-bold border-slate-100 hover:bg-orange-50 transition-all">
                <ShoppingCart className="h-4 w-4 text-orange-600" /> {t('purchases')}
              </Button>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl bg-white p-6">
            <CardTitle className="text-sm font-bold font-headline uppercase tracking-tight text-slate-900 mb-4">{t('stockAlerts')}</CardTitle>
            <div className="space-y-3">
              {stats.lowStockCount > 0 ? (
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500 text-white flex items-center justify-center shadow-lg"><AlertCircle className="h-4 w-4" /></div>
                    <div>
                      <p className="text-xs font-bold text-red-900">{t('criticalStock')}</p>
                      <p className="text-[10px] text-red-700 font-medium">{stats.lowStockCount} {t('itemsBelowThreshold')}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-red-400" />
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest text-center py-6">{t('allHealthy')}</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
