"use client"

import * as React from "react"
import { TrendingUp, ShoppingCart, Target, Loader2, Plus, Clock, BarChart3, CheckCircle2, AlertCircle } from "lucide-react"
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

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "sales_invoices"), orderBy("createdAt", "desc"), limit(10));
  }, [db, companyId, branchId]);
  const { data: recentInvoices, isLoading: invoicesLoading } = useCollection(invoicesQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "products"), limit(100));
  }, [db, companyId, branchId]);
  const { data: products } = useCollection(productsQuery);

  const stats = React.useMemo(() => {
    const totalSales = recentInvoices?.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0;
    const dues = recentInvoices?.filter(i => i.status !== 'paid').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0;
    const lowStockCount = products?.filter(p => (p.currentStock || 0) <= (p.minStockLevel || 5)).length || 0;
    return { totalSales, dues, lowStockCount };
  }, [recentInvoices, products]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">{t('dashboard')}</h1>
        <div className="flex items-center gap-2">
          <Select defaultValue="this-month">
            <SelectTrigger className="w-[130px] h-9 text-xs font-bold bg-white border-slate-200 rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-xl border-slate-100">
              <SelectItem value="this-month">{t('thisMonth')}</SelectItem>
              <SelectItem value="last-month">{t('lastMonth')}</SelectItem>
              <SelectItem value="this-quarter">{t('thisQuarter')}</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="h-9 rounded-lg gap-2 px-6 font-bold bg-primary" asChild>
            <Link href="/sales/new">
              <Plus className="h-4 w-4" /> New Sale
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('totalRevenue')} value={`৳${stats.totalSales.toLocaleString()}`} icon={TrendingUp} colorClass="bg-blue-600" trend={{ value: 12, isPositive: true }} />
        <KPICard title={t('totalOrders')} value={recentInvoices?.length || 0} icon={ShoppingCart} colorClass="bg-indigo-600" />
        <KPICard title={t('pendingInvoices')} value={`৳${stats.dues.toLocaleString()}`} icon={Clock} colorClass="bg-orange-600" />
        <KPICard title={t('activeCustomers')} value="428" icon={Target} colorClass="bg-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-xl bg-white ring-1 ring-slate-100 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 px-6 py-4">
            <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-500">{t('recentTransactions')}</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase tracking-widest text-primary" asChild>
              <Link href="/sales">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {invoicesLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-slate-200" /></div>
            ) : recentInvoices && recentInvoices.length > 0 ? (
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase font-black text-slate-400 pl-6 h-10">Ref #</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-slate-400 h-10">{t('customer')}</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-slate-400 h-10">{t('amount')}</TableHead>
                    <TableHead className="text-[10px] uppercase font-black text-slate-400 text-right pr-6 h-10">{t('status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.map((inv) => (
                    <TableRow key={inv.id} className="h-12 hover:bg-muted/5 transition-colors border-slate-50">
                      <TableCell className="text-xs font-bold pl-6 text-primary">{inv.invoiceNumber}</TableCell>
                      <TableCell className="text-xs font-medium text-slate-600 truncate max-w-[200px]">{inv.customerName}</TableCell>
                      <TableCell className="text-xs font-bold">৳{inv.totalAmount?.toLocaleString()}</TableCell>
                      <TableCell className="text-right pr-6">
                        <Badge className={cn(
                          "text-[9px] uppercase font-black px-2 h-4 border-none",
                          inv.status === "paid" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"
                        )}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-16 text-slate-300 text-xs font-bold uppercase tracking-widest">{t('noSales')}</div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-none shadow-sm rounded-xl bg-white ring-1 ring-slate-100 overflow-hidden">
            <CardHeader className="border-b border-slate-50 px-6 py-4">
              <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-orange-500" /> {t('stockAlerts')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {stats.lowStockCount > 0 ? (
                <Link href="/inventory" className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100 group transition-all">
                  <div className="space-y-0.5">
                    <p className="text-xs font-black text-red-900">{stats.lowStockCount} Items Low</p>
                    <p className="text-[9px] text-red-600 font-black uppercase tracking-tighter">Restock required</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-red-300 group-hover:scale-110 transition-transform" />
                </Link>
              ) : (
                <div className="text-center py-8 opacity-20">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">{t('allHealthy')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg rounded-xl bg-primary text-white overflow-hidden p-8 relative">
            <BarChart3 className="absolute bottom-[-10px] right-[-10px] h-24 w-24 opacity-10" />
            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-2">{t('totalRevenue')}</h4>
            <div className="text-3xl font-black tracking-tighter">৳{stats.totalSales.toLocaleString()}</div>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-black bg-white/10 w-fit px-3 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" />
              <span>+8.4% Growth</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
