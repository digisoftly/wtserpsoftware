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
  LayoutDashboard,
  BarChart3,
  BrainCircuit,
  XCircle,
  TrendingDown,
  Activity,
  Calendar,
  History,
  FileBarChart,
  UserCheck,
  UserPlus2,
  PlaneTakeoff,
  ShieldCheck,
  ShieldAlert,
  Archive,
  Scan,
  Wrench
} from "lucide-react"
import { KPICard } from "@/components/dashboard/kpi-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function Dashboard() {
  const { branchId, companyId } = useTenant();
  const db = useFirestore();
  const { t, formatCurrency } = useTranslation();
  const [isFabOpen, setIsFabOpen] = React.useState(false);

  // Data Subscriptions
  const invoicesQuery = useMemoFirebase(() => (!db || !companyId || !branchId) ? null : collection(db, "companies", companyId, "branches", branchId, "sales_invoices"), [db, companyId, branchId]);
  const { data: invoices, isLoading: invLoading } = useCollection(invoicesQuery);

  const quotesQuery = useMemoFirebase(() => (!db || !companyId || !branchId) ? null : collection(db, "companies", companyId, "branches", branchId, "quotations"), [db, companyId, branchId]);
  const { data: quotations, isLoading: qLoading } = useCollection(quotesQuery);

  const productsQuery = useMemoFirebase(() => (!db || !companyId || !branchId) ? null : collection(db, "companies", companyId, "branches", branchId, "products"), [db, companyId, branchId]);
  const { data: products, isLoading: prodLoading } = useCollection(productsQuery);

  const customersQuery = useMemoFirebase(() => (!db || !companyId || !branchId) ? null : collection(db, "companies", companyId, "branches", branchId, "customers"), [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  const projectsQuery = useMemoFirebase(() => (!db || !companyId || !branchId) ? null : collection(db, "companies", companyId, "branches", branchId, "projects"), [db, companyId, branchId]);
  const { data: projects } = useCollection(projectsQuery);

  const expensesQuery = useMemoFirebase(() => (!db || !companyId || !branchId) ? null : collection(db, "companies", companyId, "branches", branchId, "expenses"), [db, companyId, branchId]);
  const { data: expenses } = useCollection(expensesQuery);

  const purchasesQuery = useMemoFirebase(() => (!db || !companyId || !branchId) ? null : collection(db, "companies", companyId, "branches", branchId, "purchase_orders"), [db, companyId, branchId]);
  const { data: purchases } = useCollection(purchasesQuery);

  const staffQuery = useMemoFirebase(() => (!db || !companyId || !branchId) ? null : collection(db, "companies", companyId, "branches", branchId, "employees"), [db, companyId, branchId]);
  const { data: staff } = useCollection(staffQuery);

  const contractsQuery = useMemoFirebase(() => (!db || !companyId || !branchId) ? null : collection(db, "companies", companyId, "branches", branchId, "service_contracts"), [db, companyId, branchId]);
  const { data: contracts } = useCollection(contractsQuery);

  const serialsQuery = useMemoFirebase(() => (!db || !companyId || !branchId) ? null : collection(db, "companies", companyId, "branches", branchId, "serial_numbers"), [db, companyId, branchId]);
  const { data: serials } = useCollection(serialsQuery);

  const isLoading = invLoading || qLoading || prodLoading;

  // Aggregate Calculations
  const stats = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);

    // Sales
    const totalSales = invoices?.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0;
    const todaySales = invoices?.filter(i => i.invoiceDate === today).reduce((sum, i) => sum + (i.totalAmount || 0), 0) || 0;
    const monthlySales = invoices?.filter(i => i.invoiceDate?.startsWith(thisMonth)).reduce((sum, i) => sum + (i.totalAmount || 0), 0) || 0;

    // Purchase
    const totalPurchase = purchases?.reduce((sum, p) => sum + (p.totalAmount || 0), 0) || 0;
    const todayPurchase = purchases?.filter(p => p.orderDate === today).reduce((sum, p) => sum + (p.totalAmount || 0), 0) || 0;
    const monthlyPurchase = purchases?.filter(p => p.orderDate?.startsWith(thisMonth)).reduce((sum, i) => sum + (i.totalAmount || 0), 0) || 0;

    // Expenses
    const totalExpense = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    const todayExpense = expenses?.filter(e => e.expenseDate === today).reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    const monthlyExpense = expenses?.filter(e => e.expenseDate?.startsWith(thisMonth)).reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

    const totalIncome = invoices?.reduce((sum, i) => sum + (i.paidAmount || 0), 0) || 0;
    const customerDue = invoices?.reduce((sum, i) => sum + (i.balanceDue || 0), 0) || 0;
    const supplierDue = purchases?.reduce((sum, p) => sum + (p.balanceDue || 0), 0) || 0;

    const projectBill = projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;
    const projectPaid = projects?.reduce((sum, p) => sum + (p.paidAmount || 0), 0) || 0;

    return {
      todaySales,
      monthlySales,
      totalSales,
      netProfit: totalSales - (totalPurchase + totalExpense),
      totalQuotations: quotations?.length || 0,
      activeQuotations: quotations?.filter(q => q.status === 'approved').length || 0,
      pendingQuotations: quotations?.filter(q => q.status === 'draft').length || 0,
      cancelledQuotations: quotations?.filter(q => q.status === 'rejected' || q.status === 'expired').length || 0,
      todayPurchase,
      monthlyPurchase,
      totalPurchase,
      pendingPurchase: purchases?.filter(p => p.status === 'pending').length || 0,
      totalIncome,
      customerDue,
      salesDue: customerDue,
      purchaseDue: supplierDue,
      supplierDue,
      totalProjectBill: projectBill,
      totalProjectPaid: projectPaid,
      projectDue: projectBill - projectPaid,
      activeProjects: projects?.filter(p => p.status === 'In Progress').length || 0,
      lowStockItems: products?.filter(p => (p.currentStock || 0) <= (p.minStockLevel || 5)).length || 0,
      serialInventory: serials?.length || 0,
      activeServiceContracts: contracts?.filter(c => c.status === 'active').length || 0,
    };
  }, [invoices, purchases, expenses, quotations, products, projects, staff, contracts, serials]);

  const QUICK_ACTIONS = [
    { label: t('sales'), icon: ShoppingCart, color: "bg-[#22C55E]", path: "/sales/new" },
    { label: t('purchases'), icon: Package, color: "bg-[#F97316]", path: "/purchases/new" },
    { label: t('quotations'), icon: FileText, color: "bg-[#A855F7]", path: "/quotations/new" },
    { label: t('customers'), icon: UserPlus, color: "bg-[#06B6D4]", path: "/customers/new" },
    { label: t('projectBilling'), icon: Briefcase, color: "bg-[#14B8A6]", path: "/projects/new" },
  ];

  // Mobile: 2, Tablet: 3, Desktop: 4
  const gridClass = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-4";

  const renderSectionHeader = (title: string) => (
    <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0 px-1">
      <div className="h-1 w-6 md:w-10 bg-blue-600 rounded-full" />
      <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t(title)}</h2>
    </div>
  );

  return (
    <div className="relative space-y-4 pb-24 touch-scroll">
      <div className="flex items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">{t('dashboard')}</h1>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{t('happeningToday')}</p>
        </div>
        <Button variant="outline" size="sm" className="h-9 rounded-full gap-2 font-black text-[10px] uppercase bg-white shadow-sm" onClick={() => window.location.reload()}>
          <RefreshCw className={cn("h-3.5 w-3.5 text-blue-600", isLoading && "animate-spin")} />
        </Button>
      </div>

      {renderSectionHeader('salesOverview')}
      <div className={gridClass}>
        <KPICard isLoading={isLoading} title="todaySales" value={formatCurrency(stats.todaySales)} icon={ShoppingCart} colorClass="bg-green-600" />
        <KPICard isLoading={isLoading} title="monthlySales" value={formatCurrency(stats.monthlySales)} icon={TrendingUp} colorClass="bg-blue-600" />
        <KPICard isLoading={isLoading} title="totalSales" value={formatCurrency(stats.totalSales)} icon={BarChart3} colorClass="bg-indigo-600" />
        <KPICard isLoading={isLoading} title="netProfit" value={formatCurrency(stats.netProfit)} icon={DollarSign} colorClass="bg-emerald-600" />
      </div>

      {renderSectionHeader('quotationOverview')}
      <div className={gridClass}>
        <KPICard isLoading={isLoading} title="totalQuotations" value={stats.totalQuotations} icon={FileText} colorClass="bg-amber-600" />
        <KPICard isLoading={isLoading} title="activeQuotations" value={stats.activeQuotations} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard isLoading={isLoading} title="pendingQuotations" value={stats.pendingQuotations} icon={Clock} colorClass="bg-orange-600" />
        <KPICard isLoading={isLoading} title="cancelledQuotations" value={stats.cancelledQuotations} icon={XCircle} colorClass="bg-red-600" />
      </div>

      {renderSectionHeader('purchaseOverview')}
      <div className={gridClass}>
        <KPICard isLoading={isLoading} title="todayPurchase" value={formatCurrency(stats.todayPurchase)} icon={Package} colorClass="bg-blue-600" />
        <KPICard isLoading={isLoading} title="monthlyPurchase" value={formatCurrency(stats.monthlyPurchase)} icon={Calendar} colorClass="bg-indigo-600" />
        <KPICard isLoading={isLoading} title="totalPurchase" value={formatCurrency(stats.totalPurchase)} icon={Archive} colorClass="bg-blue-700" />
        <KPICard isLoading={isLoading} title="pendingPurchase" value={stats.pendingPurchase} icon={History} colorClass="bg-orange-600" />
      </div>

      {renderSectionHeader('operationsOverview')}
      <div className={gridClass}>
        <KPICard isLoading={isLoading} title="lowStockItems" value={stats.lowStockItems} icon={Box} colorClass="bg-red-600" />
        <KPICard isLoading={isLoading} title="serialInventory" value={stats.serialInventory} icon={Scan} colorClass="bg-purple-600" />
        <KPICard isLoading={isLoading} title="activeServiceContracts" value={stats.activeServiceContracts} icon={Wrench} colorClass="bg-teal-600" />
        <KPICard isLoading={isLoading} title="activeProjects" value={stats.activeProjects} icon={Briefcase} colorClass="bg-indigo-600" />
      </div>

      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
        {isFabOpen && <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[-1]" onClick={() => setIsFabOpen(false)} />}
        <div className={cn("flex flex-col items-end gap-3 transition-all transform origin-bottom", isFabOpen ? "scale-100 opacity-100 translate-y-0" : "scale-75 opacity-0 translate-y-10 pointer-events-none")}>
          {QUICK_ACTIONS.map((action, i) => (
            <Link key={i} href={action.path} onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 active:scale-95 group">
              <div className="bg-white pl-4 pr-2 py-2 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 min-w-[150px] justify-between">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{action.label}</span>
                <div className={cn("w-8 h-8 rounded-xl text-white flex items-center justify-center shadow-lg", action.color)}><action.icon className="h-4 w-4" /></div>
              </div>
            </Link>
          ))}
        </div>
        <Button onClick={() => setIsFabOpen(!isFabOpen)} className={cn("w-14 h-14 rounded-full shadow-2xl border-none p-0 flex items-center justify-center transition-all duration-300", isFabOpen ? "bg-slate-900 rotate-90" : "bg-red-500 hover:bg-red-600")}>
          <Plus className={cn("h-7 w-7 text-white transition-transform", isFabOpen ? "rotate-45" : "rotate-0")} />
        </Button>
      </div>
    </div>
  )
}