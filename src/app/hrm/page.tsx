"use client"

import * as React from "react"
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  Clock, 
  Heart,
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  History,
  UserX,
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
import { cn } from "@/lib/utils"

export default function HRMDashboard() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t, formatCurrency } = useTranslation();

  const employeesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "employees");
  }, [db, companyId, branchId]);
  const { data: employees } = useCollection(employeesQuery);

  const leavesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "leave_requests"), limit(5), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: recentLeaves } = useCollection(leavesQuery);

  const stats = React.useMemo(() => {
    const total = employees?.length || 0;
    const active = employees?.filter(e => e.employmentStatus === 'active').length || 0;
    const onLeave = employees?.filter(e => e.employmentStatus === 'on_leave').length || 0;
    return {
      total, active, onLeave,
      presentToday: active - onLeave, 
      absentToday: total - active, 
      salaryDue: 45000,
      salaryPaid: 125000,
    };
  }, [employees]);

  const renderSectionHeader = (title: string) => (
    <div className="flex items-center gap-2 mb-4 px-1">
      <div className="h-1 w-6 bg-purple-600 rounded-full" />
      <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t(title)}</h2>
    </div>
  );

  return (
    <div className="space-y-8 pb-24 touch-scroll max-w-[1400px] mx-auto">
      <div className="flex items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-black font-headline text-purple-600 uppercase tracking-tight">{t('hrmDashboard')}</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Staff Terminal</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 h-10 rounded-full px-6 shadow-lg shadow-purple-100 text-[10px] uppercase font-black" asChild>
           <Link href="/hrm/employees/new"><UserPlus className="h-4 w-4" /></Link>
        </Button>
      </div>

      <div className="space-y-10">
        <section>
          {renderSectionHeader('workforceStatic')}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            <KPICard title="totalEmployees" value={stats.total} icon={Users} colorClass="bg-blue-600" />
            <KPICard title="activeEmployees" value={stats.active} icon={UserCheck} colorClass="bg-green-600" />
            <KPICard title="inactiveEmployees" value={stats.total - stats.active} icon={UserX} colorClass="bg-slate-500" />
            <KPICard title="onLeaveToday" value={stats.onLeave} icon={Heart} colorClass="bg-rose-600" />
          </div>
        </section>

        <section>
          {renderSectionHeader('attendancePulse')}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            <KPICard title="presentToday" value={stats.presentToday} icon={CheckCircle2} colorClass="bg-emerald-600" />
            <KPICard title="absentToday" value={stats.absentToday} icon={AlertCircle} colorClass="bg-red-600" />
            <KPICard title="salaryPaid" value={formatCurrency(stats.salaryPaid)} icon={CheckCircle2} colorClass="bg-green-600" />
            <KPICard title="salaryDue" value={formatCurrency(stats.salaryDue)} icon={AlertCircle} colorClass="bg-orange-600" />
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b p-6 flex flex-row items-center justify-between">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <History className="h-4 w-4 text-purple-600" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             {recentLeaves && recentLeaves.length > 0 ? (
               <div className="divide-y divide-slate-50">
                  {recentLeaves.map((leave, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-xs">
                            {leave.employeeName?.[0] || 'E'}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 uppercase">{leave.employeeName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{leave.leaveType} • {new Date(leave.startDate).toLocaleDateString()}</p>
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

        <Card className="border-none shadow-xl rounded-[2.5rem] bg-purple-600 text-white overflow-hidden p-8 text-center space-y-6 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center">
                <Award className="h-8 w-8" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest opacity-80">{t('upcomingBirthdays')}</h3>
            <p className="text-sm font-bold uppercase opacity-40 italic">No events today</p>
        </Card>
      </div>
    </div>
  )
}