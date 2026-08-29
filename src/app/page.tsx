
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
  CreditCard,
  LayoutDashboard
} from "lucide-react"
import { KPICard } from "@/components/dashboard/kpi-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function Dashboard() {
  const { branchId, companyId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isFabOpen, setIsFabOpen] = React.useState(false);

  // 1. System Config for Dynamic Dashboard
  const configRef = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return doc(db, "companies", companyId, "system", "config");
  }, [db, companyId]);
  const { data: config } = useDoc(configRef);

  // 2. Data Subscriptions
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

  // 3. Aggregate Calculations
  const stats: any = React.useMemo(() => {
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
      totalSales: `৳${totalSales.toLocaleString()}`,
      todaySales: `৳${todaySales.toLocaleString()}`,
      monthlySales: `৳${monthlySales.toLocaleString()}`,
      totalPurchase: `৳${totalPurchase.toLocaleString()}`,
      netProfit: `৳${netProfit.toLocaleString()}`,
      totalExpense: `৳${totalExpense.toLocaleString()}`,
      totalCustomers: customers?.length || 0,
      totalSuppliers: suppliers?.length || 0,
      lowStockCount: lowStockItems.length,
      pendingProjects: projects?.filter(p => !['Completed', 'completed'].includes(p.status)).length || 0,
      customerDue: `৳${customerDue.toLocaleString()}`,
      supplierDue: `৳${supplierDue.toLocaleString()}`,
      staffCount,
      monthName,
      formattedToday,
      lowStockItems
    };
  }, [invoices, purchases, expenses, customers, suppliers, products, projects, staff]);

  const dynamicCards = config?.dashboardKpiCards || [];

  const QUICK_ACTIONS = [
    { label: t('sales'), icon: ShoppingCart, color: "bg-[#22C55E]", path: "/sales/new" },
    { label: t('purchases'), icon: Package, color: "bg-[#F97316]", path: "/purchases/new" },
    { label: t('quotations'), icon: FileText, color: "bg-[#A855F7]", path: "/quotations/new" },
    { label: t('customers'), icon: UserPlus, color: "bg-[#06B6D4]", path: "/customers/new" },
    { label: t('suppliers'), icon: Truck, color: "bg-[#F59E0B]", path: "/suppliers" },
    { label: t('projectBilling'), icon: Briefcase, color: "bg-[#14B8A6]", path: "/projects/new" },
    { label: t('payments'), icon: CreditCard, color: "bg-[#6366F1]", path: "/payments/new" },
  ];

  return (
    <div className="relative space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">{t('dashboard')}</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Enterprise Analytical Interface</p>
        </div>
        <Button variant="outline" size="sm" className="h-10 rounded-full gap-2 font-black text-[10px] uppercase tracking-widest bg-white shadow-sm hover:bg-slate-50" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 text-blue-600" /> Refresh Terminal
        </Button>
      </div>

      {/* DYNAMIC KPI GRID */}
      {dynamicCards.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dynamicCards.map((card: any) => (
            <KPICard 
              key={card.id}
              {...card}
              value={stats[card.valueKey] || "---"}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard title="Total Sales" value={stats.totalSales} icon={ShoppingCart} colorClass="bg-green-600" />
          <KPICard title="Today Sales" value={stats.todaySales} subtext={stats.formattedToday} icon={DollarSign} colorClass="bg-blue-600" />
          <KPICard title="Total Orders" value={stats.totalPurchase} icon={Package} colorClass="bg-orange-600" />
          <KPICard title="Net Profit" value={stats.netProfit} icon={TrendingUp} colorClass="bg-green-500" />
        </div>
      )}

      {/* ... keeping the remaining sections for visual consistency ... */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm rounded-[2rem] bg-[#FFEBEE]/40 ring-1 ring-red-100/50">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">{t('customer')} Due</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">{stats.customerDue}</h2>
            </div>
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] bg-red-500 text-white flex items-center justify-center shadow-2xl shadow-red-200 shrink-0">
               <ArrowDownRight className="h-6 w-6 md:h-8 md:w-8" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-[2rem] bg-[#FFF3E0]/40 ring-1 ring-orange-100/50">
          <CardContent className="p-8 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest">{t('suppliers')} Due</p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">{stats.supplierDue}</h2>
            </div>
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] bg-orange-600 text-white flex items-center justify-center shadow-2xl shadow-orange-200 shrink-0">
               <ArrowUpRight className="h-6 w-6 md:h-8 md:w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] flex flex-col items-end gap-4">
        {isFabOpen && (
          <div 
            className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[-1] pointer-events-auto transition-all"
            onClick={() => setIsFabOpen(false)}
          />
        )}

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
              <div className="bg-white pl-4 md:pl-6 pr-2 py-2 rounded-2xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.15)] border border-slate-100 flex items-center gap-3 md:gap-5 min-w-[160px] md:min-w-[180px] justify-between">
                <span className="text-[11px] md:text-[12px] font-black text-slate-600 uppercase tracking-tight">{action.label}</span>
                <div className={cn("w-9 h-9 md:w-10 md:h-10 rounded-xl text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform", action.color)}>
                  <action.icon className="h-4 w-4 md:h-5 md:w-5" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Button 
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={cn(
            "w-14 h-14 md:w-16 md:h-16 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-none p-0 flex items-center justify-center transition-all duration-500 active:scale-90",
            isFabOpen ? "bg-slate-900 rotate-90" : "bg-[#EF4444] hover:bg-[#DC2626]"
          )}
        >
          <Plus className={cn("h-7 w-7 md:h-8 md:w-8 text-white transition-transform", isFabOpen ? "rotate-45" : "rotate-0")} />
        </Button>
      </div>
    </div>
  )
}
