
"use client"

import * as React from "react"
import { Plus, Search, Loader2, MoreVertical, Edit, Trash2, ShieldCheck, CheckCircle2 } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, setDoc, deleteDoc, serverTimestamp, where, writeBatch } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { KPICard } from "@/components/dashboard/kpi-card"
import { Checkbox } from "@/components/ui/checkbox"
import { useBulkSelection } from "@/hooks/use-bulk-selection"
import { BulkActionToolbar } from "@/components/layout/bulk-action-toolbar"
import { cn } from "@/lib/utils"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export default function MasterWarrantyTypesPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const { t, language } = useTranslation();
  
  const masterType = "warrantyTypes";
  const collectionName = "master_data";

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const masterQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, "companies", companyId, collectionName), 
      where("type", "==", masterType),
      orderBy("name")
    );
  }, [db, companyId, masterType]);

  const { data: records, isLoading } = useCollection(masterQuery);

  // Bulk Selection
  const { 
    selectedIds, 
    isAllSelected, 
    toggleSelect, 
    toggleSelectAll, 
    clearSelection, 
    selectedCount 
  } = useBulkSelection(records);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId) return;

    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).trim();

    // Duplicate Check
    const exists = records?.some(r => 
      r.name?.toLowerCase() === name.toLowerCase() && 
      r.id !== selectedRecord?.id
    );

    if (exists) {
      toast({ 
        variant: "destructive", 
        title: language === 'BN' ? "এই নামে ইতিমধ্যে তথ্য রয়েছে" : "Name already exists",
        description: name
      });
      return;
    }

    setIsSubmitting(true);
    const data = {
      type: masterType,
      name: name,
      description: formData.get("description") as string || "",
      isActive: true,
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = selectedRecord ? doc(db, "companies", companyId, collectionName, selectedRecord.id) : doc(collection(db, "companies", companyId, collectionName));
      await setDoc(docRef, { ...data, createdAt: selectedRecord?.createdAt || serverTimestamp(), id: docRef.id }, { merge: true });
      toast({ title: t('success') });
      setIsModalOpen(false);
      setSelectedRecord(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (!db || !companyId || selectedIds.length === 0) return;

    if (action === 'delete') {
      if (confirm(`Delete ${selectedIds.length} items?`)) {
        setIsSubmitting(true);
        try {
          const batch = writeBatch(db);
          selectedIds.forEach(id => {
            batch.delete(doc(db, "companies", companyId, collectionName, id));
          });
          await batch.commit();
          toast({ title: t('success'), description: `${selectedIds.length} items removed.` });
          clearSelection();
        } catch (e) {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `companies/${companyId}/${collectionName}/...`,
            operation: 'delete'
          }));
          toast({ variant: "destructive", title: t('error') });
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  const filtered = records?.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-4 pb-10">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">{t('warrantyTypes')}</h1>
          <nav className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Master Data / Product Warranty</nav>
        </div>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 gap-2 h-9 rounded-md px-4 font-bold text-xs shadow-sm" onClick={() => { setSelectedRecord(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4" /> {t('addGeneric')}
        </Button>
      </div>

      <div className="flex gap-4">
        <KPICard title={t('warrantyTypes')} value={records?.length || 0} icon={ShieldCheck} colorClass="text-purple-500" />
      </div>

      <div className="bg-white p-3 rounded-md border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input placeholder={t('search')} className="pl-9 h-8 w-full border border-slate-200 bg-slate-50/50 rounded-md text-xs font-medium focus:ring-1 focus:ring-blue-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <Card className="border border-slate-200 shadow-sm rounded-md overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50 border-b">
            <TableRow>
              <TableHead className="w-10 pl-6 h-10">
                <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} />
              </TableHead>
              <TableHead className="h-10 text-[10px] uppercase font-bold text-slate-500">{t('label')}</TableHead>
              <TableHead className="h-10 text-[10px] uppercase font-bold text-slate-500">{t('details')}</TableHead>
              <TableHead className="text-right h-10 pr-6 sticky right-0 bg-slate-50 w-24">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-300" /></TableCell></TableRow>
            ) : filtered?.length === 0 ? (
               <TableRow><TableCell colSpan={4} className="h-40 text-center text-slate-400 text-xs italic">No data found</TableCell></TableRow>
            ) : (
              filtered?.map((r) => (
                <TableRow key={r.id} className={cn("h-11 hover:bg-slate-50/50 transition-colors group", selectedIds.includes(r.id) && "bg-blue-50/30")}>
                  <TableCell className="pl-6">
                    <Checkbox checked={selectedIds.includes(r.id)} onCheckedChange={() => toggleSelect(r.id)} />
                  </TableCell>
                  <TableCell className="font-bold text-xs uppercase text-slate-700">{r.name}</TableCell>
                  <TableCell className="text-[11px] text-slate-500">{r.description || "---"}</TableCell>
                  <TableCell className="text-right pr-6 sticky right-0 bg-white group-hover:bg-slate-50 transition-colors">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-slate-400 hover:text-blue-600" onClick={() => { setSelectedRecord(r); setIsModalOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md text-slate-400 hover:text-red-600" onClick={() => deleteDoc(doc(db!, "companies", companyId!, collectionName, r.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md rounded-lg p-0 overflow-hidden border-none shadow-2xl bg-white">
          <DialogHeader className="bg-slate-900 p-4 text-white">
            <DialogTitle className="text-sm font-bold uppercase tracking-widest">{selectedRecord ? t('edit') : t('addGeneric')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase text-slate-500">{t('label')} *</Label><Input name="name" defaultValue={selectedRecord?.name} required className="h-10 text-sm font-medium" /></div>
            <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase text-slate-500">{t('details')}</Label><Input name="description" defaultValue={selectedRecord?.description} className="h-10 text-sm font-medium" /></div>
            <DialogFooter className="pt-4 border-t gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)} className="text-xs font-bold">{t('cancel')}</Button>
              <Button type="submit" disabled={isSubmitting} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs font-bold px-6">{isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : t('save')}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <BulkActionToolbar 
        selectedCount={selectedCount} 
        onClear={clearSelection} 
        onAction={handleBulkAction}
        isLoading={isSubmitting}
      />
    </div>
  )
}
