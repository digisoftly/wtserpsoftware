
"use client"

import * as React from "react"
import { History, Search, Loader2, Calendar, User, Monitor, Globe } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"

export default function LoginHistoryPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = React.useState("");

  const historyQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, "companies", companyId, "login_history"),
      orderBy("timestamp", "desc"),
      limit(200)
    );
  }, [db, companyId]);

  const { data: history, isLoading } = useCollection(historyQuery);

  const filtered = React.useMemo(() => {
    if (!history) return [];
    return history.filter(h => 
      h.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.userId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [history, searchTerm]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-indigo-600 uppercase tracking-tight">{t('loginHistory')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Authentication & Session Tracking</p>
        </div>
      </div>

      <div className="bg-white p-3 rounded-2xl border ring-1 ring-slate-100">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input 
            placeholder="Search by operator..." 
            className="pl-9 h-10 w-full border-none bg-slate-50/50 rounded-xl text-xs font-bold transition-all outline-none" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-black h-12 pl-8">Access Time</TableHead>
                  <TableHead className="text-[10px] uppercase font-black h-12">User Identity</TableHead>
                  <TableHead className="text-[10px] uppercase font-black h-12">Event</TableHead>
                  <TableHead className="text-[10px] uppercase font-black h-12">Browser / System</TableHead>
                  <TableHead className="text-[10px] uppercase font-black h-12 text-right pr-8">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} className="h-16 hover:bg-muted/5 transition-colors group">
                    <TableCell className="pl-8">
                       <div className="text-[10px] font-bold text-slate-600">
                         {item.timestamp?.toDate ? new Date(item.timestamp.toDate()).toLocaleString() : "---"}
                       </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-black text-[10px] uppercase text-slate-900">{item.userName}</span>
                        <span className="text-[8px] font-mono text-slate-400">ID: {item.userId?.slice(-8)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline" className={cn("text-[8px] h-4 uppercase border-none px-2 font-black", 
                         item.action === 'LOGIN' ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600")}>
                         {item.action}
                       </Badge>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                         <Monitor className="h-3 w-3" />
                         <span className="truncate max-w-[200px]">{item.userAgent || "Generic Browser"}</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <Badge className="text-[8px] h-4 uppercase font-black border-none px-2 bg-green-50 text-green-700">Successful</Badge>
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
