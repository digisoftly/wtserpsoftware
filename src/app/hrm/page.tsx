
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
  ArrowRight
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

export default function HRMDashboard() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const router = useRouter();

  // Real-time Data Subscriptions
  const employeesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "employees");
  }, [db, companyId, branchId]);
  const { data: employees, isLoading: employeesLoading } = useCollection(employeesQuery);

  const departmentsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "departments");
  }, [db, companyId, branchId]);
  const { data: departments } = useCollection(departmentsQuery);

  const leavesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "leave_requests"), limit(5), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: recentLeaves } = useCollection(leavesQuery);

  // Aggregate Stats
  const stats = React.useMemo(() => {
    const total = employees?.length || 0;
    const active = employees?.filter(e => e.employmentStatus === 'active').length || 0;
    const onLeave = employees?.filter(e => e.employmentStatus === 'on_leave').length || 0;
    
    return {
      total,
      active,
      newlyJoined: employees?.filter(e => {
        const joining = new Date(e.joiningDate);
        const now = new Date();
        return joining.getMonth() === now.getMonth() && joining.getFullYear() === now.getFullYear();
      }).length || 0,
      onLeave,
      presentToday: active - onLeave, // Simplified logic
      absentToday: total - active,
      lateToday: 0,
      totalDepts: departments?.length || 0,
      pendingLeaves: recentLeaves?.filter(l => l.status === 'pending').length || 0,
      payrollTotal: active * 25000, // Mock calculation for overview
    };
  }, [employees, departments, recentLeaves]);

  const renderSectionHeader = (titleKey: string) => (
    <div className="flex items-center gap-3 mb-4 mt-8 first:mt-0">
      <div className="h-1.5 w-8 bg-purple-600 rounded-full" />
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{t(titleKey)}</h2>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-purple-600 uppercase tracking-tight">{t('hrmDashboard')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Enterprise Human Capital Terminal</p>
        </div>
        <div className="flex items-center gap-2">
           <Button className="bg-purple-600 hover:bg-purple-700 gap-2 rounded-full px-8 shadow-xl shadow-purple-100 h-10 text-[10px] uppercase font-black transition-all active:scale-95" asChild>
              <Link href="/hrm/employees/new"><UserPlus className="h-4 w-4" /> {t('addEmployee')}</Link>
           </Button>
        </div>
      </div>

      {/* KPI GROUP 1: EMPLOYEES */}
      {renderSectionHeader('employees')}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="totalEmployees" value={stats.total} icon={Users} colorClass="bg-blue-600" />
        <KPICard title="activeEmployees" value={stats.active} icon={UserCheck} colorClass="bg-green-600" />
        <KPICard title="newEmployees" value={stats.newlyJoined} icon={UserPlus} colorClass="bg-indigo-600" />
        <KPICard title="onLeave" value={stats.onLeave} icon={UserX} colorClass="bg-orange-600" />
      </div>

      {/* KPI GROUP 2: ATTENDANCE */}
      {renderSectionHeader('attendance')}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="presentToday" value={stats.presentToday} icon={CheckCircle2} colorClass="bg-emerald-600" />
        <KPICard title="absentToday" value={stats.absentToday} icon={AlertCircle} colorClass="bg-red-600" />
        <KPICard title="lateToday" value={stats.lateToday} icon={Clock} colorClass="bg-amber-600" />
        <KPICard title="onLeaveToday" value={stats.onLeave} icon={Heart} colorClass="bg-rose-600" />
      </div>

      {/* KPI GROUP 3: ORG & RECRUITMENT */}
      {renderSectionHeader('recruitment')}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="departments" value={stats.totalDepts} icon={Building} colorClass="bg-blue-500" />
        <KPICard title="designations" value={12} icon={Briefcase} colorClass="bg-violet-600" />
        <KPICard title="openPositions" value={5} icon={Target} colorClass="bg-purple-500" />
        <KPICard title="pendingRecruitment" value={3} icon={Activity} colorClass="bg-sky-600" />
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* RECENT LEAVE REQUESTS */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <History className="h-4 w-4 text-purple-600" /> {t('recentActivities')}
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase" asChild>
              <Link href="/hrm/leave">View All <ArrowRight className="h-3 w-3 ml-1" /></Link>
            </Button>
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

        {/* UPCOMING EVENTS */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-purple-600 text-white overflow-hidden">
             <CardHeader className="p-6 pb-0">
               <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                 <Gift className="h-4 w-4" /> {t('upcomingBirthdays')}
               </CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-4">
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 flex items-center justify-between">
                   <div>
                      <p className="text-xs font-black uppercase">Rakib Hasan</p>
                      <p className="text-[9px] font-bold opacity-60">15 MARCH • 3 DAYS TO GO</p>
                   </div>
                   <Badge className="bg-white text-purple-600 font-black text-[8px] uppercase">IT DEPT</Badge>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between opacity-60">
                   <div>
                      <p className="text-xs font-black uppercase">Sumona Akter</p>
                      <p className="text-[9px] font-bold opacity-60">22 MARCH</p>
                   </div>
                   <Badge className="bg-white/10 text-white font-black text-[8px] uppercase">SALES</Badge>
                </div>
             </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 overflow-hidden">
             <CardHeader className="p-6 pb-0">
               <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                 <Scan className="h-4 w-4 text-purple-600" /> {t('quickActions')}
               </CardTitle>
             </CardHeader>
             <CardContent className="p-6 grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-16 rounded-2xl flex flex-col items-center justify-center gap-1 border-slate-100 hover:bg-purple-50 hover:text-purple-600 group transition-all" asChild>
                   <Link href="/hrm/attendance">
                     <Clock className="h-4 w-4 text-slate-400 group-hover:text-purple-600" />
                     <span className="text-[9px] font-black uppercase">Log Attendance</span>
                   </Link>
                </Button>
                <Button variant="outline" className="h-16 rounded-2xl flex flex-col items-center justify-center gap-1 border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 group transition-all" asChild>
                   <Link href="/hrm/payroll">
                     <CreditCard className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                     <span className="text-[9px] font-black uppercase">Run Payroll</span>
                   </Link>
                </Button>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
