
"use client"

import * as React from "react"
import { Plus, Search, Loader2, MoreVertical, Edit, Trash2, FolderTree, LayoutGrid } from "lucide-react"
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
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { KPICard } from "@/components/dashboard/kpi-card"
import { Checkbox } from "@/components/ui/checkbox"
import { useBulkSelection } from "@/hooks/use-bulk-selection"
import { BulkActionToolbar } from "@/components/layout/bulk-action-toolbar"
import { cn } from "@/lib/utils"

export default function MasterCategoriesPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const categoriesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_categories"), orderBy("name"));
  }, [db, companyId]);

  const { data: categories, isLoading } = useCollection(categoriesQuery);

  // Bulk Selection
  const { 
    selectedIds, 
    isAllSelected, 
    isSomeSelected, 
    toggleSelect, 
    toggleSelectAll, 
    clearSelection, 
    selectedCount 
  } = useBulkSelection(categories);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const categoryData = {
      name: formData.get("name") as string,
      parentId: formData.get("parentId") as string || "none",
      description: formData.get("description") as string || "",
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = selectedRecord ? doc(db, "companies", companyId, "master_categories", selectedRecord.id) : doc(collection(db, "companies", companyId, "master_categories"));
      await setDoc(docRef, { ...categoryData, createdAt: selectedRecord?.createdAt || serverTimestamp() }, { merge: true });
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
      if (confirm(`Delete ${selectedIds.length} categories?`)) {
        setIsSubmitting(true);
        try {
          const batch = writeBatch(db);
          selectedIds.forEach(id => {
            batch.delete(doc(db, "companies", companyId, "master_categories", id));
          });
          await batch.commit();
          toast({ title: t('success'), description: `${selectedIds.length} items removed.` });
          clearSelection();
        } catch (e) {
          toast({ variant: "destructive", title: t('error') });
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  const filtered = categories?.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-headline text-pink-600 uppercase tracking-tight">{t('categories')}</h1>
        <Button className="bg-pink-600 hover:bg-pink-700 gap-2 rounded-full h-9 px-6 text-[10px] uppercase font-bold shadow-lg" onClick={() => { setSelectedRecord(null); setIsModalOpen(true); }}>
          <Plus className="h-4 w-4" /> {t('addCategory')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard title={t('totalCategories')} value={categories?.length || 0} icon={FolderTree} colorClass="bg-pink-600" />
        <KPICard title={t('active_status')} value={categories?.length || 0} icon={LayoutGrid} colorClass="bg-blue-600" />
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
                <TableHead className="h-10 text-[10px] uppercase font-black">{t('label')}</TableHead>
                <TableHead className="h-10 text-[10px] uppercase font-black">{t('parentCategory')}</TableHead>
                <TableHead className="text-right h-10 pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((c) => (
                <TableRow key={c.id} className={cn("h-12 hover:bg-muted/5 transition-colors group", selectedIds.includes(c.id) && "bg-blue-50/30")}>
                  <TableCell className="pl-6">
                    <Checkbox checked={selectedIds.includes(c.id)} onCheckedChange={() => toggleSelect(c.id)} />
                  </TableCell>
                  <TableCell className="pl-6 font-bold text-xs uppercase">{c.name}</TableCell>
                  <TableCell className="text-[10px] font-bold text-muted-foreground uppercase">
                    {c.parentId !== 'none' ? categories?.find(cat => cat.id === c.parentId)?.name : "Root"}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-pink-600"><MoreVertical className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem className="text-xs font-bold" onClick={() => { setSelectedRecord(c); setIsModalOpen(true); }}><Edit className="mr-2 h-3.5 w-3.5" /> {t('edit')}</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 text-xs font-bold" onClick={() => deleteDoc(doc(db!, "companies", companyId!, "master_categories", c.id))}><Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}</DropdownMenuItem>
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
            <DialogTitle className="text-xl font-bold font-headline uppercase">{selectedRecord ? t('edit') : t('addCategory')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="p-6 space-y-4 bg-slate-50">
            <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">{t('label')}</Label><Input name="name" defaultValue={selectedRecord?.name} required className="h-10 text-xs rounded-xl" /></div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase">{t('parentCategory')}</Label>
              <Select name="parentId" defaultValue={selectedRecord?.parentId || "none"}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs font-bold">-- Root Category --</SelectItem>
                  {categories?.filter(cat => cat.id !== selectedRecord?.id).map(cat => <SelectItem key={cat.id} value={cat.id} className="text-xs font-bold">{cat.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-[10px] font-bold uppercase">{t('details')}</Label><Input name="description" defaultValue={selectedRecord?.description} className="h-10 text-xs rounded-xl" /></div>
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
