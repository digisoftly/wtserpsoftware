
"use client"

import * as React from "react"
import { 
  Plus, 
  Search, 
  Loader2, 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  History,
  Download,
  Printer,
  Calculator,
  PlayCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, addDoc, serverTimestamp, where, getDocs } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { KPICard } from "@/components/dashboard/kpi-card"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function PayrollManagementPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t, formatCurrency } = useTranslation();
  
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [selectedMonth, setSelectedMonth] = React.useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = React.useState(String(new Date().getFullYear()));

  // Queries
  const payrollsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "payrolls"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);
  const { data: payrolls, isLoading } = useCollection(payrollsQuery);

  const employeesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "employees");
  }, [db, companyId, branchId]);
  const { data: employees } = useCollection(employeesQuery);

  const stats = React.useMemo(() => ({
    total: payrolls?.reduce((s, p) => s + (p.netSalary || 0), 0) || 0,
    paid: payrolls?.filter(p => p.status === 'paid').reduce((s, p) => s + (p.netSalary || 0), 0) || 0,
    pending: payrolls?.filter(p => p.status !== 'paid').reduce((s, p) => s + (p.netSalary || 0), 0) || 0,
  }), [payrolls]);

  const handleGeneratePayroll = async () => {
    if (!db || !companyId || !branchId || !employees) return;
    setIsGenerating(true);
    
    try {
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const periodLabel = `${monthNames[Number(selectedMonth) - 1]} ${selectedYear}`;
      
      let count = 0;
      for (const emp of employees) {
        if (emp.employmentStatus !== 'active') continue;
        
        // Skip if already generated
        const dupCheck = query(
          collection(db, "companies", companyId, "branches", branchId, "payrolls"),
          where("employeeId", "==", emp.id),
          where("period", "==", periodLabel)
        );
        const dupSnap = await getDocs(dupCheck);
        if (!dupSnap.empty) continue;

        const payrollData = {
          employeeId: emp.id,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          designation: emp.designation,
          department: emp.department,
          period: periodLabel,
          basicSalary: emp.basicSalary || 0,
          grossSalary: emp.basicSalary || 0,
          totalDeduction: 0,
          netSalary: emp.basicSalary || 0,
          status: 'draft',
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, "companies", companyId, "branches", branchId, "payrolls"), payrollData);
        count++;
      }
      
      toast({ title: t('success'), description: `${count} payroll records initialized.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-emerald-600 uppercase tracking-tight">{t('payroll')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Enterprise Salary Settlement Terminal</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl ring-1 ring-slate-100 shadow-sm">
           <Select value={selectedMonth} onValueChange={setSelectedMonth}>
             <SelectTrigger className="w-32 h-9 border-none bg-slate-50 rounded-xl font-bold text-xs"><SelectValue /></SelectTrigger>
             <SelectContent className="rounded-xl">
               {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((m, i) => (
                 <SelectItem key={m} value={String(i + 1)} className="text-xs font-bold">{m}</SelectItem>
               ))}
             </SelectContent>
           </Select>
           <Select value={selectedYear} onValueChange={setSelectedYear}>
             <SelectTrigger className="w-24 h-9 border-none bg-slate-50 rounded-xl font-bold text-xs"><SelectValue /></SelectTrigger>
             <SelectContent className="rounded-xl">
               {["2024", "2025", "2026"].map(y => <SelectItem key={y} value={y} className="text-xs font-bold">{y}</SelectItem>)}
             </SelectContent>
           </Select>
           <Button onClick={handleGeneratePayroll} disabled={isGenerating} className="bg-emerald-600 hover:bg-emerald-700 h-9 rounded-xl gap-2 text-[10px] font-black uppercase px-6">
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />} {t('payroll')} Generate
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="monthlyPayroll" value={formatCurrency(stats.total)} icon={CreditCard} colorClass="bg-blue-600" />
        <KPICard title="salaryPaid" value={formatCurrency(stats.paid)} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title="salaryDue" value={formatCurrency(stats.pending)} icon={AlertCircle} colorClass="bg-red-600" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
           <div className="overflow-x-auto">
             <Table>
               <TableHeader className="bg-slate-50/50">
                 <TableRow>
                   <TableHead className="h-12 text-[10px] uppercase font-black pl-8">Employee</TableHead>
                   <TableHead className="h-12 text-[10px] uppercase font-black">Payroll Period</TableHead>
                   <TableHead className="h-12 text-[10px] uppercase font-black text-right">Net Salary</TableHead>
                   <TableHead className="h-12 text-[10px] uppercase font-black text-center">Status</TableHead>
                   <TableHead className="h-12 text-right pr-8">Actions</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {payrolls?.length === 0 ? (
                   <TableRow><TableCell colSpan={5} className="h-64 text-center opacity-30 italic text-[10px] font-black uppercase tracking-widest">{t('noData')}</TableCell></TableRow>
                 ) : (
                   payrolls?.map((p, idx) => (
                     <TableRow 
                       key={p.id} 
                       className={cn(
                        "h-16 transition-all border-b border-white/50",
                        idx % 2 === 0 ? "bg-[#EAF6FF] hover:bg-[#D9EFFF]" : "bg-[#EEF9F1] hover:bg-[#E1F2E6]"
                       )}
                     >
                       <TableCell className="pl-8">
                          <div className="flex flex-col">
                            <span className="text-xs font-black uppercase text-slate-900">{p.employeeName}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{p.designation}</span>
                          </div>
                       </TableCell>
                       <TableCell className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{p.period}</TableCell>
                       <TableCell className="text-right font-black text-xs text-slate-900">{formatCurrency(p.netSalary)}</TableCell>
                       <TableCell className="text-center">
                          <Badge className={cn("text-[8px] font-black uppercase px-2 h-5 border-none", 
                            p.status === 'paid' ? "bg-green-600 text-white" : "bg-orange-50 text-orange-700")}>
                            {p.status}
                          </Badge>
                       </TableCell>
                       <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600"><Printer className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400"><History className="h-4 w-4" /></Button>
                          </div>
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
