"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Plus, Search, Loader2, MoreVertical, AlertCircle, CheckCircle2, Clock, LifeBuoy } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"

export default function SupportPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = React.useState("");

  const ticketsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "tickets"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: tickets, isLoading } = useCollection(ticketsQuery);

  const stats = React.useMemo(() => ({
    open: tickets?.filter(t => t.status === 'open').length || 0,
    closed: tickets?.filter(t => t.status === 'closed').length || 0,
    pending: tickets?.filter(t => t.status === 'pending').length || 0
  }), [tickets]);

  const filteredTickets = tickets?.filter(t => t.subject?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-headline text-indigo-600">{t('support')}</h1>
        <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 rounded-full h-9 px-6 text-[10px] uppercase font-bold shadow-lg shadow-indigo-100" asChild>
          <Link href="/support/new">
            <Plus className="h-4 w-4" /> {t('addTicket')}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title={t('openTickets')} value={stats.open} icon={AlertCircle} colorClass="bg-red-600" />
        <KPICard title={t('closedTickets')} value={stats.closed} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title={t('pending_status')} value={stats.pending} icon={Clock} colorClass="bg-orange-600" />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input placeholder={t('search')} className="pl-9 h-10 w-full border-none bg-white shadow-sm ring-1 ring-slate-100 rounded-xl outline-none text-xs font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      ) : filteredTickets && filteredTickets.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white ring-1 ring-slate-100">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead className="text-[10px] uppercase font-bold h-9">ID</TableHead>
                <TableHead className="text-[10px] uppercase font-bold h-9">{t('subject')}</TableHead>
                <TableHead className="text-right h-9"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets?.map((t_doc) => (
                <TableRow key={t_doc.id} className="h-12 hover:bg-muted/10 transition-colors">
                  <TableCell className="font-mono text-[10px] text-indigo-600 font-black uppercase">#TK-{t_doc.id.slice(-4)}</TableCell>
                  <TableCell>
                    <div className="font-bold text-xs">{t_doc.subject}</div>
                    <div className="text-[9px] uppercase font-black text-muted-foreground">{t(t_doc.priority as any)}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-indigo-50 text-indigo-600 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="p-16 bg-white rounded-[2rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
          <LifeBuoy className="h-10 w-10 text-indigo-200 mb-4" />
          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{t('allHealthy')}</p>
        </div>
      )}
    </div>
  )
}