"use client"

import * as React from "react"
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Clock, 
  Calendar, 
  Building, 
  CreditCard, 
  Target, 
  Briefcase, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  LayoutDashboard,
  Heart,
  Gift,
  History,
  Activity,
  UserX,
  FileText,
  Scan,
  Wrench,
  ArrowRight,
  ClipboardList,
  DollarSign,
  UserPlus2,
  XCircle,
  BarChart3,
  Cake,
  PartyPopper,
  Award
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { KPICard } from "@/components/dashboard/kpi-card"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function HRMDashboard() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t, formatCurrency } = useTranslation();
  const router = useRouter();

  const employeesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "employees");
  }, [db, companyId, branchId]);
  const { data: employees, isLoading: employeesLoading } = useCollection(employeesQuery);

  const leavesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "leave_requests"), limit(5), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: recentLeaves } = useCollection(leavesQuery);

  const stats = React.useMemo(() => {
    const total = employees?.length || 0;
    const active = employees?.filter(e => e.employmentStatus === 'active').length || 0;
    const inactive = employees?.filter(e => e.employmentStatus === 'inactive').length || 0;
    const onLeave = employees?.filter(e => e.employmentStatus === 'on_leave').length || 0;
    
    return {
      total, active, inactive, onLeave,
      presentToday: active - onLeave, 
      absentToday: total - active, 
      monthlyPayroll: active * 25000,
      salaryDue: 45000,
      salaryPaid: 125000,
      leaveRequests: recentLeaves?.length || 0,
      pendingLeaves: recentLeaves?.filter(l => l.status === 'pending').length || 0,
    };
  }, [employees, recentLeaves]);

  // APP-LIKE GRID: 2 Columns Mobile, 3 Tablet, 4 Desktop
  const gridClass = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4";

  const renderSectionHeader = (title: string) => (
    <div className="flex items-center gap-2 mb-3 mt-6 first:mt-0 px-1">
      <div className="h-1 w-6 md:w-10 bg-purple-600 rounded-full" />
      <h2 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t(title)}</h2>
    </div>
  );

  return (
    <div className="space-y-4 md:space-y-6 pb-24 touch-scroll">
      <div className="flex items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-purple-600 uppercase tracking-tight">{t('hrmDashboard')}</h1>
          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Personnel Radar</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 h-9 rounded-full px-5 shadow-lg shadow-purple-100 text-[10px] uppercase font-black" asChild>
           <Link href="/hrm/employees/new"><UserPlus className="h-4 w-4" /></Link>
        </Button>
      </div>

      {renderSectionHeader('workforceStatic')}
      <div className={gridClass}>
        <KPICard title="totalEmployees" value={stats.total} icon={Users} colorClass="bg-blue-600" />
        <KPICard title="activeEmployees" value={stats.active} icon={UserCheck} colorClass="bg-green-600" />
        <KPICard title="inactiveEmployees" value={stats.inactive} icon={UserX} colorClass="bg-slate-500" />
        <KPICard title="onLeaveToday" value={stats.onLeave} icon={Heart} colorClass="bg-rose-600" />
      </div>

      {renderSectionHeader('attendancePulse')}
      <div className={gridClass}>
        <KPICard title="presentToday" value={stats.presentToday} icon={CheckCircle2} colorClass="bg-emerald-600" />
        <KPICard title="absentToday" value={stats.absentToday} icon={AlertCircle} colorClass="bg-red-600" />
        <KPICard title="salaryPaid" value={formatCurrency(stats.salaryPaid)} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title="salaryDue" value={formatCurrency(stats.salaryDue)} icon={AlertCircle} colorClass="bg-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mt-4">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl md:rounded-[2rem] bg-white ring-1 ring-slate-100 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-4 md:p-6 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <History className="h-4 w-4 text-purple-600" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             {recentLeaves && recentLeaves.length > 0 ? (
               <div className="divide-y divide-slate-50">
                  {recentLeaves.map((leave, i) => (
                    <div key={i} className="p-3 md:p-4 flex items-center justify-between hover:bg-slate-50 active:bg-slate-100 transition-colors">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-[10px] uppercase">
                            {leave.employeeName?.[0] || 'E'}
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-slate-900 uppercase truncate max-w-[120px]">{leave.employeeName}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">{leave.leaveType} • {new Date(leave.startDate).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <Badge className={cn("text-[7px] md:text-[8px] font-black uppercase px-2 h-4 md:h-5 border-none", 
                         leave.status === 'approved' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>
                         {leave.status}
                       </Badge>
                    </div>
                  ))}
               </div>
             ) : (
               <div className="p-16 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest">{t('noData')}</div>
             )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-2xl md:rounded-[2.5rem] bg-purple-600 text-white overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto">
                <Award className="h-6 w-6" />
            </div>
            <h3 className="text-[10px] font-black uppercase tracking-widest opacity-80">{t('upcomingBirthdays')}</h3>
            <p className="text-xs font-bold uppercase py-10 opacity-40 italic">No events today</p>
        </Card>
      </div>
    </div>
  )
}