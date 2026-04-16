"use client"

import * as React from "react"
import { TrendingUp, ShoppingCart, Target, LifeBuoy, Loader2, ArrowRight, AlertCircle, DollarSign } from "lucide-react"
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

  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "products");
  }, [db, companyId, branchId]);
  const { data: products } = useCollection(productsQuery);

  const stats = React.useMemo(() => {
    const totalSales = allInvoices?.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0;
    const dues = allInvoices?.filter(i => i.status !== 'paid').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0;
    const lowStockCount = products?.filter(p => (p.currentStock || 0) <= (p.minStockLevel || 5)).length || 0;
    return { totalSales, dues, lowStockCount };
  }, [allInvoices, products]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-headline">Dashboard</h1>
        <Button variant="outline" size="sm" className="rounded-full h-8 px-4 text-[10px] font-bold uppercase">Export PDF</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard title="Total Sales" value={`৳${stats.totalSales.toLocaleString()}`} icon={TrendingUp} colorClass="bg-blue-600" subtext="All time" />
        <KPICard title="Total Purchase" value="৳0" icon={ShoppingCart} colorClass="bg-orange-600" subtext="Inbound" />
        <KPICard title="Profit" value={`৳${(stats.totalSales * 0.25).toLocaleString()}`} icon={DollarSign} colorClass="bg-green-600" subtext="Est. 25%" />
        <KPICard title="Due Amount" value={`৳${stats.dues.toLocaleString()}`} icon={AlertCircle} colorClass="bg-red-600" subtext="Outstanding" />
        <KPICard title="Stock Alert" value={stats.lowStockCount} icon={AlertCircle} colorClass="bg-rose-600" subtext="Low quantity" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between py-4 bg-muted/10">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Recent Sales</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-[10px] font-bold uppercase">View All</Button>
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
                    <TableHead className="h-9 text-[10px] uppercase font-bold text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.map((inv) => (
                    <TableRow key={inv.id} className="h-12">
                      <TableCell className="font-bold text-xs">{inv.invoiceNumber}</TableCell>
                      <TableCell className="text-xs">ID: {inv.customerId.slice(-4)}</TableCell>
                      <TableCell className="font-bold text-xs">৳{inv.totalAmount?.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
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
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Leads</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {leads && leads.length > 0 ? (
              leads.slice(0, 4).map((lead, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold truncate max-w-[120px]">{lead.name}</p>
                    <p className="text-[9px] text-muted-foreground uppercase">{lead.status}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-blue-50 text-blue-600"><ArrowRight className="h-3.5 w-3.5" /></Button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-[10px] text-muted-foreground italic uppercase">No active leads.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
