"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Wallet, Landmark, TrendingDown, TrendingUp, Loader2, ArrowUpRight, ArrowDownLeft, Plus, MoreVertical } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"

export default function AccountsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const txQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "transactions"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: transactions, isLoading } = useCollection(txQuery);

  const stats = React.useMemo(() => {
    const income = transactions?.filter(t => t.transactionType === 'income').reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    const expense = transactions?.filter(t => t.transactionType === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    return { balance: income - expense, income, expense };
  }, [transactions]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-xl font-bold font-headline text-blue-600">{t('accounts')}</h1>
        <Button className="bg-blue-600 hover:bg-blue-700 rounded-full gap-2 shadow-lg h-9 px-6 text-[10px] uppercase font-bold" asChild>
          <Link href="/accounts/new">
            <Plus className="h-4 w-4" /> {t('addJournal')}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title={t('cashBalance')} value={`৳${stats.balance.toLocaleString()}`} icon={Wallet} colorClass="bg-blue-600" />
        <KPICard title={t('totalIncome')} value={`৳${stats.income.toLocaleString()}`} icon={TrendingUp} colorClass="bg-green-600" />
        <KPICard title={t('totalExpense')} value={`৳${stats.expense.toLocaleString()}`} icon={TrendingDown} colorClass="bg-red-600" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : transactions && transactions.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white ring-1 ring-slate-100">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-bold h-9">{t('date')}</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9">{t('label')}</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9">{t('amount')}</TableHead>
                  <TableHead className="text-right h-9"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((t_row) => (
                  <TableRow key={t_row.id} className="h-12 hover:bg-muted/10 transition-colors">
                    <TableCell className="text-[10px] font-bold uppercase">{new Date(t_row.transactionDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="font-bold text-xs">{t_row.description}</div>
                    </TableCell>
                    <TableCell>
                      <span className={cn("font-black text-xs flex items-center gap-1", t_row.transactionType === 'income' ? 'text-green-600' : 'text-red-600')}>
                        {t_row.transactionType === 'income' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                        ৳{t_row.amount?.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        </Card>
      ) : (
        <div className="p-16 bg-white rounded-[2rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
          <Landmark className="h-10 w-10 text-blue-200 mb-4" />
          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{t('noSales')}</p>
        </div>
      )}
    </div>
  )
}