"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Receipt, Plus, Search, Loader2, CreditCard, Calendar } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"

export default function ExpensesPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = React.useState("");

  const expensesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "expenses"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: expenses, isLoading } = useCollection(expensesQuery);

  const stats = React.useMemo(() => {
    if (!expenses) return { today: 0, monthly: 0 };
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);
    return {
      today: expenses.filter(e => e.expenseDate?.startsWith(today)).reduce((s, e) => s + (e.amount || 0), 0),
      monthly: expenses.filter(e => e.expenseDate?.startsWith(thisMonth)).reduce((s, e) => s + (e.amount || 0), 0)
    };
  }, [expenses]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-xl font-bold font-headline text-red-500">{t('expenses')}</h1>
        <Button className="bg-red-500 hover:bg-red-600 gap-2 rounded-full px-8 shadow-lg h-9 text-[10px] uppercase font-bold shadow-red-100" asChild>
          <Link href="/expenses/new">
            <Plus className="h-4 w-4" /> {t('addExpense')}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard title={t('todayExpense')} value={`৳${stats.today.toLocaleString()}`} icon={CreditCard} colorClass="bg-red-600" />
        <KPICard title={t('monthlyExpense')} value={`৳${stats.monthly.toLocaleString()}`} icon={Calendar} colorClass="bg-blue-600" />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input placeholder={t('search')} className="pl-9 h-9 w-full text-xs border-none bg-white shadow-sm ring-1 ring-slate-100 rounded-xl outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-red-500" /></div>
      ) : expenses && expenses.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white ring-1 ring-slate-100">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-bold h-9">{t('date')}</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9">{t('label')}</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9 text-right">{t('amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses?.map((exp) => (
                  <TableRow key={exp.id} className="h-12 hover:bg-muted/10 transition-colors">
                    <TableCell className="text-[10px] font-bold uppercase">{new Date(exp.expenseDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="font-bold text-xs">{exp.description}</div>
                      <div className="text-[9px] uppercase text-muted-foreground font-black">{t(exp.category as any)}</div>
                    </TableCell>
                    <TableCell className="text-right font-black text-xs text-red-600">৳{exp.amount?.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="p-16 bg-white rounded-[2rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
          <Receipt className="h-10 w-10 text-red-200 mb-4" />
          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{t('noReturns')}</p>
        </div>
      )}
    </div>
  )
}