"use client"

import * as React from "react"
import { TrendingUp, ShoppingCart, Target, Loader2, ArrowRight, AlertCircle, DollarSign, Plus, Truck, FileText, Receipt, Layers, Wallet, Landmark, CheckCircle2, BarChart3, Clock } from "lucide-react"
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
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t('dashboard')}</h1>
          <p className="text-xs text-slate-500 font-medium">Business Performance Overview</p>
        </div>
        <div className="flex items-center gap-3">
          <Select defaultValue="this-month">
            <SelectTrigger className="w-[140px] h-9 text-xs font-semibold bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">{t('thisMonth')}</SelectItem>
              <SelectItem value="last-month">{t('lastMonth')}</SelectItem>
              <SelectItem value="this-quarter">{t('thisQuarter')}</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="rounded-md gap-2" asChild>
            <Link href="/sales/new">
              <Plus className="h-4 w-4" /> New Sale
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('totalRevenue')} value={`৳${stats.totalSales.toLocaleString()}`} trend={{ value: 12, isPositive: true }} icon={TrendingUp} colorClass="bg-blue-600" />
        <KPICard title={t('totalOrders')} value={recentInvoices?.length || 0} icon={ShoppingCart} colorClass="bg-indigo-600" />
        <KPICard title={t('pendingInvoices')} value={`৳${stats.dues.toLocaleString()}`} icon={Clock} colorClass="bg-orange-600" />
        <KPICard title={t('activeCustomers')} value="428" icon={Target} colorClass="bg-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Table */}
        <Card className="lg:col-span-2 border border-slate-200 shadow-sm rounded-md bg-white">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 px-6 py-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700">{t('recentTransactions')}</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs font-bold text-primary hover:bg-slate-50" asChild>
              <Link href="/sales">View All</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {invoicesLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-slate-300" /></div>
            ) : recentInvoices && recentInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-bold text-slate-500 pl-6 h-10">Ref #</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-slate-500 h-10">{t('customer')}</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-slate-500 h-10">{t('amount')}</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-slate-500 text-right pr-6 h-10">{t('status')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentInvoices.map((inv) => (
                      <TableRow key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="text-xs font-bold pl-6 text-primary">{inv.invoiceNumber}</TableCell>
                        <TableCell className="text-xs font-medium text-slate-600 truncate max-w-[150px]">{inv.customerName}</TableCell>
                        <TableCell className="text-xs font-bold">৳{inv.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell className="text-right pr-6">
                          <Badge variant="outline" className={cn(
                            "text-[9px] uppercase font-black px-2 h-5 border-none",
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
              <div className="text-center py-10 text-slate-400 text-xs font-medium italic">{t('noSales')}</div>
            )}
          </CardContent>
        </Card>

        {/* Stock Alerts & Insights */}
        <div className="space-y-6">
          <Card className="border border-slate-200 shadow-sm rounded-md bg-white">
            <CardHeader className="border-b border-slate-50 px-6 py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" /> {t('stockAlerts')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {stats.lowStockCount > 0 ? (
                <Link href="/inventory" className="flex items-center justify-between p-4 bg-red-50/50 rounded-md border border-red-100 group transition-all">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-red-900">{stats.lowStockCount} Items Low</p>
                    <p className="text-[10px] text-red-600 uppercase font-bold tracking-tighter">Inventory replenishment required</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-red-400 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2 opacity-20" />
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t('allHealthy')}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm rounded-md bg-primary text-white overflow-hidden p-6 relative">
            <BarChart3 className="absolute bottom-[-10px] right-[-10px] h-24 w-24 opacity-10" />
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-blue-200 mb-1">{t('totalRevenue')}</h4>
            <div className="text-3xl font-bold tracking-tight">৳{stats.totalSales.toLocaleString()}</div>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold bg-white/10 w-fit px-2 py-1 rounded">
              <TrendingUp className="h-3 w-3" />
              <span>+8.4% GROWTH</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}