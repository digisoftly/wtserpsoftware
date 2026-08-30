
"use client"

import * as React from "react"
import { 
  Users, 
  Plus, 
  Search, 
  Loader2, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  Mail, 
  Phone, 
  Building, 
  Briefcase,
  Calendar,
  Filter,
  ArrowRight
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, limit } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function EmployeeListPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t, formatDate } = useTranslation();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);

  // Data Subscription
  const employeesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "employees"),
      orderBy("createdAt", "desc"),
      limit(200)
    );
  }, [db, companyId, branchId]);

  const { data: employees, isLoading } = useCollection(employeesQuery);

  const filteredEmployees = React.useMemo(() => {
    if (!employees) return [];
    return employees.filter(emp => 
      `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const handleDelete = () => {
    if (!selectedRecord || !db || !companyId || !branchId) return;
    const docRef = doc(db, "companies", companyId, "branches", branchId, "employees", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: t('success') });
    setIsDeleteAlertOpen(false);
    setSelectedRecord(null);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-purple-600 uppercase tracking-tight">{t('employees')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Staff Identity Directory</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 gap-2 rounded-full px-8 shadow-xl shadow-purple-100 h-10 text-[10px] uppercase font-black transition-all active:scale-95 w-full md:w-auto" asChild>
          <Link href="/hrm/employees/new">
            <Plus className="h-4 w-4" /> {t('addEmployee')}
          </Link>
        </Button>
      </div>

      <Card className="bg-white p-3 rounded-2xl border ring-1 ring-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input 
            placeholder={t('search')} 
            className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs font-bold transition-all outline-none focus:ring-2 focus:ring-purple-500" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <Button variant="ghost" size="sm" className="h-10 px-4 gap-2 text-[10px] font-black uppercase text-slate-500">
           <Filter className="h-3.5 w-3.5" /> {t('actions')}
        </Button>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="h-12 text-[10px] uppercase font-black pl-8">{t('employeeId')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('employeeName')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('designation')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black text-center">{t('status')}</TableHead>
                  <TableHead className="h-12 text-right pr-8 sticky right-0 bg-white/95 backdrop-blur-sm z-20 w-[120px]">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-64 text-center opacity-30 italic text-xs uppercase font-bold tracking-widest">{t('noData')}</TableCell></TableRow>
                ) : (
                  filteredEmployees.map((emp, idx) => (
                    <TableRow 
                      key={emp.id} 
                      className={cn(
                        "h-20 transition-all border-b border-white/50",
                        idx % 2 === 0 ? "bg-[#EAF6FF] hover:bg-[#D9EFFF]" : "bg-[#EEF9F1] hover:bg-[#E1F2E6]"
                      )}
                    >
                      <TableCell className="pl-8">
                         <span className="font-mono text-[10px] font-black text-purple-600 uppercase tracking-tighter bg-purple-50 px-2 py-1 rounded">
                           {emp.employeeId}
                         </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center font-black text-purple-600 text-xs shadow-inner">
                              {emp.firstName?.[0]}{emp.lastName?.[0]}
                           </div>
                           <div>
                              <p className="text-xs font-black uppercase text-slate-900 leading-tight">{emp.firstName} {emp.lastName}</p>
                              <div className="flex items-center gap-3 mt-1 text-[9px] font-bold text-slate-400 uppercase">
                                 <span className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> {emp.email}</span>
                              </div>
                           </div>
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter flex items-center gap-1">
                               <Briefcase className="h-3 w-3 opacity-30" /> {emp.designation}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 flex items-center gap-1">
                               <Building className="h-2.5 w-2.5 opacity-30" /> {emp.department}
                            </span>
                         </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("text-[8px] h-5 uppercase border-none px-2 font-black shadow-sm", 
                          emp.employmentStatus === 'active' ? "bg-green-600 text-white" : "bg-slate-200 text-slate-700")}>
                          {emp.employmentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8 sticky right-0 bg-white/90 backdrop-blur-sm group-hover:bg-slate-50/90 transition-colors z-20">
                         <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => router.push(`/hrm/employees/${emp.id}`)}><Eye className="h-4 w-4" /></Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl p-2 border-slate-100">
                                <DropdownMenuItem className="h-10 rounded-lg text-xs font-bold" onClick={() => router.push(`/hrm/employees/${emp.id}`)}><Eye className="mr-2 h-4 w-4" /> {t('profile')}</DropdownMenuItem>
                                <DropdownMenuItem className="h-10 rounded-lg text-xs font-bold" onClick={() => router.push(`/hrm/employees/${emp.id}/edit`)}><Edit className="mr-2 h-4 w-4" /> {t('edit')}</DropdownMenuItem>
                                <DropdownMenuSeparator className="my-1 bg-slate-50" />
                                <DropdownMenuItem className="h-10 rounded-lg text-red-600 text-xs font-bold focus:bg-red-50 focus:text-red-700" onClick={() => { setSelectedRecord(emp); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> {t('delete')}</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase text-slate-900">{t('confirmDelete')}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-bold text-slate-500">This action is permanent and will remove the employee record from the system registry.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-6">
            <AlertDialogCancel className="h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest" onClick={handleDelete}>Delete Record</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
