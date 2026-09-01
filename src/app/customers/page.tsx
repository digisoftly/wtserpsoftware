
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Search, MoreVertical, Loader2, UserCheck, UserX, Edit, Trash2, Eye, Phone, Mail } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, query, limit, orderBy, deleteDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { KPICard } from "@/components/dashboard/kpi-card"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export default function CustomersPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const router = useRouter();

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const deferredSearch = React.useDeferredValue(searchTerm);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "customers"),
      orderBy("createdAt", "desc"),
      limit(100)
    );
  }, [db, companyId, branchId]);

  const { data: customers, isLoading } = useCollection(customersQuery);

  const stats = React.useMemo(() => ({
    total: customers?.length || 0,
    active: customers?.length || 0,
    due: 0
  }), [customers]);

  const filteredCustomers = React.useMemo(() => {
    return customers?.filter(c => 
      c.fullName?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      c.email?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      c.companyName?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      c.phoneNumber?.toLowerCase().includes(deferredSearch.toLowerCase())
    );
  }, [customers, deferredSearch]);

  const handleDeleteCustomer = async () => {
    if (!selectedCustomer || !db) return;
    const docRef = doc(db, "companies", companyId!, "branches", branchId!, "customers", selectedCustomer.id);
    await deleteDoc(docRef);
    toast({ title: t('success') });
    setIsDeleteAlertOpen(false);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-headline text-cyan-600 uppercase tracking-tight">{t('customers')}</h1>
        <Button className="bg-cyan-600 hover:bg-cyan-700 gap-2 rounded-full h-9 px-6 text-[10px] uppercase font-bold shadow-lg shadow-cyan-100" asChild>
          <Link href="/customers/new">
            <UserPlus className="h-4 w-4" /> {t('add')} {t('customer')}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title={t('activeCustomers')} value={stats.total} icon={Users} colorClass="bg-blue-600" />
        <KPICard title={t('all')} value={stats.active} icon={UserCheck} colorClass="bg-green-600" />
        <KPICard title={t('pendingInvoices')} value={stats.due} icon={UserX} colorClass="bg-red-600" />
      </div>

      <div className="bg-white p-3 rounded-2xl border ring-1 ring-slate-100">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input 
            placeholder={t('search')} 
            className="pl-9 h-10 w-full border-none bg-slate-50/50 rounded-xl text-xs font-bold transition-all outline-none" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-cyan-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-black h-12 pl-8">Type</TableHead>
                  <TableHead className="text-[10px] uppercase font-black h-12">Customer Identity</TableHead>
                  <TableHead className="text-[10px] uppercase font-black h-12">Contact Details</TableHead>
                  <TableHead className="h-12 text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers?.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-40 text-center text-[10px] font-black uppercase text-slate-300">{t('noData')}</TableCell></TableRow>
                ) : (
                  filteredCustomers?.map((customer, idx) => (
                    <TableRow 
                      key={customer.id} 
                      className={cn(
                        "h-16 transition-all border-b border-white/50 cursor-pointer",
                        idx % 2 === 0 ? "bg-[#EAF6FF] hover:bg-[#D9EFFF]" : "bg-[#EEF9F1] hover:bg-[#E1F2E6]"
                      )}
                      onClick={() => router.push(`/customers/${customer.id}/view`)}
                    >
                      <TableCell className="pl-8">
                        <Badge variant="outline" className="text-[8px] font-black h-5 px-2 bg-white border-none uppercase">
                          {customer.customerType === "company" ? "Corp" : customer.customerType === "organization" ? "Org" : "Indiv"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-xs uppercase text-slate-900">
                          {customer.customerType !== 'individual' ? customer.companyName : customer.fullName}
                        </div>
                        {customer.customerType !== 'individual' && customer.contactPerson && (
                          <div className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter mt-0.5">Attn: {customer.contactPerson}</div>
                        )}
                      </TableCell>
                      <TableCell>
                         <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-700">
                               <Phone className="h-3 w-3 text-cyan-600" /> {customer.phoneNumber}
                            </span>
                            {customer.email && (
                              <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                                <Mail className="h-2.5 w-2.5" /> {customer.email}
                              </span>
                            )}
                         </div>
                      </TableCell>
                      <TableCell className="text-right pr-8" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => router.push(`/customers/${customer.id}/view`)} title="View Profile"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-amber-600" onClick={() => router.push(`/customers/${customer.id}/edit`)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-600" onClick={() => { setSelectedCustomer(customer); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
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
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tight text-slate-900">{t('confirmDelete')}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">Record will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest" onClick={handleDeleteCustomer}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
