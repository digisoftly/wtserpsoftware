
"use client"

import * as React from "react"
import { Plus, Search, Loader2, MoreVertical, Edit, Trash2, ShieldCheck, CheckCircle2, X } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useBulkSelection } from "@/hooks/use-bulk-selection"
import { BulkActionToolbar } from "@/components/layout/bulk-action-toolbar"
import { cn } from "@/lib/utils"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

export default function GenericMasterPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const { t, language } = useTranslation();
  
  // Detect current master type from path
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const masterType = pathname.split('/').pop() || 'generic';
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
      isActive: formData.get("isActive") === "on",
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
    } else if (action === 'status') {
       setIsSubmitting(true);
       try {
         const batch = writeBatch(db);
         selectedIds.forEach(id => {
           batch.update(doc(db, "companies", companyId, collectionName, id), { isActive: true, updatedAt: serverTimestamp() });
         });
         await batch.commit();
         toast({ title: t('success'), description: "Status updated for selected items." });
         clearSelection();
       } catch (e) {
         toast({ variant: "destructive", title: t('error') });
       } finally {
         setIsSubmitting(false);
       }
    }
  };

  const filtered = records?.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-headline text-pink-600 uppercase tracking-tight">{t(masterType as any)}</h1>
        <Button className="bg-pink-600 hover:bg-pink-700 gap-2 rounded-full h-9 px-6 text-[10px] uppercase font-bold shadow-lg" onClick={() => { setSelectedRecord(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4" /> {t('addGeneric')}
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder={t('search')} className="pl-9 h-9 border-none bg-white shadow-sm ring-1 ring-slate-100 text-xs" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-pink-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden bg-white ring-1 ring-slate-100">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="w-12 pl-6">
                  <Checkbox checked={isAllSelected} onCheckedChange={toggleSelectAll} />
                </TableHead>
                <TableHead className="h-10 text-[10px] uppercase font-black pl-6">{t('label')}</TableHead>
                <TableHead className="h-10 text-[10px] uppercase font-black">{t('details')}</TableHead>
                <TableHead className="h-10 text-[10px] uppercase font-black text-center">{t('status')}</TableHead>
                <TableHead className="text-right h-10 pr-6 sticky right-0 bg-white/95 backdrop-blur-sm z-20 w-[120px]">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((r) => (
                <TableRow key={r.id} className={cn("h-12 hover:bg-muted/5 transition-colors group", selectedIds.includes(r.id) && "bg-blue-50/30")}>
                  <TableCell className="pl-6">
                    <Checkbox checked={selectedIds.includes(r.id)} onCheckedChange={() => toggleSelect(r.id)} />
                  </TableCell>
                  <TableCell className="pl-6 font-bold text-xs uppercase">{r.name}</TableCell>
                  <TableCell className="text-[10px] font-bold text-muted-foreground uppercase">{r.description || "---"}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={cn("text-[8px] uppercase font-black px-2 h-4", r.isActive ? "bg-green-50 text-green-700 border-none" : "bg-red-50 text-red-700 border-none")}>
                      {r.isActive ? t('active_status') : t('inactive_status')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6 sticky right-0 bg-white/90 backdrop-blur-sm z-20">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => { setSelectedRecord(r); setIsModalOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-red-600 hover:bg-red-50" onClick={() => deleteDoc(doc(db!, "companies", companyId!, collectionName, r.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-[2rem]">
          <DialogHeader className="bg-pink-600 p-6 text-white">
            <DialogTitle className="text-xl font-bold font-headline uppercase">{selectedRecord ? t('edit') : t('addGeneric')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="p-6 space-y-4 bg-slate-50">
            <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">{t('label')}</Label><Input name="name" defaultValue={selectedRecord?.name} required className="h-10 text-xs rounded-xl" /></div>
            <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">{t('details')}</Label><Input name="description" defaultValue={selectedRecord?.description} className="h-10 text-xs rounded-xl" /></div>
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-dashed">
              <Label className="text-xs font-bold uppercase">{t('isActive')}</Label>
              <Switch name="isActive" defaultChecked={selectedRecord ? selectedRecord.isActive : true} />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full bg-pink-600 hover:bg-pink-700 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest">{isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : t('save')}</Button>
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
