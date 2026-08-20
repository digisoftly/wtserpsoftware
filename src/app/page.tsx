"use client"

import * as React from "react"
import { 
  TrendingUp, 
  ShoppingCart, 
  Target, 
  Loader2, 
  Plus, 
  Clock, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Wallet,
  DollarSign,
  Package,
  Users,
  Briefcase,
  UserX,
  ClipboardList,
  FolderOpen,
  ArrowUpRight,
  ArrowDownRight,
  Truck,
  Receipt
} from "lucide-react"
import { KPICard } from "@/components/dashboard/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"

/**
 * Redesigned Dashboard based on the image:
 * - High-density grid of cards with tinted backgrounds
 * - Dedicated sections for Dues, Project Summary, and Low Stock Alerts
 */
export default function Dashboard() {
  const { branchId, companyId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  // Data Fetching
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "sales_invoices"), orderBy("createdAt", "desc"), limit(20));
  }, [db, companyId, branchId]);
  const { data: invoices, isLoading: invoicesLoading } = useCollection(invoicesQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "products");
  }, [db, companyId, branchId]);
  const { data: products } = useCollection(productsQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  const suppliersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "suppliers");
  }, [db, companyId, branchId]);
  const { data: suppliers } = useCollection(suppliersQuery);

  const projectsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "projects");
  }, [db, companyId, branchId]);
  const { data: projects } = useCollection(projectsQuery);

  const expensesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "expenses");
  }, [db, companyId, branchId]);
  const { data: expenses } = useCollection(expensesQuery);

  const purchasesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "purchase_orders");
  }, [db, companyId, branchId]);
  const { data: purchases } = useCollection(purchasesQuery);

  const staffQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "employees");
  }, [db, companyId, branchId]);
  const { data: staff } = useCollection(staffQuery);

  // Aggregation Logic
  const stats = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);

    const totalSales = invoices?.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0;
    const todaySales = invoices?.filter(i => i.invoiceDate === today).reduce((sum, i) => sum + (i.totalAmount || 0), 0) || 0;
    const monthlySales = invoices?.filter(i => i.invoiceDate?.startsWith(thisMonth)).reduce((sum, i) => sum + (i.totalAmount || 0), 0) || 0;
    
    const totalPurchase = purchases?.reduce((sum, p) => sum + (p.totalAmount || 0), 0) || 0;
    const totalExpense = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    const netProfit = totalSales - (totalPurchase + totalExpense);

    const customerDue = invoices?.reduce((sum, i) => sum + (i.balanceDue || 0), 0) || 0;
    const supplierDue = suppliers?.reduce((sum, s) => sum + (s.totalDueAmount || 0), 0) || 0;

    const lowStockItems = products?.filter(p => (p.currentStock || 0) <= (p.minStockLevel || 5)) || [];

    const projectBill = projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;
    const projectPaid = projects?.reduce((sum, p) => sum + (p.paidAmount || 0), 0) || 0;
    const projectDue = projectBill - projectPaid;

    return {
      totalSales, todaySales, totalPurchase, netProfit, monthlySales, totalExpense,
      totalCustomers: customers?.length || 0,
      totalSuppliers: suppliers?.length || 0,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      pendingProjects: projects?.filter(p => p.status !== 'Completed').length || 0,
      customerDue,
      supplierDue,
      projectBill,
      projectPaid,
      projectDue,
      staffCount: staff?.length || 0
    };
  }, [invoices, purchases, expenses, customers, suppliers, products, projects, staff]);

  return (
    <div className="space-y-6 pb-10">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Dashboard</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Welcome! Here's your overview for today</p>
        </div>
        <Button variant="outline" size="sm" className="h-9 rounded-xl gap-2 font-bold text-[11px] uppercase tracking-widest bg-white" onClick={() => window.location.reload()}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {/* PRIMARY KPI GRID - 4 COLS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Sales" value={`৳${stats.totalSales.toLocaleString()}`} icon={ShoppingCart} colorClass="bg-green-600" />
        <KPICard title="Today Sales" value={`৳${stats.todaySales.toLocaleString()}`} subtext={new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} icon={DollarSign} colorClass="bg-blue-600" />
        <KPICard title="Total Purchase" value={`৳${stats.totalPurchase.toLocaleString()}`} icon={Package} colorClass="bg-orange-600" />
        <KPICard title="Net Profit" value={`৳${stats.netProfit.toLocaleString()}`} icon={TrendingUp} colorClass="bg-green-600" />
      </div>

      {/* SECONDARY KPI GRID - 4 COLS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Monthly Sales" value={`৳${stats.monthlySales.toLocaleString()}`} subtext={new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} icon={Clock} colorClass="bg-purple-600" />
        <KPICard title="Total Expense" value={`৳${stats.totalExpense.toLocaleString()}`} icon={Wallet} colorClass="bg-red-600" />
        <KPICard title="Total Customers" value={stats.totalCustomers} icon={Users} colorClass="bg-cyan-600" />
        <KPICard title="Total Suppliers" value={stats.totalSuppliers} icon={Truck} colorClass="bg-orange-600" />
      </div>

      {/* STATUS KPI GRID - 4 COLS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Low Stock Items" value={stats.lowStockCount} icon={AlertCircle} colorClass="bg-red-600" />
        <KPICard title="Pending Projects" value={stats.pendingProjects} icon={ClipboardList} colorClass="bg-teal-600" />
        <KPICard title="Present Today" value={stats.staffCount} subtext={`of ${stats.staffCount}`} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title="Absent Today" value={0} icon={UserX} colorClass="bg-red-600" />
      </div>

      {/* DUES SECTION - 2 LARGE CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-none shadow-sm rounded-[1.5rem] bg-red-50/30 ring-1 ring-red-50">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Customer Due</p>
              <h2 className="text-3xl font-black text-slate-900">৳{stats.customerDue.toLocaleString()}</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stats.totalCustomers} Customers</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-100">
               <ArrowDownRight className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-[1.5rem] bg-orange-50/30 ring-1 ring-orange-50">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Supplier Due</p>
              <h2 className="text-3xl font-black text-slate-900">৳{stats.supplierDue.toLocaleString()}</h2>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{stats.totalSuppliers} Suppliers</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-100">
               <ArrowUpRight className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PROJECT BILLING SUMMARY */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <FolderOpen className="h-4 w-4 text-teal-600" />
           <h3 className="text-xs font-black uppercase text-slate-600 tracking-widest">Project Billing Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard title="Total Project Bill" value={`৳${stats.projectBill.toLocaleString()}`} subtext={`${projects?.length || 0} Projects`} icon={Receipt} colorClass="bg-teal-600" />
          <KPICard title="Total Project Paid" value={`৳${stats.projectPaid.toLocaleString()}`} icon={TrendingUp} colorClass="bg-green-600" />
          <KPICard title="Project Due" value={`৳${stats.projectDue.toLocaleString()}`} subtext={`${projects?.filter(p => (p.budget - p.paidAmount) > 0).length || 0} Pending`} icon={AlertCircle} colorClass="bg-red-600" />
        </div>
      </div>

      {/* LOW STOCK ALERT SECTION */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
           <AlertCircle className="h-4 w-4 text-red-600" />
           <h3 className="text-xs font-black uppercase text-slate-600 tracking-widest">Low Stock Alert</h3>
        </div>
        <Card className="border-none shadow-sm rounded-[1.5rem] bg-red-50/30 ring-1 ring-red-50 overflow-hidden">
           <CardContent className="p-4 space-y-2">
              {stats.lowStockItems.length > 0 ? (
                stats.lowStockItems.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-red-50 shadow-sm">
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Model: {item.sku || 'N/A'}</p>
                    </div>
                    <Badge variant="destructive" className="h-6 rounded-lg font-black text-[10px] px-3">
                      {item.currentStock} {item.unit || 'Pcs'}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center opacity-20">
                   <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-600" />
                   <p className="text-[10px] font-black uppercase tracking-widest">All Stock Levels are Healthy</p>
                </div>
              )}
           </CardContent>
        </Card>
      </div>

      {/* FLOATING ACTION BUTTON (Optional but in many ERP images) */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button size="icon" className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-400 group">
          <Plus className="h-6 w-6 text-white transition-transform group-hover:rotate-90" />
        </Button>
      </div>
    </div>
  )
}
