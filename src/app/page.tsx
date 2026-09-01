"use client"

import * as React from "react"
import { 
  ShoppingCart, 
  Package, 
  Wallet, 
  Users, 
  Truck, 
  AlertCircle, 
  ClipboardList, 
  CheckCircle2, 
  DollarSign, 
  Clock, 
  Receipt, 
  TrendingUp,
  RefreshCw,
  Box,
  Plus,
  FileText,
  UserPlus,
  Briefcase,
  BarChart3,
  XCircle,
  Calendar,
  Archive,
  Scan,
  Wrench
} from "lucide-react"
import { KPICard } from "@/components/dashboard/kpi-card"
import { Button } from "@/components/ui/button"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function Dashboard() {
  const { branchId, companyId } = useTenant();
  const db = useFirestore();
  const { t, formatCurrency } = useTranslation();
  const [isFabOpen, setIsFabOpen] = React.useState(false);

  // Data Subscriptions (Logic unchanged)
  const invoicesQuery = useMemoFirebase(() => (!db || !companyId || !branchId) ? null : collection(db, "companies", companyId, "branches", branchId, "sales_invoices"), [db, companyId, branchId]);
  const { data: invoices, isLoading: invLoading } = useCollection(invoicesQuery);

  const quotesQuery = useMemoFirebase(() => (!db || !companyId || !branchId) ? null : collection(db, "companies", companyId, "branches", branchId, "quotations"), [db, companyId, branchId]);
  const { data: quotations, isLoading: qLoading } = useCollection(quotesQuery);

  const productsQuery = useMemoFirebase(() => (!db || !companyId || !branchId) ? null : collection(db, "companies", companyId, "branches", branchId, "products"), [db, companyId, branchId]);
  const { data: products, isLoading: prodLoading } = useCollection(productsQuery);

  const projectsQuery = useMemoFirebase(() => (!db || !companyId || !branchId) ? null : collection(db, "companies", companyId, "branches", branchId, "projects"), [db, companyId, branchId]);
  const { data: projects } = useCollection(projectsQuery);

  const expensesQuery = useMemoFirebase(() => (!db || !companyId || !branchId) ? null : collection(db, "companies", companyId, "branches", branchId, "expenses"), [db, companyId, branchId]);
  const { data: expenses } = useCollection(expensesQuery);

  const purchasesQuery = useMemoFirebase(() => (!db || !companyId || !branchId) ? null : collection(db, "companies", companyId, "branches", branchId, "purchase_orders"), [db, companyId, branchId]);
  const { data: purchases } = useCollection(purchasesQuery);

  const contractsQuery = useMemoFirebase(() => (!db || !companyId || !branchId) ? null : collection(db, "companies", companyId, "branches", branchId, "service_contracts"), [db, companyId, branchId]);
  const { data: contracts } = useCollection(contractsQuery);

  const serialsQuery = useMemoFirebase(() => (!db || !companyId || !branchId) ? null : collection(db, "companies", companyId, "branches", branchId, "serial_numbers"), [db, companyId, branchId]);
  const { data: serials } = useCollection(serialsQuery);

  const isLoading = invLoading || qLoading || prodLoading;

  const stats = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);

    const totalSales = invoices?.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0;
    const todaySales = invoices?.filter(i => i.invoiceDate === today).reduce((sum, i) => sum + (i.totalAmount || 0), 0) || 0;
    const monthlySales = invoices?.filter(i => i.invoiceDate?.startsWith(thisMonth)).reduce((sum, i) => sum + (i.totalAmount || 0), 0) || 0;
    const totalPurchase = purchases?.reduce((sum, p) => sum + (p.totalAmount || 0), 0) || 0;
    const totalExpense = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

    return {
      todaySales, monthlySales, totalSales,
      netProfit: totalSales - (totalPurchase + totalExpense),
      totalQuotations: quotations?.length || 0,
      activeQuotations: quotations?.filter(q => q.status === 'approved').length || 0,
      pendingQuotations: quotations?.filter(q => q.status === 'draft').length || 0,
      cancelledQuotations: quotations?.filter(q => q.status === 'expired' || q.status === 'rejected').length || 0,
      todayPurchase: purchases?.filter(p => p.orderDate === today).reduce((sum, p) => sum + (p.totalAmount || 0), 0) || 0,
      monthlyPurchase: purchases?.filter(p => p.orderDate?.startsWith(thisMonth)).reduce((sum, p) => sum + (p.totalAmount || 0), 0) || 0,
      totalPurchase,
      pendingPurchase: purchases?.filter(p => p.status === 'pending').length || 0,
      lowStockItems: products?.filter(p => (p.currentStock || 0) <= (p.minStockLevel || 5)).length || 0,
      serialInventory: serials?.length || 0,
      activeServiceContracts: contracts?.filter(c => c.status === 'active').length || 0,
      activeProjects: projects?.filter(p => p.status === 'In Progress').length || 0,
    };
  }, [invoices, purchases, expenses, quotations, products, projects, contracts, serials]);

  const QUICK_ACTIONS = [
    { label: t('sales'), icon: ShoppingCart, color: "bg-[#22C55E]", path: "/sales/new" },
    { label: t('purchases'), icon: Package, color: "bg-[#F97316]", path: "/purchases/new" },
    { label: t('quotations'), icon: FileText, color: "bg-[#A855F7]", path: "/quotations/new" },
    { label: t('customers'), icon: UserPlus, color: "bg-[#06B6D4]", path: "/customers/new" },
    { label: t('projectBilling'), icon: Briefcase, color: "bg-[#14B8A6]", path: "/projects/new" },
  ];

  const renderSection = (title: string, cards: React.ReactNode) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-1">
        <div className="h-1 w-8 bg-blue-600 rounded-full" />
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{t(title)}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        {cards}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-24 max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4 sticky top-0 z-20 bg-slate-50/80 backdrop-blur-md py-2 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">{t('dashboard')}</h1>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">{t('happeningToday')}</p>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 text-slate-400 hover:text-blue-600" onClick={() => window.location.reload()}>
          <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
        </Button>
      </div>

      {renderSection('salesOverview', (
        <>
          <KPICard isLoading={isLoading} title="todaySales" value={formatCurrency(stats.todaySales)} icon={ShoppingCart} colorClass="bg-green-600" />
          <KPICard isLoading={isLoading} title="monthlySales" value={formatCurrency(stats.monthlySales)} icon={TrendingUp} colorClass="bg-blue-600" />
          <KPICard isLoading={isLoading} title="totalSales" value={formatCurrency(stats.totalSales)} icon={BarChart3} colorClass="bg-indigo-600" />
          <KPICard isLoading={isLoading} title="netProfit" value={formatCurrency(stats.netProfit)} icon={DollarSign} colorClass="bg-emerald-600" />
        </>
      ))}

      {renderSection('quotationOverview', (
        <>
          <KPICard isLoading={isLoading} title="totalQuotations" value={stats.totalQuotations} icon={FileText} colorClass="bg-amber-600" />
          <KPICard isLoading={isLoading} title="activeQuotations" value={stats.activeQuotations} icon={CheckCircle2} colorClass="bg-green-600" />
          <KPICard isLoading={isLoading} title="pendingQuotations" value={stats.pendingQuotations} icon={Clock} colorClass="bg-orange-600" />
          <KPICard isLoading={isLoading} title="cancelledQuotations" value={stats.cancelledQuotations} icon={XCircle} colorClass="bg-red-600" />
        </>
      ))}

      {renderSection('purchaseOverview', (
        <>
          <KPICard isLoading={isLoading} title="todayPurchase" value={formatCurrency(stats.todayPurchase)} icon={Package} colorClass="bg-blue-600" />
          <KPICard isLoading={isLoading} title="monthlyPurchase" value={formatCurrency(stats.monthlyPurchase)} icon={Calendar} colorClass="bg-indigo-600" />
          <KPICard isLoading={isLoading} title="totalPurchase" value={formatCurrency(stats.totalPurchase)} icon={Archive} colorClass="bg-blue-700" />
          <KPICard isLoading={isLoading} title="pendingPurchase" value={stats.pendingPurchase} icon={Clock} colorClass="bg-orange-700" />
        </>
      ))}

      {renderSection('operationsOverview', (
        <>
          <KPICard isLoading={isLoading} title="lowStockItems" value={stats.lowStockItems} icon={Box} colorClass="bg-red-600" />
          <KPICard isLoading={isLoading} title="serialInventory" value={stats.serialInventory} icon={Scan} colorClass="bg-purple-600" />
          <KPICard isLoading={isLoading} title="activeServiceContracts" value={stats.activeServiceContracts} icon={Wrench} colorClass="bg-teal-600" />
          <KPICard isLoading={isLoading} title="activeProjects" value={stats.activeProjects} icon={ClipboardList} colorClass="bg-indigo-500" />
        </>
      ))}

      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
        {isFabOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[-1]" onClick={() => setIsFabOpen(false)} />}
        <div className={cn("flex flex-col items-end gap-3 transition-all transform origin-bottom", isFabOpen ? "scale-100 opacity-100 translate-y-0" : "scale-75 opacity-0 translate-y-10 pointer-events-none")}>
          {QUICK_ACTIONS.map((action, i) => (
            <Link key={i} href={action.path} onClick={() => setIsFabOpen(false)} className="flex items-center gap-3 active:scale-95 group">
              <div className="bg-white px-4 py-3 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] ring-1 ring-slate-100 flex items-center gap-4 min-w-[180px] justify-between">
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{action.label}</span>
                <div className={cn("w-9 h-9 rounded-xl text-white flex items-center justify-center shadow-lg", action.color)}><action.icon className="h-5 w-5" /></div>
              </div>
            </Link>
          ))}
        </div>
        <Button onClick={() => setIsFabOpen(!isFabOpen)} className={cn("w-16 h-16 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-none p-0 flex items-center justify-center transition-all duration-500", isFabOpen ? "bg-slate-900 rotate-90" : "bg-red-500 hover:bg-red-600")}>
          <Plus className={cn("h-8 w-8 text-white transition-transform", isFabOpen ? "rotate-45" : "rotate-0")} />
        </Button>
      </div>
    </div>
  );
}