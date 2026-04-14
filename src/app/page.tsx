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
  Loader2
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

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "sales_invoices"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
  }, [db, companyId, branchId]);

  const { data: recentInvoices, isLoading: invoicesLoading } = useCollection(invoicesQuery);

  const allInvoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "sales_invoices");
  }, [db, companyId, branchId]);
  const { data: allInvoices } = useCollection(allInvoicesQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  const employeesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "employees");
  }, [db, companyId, branchId]);
  const { data: employees } = useCollection(employeesQuery);

  const lowStockQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "low_stock_alerts");
  }, [db, companyId, branchId]);
  const { data: lowStockAlerts } = useCollection(lowStockQuery);

  const totalSales = allInvoices?.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0) || 0;

  const kpis = [
    { title: "Total Sales", value: `৳${totalSales.toLocaleString()}`, icon: TrendingUp, colorClass: "bg-blue-500", trend: { value: 12, isPositive: true } },
    { title: "Monthly Purchases", value: "৳0.00", icon: ShoppingCart, colorClass: "bg-orange-500" },
    { title: "Net Profit", value: `৳${(totalSales * 0.35).toLocaleString()}`, icon: CreditCard, colorClass: "bg-green-500" },
    { title: "Pending Projects", value: "0", icon: ClipboardList, colorClass: "bg-teal-500" },
    { title: "Low Stock Items", value: lowStockAlerts?.length.toString() || "0", icon: AlertTriangle, colorClass: "bg-red-500" },
    { title: "Active Customers", value: customers?.length.toString() || "0", icon: Users, colorClass: "bg-cyan-500", trend: { value: 2, isPositive: true } },
    { title: "Total Employees", value: employees?.length.toString() || "0", icon: Briefcase, colorClass: "bg-violet-500" },
    { title: "Today's Attendance", value: `${employees?.length || 0}/${employees?.length || 0}`, icon: CalendarDays, colorClass: "bg-indigo-500" },
  ]

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">Operational Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time performance metrics for {branchId?.replace('-', ' ')}</p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <Button variant="outline" className="bg-white border-primary/20 shrink-0">Export PDF</Button>
          <Button className="bg-primary hover:bg-primary/90 rounded-full px-6 shrink-0">Add Entry</Button>
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
              <CardTitle className="font-headline text-lg md:text-xl">Recent Sales</CardTitle>
              <CardDescription className="text-xs md:text-sm">Latest generated invoices</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5">View All</Button>
          </CardHeader>
          <CardContent className="p-0 md:p-6 md:pt-0">
            <div className="overflow-x-auto">
              {invoicesLoading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : recentInvoices && recentInvoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentInvoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                        <TableCell>
                          <Badge 
                            className={cn(
                              inv.status === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                            )} 
                            variant="secondary"
                          >
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell>৳{inv.totalAmount?.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">Details</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 text-muted-foreground text-sm">No recent invoices found.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-xl">
          <CardHeader>
            <CardTitle className="font-headline text-lg md:text-xl">Inventory Alerts</CardTitle>
            <CardDescription className="text-xs md:text-sm">Items below reorder point</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {lowStockAlerts && lowStockAlerts.length > 0 ? (
              lowStockAlerts.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <div>
                      <p className="text-sm font-semibold">Product ID: {item.productId?.slice(-6)}</p>
                      <p className="text-xs text-muted-foreground">Stock: {item.currentStock} / Min: {item.minStockLevel}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs shrink-0">Order</Button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground italic">
                All items optimally stocked.
              </div>
            )}
            <Button variant="link" className="w-full text-sm text-primary">View Inventory Forecast</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
