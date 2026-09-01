
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

  // Real-time Data Subscriptions
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

  // Aggregate Stats
  const stats = React.useMemo(() => {
    const total = employees?.length || 0;
    const active = employees?.filter(e => e.employmentStatus === 'active').length || 0;
    const inactive = employees?.filter(e => e.employmentStatus === 'inactive').length || 0;
    const onLeave = employees?.filter(e => e.employmentStatus === 'on_leave').length || 0;
    
    const now = new Date();
    const newThisMonth = employees?.filter(e => {
        const joining = new Date(e.joiningDate);
        return joining.getMonth() === now.getMonth() && joining.getFullYear() === now.getFullYear();
    }).length || 0;

    return {
      total,
      active,
      inactive,
      newEmployees: newThisMonth,
      onLeave,
      presentToday: active - onLeave, 
      absentToday: total - active, 
      lateToday: 0,
      totalDepts: 5,
      totalDesignations: 8,
      openPositions: 2,
      pendingRecruitment: 3,
      monthlyPayroll: active * 25000,
      salaryDue: 45000,
      salaryPaid: 125000,
      salaryPending: 80000,
      leaveRequests: recentLeaves?.length || 0,
      pendingLeaves: recentLeaves?.filter(l => l.status === 'pending').length || 0,
      approvedLeaves: recentLeaves?.filter(l => l.status === 'approved').length || 0,
      rejectedLeaves: recentLeaves?.filter(l => l.status === 'rejected').length || 0,
      probation: employees?.filter(e => e.employmentType === 'Probation').length || 0,
      contract: employees?.filter(e => e.employmentType === 'Contract').length || 0,
      exitCount: 1,
      newJoiners: 2
    };
  }, [employees, recentLeaves]);

  const gridClass = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4";

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-purple-600 uppercase tracking-tight">{t('hrmDashboard')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Personnel Intelligence Terminal</p>
        </div>
        <div className="flex items-center gap-2">
           <Button className="bg-purple-600 hover:bg-purple-700 gap-2 rounded-full px-8 shadow-xl shadow-purple-100 h-10 text-[10px] uppercase font-black transition-all active:scale-95" asChild>
              <Link href="/hrm/employees/new"><UserPlus className="h-4 w-4" /> {t('addEmployee')}</Link>
           </Button>
        </div>
      </div>

      {/* GROUP 1: WORKFORCE STATIC */}
      <div className={gridClass}>
        <KPICard title="totalEmployees" value={stats.total} icon={Users} colorClass="bg-blue-600" />
        <KPICard title="activeEmployees" value={stats.active} icon={UserCheck} colorClass="bg-green-600" />
        <KPICard title="inactiveEmployees" value={stats.inactive} icon={UserX} colorClass="bg-slate-500" />
        <KPICard title="newEmployees" value={stats.newEmployees} icon={UserPlus} colorClass="bg-indigo-600" />
      </div>

      {/* GROUP 2: ATTENDANCE PULSE */}
      <div className={gridClass}>
        <KPICard title="presentToday" value={stats.presentToday} icon={CheckCircle2} colorClass="bg-emerald-600" />
        <KPICard title="absentToday" value={stats.absentToday} icon={AlertCircle} colorClass="bg-red-600" />
        <KPICard title="lateToday" value={stats.lateToday} icon={Clock} colorClass="bg-amber-600" />
        <KPICard title="onLeaveToday" value={stats.onLeave} icon={Heart} colorClass="bg-rose-600" />
      </div>

      {/* GROUP 3: STRUCTURE & VACANCY */}
      <div className={gridClass}>
        <KPICard title="totalDepartments" value={stats.totalDepts} icon={Building} colorClass="bg-blue-500" />
        <KPICard title="totalDesignations" value={stats.totalDesignations} icon={Briefcase} colorClass="bg-violet-600" />
        <KPICard title="openPositions" value={stats.openPositions} icon={Target} colorClass="bg-purple-500" />
        <KPICard title="pendingRecruitment" value={stats.pendingRecruitment} icon={Activity} colorClass="bg-sky-600" />
      </div>

      {/* GROUP 4: PAYROLL RECONCILIATION */}
      <div className={gridClass}>
        <KPICard title="monthlyPayroll" value={formatCurrency(stats.monthlyPayroll)} icon={DollarSign} colorClass="bg-emerald-700" />
        <KPICard title="salaryDue" value={formatCurrency(stats.salaryDue)} icon={AlertCircle} colorClass="bg-orange-600" />
        <KPICard title="salaryPaid" value={formatCurrency(stats.salaryPaid)} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title="payrollPending" value={formatCurrency(stats.salaryPending)} icon={Clock} colorClass="bg-indigo-600" />
      </div>

      {/* GROUP 5: LEAVE WORKFLOW */}
      <div className={gridClass}>
        <KPICard title="leaveRequests" value={stats.leaveRequests} icon={ClipboardList} colorClass="bg-blue-600" />
        <KPICard title="pendingLeaves" value={stats.pendingLeaves} icon={Clock} colorClass="bg-orange-500" />
        <KPICard title="approvedLeaves" value={stats.approvedLeaves} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title="rejectedLeaves" value={stats.rejectedLeaves} icon={XCircle} colorClass="bg-red-600" />
      </div>

      {/* GROUP 6: EMPLOYMENT STATUS */}
      <div className={gridClass}>
        <KPICard title="probationEmployees" value={stats.probation} icon={UserPlus2} colorClass="bg-blue-400" />
        <KPICard title="contractEmployees" value={stats.contract} icon={FileText} colorClass="bg-indigo-400" />
        <KPICard title="exitingEmployees" value={stats.exitCount} icon={UserX} colorClass="bg-rose-500" />
        <KPICard title="newJoiners" value={stats.newJoiners} icon={PartyPopper} colorClass="bg-pink-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* RECENT HR ACTIVITY */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <History className="h-4 w-4 text-purple-600" /> Recent Employee Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             {recentLeaves && recentLeaves.length > 0 ? (
               <div className="divide-y divide-slate-50">
                  {recentLeaves.map((leave, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-xs uppercase">
                            {leave.employeeName?.[0] || 'E'}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 uppercase">{leave.employeeName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{leave.leaveType} • {new Date(leave.startDate).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <Badge className={cn("text-[8px] font-black uppercase px-2 h-5 border-none", 
                         leave.status === 'approved' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>
                         {leave.status}
                       </Badge>
                    </div>
                  ))}
               </div>
             ) : (
               <div className="p-20 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest">{t('noData')}</div>
             )}
          </CardContent>
        </Card>

        {/* CELEBRATIONS & EVENTS */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-purple-600 text-white overflow-hidden">
             <CardHeader className="p-6 pb-0">
               <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                 <Cake className="h-4 w-4" /> {t('upcomingBirthdays')}
               </CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-4">
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 flex items-center justify-between">
                   <p className="text-xs font-black uppercase">No birthdays today</p>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
