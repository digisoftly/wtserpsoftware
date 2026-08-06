"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { UserPlus, Search, MoreVertical, Loader2, Users, Edit, Trash2, UserCheck, UserX } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { KPICard } from "@/components/dashboard/kpi-card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"

export default function HRMPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");

  const employeesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "employees"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: employees, isLoading } = useCollection(employeesQuery);

  const stats = React.useMemo(() => ({
    total: employees?.length || 0,
    present: employees?.filter(e => e.employmentStatus === 'active').length || 0,
    absent: 0 
  }), [employees]);

  const handleDeleteEmployee = () => {
    if (!selectedRecord || !db) return;
    const docRef = doc(db, "companies", companyId!, "branches", branchId!, "employees", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: t('success') });
    setIsDeleteAlertOpen(false);
  };

  const filteredEmployees = employees?.filter(emp => 
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-headline text-purple-600">{t('hrm')}</h1>
        <Button className="bg-purple-600 hover:bg-purple-700 gap-2 rounded-full h-9 px-6 text-[10px] uppercase font-bold shadow-lg" asChild>
          <Link href="/hrm/new">
            <UserPlus className="h-4 w-4" /> {t('addStaff')}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title={t('totalStaff')} value={stats.total} icon={Users} colorClass="bg-blue-600" />
        <KPICard title={t('present')} value={stats.present} icon={UserCheck} colorClass="bg-green-600" />
        <KPICard title={t('absent')} value={stats.absent} icon={UserX} colorClass="bg-red-600" />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder={t('search')} className="pl-9 h-9 border-none bg-white shadow-sm ring-1 ring-slate-100 text-xs" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white ring-1 ring-slate-100">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead className="text-[10px] uppercase font-bold h-9">User</TableHead>
                <TableHead className="text-[10px] uppercase font-bold h-9">Position</TableHead>
                <TableHead className="text-right h-9"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees?.map((emp) => (
                <TableRow key={emp.id} className="h-12 hover:bg-muted/10 transition-colors">
                  <TableCell>
                    <div className="font-bold text-xs">{emp.firstName} {emp.lastName}</div>
                    <div className="text-[9px] uppercase font-black text-muted-foreground">{emp.employeeIdNumber}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs font-bold">{emp.jobTitle}</div>
                    <div className="text-[9px] uppercase font-black text-muted-foreground">{emp.department}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-purple-50 text-purple-600 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem className="text-xs font-bold" asChild><Link href={`/hrm/${emp.id}/edit`}><Edit className="mr-2 h-3.5 w-3.5" /> {t('edit')}</Link></DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 text-xs font-bold" onClick={() => { setSelectedRecord(emp); setIsDeleteAlertOpen(true); }}>
                          <Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl">
          <AlertDialogHeader><AlertDialogTitle className="font-headline uppercase">{t('delete')}?</AlertDialogTitle><AlertDialogDescription className="text-xs">Record will be permanently archived.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="rounded-full text-[10px] uppercase font-bold h-9">{t('cancel')}</AlertDialogCancel><AlertDialogAction className="bg-red-600 rounded-full text-[10px] uppercase font-bold h-9" onClick={handleDeleteEmployee}>{t('delete')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}