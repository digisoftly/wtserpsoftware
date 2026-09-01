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
    const todayIncome = invoices?.filter(i => i.lastPaymentDate === today).reduce((sum, i) => sum + (i.paidAmount || 0), 0) || 0;
    const monthlyIncome = invoices?.filter(i => i.lastPaymentDate?.startsWith(thisMonth)).reduce((sum, i) => sum + (i.paidAmount || 0), 0) || 0;

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
      todayIncome,
      monthlyIncome,
      totalIncome,
      pendingIncome: customerDue,
      todayExpense,
      monthlyExpense,
      totalExpense,
      pendingExpense: 0, 
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
      pendingProjects: projects?.filter(p => p.status === 'Pending').length || 0,
      activeServiceContracts: contracts?.filter(c => c.status === 'active').length || 0,
      staffPresent: staff?.length || 0, 
    };
  }, [invoices, purchases, expenses, quotations, products, projects, staff, contracts, serials]);

  const QUICK_ACTIONS = [
    { label: t('sales'), icon: ShoppingCart, color: "bg-[#22C55E]", path: "/sales/new" },
    { label: t('purchases'), icon: Package, color: "bg-[#F97316]", path: "/purchases/new" },
    { label: t('quotations'), icon: FileText, color: "bg-[#A855F7]", path: "/quotations/new" },
    { label: t('customers'), icon: UserPlus, color: "bg-[#06B6D4]", path: "/customers/new" },
    { label: t('suppliers'), icon: Truck, color: "bg-[#F59E0B]", path: "/suppliers" },
    { label: t('projectBilling'), icon: Briefcase, color: "bg-[#14B8A6]", path: "/projects/new" },
    { label: t('payments'), icon: CreditCard, color: "bg-[#6366F1]", path: "/payments/new" },
  ];

  const renderSectionHeader = (title: string) => (
    <div className="flex items-center gap-3 mb-3 md:mb-4 mt-6 md:mt-8 first:mt-0 px-1">
      <div className="h-1 w-8 md:w-12 bg-blue-600 rounded-full" />
      <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t(title)}</h2>
    </div>
  );

  // APP-LIKE GRID: 2 Columns Mobile, 3 Tablet, 4 Desktop
  const gridClass = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4";

  return (
    <div className="relative space-y-4 md:space-y-6 pb-24 md:pb-20 touch-scroll">
      <div className="flex items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">{t('dashboard')}</h1>
          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{t('happeningToday')}</p>
        </div>
        <Button variant="outline" size="sm" className="h-8 md:h-9 rounded-full gap-1.5 md:gap-2 font-black text-[9px] md:text-[10px] uppercase tracking-widest bg-white shadow-sm" onClick={() => window.location.reload()}>
          <RefreshCw className={cn("h-3 w-3 md:h-3.5 md:w-3.5 text-blue-600", isLoading && "animate-spin")} /> {t('refreshTerminal')}
        </Button>
      </div>

      {/* SALES */}
      {renderSectionHeader('salesOverview')}
      <div className={gridClass}>
        <KPICard isLoading={isLoading} title="todaySales" value={formatCurrency(stats.todaySales)} icon={ShoppingCart} colorClass="bg-green-600" />
        <KPICard isLoading={isLoading} title="monthlySales" value={formatCurrency(stats.monthlySales)} icon={TrendingUp} colorClass="bg-blue-600" />
        <KPICard isLoading={isLoading} title="totalSales" value={formatCurrency(stats.totalSales)} icon={BarChart3} colorClass="bg-indigo-600" />
        <KPICard isLoading={isLoading} title="netProfit" value={formatCurrency(stats.netProfit)} icon={DollarSign} colorClass="bg-emerald-600" />
      </div>

      {/* QUOTATIONS */}
      {renderSectionHeader('quotationOverview')}
      <div className={gridClass}>
        <KPICard isLoading={isLoading} title="totalQuotations" value={stats.totalQuotations} icon={FileText} colorClass="bg-amber-600" />
        <KPICard isLoading={isLoading} title="activeQuotations" value={stats.activeQuotations} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard isLoading={isLoading} title="pendingQuotations" value={stats.pendingQuotations} icon={Clock} colorClass="bg-orange-600" />
        <KPICard isLoading={isLoading} title="cancelledQuotations" value={stats.cancelledQuotations} icon={XCircle} colorClass="bg-red-600" />
      </div>

      {/* PURCHASES */}
      {renderSectionHeader('purchaseOverview')}
      <div className={gridClass}>
        <KPICard isLoading={isLoading} title="todayPurchase" value={formatCurrency(stats.todayPurchase)} icon={Package} colorClass="bg-blue-600" />
        <KPICard isLoading={isLoading} title="monthlyPurchase" value={formatCurrency(stats.monthlyPurchase)} icon={Calendar} colorClass="bg-indigo-600" />
        <KPICard isLoading={isLoading} title="totalPurchase" value={formatCurrency(stats.totalPurchase)} icon={Archive} colorClass="bg-blue-700" />
        <KPICard isLoading={isLoading} title="pendingPurchase" value={stats.pendingPurchase} icon={History} colorClass="bg-orange-600" />
      </div>

      {/* INCOME */}
      {renderSectionHeader('incomeOverview')}
      <div className={gridClass}>
        <KPICard isLoading={isLoading} title="todayIncome" value={formatCurrency(stats.todayIncome)} icon={TrendingUp} colorClass="bg-green-600" />
        <KPICard isLoading={isLoading} title="monthlyIncome" value={formatCurrency(stats.monthlyIncome)} icon={Activity} colorClass="bg-emerald-600" />
        <KPICard isLoading={isLoading} title="totalIncome" value={formatCurrency(stats.totalIncome)} icon={Wallet} colorClass="bg-green-700" />
        <KPICard isLoading={isLoading} title="pendingIncome" value={formatCurrency(stats.pendingIncome)} icon={Clock} colorClass="bg-amber-600" />
      </div>

      {/* EXPENSE */}
      {renderSectionHeader('expenseOverview')}
      <div className={gridClass}>
        <KPICard isLoading={isLoading} title="todayExpense" value={formatCurrency(stats.todayExpense)} icon={TrendingDown} colorClass="bg-red-600" />
        <KPICard isLoading={isLoading} title="monthlyExpense" value={formatCurrency(stats.monthlyExpense)} icon={Calendar} colorClass="bg-rose-600" />
        <KPICard isLoading={isLoading} title="totalExpense" value={formatCurrency(stats.totalExpense)} icon={Receipt} colorClass="bg-red-700" />
        <KPICard isLoading={isLoading} title="pendingExpense" value={formatCurrency(stats.pendingExpense)} icon={AlertCircle} colorClass="bg-orange-600" />
      </div>

      {/* DUES */}
      {renderSectionHeader('dueSummary')}
      <div className={gridClass}>
        <KPICard isLoading={isLoading} title="customerDue" value={formatCurrency(stats.customerDue)} icon={Users} colorClass="bg-red-600" />
        <KPICard isLoading={isLoading} title="salesDue" value={formatCurrency(stats.salesDue)} icon={ArrowDownRight} colorClass="bg-orange-600" />
        <KPICard isLoading={isLoading} title="purchaseDue" value={formatCurrency(stats.purchaseDue)} icon={ArrowUpRight} colorClass="bg-amber-600" />
        <KPICard isLoading={isLoading} title="supplierDue" value={formatCurrency(stats.supplierDue)} icon={Truck} colorClass="bg-red-700" />
      </div>

      {/* PROJECTS */}
      {renderSectionHeader('projectBillingSummary')}
      <div className={gridClass}>
        <KPICard isLoading={isLoading} title="totalProjectBill" value={formatCurrency(stats.totalProjectBill)} icon={FileBarChart} colorClass="bg-teal-600" />
        <KPICard isLoading={isLoading} title="totalProjectPaid" value={formatCurrency(stats.totalProjectPaid)} icon={CheckCircle2} colorClass="bg-emerald-600" />
        <KPICard isLoading={isLoading} title="projectDue" value={formatCurrency(stats.projectDue)} icon={AlertCircle} colorClass="bg-red-600" />
        <KPICard isLoading={isLoading} title="activeProjects" value={stats.activeProjects} icon={Briefcase} colorClass="bg-blue-600" />
      </div>

      {/* OPERATIONS */}
      {renderSectionHeader('operationsOverview')}
      <div className={gridClass}>
        <KPICard isLoading={isLoading} title="lowStockItems" value={stats.lowStockItems} icon={Box} colorClass="bg-red-600" />
        <KPICard isLoading={isLoading} title="serialInventory" value={stats.serialInventory} icon={Scan} colorClass="bg-purple-600" />
        <KPICard isLoading={isLoading} title="pendingProjects" value={stats.pendingProjects} icon={ClipboardList} colorClass="bg-indigo-600" />
        <KPICard isLoading={isLoading} title="activeServiceContracts" value={stats.activeServiceContracts} icon={Wrench} colorClass="bg-teal-600" />
      </div>

      {/* FAB Quick Actions - Mobile friendly size */}
      <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[100] flex flex-col items-end gap-4">
        {isFabOpen && <div className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[-1] pointer-events-auto transition-all" onClick={() => setIsFabOpen(false)} />}
        <div className={cn("flex flex-col items-end gap-3 transition-all duration-300 transform origin-bottom mb-2", isFabOpen ? "scale-100 opacity-100 translate-y-0" : "scale-75 opacity-0 translate-y-10 pointer-events-none")}>
          {QUICK_ACTIONS.map((action, i) => (
            <Link key={i} href={action.path} onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 transition-all hover:scale-105 active:scale-95 group" style={{ transitionDelay: `${isFabOpen ? (QUICK_ACTIONS.length - i) * 50 : 0}ms` }}>
              <div className="bg-white pl-4 md:pl-6 pr-2 py-2 rounded-2xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.15)] border border-slate-100 flex items-center gap-3 md:gap-5 min-w-[150px] md:min-w-[180px] justify-between">
                <span className="text-[10px] md:text-[12px] font-black text-slate-600 uppercase tracking-tight">{action.label}</span>
                <div className={cn("w-8 h-8 md:w-10 md:h-10 rounded-xl text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform", action.color)}><action.icon className="h-3.5 w-3.5 md:h-5 md:w-5" /></div>
              </div>
            </Link>
          ))}
        </div>
        <Button onClick={() => setIsFabOpen(!isFabOpen)} className={cn("w-14 h-14 md:w-16 md:h-16 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-none p-0 flex items-center justify-center transition-all duration-500 active:scale-90", isFabOpen ? "bg-slate-900 rotate-90" : "bg-[#EF4444] hover:bg-[#DC2626]")}>
          <Plus className={cn("h-7 w-7 md:h-8 md:w-8 text-white transition-transform", isFabOpen ? "rotate-45" : "rotate-0")} />
        </Button>
      </div>
    </div>
  )
}