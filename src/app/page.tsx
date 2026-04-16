"use client"

import * as React from "react"
import { TrendingUp, CreditCard, Target, LifeBuoy, Loader2, ArrowRight } from "lucide-react"
import { KPICard } from "@/components/dashboard/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"

export default function Dashboard() {
  const { branchId, companyId } = useTenant();
  const db = useFirestore();

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "sales_invoices"), orderBy("createdAt", "desc"), limit(5));
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

  const allInvoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "sales_invoices");
  }, [db, companyId, branchId]);
  const { data: allInvoices } = useCollection(allInvoicesQuery);

  const financialStats = React.useMemo(() => {
    const totalSales = allInvoices?.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0;
    const dues = allInvoices?.filter(i => i.status !== 'paid').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0;
    return { totalSales, dues };
  }, [allInvoices]);

  const kpis = [
    { title: "Revenue", value: `৳${financialStats.totalSales.toLocaleString()}`, icon: TrendingUp, colorClass: "bg-blue-600" },
    { title: "Due", value: `৳${financialStats.dues.toLocaleString()}`, icon: CreditCard, colorClass: "bg-orange-600" },
    { title: "Leads", value: leads?.length || 0, icon: Target, colorClass: "bg-rose-600" },
    { title: "Tickets", value: tickets?.filter(t => t.status === 'open').length || 0, icon: LifeBuoy, colorClass: "bg-indigo-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button variant="outline" size="sm" className="rounded-full h-8 px-4">Export PDF</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <KPICard key={idx} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Recent Sales</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs">View All</Button>
          </CardHeader>
          <CardContent className="p-0">
            {invoicesLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : recentInvoices && recentInvoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="h-9 text-[10px] uppercase font-bold">Invoice</TableHead>
                    <TableHead className="h-9 text-[10px] uppercase font-bold">Client</TableHead>
                    <TableHead className="h-9 text-[10px] uppercase font-bold">Total</TableHead>
                    <TableHead className="h-9 text-[10px] uppercase font-bold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.map((inv) => (
                    <TableRow key={inv.id} className="h-12">
                      <TableCell className="font-bold text-xs">{inv.invoiceNumber}</TableCell>
                      <TableCell className="text-xs">ID: {inv.customerId.slice(-4)}</TableCell>
                      <TableCell className="font-bold text-xs">৳{inv.totalAmount?.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={cn("text-[9px] h-5 uppercase px-1.5", inv.status === "paid" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 text-muted-foreground text-xs italic">No sales recorded.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-muted/20">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Leads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leads && leads.length > 0 ? (
              leads.slice(0, 4).map((lead, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold truncate max-w-[120px]">{lead.name}</p>
                    <p className="text-[9px] text-muted-foreground uppercase">{lead.status}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full"><ArrowRight className="h-3.5 w-3.5" /></Button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-muted-foreground italic">No leads.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}