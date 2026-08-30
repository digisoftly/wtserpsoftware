
"use client"

import * as React from "react"
import { 
  Clock, 
  Calendar, 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Filter, 
  Plus, 
  History,
  MoreVertical,
  UserCheck
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit, where } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { KPICard } from "@/components/dashboard/kpi-card"
import { cn } from "@/lib/utils"

export default function AttendanceManagementPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = React.useState("");

  const attendanceQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "attendance"),
      where("date", "==", selectedDate),
      orderBy("checkIn", "desc")
    );
  }, [db, companyId, branchId, selectedDate]);
  const { data: attendance, isLoading } = useCollection(attendanceQuery);

  const stats = React.useMemo(() => ({
    present: attendance?.filter(a => a.status === 'present').length || 0,
    absent: attendance?.filter(a => a.status === 'absent').length || 0,
    late: attendance?.filter(a => a.status === 'late').length || 0,
  }), [attendance]);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-blue-600 uppercase tracking-tight">{t('attendance')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Daily Workforce Entry Radar</p>
        </div>
        <div className="flex items-center gap-2">
           <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="h-10 rounded-full w-40 font-black uppercase text-[10px] border-slate-200" />
           <Button className="bg-blue-600 hover:bg-blue-700 gap-2 rounded-full px-8 shadow-xl shadow-blue-100 h-10 text-[10px] uppercase font-black">
              <Plus className="h-4 w-4" /> Manual Log
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="presentToday" value={stats.present} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title="absentToday" value={stats.absent} icon={AlertCircle} colorClass="bg-red-600" />
        <KPICard title="lateToday" value={stats.late} icon={Clock} colorClass="bg-amber-600" />
        <KPICard title="attendanceSummary" value={attendance?.length || 0} icon={UserCheck} colorClass="bg-blue-600" />
      </div>

      <div className="bg-white p-3 rounded-2xl border ring-1 ring-slate-100 flex gap-3">
         <div className="relative flex-1">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
           <input 
            placeholder="Search employee attendance..." 
            className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs font-bold transition-all outline-none" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
           />
         </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
           <div className="overflow-x-auto custom-scrollbar">
             <Table>
               <TableHeader className="bg-slate-50/50">
                 <TableRow>
                   <TableHead className="h-12 text-[10px] uppercase font-black pl-8">Employee</TableHead>
                   <TableHead className="h-12 text-[10px] uppercase font-black">Check-In</TableHead>
                   <TableHead className="h-12 text-[10px] uppercase font-black">Check-Out</TableHead>
                   <TableHead className="h-12 text-[10px] uppercase font-black text-center">Status</TableHead>
                   <TableHead className="h-12 text-right pr-8">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {attendance?.length === 0 ? (
                   <TableRow><TableCell colSpan={5} className="h-64 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest">{t('noData')}</TableCell></TableRow>
                 ) : (
                   attendance?.map((a, idx) => (
                     <TableRow 
                       key={a.id} 
                       className={cn(
                        "h-20 transition-all border-b border-white/50",
                        idx % 2 === 0 ? "bg-[#EAF6FF] hover:bg-[#D9EFFF]" : "bg-[#EEF9F1] hover:bg-[#E1F2E6]"
                       )}
                     >
                       <TableCell className="pl-8">
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase text-slate-900">{a.employeeName}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{a.department}</span>
                          </div>
                       </TableCell>
                       <TableCell className="font-mono text-xs font-bold text-slate-700">{a.checkIn || '---'}</TableCell>
                       <TableCell className="font-mono text-xs font-bold text-slate-700">{a.checkOut || '---'}</TableCell>
                       <TableCell className="text-center">
                          <Badge className={cn("text-[8px] font-black uppercase px-2 h-5 border-none", 
                            a.status === 'present' ? "bg-green-600 text-white" : "bg-red-50 text-red-700")}>
                            {a.status}
                          </Badge>
                       </TableCell>
                       <TableCell className="text-right pr-8">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-blue-600"><History className="h-4 w-4" /></Button>
                       </TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
           </div>
        </Card>
      )}
    </div>
  );
}
