
"use client"

import * as React from "react"
import { 
  Heart, 
  Plus, 
  Search, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Calendar,
  Filter,
  History,
  MoreVertical
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, addDoc, serverTimestamp, updateDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { KPICard } from "@/components/dashboard/kpi-card"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

export default function LeaveManagementPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  
  const [searchTerm, setSearchTerm] = React.useState("");

  const leavesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "leave_requests"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);
  const { data: leaves, isLoading } = useCollection(leavesQuery);

  const stats = React.useMemo(() => ({
    pending: leaves?.filter(l => l.status === 'pending').length || 0,
    approved: leaves?.filter(l => l.status === 'approved').length || 0,
    rejected: leaves?.filter(l => l.status === 'rejected').length || 0,
  }), [leaves]);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    if (!db || !companyId || !branchId) return;
    try {
      await updateDoc(doc(db, "companies", companyId, "branches", branchId, "leave_requests", id), {
        status,
        updatedAt: serverTimestamp()
      });
      toast({ title: t('success'), description: `Request ${status}.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error') });
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-rose-600 uppercase tracking-tight">{t('leaveManagement')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Personnel Absence Processing Terminal</p>
        </div>
        <Button className="bg-rose-600 hover:bg-rose-700 gap-2 rounded-full px-8 shadow-xl shadow-rose-100 h-10 text-[10px] uppercase font-black transition-all active:scale-95 w-full md:w-auto">
          <Plus className="h-4 w-4" /> Application Entry
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="pendingLeaves" value={stats.pending} icon={Clock} colorClass="bg-orange-600" />
        <KPICard title="approvedLeaves" value={stats.approved} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title="rejectedLeaves" value={stats.rejected} icon={XCircle} colorClass="bg-red-600" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-rose-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
           <div className="overflow-x-auto">
             <Table>
               <TableHeader className="bg-slate-50/50">
                 <TableRow>
                   <TableHead className="h-12 text-[10px] uppercase font-black pl-8">Employee</TableHead>
                   <TableHead className="h-12 text-[10px] uppercase font-black">Leave Period</TableHead>
                   <TableHead className="h-12 text-[10px] uppercase font-black text-center">Type</TableHead>
                   <TableHead className="h-12 text-[10px] uppercase font-black text-center">Status</TableHead>
                   <TableHead className="h-12 text-right pr-8">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {leaves?.length === 0 ? (
                   <TableRow><TableCell colSpan={5} className="h-64 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest">{t('noData')}</TableCell></TableRow>
                 ) : (
                   leaves?.map((l, idx) => (
                     <TableRow 
                       key={l.id} 
                       className={cn(
                        "h-20 transition-all border-b border-white/50",
                        idx % 2 === 0 ? "bg-[#EAF6FF] hover:bg-[#D9EFFF]" : "bg-[#EEF9F1] hover:bg-[#E1F2E6]"
                       )}
                     >
                       <TableCell className="pl-8">
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase text-slate-900">{l.employeeName}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{l.reason}</span>
                          </div>
                       </TableCell>
                       <TableCell className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                         {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}
                       </TableCell>
                       <TableCell className="text-center">
                          <Badge variant="outline" className="text-[8px] font-black uppercase border-slate-200">{l.leaveType}</Badge>
                       </TableCell>
                       <TableCell className="text-center">
                          <Badge className={cn("text-[8px] font-black uppercase px-2 h-5 border-none", 
                            l.status === 'approved' ? "bg-green-600 text-white" : 
                            l.status === 'rejected' ? "bg-red-600 text-white" : "bg-orange-50 text-orange-700")}>
                            {l.status}
                          </Badge>
                       </TableCell>
                       <TableCell className="text-right pr-8">
                          {l.status === 'pending' ? (
                            <div className="flex justify-end gap-1">
                               <Button size="sm" className="h-7 px-3 bg-green-600 hover:bg-green-700 text-white text-[8px] font-black uppercase rounded-full" onClick={() => handleUpdateStatus(l.id, 'approved')}>Approve</Button>
                               <Button size="sm" className="h-7 px-3 bg-red-600 hover:bg-red-700 text-white text-[8px] font-black uppercase rounded-full" onClick={() => handleUpdateStatus(l.id, 'rejected')}>Reject</Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400"><History className="h-4 w-4" /></Button>
                          )}
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
