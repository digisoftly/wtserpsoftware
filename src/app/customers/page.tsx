
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Search, MoreVertical, Loader2, UserCheck, UserX, Edit, Trash2, Mail, Phone, Eye } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, doc, query, limit, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Badge } from "@/components/ui/badge"
import { KPICard } from "@/components/dashboard/kpi-card"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"

export default function CustomersPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const deferredSearch = React.useDeferredValue(searchTerm); // Optimization
  const [customerType, setCustomerType] = React.useState<"individual" | "company">("individual");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      c.email?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
      c.companyName?.toLowerCase().includes(deferredSearch.toLowerCase())
    );
  }, [customers, deferredSearch]);

  const handleSaveCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) return;

    const customerData = {
      companyId,
      branchId,
      customerType,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string || "",
      phoneNumber: formData.get("phoneNumber") as string || "",
      companyName: customerType === "company" ? (formData.get("companyName") as string) : "",
      updatedAt: serverTimestamp(),
    };

    try {
      if (isEditModalOpen && selectedCustomer) {
        const docRef = doc(db, "companies", companyId, "branches", branchId, "customers", selectedCustomer.id);
        updateDocumentNonBlocking(docRef, customerData);
      } else {
        const colRef = collection(db, "companies", companyId, "branches", branchId, "customers");
        addDocumentNonBlocking(colRef, { ...customerData, createdAt: serverTimestamp() });
      }
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      toast({ title: t('success') });
    } catch (err) {
      toast({ variant: "destructive", title: t('error') });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = React.useCallback(() => {
    if (!selectedCustomer || !db) return;
    const docRef = doc(db, "companies", companyId!, "branches", branchId!, "customers", selectedCustomer.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: t('success') });
    setIsDeleteAlertOpen(false);
  }, [selectedCustomer, db, companyId, branchId, t]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-headline text-cyan-600">{t('customers')}</h1>
        <Button className="bg-cyan-600 hover:bg-cyan-700 gap-2 rounded-full h-9 px-6 text-[10px] uppercase font-bold shadow-lg shadow-cyan-100" onClick={() => setIsAddModalOpen(true)}>
          <UserPlus className="h-4 w-4" /> {t('addCustomer')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title={t('activeCustomers')} value={stats.total} icon={Users} colorClass="bg-blue-600" />
        <KPICard title={t('present')} value={stats.active} icon={UserCheck} colorClass="bg-green-600" />
        <KPICard title={t('pendingInvoices')} value={stats.due} icon={UserX} colorClass="bg-red-600" />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input 
            placeholder={t('search')} 
            className="pl-9 h-9 border-none bg-white shadow-sm ring-1 ring-slate-100 text-xs" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-cyan-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white ring-1 ring-slate-100">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-bold h-9">Type</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9">Name</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9">Contact</TableHead>
                  <TableHead className="h-9 text-right pr-6 sticky right-0 bg-white/95 backdrop-blur-sm z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] w-[150px]">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers?.map((customer) => (
                  <TableRow key={customer.id} className="h-12 hover:bg-muted/10 transition-colors group">
                    <TableCell>
                      <Badge variant="outline" className="text-[8px] uppercase font-black border-none bg-slate-100 px-1.5 h-4">
                        {customer.customerType === "company" ? "Corp" : "Indiv"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-xs">{customer.firstName} {customer.lastName}</div>
                      <div className="text-[9px] text-muted-foreground uppercase font-black">{customer.companyName || "Personal"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
                        <Mail className="h-3 w-3 opacity-40" /> {customer.email || "---"}
                        <Phone className="h-3 w-3 opacity-40 ml-2" /> {customer.phoneNumber || "---"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6 sticky right-0 bg-white/90 backdrop-blur-sm group-hover:bg-slate-50/90 transition-colors z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-end items-center gap-1">
                        <div className="hidden md:flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => { setSelectedCustomer(customer); setIsEditModalOpen(true); }} title={t('view')}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-amber-600 hover:bg-amber-50" onClick={() => { setSelectedCustomer(customer); setIsEditModalOpen(true); }} title={t('edit')}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-red-600 hover:bg-red-50" onClick={() => { setSelectedCustomer(customer); setIsDeleteAlertOpen(true); }} title={t('delete')}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden rounded-full hover:bg-cyan-50 text-cyan-600 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem className="text-xs" onClick={() => { setSelectedCustomer(customer); setIsEditModalOpen(true); }}><Edit className="mr-2 h-3.5 w-3.5" /> {t('edit')}</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 text-xs" onClick={() => { setSelectedCustomer(customer); setIsDeleteAlertOpen(true); }}>
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedCustomer(null); } }}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-cyan-600 p-6 text-white flex-row items-center gap-3">
            <Users className="h-6 w-6" />
            <DialogTitle className="text-xl font-bold font-headline uppercase">{isEditModalOpen ? t('edit') : t('addCustomer')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCustomer} className="p-6 space-y-4 bg-slate-50">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">First Name</Label><Input name="firstName" defaultValue={selectedCustomer?.firstName} required className="h-10 text-xs" /></div>
               <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">Last Name</Label><Input name="lastName" defaultValue={selectedCustomer?.lastName} required className="h-10 text-xs" /></div>
            </div>
            <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">Email</Label><Input name="email" type="email" defaultValue={selectedCustomer?.email} className="h-10 text-xs" /></div>
            <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">Phone</Label><Input name="phoneNumber" defaultValue={selectedCustomer?.phoneNumber} className="h-10 text-xs" /></div>
            <Button type="submit" disabled={isSubmitting} className="w-full bg-cyan-600 hover:bg-cyan-700 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest">{isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : t('save')}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle className="font-headline">{t('delete')}?</AlertDialogTitle><AlertDialogDescription className="text-xs">Record will be permanently deleted.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full text-[10px] uppercase font-bold h-9">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 rounded-full text-[10px] uppercase font-bold h-9" onClick={handleDeleteCustomer}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
