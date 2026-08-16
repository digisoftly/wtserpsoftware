
"use client"

import * as React from "react"
import { ShieldAlert, Search, Loader2, Calendar, User, Eye, FileBarChart } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { KPICard } from "@/components/dashboard/kpi-card"

export default function AuditLogsPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = React.useState("");

  const logsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, "companies", companyId, "audit_logs"),
      orderBy("timestamp", "desc"),
      limit(200)
    );
  }, [db, companyId]);

  const { data: logs, isLoading } = useCollection(logsQuery);

  const filteredLogs = React.useMemo(() => {
    if (!logs) return [];
    return logs.filter(l => 
      l.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.module?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [logs, searchTerm]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-violet-600 uppercase tracking-tight">{t('auditLogs')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Immutable System Activity Tracker</p>
        </div>
        <Button variant="outline" className="rounded-full gap-2 text-[10px] uppercase font-black px-6 h-10 border-slate-200">
           <FileBarChart className="h-4 w-4" /> Export Ledger
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard title={t('totalLogs')} value={logs?.length || 0} icon={ShieldAlert} colorClass="bg-violet-600" />
        <KPICard title={t('systemHealth')} value="Operational" icon={ShieldAlert} colorClass="bg-green-600" />
      </div>

      <div className="bg-white p-3 rounded-2xl border ring-1 ring-slate-100">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input 
            placeholder="Search by user, action or module..." 
            className="pl-9 h-10 w-full border-none bg-slate-50/50 rounded-xl text-xs font-bold transition-all outline-none" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-black h-12 pl-8">Event Time</TableHead>
                  <TableHead className="text-[10px] uppercase font-black h-12">Operator</TableHead>
                  <TableHead className="text-[10px] uppercase font-black h-12">Action</TableHead>
                  <TableHead className="text-[10px] uppercase font-black h-12">Module</TableHead>
                  <TableHead className="text-[10px] uppercase font-black h-12">Target Record</TableHead>
                  <TableHead className="h-12 text-right pr-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="h-16 hover:bg-muted/5 transition-colors group">
                    <TableCell className="pl-8">
                       <div className="text-[10px] font-bold text-slate-600">
                         {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleString() : "---"}
                       </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 opacity-30" />
                        <span className="font-black text-[10px] uppercase text-slate-900">{log.userName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <Badge className={cn("text-[8px] h-5 uppercase border-none px-2 font-black", 
                         log.action === 'CREATE' ? "bg-green-50 text-green-700" : 
                         log.action === 'DELETE' ? "bg-red-50 text-red-700" : 
                         "bg-blue-50 text-blue-700")}>
                         {log.action}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] font-black uppercase text-slate-400">{log.module}</TableCell>
                    <TableCell className="text-[10px] font-mono font-bold text-violet-600 uppercase">
                      {log.recordId || "---"}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 group-hover:text-violet-600 transition-colors">
                         <Eye className="h-4 w-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
