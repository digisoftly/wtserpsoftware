
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  User, 
  Briefcase, 
  Building, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  Loader2, 
  CreditCard, 
  History, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Activity,
  Heart,
  TrendingUp,
  Award,
  AlertTriangle,
  MapPin,
  Landmark,
  ShieldAlert,
  Wrench,
  Receipt,
  Target,
  BarChart3
} from "lucide-react"
import { useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, where, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { KPICard } from "@/components/dashboard/kpi-card"
import { cn } from "@/lib/utils"

export default function EmployeeProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t, formatDate, formatCurrency } = useTranslation();

  const employeeRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return doc(db, "companies", companyId, "branches", branchId, "employees", id as string);
  }, [db, companyId, branchId, id]);

  const { data: employee, isLoading } = useDoc(employeeRef);

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-purple-600" /></div>;
  if (!employee) return <div className="p-20 text-center uppercase font-black text-muted-foreground">{t('noData')}</div>;

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER CARD */}
      <Card className="border-none shadow-sm rounded-[2.5rem] bg-white ring-1 ring-slate-100 overflow-hidden">
         <div className="bg-purple-600 h-32 w-full relative">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute top-4 left-4 text-white hover:bg-white/20 rounded-full">
               <ArrowLeft className="h-5 w-5" />
            </Button>
         </div>
         <div className="px-8 pb-8 -mt-12 relative flex flex-col md:flex-row items-end gap-6">
            <div className="w-32 h-32 rounded-3xl bg-white border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden shrink-0">
               {employee.photoUrl ? (
                 <img src={employee.photoUrl} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full bg-purple-100 flex items-center justify-center text-purple-600 text-4xl font-black uppercase">
                    {employee.firstName?.[0]}{employee.lastName?.[0]}
                 </div>
               )}
            </div>
            <div className="flex-1 pb-2 space-y-1">
               <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black font-headline uppercase text-slate-900 tracking-tight">{employee.firstName} {employee.lastName}</h1>
                  <Badge className="bg-green-600 text-white border-none uppercase font-black text-[9px] h-5">{employee.employmentStatus}</Badge>
               </div>
               <p className="text-[11px] font-black text-purple-600 uppercase tracking-widest">{employee.designation} • {employee.department}</p>
            </div>
            <div className="pb-2 flex gap-2">
               <Button variant="outline" className="rounded-full h-10 px-6 font-black text-[10px] uppercase border-slate-200" onClick={() => router.push(`/hrm/employees/${id}/edit`)}>Edit Identity</Button>
               <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full h-10 px-8 font-black text-[10px] uppercase shadow-xl shadow-purple-100">Synchronize</Button>
            </div>
         </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="joiningDate" value={formatDate(employee.joiningDate)} icon={Calendar} colorClass="bg-blue-600" />
        <KPICard title="basicSalary" value={formatCurrency(employee.basicSalary)} icon={CreditCard} colorClass="bg-emerald-600" />
        <KPICard title="leaveBalance" value="12 Days" icon={Heart} colorClass="bg-rose-600" />
        <KPICard title="performance" value="4.8/5" icon={Award} colorClass="bg-amber-600" />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-white border p-1 rounded-2xl shadow-sm mb-6 flex h-auto overflow-x-auto no-scrollbar ring-1 ring-slate-100">
           <TabsTrigger value="overview" className="rounded-xl flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">{t('overview')}</TabsTrigger>
           <TabsTrigger value="personal" className="rounded-xl flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">{t('personal')}</TabsTrigger>
           <TabsTrigger value="employment" className="rounded-xl flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">{t('employment')}</TabsTrigger>
           <TabsTrigger value="attendance" className="rounded-xl flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">{t('attendance')}</TabsTrigger>
           <TabsTrigger value="leave" className="rounded-xl flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">{t('leave')}</TabsTrigger>
           <TabsTrigger value="payroll" className="rounded-xl flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">{t('payroll')}</TabsTrigger>
           <TabsTrigger value="documents" className="rounded-xl flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">{t('documents')}</TabsTrigger>
           <TabsTrigger value="performance" className="rounded-xl flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">{t('performance')}</TabsTrigger>
           <TabsTrigger value="training" className="rounded-xl flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">{t('training')}</TabsTrigger>
           <TabsTrigger value="assets" className="rounded-xl flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">{t('assets')}</TabsTrigger>
           <TabsTrigger value="expenses" className="rounded-xl flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">{t('expenses')}</TabsTrigger>
           <TabsTrigger value="activity" className="rounded-xl flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">{t('activity')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm rounded-3xl p-8 bg-white ring-1 ring-slate-100">
                 <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">Staff Connectivity</h3>
                 <div className="space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner"><Mail className="h-5 w-5" /></div>
                       <div><p className="text-[10px] font-bold text-slate-400 uppercase">Email Identity</p><p className="text-sm font-black text-slate-900">{employee.email}</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shadow-inner"><Phone className="h-5 w-5" /></div>
                       <div><p className="text-[10px] font-bold text-slate-400 uppercase">Mobile Number</p><p className="text-sm font-black text-slate-900">{employee.phoneNumber}</p></div>
                    </div>
                 </div>
              </Card>
              <Card className="border-none shadow-sm rounded-3xl p-8 bg-white ring-1 ring-slate-100">
                 <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">Staff Registry</h3>
                 <div className="space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shadow-inner"><History className="h-5 w-5" /></div>
                       <div><p className="text-[10px] font-bold text-slate-400 uppercase">Employee Code</p><p className="text-sm font-black text-slate-900 uppercase font-mono">{employee.employeeId}</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-inner"><ShieldCheck className="h-5 w-5" /></div>
                       <div><p className="text-[10px] font-bold text-slate-400 uppercase">Reporting Manager</p><p className="text-sm font-black text-slate-900 uppercase">System Admin</p></div>
                    </div>
                 </div>
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="personal">
           <Card className="border-none shadow-sm rounded-[2rem] p-10 bg-white ring-1 ring-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                 <div className="space-y-1"><p className="text-[10px] font-black uppercase text-slate-400">Father's Name</p><p className="text-sm font-bold uppercase">{employee.fatherName || '---'}</p></div>
                 <div className="space-y-1"><p className="text-[10px] font-black uppercase text-slate-400">Mother's Name</p><p className="text-sm font-bold uppercase">{employee.motherName || '---'}</p></div>
                 <div className="space-y-1"><p className="text-[10px] font-black uppercase text-slate-400">Date of Birth</p><p className="text-sm font-bold uppercase">{formatDate(employee.dob)}</p></div>
                 <div className="space-y-1"><p className="text-[10px] font-black uppercase text-slate-400">Gender</p><p className="text-sm font-bold uppercase">{employee.gender || '---'}</p></div>
                 <div className="space-y-1"><p className="text-[10px] font-black uppercase text-slate-400">Blood Group</p><p className="text-sm font-black text-red-600 uppercase">{employee.bloodGroup || '---'}</p></div>
                 <div className="space-y-1"><p className="text-[10px] font-black uppercase text-slate-400">National ID</p><p className="text-sm font-mono font-bold uppercase">{employee.nid || '---'}</p></div>
              </div>
           </Card>
        </TabsContent>

        <TabsContent value="employment">
           <Card className="border-none shadow-sm rounded-[2rem] p-10 bg-white ring-1 ring-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase text-slate-500">Employment Type</span><Badge variant="outline" className="font-black uppercase text-[10px]">{employee.employmentType}</Badge></div>
                  <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase text-slate-500">Probation End</span><span className="text-sm font-bold">{formatDate(employee.probationEndDate)}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase text-slate-500">Work Location</span><span className="text-sm font-bold uppercase">{employee.workLocation || 'Main Office'}</span></div>
                </div>
              </div>
           </Card>
        </TabsContent>

        <TabsContent value="payroll">
           <Card className="border-none shadow-sm rounded-[2rem] p-10 bg-white ring-1 ring-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-2">Financial Credentials</h3>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase text-slate-500">Bank Name</span><span className="text-xs font-bold uppercase">{employee.bankName || 'NOT LINKED'}</span></div>
                       <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase text-slate-500">Account Identity</span><span className="text-xs font-mono font-black">{employee.accNumber || '---'}</span></div>
                       <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase text-slate-500">Payment Channel</span><span className="text-xs font-bold uppercase">{employee.paymentMethod || 'Bank Transfer'}</span></div>
                    </div>
                 </div>
                 <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-2">Standard Salary Components</h3>
                    <div className="space-y-4">
                       <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase text-slate-500">Basic Wage</span><span className="text-xs font-black text-slate-900">{formatCurrency(employee.basicSalary)}</span></div>
                       <div className="flex justify-between items-center pt-2 border-t"><span className="text-[10px] font-black uppercase text-purple-600">Gross Payable</span><span className="text-sm font-black text-purple-700">{formatCurrency(employee.basicSalary)}</span></div>
                    </div>
                 </div>
              </div>
           </Card>
        </TabsContent>

        <TabsContent value="documents">
           <div className="p-20 bg-white rounded-[3rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
              <FileText className="h-12 w-12 text-purple-200 mb-6" />
              <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]">Identity Document Vault Initializing...</p>
           </div>
        </TabsContent>
        
        <TabsContent value="attendance">
           <Card className="border-none shadow-sm rounded-3xl p-8 bg-white ring-1 ring-slate-100">
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Attendance Registry</h3>
               <Button variant="outline" size="sm" className="h-8 rounded-xl text-[9px] font-black uppercase">View Calendar</Button>
             </div>
             <div className="p-20 text-center opacity-20">
               <Clock className="h-12 w-12 mx-auto mb-4" />
               <p className="text-[10px] font-black uppercase tracking-widest">Logs Loading...</p>
             </div>
           </Card>
        </TabsContent>

        <TabsContent value="activity">
           <Card className="border-none shadow-sm rounded-3xl p-8 bg-white ring-1 ring-slate-100">
             <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">Staff Timeline</h3>
             <div className="relative border-l-2 border-slate-100 ml-4 pl-8 space-y-8">
                <div className="relative">
                  <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-purple-600 border-4 border-white shadow-sm" />
                  <p className="text-[9px] font-black text-purple-600 uppercase">Joined Organization</p>
                  <p className="text-xs font-bold text-slate-900">{formatDate(employee.joiningDate)}</p>
                </div>
             </div>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
