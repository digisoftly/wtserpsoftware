
"use client"

import * as React from "react"
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  Wallet, 
  Users, 
  Truck, 
  AlertCircle, 
  ClipboardList, 
  CheckCircle2, 
  UserX, 
  DollarSign, 
  Clock, 
  Receipt, 
  FolderOpen,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Box,
  Plus,
  FileText,
  UserPlus,
  Briefcase,
  CreditCard
} from "lucide-react"
import { KPICard } from "@/components/dashboard/kpi-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"
import { cn } from "@/lib/utils"

/**
 * WarriorERP - High Fidelity Dashboard
 * Matches the reference image layout and colorful KPI card system.
 * Includes the new Floating Action Button (FAB) menu.
 */
export default function Dashboard() {
  const { branchId, companyId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isFabOpen, setIsFabOpen] = React.useState(false);

  // 1. Data Subscriptions
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "sales_invoices");
  }, [db, companyId, branchId]);
  const { data: invoices } = useCollection(invoicesQuery);

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

  // 2. Aggregate Calculations
  const stats = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const formattedToday = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const totalSales = invoices?.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0;
    const todaySales = invoices?.filter(i => i.invoiceDate === today).reduce((sum, i) => sum + (i.totalAmount || 0), 0) || 0;
    const monthlySales = invoices?.filter(i => i.invoiceDate?.startsWith(thisMonth)).reduce((sum, i) => sum + (i.totalAmount || 0), 0) || 0;
    
    const totalPurchase = purchases?.reduce((sum, p) => sum + (p.totalAmount || 0), 0) || 0;
    const totalExpense = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    const netProfit = totalSales - (totalPurchase + totalExpense);

    const customerDue = invoices?.reduce((sum, i) => sum + (i.balanceDue || 0), 0) || 0;
    const dueCustomersCount = Array.from(new Set(invoices?.filter(i => (i.balanceDue || 0) > 0).map(i => i.customerId))).length;
    const supplierDue = suppliers?.reduce((sum, s) => sum + (s.totalDueAmount || 0), 0) || 0;
    const dueSuppliersCount = suppliers?.filter(s => (s.totalDueAmount || 0) > 0).length || 0;

    const lowStockItems = products?.filter(p => (p.currentStock || 0) <= (p.minStockLevel || 5)) || [];

    const projectBill = projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;
    const projectPaid = projects?.reduce((sum, p) => sum + (p.paidAmount || 0), 0) || 0;
    const projectDue = projectBill - projectPaid;

    const staffCount = staff?.length || 0;

    return {
      totalSales, todaySales, totalPurchase, netProfit, monthlySales, totalExpense,
      totalCustomers: customers?.length || 0,
      totalSuppliers: suppliers?.length || 0,
      lowStockCount: lowStockItems.length,
      lowStockItems,
      pendingProjects: projects?.filter(p => !['Completed', 'completed'].includes(p.status)).length || 0,
      customerDue,
      dueCustomersCount,
      supplierDue,
      dueSuppliersCount,
      projectBill,
      projectPaid,
      projectDue,
      staffCount,
      monthName,
      formattedToday
    };
  }, [invoices, purchases, expenses, customers, suppliers, products, projects, staff]);

  const QUICK_ACTIONS = [
    { label: "New Sale", icon: ShoppingCart, color: "bg-[#22C55E]", path: "/sales/new" },
    { label: "New Purchase", icon: Package, color: "bg-[#F97316]", path: "/purchases/new" },
    { label: "New Quotation", icon: FileText, color: "bg-[#A855F7]", path: "/quotations/new" },
    { label: "New Customer", icon: UserPlus, color: "bg-[#06B6D4]", path: "/customers/new" },
    { label: "New Supplier", icon: Truck, color: "bg-[#F59E0B]", path: "/suppliers/new" },
    { label: "New Project", icon: Briefcase, color: "bg-[#14B8A6]", path: "/projects/new" },
    { label: "New Payment", icon: CreditCard, color: "bg-[#6366F1]", path: "/payments/new" },
  ];

  return (
    <div className="relative space-y-8 pb-20">
      {/* 3. PAGE HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Dashboard</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Enterprise Resource Analysis Terminal</p>
        </div>
        <Button variant="outline" size="sm" className="h-10 rounded-full gap-2 font-black text-[10px] uppercase tracking-widest bg-white shadow-sm hover:bg-slate-50" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 text-blue-600" /> Refresh Data
        </Button>
      </div>

      {/* 4. PRIMARY KPI GRID (ROW 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Total Sales" value={`৳${stats.totalSales.toLocaleString()}`} icon={ShoppingCart} colorClass="bg-green-600" />
        <KPICard title="Today Sales" value={`৳${stats.todaySales.toLocaleString()}`} subtext={stats.formattedToday} icon={DollarSign} colorClass="bg-blue-600" />
        <KPICard title="Total Purchase" value={`৳${stats.totalPurchase.toLocaleString()}`} icon={Package} colorClass="bg-orange-600" />
        <KPICard title="Net Profit" value={`৳${stats.netProfit.toLocaleString()}`} icon={TrendingUp} colorClass="bg-green-500" />
      </div>

      {/* 5. SECONDARY KPI GRID (ROW 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Monthly Sales" value={`৳${stats.monthlySales.toLocaleString()}`} subtext={stats.monthName} icon={Clock} colorClass="bg-purple-600" />
        <KPICard title="Total Expense" value={`৳${stats.totalExpense.toLocaleString()}`} icon={Wallet} colorClass="bg-red-500" />
        <KPICard title="Total Customers" value={stats.totalCustomers} icon={Users} colorClass="bg-cyan-600" />
        <KPICard title="Total Suppliers" value={stats.totalSuppliers} icon={Truck} colorClass="bg-orange-500" />
      </div>

      {/* 6. STATUS KPI GRID (ROW 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Low Stock Items" value={stats.lowStockCount} icon={AlertCircle} colorClass="bg-red-600" />
        <KPICard title="Pending Projects" value={stats.pendingProjects} icon={ClipboardList} colorClass="bg-teal-600" />
        <KPICard title="Present Today" value={stats.staffCount} subtext={`of ${stats.staffCount}`} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title="Absent Today" value={0} icon={UserX} colorClass="bg-red-500" />
      </div>

      {/* 7. DUES ANALYSIS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm rounded-[2rem] bg-[#FFEBEE]/40 ring-1 ring-red-100/50">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Customer Due</p>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">৳{stats.customerDue.toLocaleString()}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stats.dueCustomersCount} Customers</p>
            </div>
            <div className="w-16 h-16 rounded-[1.5rem] bg-red-500 text-white flex items-center justify-center shadow-2xl shadow-red-200">
               <ArrowDownRight className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-[2rem] bg-[#FFF3E0]/40 ring-1 ring-orange-100/50">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Supplier Due</p>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">৳{stats.supplierDue.toLocaleString()}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stats.dueSuppliersCount} Suppliers</p>
            </div>
            <div className="w-16 h-16 rounded-[1.5rem] bg-orange-600 text-white flex items-center justify-center shadow-2xl shadow-orange-200">
               <ArrowUpRight className="h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 8. PROJECT BILLING SUMMARY */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
           <div className="h-6 w-1 bg-teal-500 rounded-full" />
           <FolderOpen className="h-5 w-5 text-teal-600" />
           <h3 className="text-sm font-black uppercase text-slate-700 tracking-widest">Project Billing Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <KPICard title="Total Project Bill" value={`৳${stats.projectBill.toLocaleString()}`} subtext={`${projects?.length || 0} Projects`} icon={Receipt} colorClass="bg-teal-600" />
          <KPICard title="Total Project Paid" value={`৳${stats.projectPaid.toLocaleString()}`} icon={TrendingUp} colorClass="bg-green-600" />
          <KPICard title="Project Due" value={`৳${stats.projectDue.toLocaleString()}`} subtext={`${stats.pendingProjects} Pending`} icon={AlertCircle} colorClass="bg-red-500" />
        </div>
      </div>

      {/* 9. LOW STOCK ALERT SECTION */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-2">
           <div className="h-6 w-1 bg-red-500 rounded-full" />
           <AlertCircle className="h-5 w-5 text-red-600" />
           <h3 className="text-sm font-black uppercase text-slate-700 tracking-widest">Low Stock Alert</h3>
        </div>
        <Card className="border-none shadow-sm rounded-[2.5rem] bg-[#FFEBEE]/30 ring-1 ring-red-100 overflow-hidden">
           <CardContent className="p-6 space-y-3">
              {stats.lowStockItems.length > 0 ? (
                stats.lowStockItems.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-red-50 shadow-sm group hover:scale-[1.01] transition-transform">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
                         <Box className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Model: {item.sku || 'N/A'}</p>
                      </div>
                    </div>
                    <Badge variant="destructive" className="h-8 rounded-xl font-black text-[11px] px-4 shadow-lg shadow-red-100">
                      {item.currentStock} {item.unit || 'Pcs'}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center opacity-40">
                   <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-600" />
                   <p className="text-[10px] font-black uppercase tracking-[0.4em]">Inventory levels synchronized and healthy</p>
                </div>
              )}
           </CardContent>
        </Card>
      </div>

      {/* 10. FLOATING ACTION BUTTON (FAB) MENU */}
      <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end gap-4">
        {/* Backdrop for open menu */}
        {isFabOpen && (
          <div 
            className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[-1] pointer-events-auto transition-all"
            onClick={() => setIsFabOpen(false)}
          />
        )}

        {/* Quick Actions List */}
        <div className={cn(
          "flex flex-col items-end gap-3 transition-all duration-300 transform origin-bottom mb-2",
          isFabOpen ? "scale-100 opacity-100 translate-y-0" : "scale-75 opacity-0 translate-y-10 pointer-events-none"
        )}>
          {QUICK_ACTIONS.map((action, i) => (
            <Link 
              key={i} 
              href={action.path}
              onClick={() => setIsFabOpen(false)}
              className="flex items-center gap-3 transition-all hover:scale-105 active:scale-95 group"
              style={{ transitionDelay: `${isFabOpen ? (QUICK_ACTIONS.length - i) * 50 : 0}ms` }}
            >
              <div className="bg-white pl-6 pr-2 py-2 rounded-2xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.15)] border border-slate-100 flex items-center gap-5 min-w-[180px] justify-between">
                <span className="text-[12px] font-black text-slate-600 uppercase tracking-tight">{action.label}</span>
                <div className={cn("w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform", action.color)}>
                  <action.icon className="h-5 w-5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Main Floating Toggle Button */}
        <Button 
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={cn(
            "w-16 h-16 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-none p-0 flex items-center justify-center transition-all duration-500 active:scale-90",
            isFabOpen ? "bg-slate-900 rotate-90" : "bg-[#EF4444] hover:bg-[#DC2626]"
          )}
        >
          {isFabOpen ? (
            <Plus className="h-8 w-8 text-white rotate-45 transition-transform" />
          ) : (
            <Plus className="h-8 w-8 text-white rotate-0 transition-transform" />
          )}
        </Button>
      </div>
    </div>
  )
}
