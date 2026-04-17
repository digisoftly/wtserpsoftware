"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Download, TrendingUp } from "lucide-react"
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
import { useTranslation } from "@/hooks/use-translation"
import { KPICard } from "@/components/dashboard/kpi-card"

export default function ReportsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "sales_invoices");
  }, [db, companyId, branchId]);
  const { data: invoices } = useCollection(invoicesQuery);

  const salesData = React.useMemo(() => {
    if (!invoices) return [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const stats = months.map(m => ({ name: m, total: 0 }));
    
    invoices.forEach(inv => {
      const date = new Date(inv.invoiceDate);
      const monthIdx = date.getMonth();
      stats[monthIdx].total += inv.totalAmount || 0;
    });
    
    return stats;
  }, [invoices]);

  const totalAnnual = salesData.reduce((sum, d) => sum + d.total, 0);
  const avgOrder = invoices && invoices.length > 0 ? (totalAnnual / invoices.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-indigo-600">{t('reports')}</h1>
          <p className="text-muted-foreground mt-1 lowercase">{t('configSub')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 h-9 rounded-xl text-[10px] uppercase font-bold">
            <Calendar className="h-3.5 w-3.5" /> Range
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 h-9 rounded-xl text-[10px] uppercase font-bold shadow-lg shadow-indigo-100">
            <Download className="h-3.5 w-3.5" /> {t('export')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('annualRevenue')} value={`৳${totalAnnual.toLocaleString()}`} icon={TrendingUp} colorClass="bg-green-600" />
        <KPICard title={t('totalOrders')} value={invoices?.length || 0} icon={Download} colorClass="bg-blue-600" />
        <KPICard title={t('avgOrderValue')} value={`৳${avgOrder.toFixed(0)}`} icon={TrendingUp} colorClass="bg-purple-600" />
        <KPICard title={t('netMargin')} value="28.4%" icon={TrendingUp} colorClass="bg-indigo-600" />
      </div>

      <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-8">
          <CardTitle className="font-headline text-xl uppercase tracking-tight">{t('revenueOverview')}</CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase text-muted-foreground">{t('happeningToday')}</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  stroke="#888888" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fontWeight: 700 }}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `৳${value}`}
                  tick={{ fontWeight: 700 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                />
                <Bar 
                  dataKey="total" 
                  fill="hsl(var(--primary))" 
                  radius={[8, 8, 0, 0]}
                  barSize={32}
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
