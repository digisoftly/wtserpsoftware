"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { BarChart3, Download, Calendar, TrendingUp, DollarSign, Package, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  CartesianGrid
} from "recharts"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"

export default function ReportsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "sales_invoices");
  }, [db, companyId, branchId]);
  const { data: invoices } = useCollection(invoicesQuery);

  const salesData = React.useMemo(() => {
    if (!invoices) return [];
    // Simple group by month logic
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const stats = months.map(m => ({ name: m, total: 0 }));
    
    invoices.forEach(inv => {
      const date = new Date(inv.invoiceDate);
      const monthIdx = date.getMonth();
      stats[monthIdx].total += inv.totalAmount || 0;
    });
    
    return stats;
  }, [invoices]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-indigo-600">Business Intelligence</h1>
          <p className="text-muted-foreground mt-1">Analytical reports and performance tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" /> Range
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Download className="h-4 w-4" /> Export All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Annual Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${salesData.reduce((sum, d) => sum + d.total, 0).toLocaleString()}</div>
            <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +14.2% YoY</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Invoices Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices?.length || 0}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Last 365 days</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${invoices && invoices.length > 0 ? (salesData.reduce((sum, d) => sum + d.total, 0) / invoices.length).toFixed(2) : "0.00"}</div>
            <p className="text-[10px] text-muted-foreground mt-1">Per transaction</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Net Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28.4%</div>
            <p className="text-[10px] text-red-600 mt-1 flex items-center gap-1">↓ 2% from Target</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="font-headline text-lg">Monthly Sales Performance</CardTitle>
          <CardDescription>Revenue distribution across the fiscal year</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  cursor={{ fill: '#f5f5f5' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar 
                  dataKey="total" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                >
                  {salesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === new Date().getMonth() ? "hsl(var(--primary))" : "#e2e8f0"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
