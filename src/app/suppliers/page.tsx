"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Truck, Plus, Search, Loader2, MoreVertical, Mail, Phone, Edit, Trash2, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"

export default function SuppliersPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");

  const suppliersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "suppliers");
  }, [db, companyId, branchId]);

  const { data: suppliers, isLoading } = useCollection(suppliersQuery);

  const stats = React.useMemo(() => ({
    total: suppliers?.length || 0,
    payable: suppliers?.reduce((s, sup) => s + (sup.totalDueAmount || 0), 0) || 0
  }), [suppliers]);

  const handleDeleteSupplier = () => {
    if (!selectedRecord || !db) return;
    const docRef = doc(db, "companies", companyId!, "branches", branchId!, "suppliers", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: t('success') });
    setIsDeleteAlertOpen(false);
  };

  const filteredSuppliers = suppliers?.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-headline text-amber-700">{t('suppliers')}</h1>
        <Button className="bg-amber-700 hover:bg-amber-800 gap-2 rounded-full shadow-lg h-9 px-6 text-[10px] uppercase font-bold shadow-amber-100" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" /> {t('addSupplier')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard title={t('totalSuppliers')} value={stats.total} icon={Truck} colorClass="bg-blue-600" />
        <KPICard title={t('payableAmount')} value={`৳${stats.payable.toLocaleString()}`} icon={AlertCircle} colorClass="bg-red-600" />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder={t('search')} className="pl-9 h-9 border-none bg-white shadow-sm ring-1 ring-slate-100 text-xs" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-700" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white ring-1 ring-slate-100">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-bold h-9">{t('label')}</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9">Contact</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9">{t('dueAmount')}</TableHead>
                  <TableHead className="text-right h-9"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers?.map((s) => (
                  <TableRow key={s.id} className="h-12 hover:bg-muted/10 transition-colors">
                    <TableCell className="font-bold text-xs">{s.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
                        <Mail className="h-3 w-3 opacity-40" /> {s.email || "---"}
                        <Phone className="h-3 w-3 opacity-40 ml-2" /> {s.phoneNumber || "---"}
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-xs text-red-600">৳{(s.totalDueAmount || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-amber-50 text-amber-700 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem className="text-xs font-bold" onClick={() => { setSelectedRecord(s); setIsEditModalOpen(true); }}><Edit className="mr-2 h-3.5 w-3.5" /> {t('edit')}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 text-xs font-bold" onClick={() => { setSelectedRecord(s); setIsDeleteAlertOpen(true); }}>
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedRecord(null); } }}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-[2rem]">
          <DialogHeader className="bg-amber-700 p-6 text-white flex-row items-center gap-3">
            <Truck className="h-6 w-6" />
            <DialogTitle className="text-xl font-bold font-headline uppercase">{isEditModalOpen ? t('edit') : t('addSupplier')}</DialogTitle>
          </DialogHeader>
          <div className="p-6 bg-slate-50 italic text-[10px] uppercase font-bold tracking-widest text-center py-20 text-muted-foreground">
            {t('locationSetup')}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader><AlertDialogTitle className="font-headline uppercase">{t('delete')}?</AlertDialogTitle><AlertDialogDescription className="text-xs font-bold text-muted-foreground">{t('errorSub')}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full text-[10px] uppercase font-bold h-9">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 rounded-full text-[10px] uppercase font-bold h-9" onClick={handleDeleteSupplier}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
