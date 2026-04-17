"use client"

import * as React from "react"
import { Target, Plus, Search, Loader2, MoreVertical, Trash2, Eye, CheckCircle2, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"

export default function CRMPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = React.useState("");

  const leadsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "leads"), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: leads, isLoading } = useCollection(leadsQuery);

  const stats = React.useMemo(() => ({
    total: leads?.length || 0,
    converted: leads?.filter(l => l.status === 'qualified').length || 0,
    pipeline: leads?.length ? leads.length * 50000 : 0
  }), [leads]);

  const filtered = leads?.filter(l => l.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-headline text-rose-500">{t('crm')}</h1>
        <Button className="rounded-full gap-2 h-9 px-6 bg-rose-500 hover:bg-rose-600 font-bold text-[10px] uppercase shadow-lg shadow-rose-100">
          <Plus className="h-4 w-4" /> {t('addLead')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title={t('totalLeads')} value={stats.total} icon={Target} colorClass="bg-blue-600" />
        <KPICard title={t('convertedLeads')} value={stats.converted} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title={t('pipelineValue')} value={`৳${stats.pipeline.toLocaleString()}`} icon={DollarSign} colorClass="bg-purple-600" />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder={t('search')} className="pl-9 h-9 text-xs border-none bg-white shadow-sm ring-1 ring-slate-100" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-rose-500" /></div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden rounded-xl bg-white ring-1 ring-slate-100">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead className="h-9 text-[10px] uppercase font-bold">{t('label')}</TableHead>
                <TableHead className="h-9 text-[10px] uppercase font-bold text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((lead) => (
                <TableRow key={lead.id} className="h-12 hover:bg-muted/10 transition-colors">
                  <TableCell>
                    <div className="font-bold text-xs">{lead.name}</div>
                    <div className="text-[9px] uppercase font-black text-muted-foreground">{lead.company || t('individual')}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-rose-50 text-rose-500 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem className="text-xs font-bold"><Eye className="mr-2 h-3.5 w-3.5" /> {t('view')}</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs text-red-600 font-bold"><Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
