
"use client"

import * as React from "react"
import { 
  TrendingUp, 
  ShoppingCart, 
  CreditCard, 
  Users, 
  AlertTriangle, 
  ClipboardList,
  CalendarDays,
  Briefcase,
  Loader2,
  Target,
  LifeBuoy,
  Receipt
} from "lucide-react"
import { KPICard } from "@/components/dashboard/kpi-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"

export default function Dashboard() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();

  // Queries for dynamic data
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "sales_invoices"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
  }, [db, companyId, branchId]);
  const { data: recentInvoices, isLoading: invoicesLoading } = useCollection(invoicesQuery);

  const leadsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "leads");
  }, [db, companyId, branchId]);
  const { data: leads } = useCollection(leadsQuery);

  const ticketsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "tickets");
  }, [db, companyId, branchId]);
  const { data: tickets } = useCollection(ticketsQuery);

  const expensesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "expenses");
  }, [db, companyId, branchId]);
  const { data: expenses } = useCollection(expensesQuery);

  const allInvoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "sales_invoices");
  }, [db, companyId, branchId]);
  const { data: allInvoices } = useCollection(allInvoicesQuery);

  // OPTIMIZATION: Memoized KPI values to prevent lag on dashboard load
  const financialStats = React.useMemo(() => {
    const totalSales = allInvoices?.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0;
    const totalExpenses = expenses?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    const netProfit = totalSales - totalExpenses;
    return { totalSales, totalExpenses, netProfit };
  }, [allInvoices, expenses]);

  const kpis = React.useMemo(() => [
    { title: "Total Revenue", value: `৳${financialStats.totalSales.toLocaleString()}`, icon: TrendingUp, colorClass: "bg-blue-500" },
    { title: "Net Profit", value: `৳${financialStats.netProfit.toLocaleString()}`, icon: CreditCard, colorClass: "bg-green-500" },
    { title: "Pipeline Leads", value: leads?.length || 0, icon: Target, colorClass: "bg-rose-500" },
    { title: "Active Tickets", value: tickets?.filter(t => t.status === 'open').length || 0, icon: LifeBuoy, colorClass: "bg-indigo-500" },
    { title: "Monthly Expense", value: `৳${financialStats.totalExpenses.toLocaleString()}`, icon: Receipt, colorClass: "bg-red-500" },
    { title: "Active Projects", value: "0", icon: ClipboardList, colorClass: "bg-teal-500" },
    { title: "Active Clients", value: "0", icon: Users, colorClass: "bg-cyan-500" },
    { title: "Employees", value: "0", icon: Briefcase, colorClass: "bg-violet-500" },
  ], [financialStats, leads, tickets]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">Enterprise Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time ecosystem overview for {branchId?.replace('-', ' ')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="bg-white rounded-full">Report PDF</Button>
          <Button className="bg-primary hover:bg-primary/90 rounded-full px-6">Global Search</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {kpis.map((kpi, idx) => (
          <KPICard key={idx} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-lg">Sales Activity</CardTitle>
              <CardDescription className="text-xs">Latest transactions & revenue streams</CardDescription>
            </div>
            <Button variant="ghost" size="sm">View Ledger</Button>
          </CardHeader>
          <CardContent className="p-0 md:p-6 md:pt-0">
            {invoicesLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : recentInvoices && recentInvoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-bold text-xs uppercase">{inv.invoiceNumber}</TableCell>
                      <TableCell className="text-xs">Client ID: {inv.customerId.slice(-4)}</TableCell>
                      <TableCell className="font-bold text-xs">৳{inv.totalAmount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={cn(inv.status === "paid" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 text-muted-foreground text-sm">Waiting for first sale...</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-xl bg-indigo-50/30">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Lead Pipeline</CardTitle>
            <CardDescription className="text-xs">Potential business growth</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {leads && leads.length > 0 ? (
              leads.slice(0, 4).map((lead, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
                  <div>
                    <p className="text-xs font-bold">{lead.name}</p>
                    <p className="text-[10px] text-muted-foreground">{lead.company || "Individual"}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] uppercase border-indigo-200 text-indigo-700">{lead.status}</Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground italic">No leads captured yet.</div>
            )}
            <Button variant="link" className="w-full text-xs text-indigo-600">Open CRM</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
