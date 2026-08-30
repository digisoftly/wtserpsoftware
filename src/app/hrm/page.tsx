
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
  BarChart3
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

  const designationsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "designations");
  }, [db, companyId, branchId]);
  const { data: designations } = useCollection(designationsQuery);

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
    const probation = employees?.filter(e => e.employmentType === 'Probation').length || 0;
    const contract = employees?.filter(e => e.employmentType === 'Contract').length || 0;
    
    const today = new Date().toISOString().split('T')[0];
    const newThisMonth = employees?.filter(e => {
        const joining = new Date(e.joiningDate);
        const now = new Date();
        return joining.getMonth() === now.getMonth() && joining.getFullYear() === now.getFullYear();
    }).length || 0;

    return {
      total,
      active,
      inactive,
      newEmployees: newThisMonth,
      onLeave,
      presentToday: active - onLeave, // Mock
      absentToday: total - active, // Mock
      lateToday: 0,
      totalDepts: departments?.length || 0,
      totalDesignations: designations?.length || 0,
      openPositions: 0,
      pendingRecruitment: 0,
      monthlyPayroll: active * 25000,
      salaryDue: 0,
      salaryPaid: 0,
      salaryPending: active * 25000,
      leaveRequests: recentLeaves?.length || 0,
      pendingLeaves: recentLeaves?.filter(l => l.status === 'pending').length || 0,
      approvedLeaves: recentLeaves?.filter(l => l.status === 'approved').length || 0,
      rejectedLeaves: recentLeaves?.filter(l => l.status === 'rejected').length || 0,
      probation,
      contract,
      exitCount: employees?.filter(e => ['Resigned', 'Terminated'].includes(e.employmentStatus)).length || 0
    };
  }, [employees, departments, designations, recentLeaves]);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="totalEmployees" value={stats.total} icon={Users} colorClass="bg-blue-600" />
        <KPICard title="activeEmployees" value={stats.active} icon={UserCheck} colorClass="bg-green-600" />
        <KPICard title="inactiveEmployees" value={stats.inactive} icon={UserX} colorClass="bg-slate-500" />
        <KPICard title="newEmployees" value={stats.newEmployees} icon={UserPlus} colorClass="bg-indigo-600" />
      </div>

      {/* KPI GROUP 2: ATTENDANCE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="presentToday" value={stats.presentToday} icon={CheckCircle2} colorClass="bg-emerald-600" />
        <KPICard title="absentToday" value={stats.absentToday} icon={AlertCircle} colorClass="bg-red-600" />
        <KPICard title="lateToday" value={stats.lateToday} icon={Clock} colorClass="bg-amber-600" />
        <KPICard title="onLeaveToday" value={stats.onLeave} icon={Heart} colorClass="bg-rose-600" />
      </div>

      {/* KPI GROUP 3: ORG & RECRUITMENT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="totalDepartments" value={stats.totalDepts} icon={Building} colorClass="bg-blue-500" />
        <KPICard title="totalDesignations" value={stats.totalDesignations} icon={Briefcase} colorClass="bg-violet-600" />
        <KPICard title="openPositions" value={stats.openPositions} icon={Target} colorClass="bg-purple-500" />
        <KPICard title="pendingRecruitment" value={stats.pendingRecruitment} icon={Activity} colorClass="bg-sky-600" />
      </div>

      {/* KPI GROUP 4: PAYROLL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="monthlyPayroll" value={`৳${stats.monthlyPayroll.toLocaleString()}`} icon={DollarSign} colorClass="bg-emerald-700" />
        <KPICard title="salaryDue" value={`৳${stats.salaryDue.toLocaleString()}`} icon={AlertCircle} colorClass="bg-orange-600" />
        <KPICard title="salaryPaid" value={`৳${stats.salaryPaid.toLocaleString()}`} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title="payrollPending" value={`৳${stats.salaryPending.toLocaleString()}`} icon={Clock} colorClass="bg-indigo-600" />
      </div>

      {/* KPI GROUP 5: LEAVE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="leaveRequests" value={stats.leaveRequests} icon={ClipboardList} colorClass="bg-blue-600" />
        <KPICard title="pendingLeaves" value={stats.pendingLeaves} icon={Clock} colorClass="bg-orange-500" />
        <KPICard title="approvedLeaves" value={stats.approvedLeaves} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title="rejectedLeaves" value={stats.rejectedLeaves} icon={XCircle} colorClass="bg-red-600" />
      </div>

      {/* KPI GROUP 6: OTHERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="probationEmployees" value={stats.probation} icon={UserPlus2} colorClass="bg-blue-400" />
        <KPICard title="contractEmployees" value={stats.contract} icon={FileText} colorClass="bg-indigo-400" />
        <KPICard title="exitingEmployees" value={stats.exitCount} icon={UserX} colorClass="bg-rose-500" />
        <KPICard title="totalStaff" value={stats.total} icon={Users} colorClass="bg-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* RECENT ACTIVITY */}
        <Card className="lg:col-span-2 border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <History className="h-4 w-4 text-purple-600" /> {t('recentActivities')}
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

        {/* EVENTS */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-[2.5rem] bg-purple-600 text-white overflow-hidden">
             <CardHeader className="p-6 pb-0">
               <CardTitle className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                 <Gift className="h-4 w-4" /> {t('upcomingBirthdays')}
               </CardTitle>
             </CardHeader>
             <CardContent className="p-6 space-y-4">
                <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/10 flex items-center justify-between">
                   <p className="text-xs font-black uppercase">No birthdays today</p>
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
                     <span className="text-[9px] font-black uppercase">Attendance</span>
                   </Link>
                </Button>
                <Button variant="outline" className="h-16 rounded-2xl flex flex-col items-center justify-center gap-1 border-slate-100 hover:bg-indigo-50 hover:text-indigo-600 group transition-all" asChild>
                   <Link href="/hrm/payroll">
                     <CreditCard className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
                     <span className="text-[9px] font-black uppercase">Payroll</span>
                   </Link>
                </Button>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
