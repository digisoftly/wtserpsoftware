"use client"

import * as React from "react"
import { Plus, Search, Loader2, MoreVertical, Edit, Trash2, Settings2, Fingerprint } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, setDoc, deleteDoc, serverTimestamp, writeBatch } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
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

export default function MasterCustomFieldsPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fieldsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_custom_fields"), orderBy("targetModule"));
  }, [db, companyId]);

  const { data: fields, isLoading } = useCollection(fieldsQuery);

  // Bulk Selection
  const { 
    selectedIds, 
    isAllSelected, 
    isSomeSelected, 
    toggleSelect, 
    toggleSelectAll, 
    clearSelection, 
    selectedCount 
  } = useBulkSelection(fields);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const fieldData = {
      label: formData.get("label") as string,
      type: formData.get("type") as string,
      targetModule: formData.get("targetModule") as string,
      options: (formData.get("options") as string)?.split(',').map(s => s.trim()).filter(Boolean) || [],
      isRequired: formData.get("isRequired") === "on",
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = selectedRecord ? doc(db, "companies", companyId, "master_custom_fields", selectedRecord.id) : doc(collection(db, "companies", companyId, "master_custom_fields"));
      await setDoc(docRef, { ...fieldData, createdAt: selectedRecord?.createdAt || serverTimestamp() }, { merge: true });
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
            batch.delete(doc(db, "companies", companyId, "master_custom_fields", id));
          });
          await batch.commit();
          toast({ title: t('success'), description: `${selectedIds.length} items removed.` });
          clearSelection();
        } catch (e) {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `companies/${companyId}/master_custom_fields/...`,
            operation: 'delete'
          }));
          toast({ variant: "destructive", title: t('error') });
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  const filtered = fields?.filter(f => f.label.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-headline text-pink-600 uppercase tracking-tight">{t('customFields')}</h1>
        <Button className="bg-pink-600 hover:bg-pink-700 gap-2 rounded-full h-9 px-6 text-[10px] uppercase font-bold shadow-lg" onClick={() => { setSelectedRecord(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4" /> {t('addCustomField')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard title={t('totalFields')} value={fields?.length || 0} icon={Fingerprint} colorClass="bg-pink-600" />
        <KPICard title={t('active_status')} value={fields?.length || 0} icon={Settings2} colorClass="bg-blue-600" />
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
                <TableHead className="h-10 text-[10px] uppercase font-black">{t('targetModule')}</TableHead>
                <TableHead className="h-10 text-[10px] uppercase font-black">{t('fieldType')}</TableHead>
                <TableHead className="text-right h-10 pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((f) => (
                <TableRow key={f.id} className={cn("h-12 hover:bg-muted/5 transition-colors group", selectedIds.includes(f.id) && "bg-blue-50/30")}>
                  <TableCell className="pl-6">
                    <Checkbox checked={selectedIds.includes(f.id)} onCheckedChange={() => toggleSelect(f.id)} />
                  </TableCell>
                  <TableCell className="pl-6 font-bold text-xs uppercase">{f.label}</TableCell>
                  <TableCell className="text-[10px] font-black text-pink-600 uppercase">{f.targetModule}</TableCell>
                  <TableCell className="text-[10px] font-bold text-muted-foreground uppercase">{f.type}</TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-pink-600"><MoreVertical className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem className="text-xs font-bold" onClick={() => { setSelectedRecord(f); setIsModalOpen(true); }}><Edit className="mr-2 h-3.5 w-3.5" /> {t('edit')}</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 text-xs font-bold" onClick={() => deleteDoc(doc(db!, "companies", companyId!, "master_custom_fields", f.id))}><Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
            <DialogTitle className="text-xl font-bold font-headline uppercase">{selectedRecord ? t('edit') : t('addCustomField')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="p-6 space-y-4 bg-slate-50">
            <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">{t('label')}</Label><Input name="label" defaultValue={selectedRecord?.label} required className="h-10 text-xs rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase">{t('fieldType')}</Label>
                <Select name="type" defaultValue={selectedRecord?.type || "text"}>
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text" className="text-xs font-bold">Text</SelectItem>
                    <SelectItem value="number" className="text-xs font-bold">Number</SelectItem>
                    <SelectItem value="dropdown" className="text-xs font-bold">Dropdown</SelectItem>
                    <SelectItem value="date" className="text-xs font-bold">Date</SelectItem>
                    <SelectItem value="checkbox" className="text-xs font-bold">Checkbox</SelectItem>
                    <SelectItem value="textarea" className="text-xs font-bold">Textarea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase">{t('targetModule')}</Label>
                <Select name="targetModule" defaultValue={selectedRecord?.targetModule || "product"}>
                  <SelectTrigger className="h-10 text-xs rounded-xl bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product" className="text-xs font-bold">Product</SelectItem>
                    <SelectItem value="customer" className="text-xs font-bold">Customer</SelectItem>
                    <SelectItem value="supplier" className="text-xs font-bold">Supplier</SelectItem>
                    <SelectItem value="project" className="text-xs font-bold">Project</SelectItem>
                    <SelectItem value="contract" className="text-xs font-bold">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase">{t('options')}</Label>
              <Input name="options" defaultValue={selectedRecord?.options?.join(', ')} placeholder="Option 1, Option 2..." className="h-10 text-xs rounded-xl" />
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-dashed">
              <Label className="text-xs font-bold">Required Field?</Label>
              <Switch name="isRequired" defaultChecked={selectedRecord?.isRequired} />
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
