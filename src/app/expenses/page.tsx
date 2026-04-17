"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Receipt, Plus, Search, Loader2, CreditCard, Calendar } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"

export default function ExpensesPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
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

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) return;

    const expenseData = {
      companyId,
      branchId,
      description: formData.get("description") as string,
      amount: Number(formData.get("amount")),
      category: formData.get("category") as string,
      paymentMethod: formData.get("paymentMethod") as string,
      expenseDate: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const colRef = collection(db, "companies", companyId, "branches", branchId, "expenses");
    addDocumentNonBlocking(colRef, expenseData);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-xl font-bold font-headline text-red-500">{t('expenses')}</h1>
        <Button className="bg-red-500 hover:bg-red-600 gap-2 rounded-full px-8 shadow-lg h-9 text-[10px] uppercase font-bold shadow-red-100" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" /> {t('addExpense')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard title={t('todayExpense')} value={`৳${stats.today.toLocaleString()}`} icon={CreditCard} colorClass="bg-red-600" />
        <KPICard title={t('monthlyExpense')} value={`৳${stats.monthly.toLocaleString()}`} icon={Calendar} colorClass="bg-blue-600" />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder={t('search')} className="pl-9 h-9 text-xs border-none bg-white shadow-sm ring-1 ring-slate-100" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-[2rem]">
          <DialogHeader className="bg-red-500 p-6 text-white flex-row items-center gap-3">
            <Plus className="h-6 w-6" />
            <DialogTitle className="text-xl font-bold font-headline uppercase">{t('addExpense')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="p-6 space-y-4 bg-slate-50">
            <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('label')}</Label><Input name="description" required className="h-11 rounded-xl border-none ring-1 ring-slate-200 text-xs" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('amount')} (৳)</Label><Input name="amount" type="number" step="0.01" required className="h-11 rounded-xl border-none ring-1 ring-slate-200 text-xs font-bold" /></div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t('type')}</Label>
                <Select name="category" defaultValue="utility">
                  <SelectTrigger className="h-11 rounded-xl bg-white border-none ring-1 ring-slate-200 shadow-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utility" className="text-xs font-bold">{t('utility')}</SelectItem>
                    <SelectItem value="rent" className="text-xs font-bold">{t('rent')}</SelectItem>
                    <SelectItem value="salary" className="text-xs font-bold">{t('salary')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 h-12 rounded-2xl text-[10px] font-black uppercase mt-4 tracking-widest shadow-xl shadow-red-100 active:scale-95 transition-all">{t('save')}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
