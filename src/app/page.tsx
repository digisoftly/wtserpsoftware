"use client"

import * as React from "react"
import { TrendingUp, ShoppingCart, Target, Loader2, ArrowRight, AlertCircle, Plus, Clock, BarChart3, CheckCircle2 } from "lucide-react"
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('dashboard')}</h1>
        <div className="flex items-center gap-3">
          <Select defaultValue="this-month">
            <SelectTrigger className="w-[130px] h-8 text-xs font-semibold bg-white border-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">{t('thisMonth')}</SelectItem>
              <SelectItem value="last-month">{t('lastMonth')}</SelectItem>
              <SelectItem value="this-quarter">{t('thisQuarter')}</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 rounded-md gap-2 px-4" asChild>
            <Link href="/sales/new">
              <Plus className="h-3.5 w-3.5" /> New Sale
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('totalRevenue')} value={`৳${stats.totalSales.toLocaleString()}`} trend={{ value: 12, isPositive: true }} icon={TrendingUp} colorClass="bg-blue-600" />
        <KPICard title={t('totalOrders')} value={recentInvoices?.length || 0} icon={ShoppingCart} colorClass="bg-indigo-600" />
        <KPICard title={t('pendingInvoices')} value={`৳${stats.dues.toLocaleString()}`} icon={Clock} colorClass="bg-orange-600" />
        <KPICard title={t('activeCustomers')} value="428" icon={Target} colorClass="bg-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-slate-200 shadow-sm rounded-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 px-6 py-3">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('recentTransactions')}</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-[11px] font-bold text-primary hover:bg-slate-50" asChild>
              <Link href="/sales">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {invoicesLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-slate-200" /></div>
            ) : recentInvoices && recentInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[10px] uppercase font-bold text-slate-400 pl-6 h-9">Ref #</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-slate-400 h-9">{t('customer')}</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-slate-400 h-9">{t('amount')}</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-slate-400 text-right pr-6 h-9">{t('status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentInvoices.map((inv) => (
                      <TableRow key={inv.id} className="hover:bg-slate-50/50 transition-colors border-slate-50">
                        <TableCell className="text-xs font-bold pl-6 text-primary">{inv.invoiceNumber}</TableCell>
                        <TableCell className="text-xs font-medium text-slate-600 truncate max-w-[150px]">{inv.customerName}</TableCell>
                        <TableCell className="text-xs font-bold">৳{inv.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell className="text-right pr-6">
                          <Badge variant="outline" className={cn(
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
              </div>
            ) : (
              <div className="text-center py-10 text-slate-300 text-xs font-medium italic">{t('noSales')}</div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border border-slate-200 shadow-sm rounded-md bg-white">
            <CardHeader className="border-b border-slate-50 px-6 py-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 text-orange-500" /> {t('stockAlerts')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {stats.lowStockCount > 0 ? (
                <Link href="/inventory" className="flex items-center justify-between p-4 bg-red-50/30 rounded-md border border-red-100 group transition-all">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-red-900">{stats.lowStockCount} Items Low</p>
                    <p className="text-[9px] text-red-600 font-bold uppercase">Restock required</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-red-300 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2 opacity-10" />
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{t('allHealthy')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm rounded-md bg-primary text-white overflow-hidden p-6 relative">
            <BarChart3 className="absolute bottom-[-5px] right-[-5px] h-16 w-16 opacity-10" />
            <h4 className="text-[9px] font-bold uppercase tracking-wider text-blue-200 mb-1">{t('totalRevenue')}</h4>
            <div className="text-2xl font-bold tracking-tight">৳{stats.totalSales.toLocaleString()}</div>
            <div className="mt-4 flex items-center gap-2 text-[9px] font-bold bg-white/10 w-fit px-2 py-0.5 rounded">
              <TrendingUp className="h-3 w-3" />
              <span>+8.4%</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
