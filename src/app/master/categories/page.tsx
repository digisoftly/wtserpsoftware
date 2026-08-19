
"use client"

import * as React from "react"
import { Search, Loader2, Edit, Trash2, FolderTree, Save, Plus, ChevronRight, Layers } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function MasterCategoriesPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const { t, language } = useTranslation();
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const categoriesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_categories"), orderBy("name"));
  }, [db, companyId]);

  const { data: categories, isLoading } = useCollection(categoriesQuery);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId) return;

    const form = e.currentTarget; // FIX: Capture form element
    const formData = new FormData(form);
    const name = (formData.get("name") as string).trim();

    const exists = categories?.some(c => 
      c.name?.toLowerCase() === name.toLowerCase() && 
      c.id !== selectedRecord?.id
    );

    if (exists) {
      toast({ variant: "destructive", title: language === 'BN' ? "এই নামে ইতিমধ্যে তথ্য রয়েছে" : "Name already exists" });
      return;
    }

    setIsSubmitting(true);
    const categoryData = {
      name: name,
      parentId: formData.get("parentId") as string || "none",
      description: formData.get("description") as string || "",
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = selectedRecord ? doc(db, "companies", companyId, "master_categories", selectedRecord.id) : doc(collection(db, "companies", companyId, "master_categories"));
      await setDoc(docRef, { ...categoryData, createdAt: selectedRecord?.createdAt || serverTimestamp(), id: docRef.id }, { merge: true });
      toast({ title: t('common.success') });
      setSelectedRecord(null);
      form.reset(); // FIX: Use captured form element
    } catch (err: any) {
      toast({ variant: "destructive", title: t('common.error'), description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = categories?.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getLevel = (cat: any, list: any[]): number => {
    if (cat.parentId === 'none') return 1;
    const parent = list.find(c => c.id === cat.parentId);
    if (!parent) return 1;
    return 1 + getLevel(parent, list);
  };

  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-xl font-black font-headline text-blue-600 uppercase tracking-tight flex items-center gap-2">
        <Layers className="h-6 w-6" /> {t('nav.categories')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="p-8 h-fit rounded-[2rem] border-none ring-1 ring-slate-100 shadow-sm bg-white space-y-6">
          <h2 className="text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">{selectedRecord ? t('common.edit') : t('nav.addCategory')}</h2>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('common.label')} *</Label>
              <Input name="name" defaultValue={selectedRecord?.name} required className="h-12 rounded-xl border-none ring-1 ring-slate-200 font-bold text-xs" placeholder="e.g. Network Switch" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Parent Category</Label>
              <Select name="parentId" defaultValue={selectedRecord?.parentId || "none"}>
                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-2xl">
                  <SelectItem value="none" className="text-xs font-black text-blue-600 uppercase">-- ROOT CATEGORY --</SelectItem>
                  {categories?.filter(cat => cat.id !== selectedRecord?.id).map((cat, idx) => (
                    <SelectItem key={`${cat.id}-${idx}`} value={cat.id} className="text-xs font-bold uppercase">
                      {getLevel(cat, categories || []) > 1 ? "— ".repeat(getLevel(cat, categories || []) - 1) : ""}{cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('common.details')}</Label>
              <Input name="description" defaultValue={selectedRecord?.description} className="h-12 rounded-xl border-none ring-1 ring-slate-200" />
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100">
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} {t('common.save')}
              </Button>
              {selectedRecord && (
                <Button type="button" variant="ghost" onClick={() => setSelectedRecord(null)} className="h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                  {t('common.cancel')}
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
          <div className="p-5 border-b bg-slate-50/30 flex items-center justify-between">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input placeholder={t('common.search')} className="pl-9 h-10 border-none bg-white ring-1 ring-slate-200 text-xs font-bold rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="h-12 text-[10px] uppercase font-black pl-8">{t('common.label')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black text-center">Level</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">Parent</TableHead>
                  <TableHead className="text-right h-12 pr-8 sticky right-0 bg-white/95 w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto text-blue-200" /></TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-40 text-center text-slate-300 italic text-[10px] font-black uppercase tracking-widest">No categories found</TableCell></TableRow>
                ) : filtered?.map((c, idx) => {
                  const level = getLevel(c, categories || []);
                  return (
                    <TableRow key={`${c.id}-${idx}`} className="h-14 hover:bg-muted/5 group border-slate-50 transition-colors">
                      <TableCell className="pl-8">
                        <div className="flex items-center gap-2">
                           {[...Array(level - 1)].map((_, i) => <div key={i} className="w-4 h-px bg-slate-200" />)}
                           {level > 1 && <ChevronRight className="h-3 w-3 text-slate-300" />}
                           <span className={cn("text-[11px] uppercase tracking-tight", level === 1 ? "font-black text-slate-900" : level === 2 ? "font-bold text-slate-700" : "font-medium text-slate-500")}>
                             {c.name}
                           </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <span className={cn("text-[8px] font-black px-2 py-0.5 rounded-full uppercase", 
                           level === 1 ? "bg-blue-50 text-blue-700" : 
                           level === 2 ? "bg-purple-50 text-purple-700" : 
                           "bg-slate-100 text-slate-600")}>
                           L{level}
                         </span>
                      </TableCell>
                      <TableCell className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {c.parentId !== 'none' ? categories?.find(cat => cat.id === c.parentId)?.name : "---"}
                      </TableCell>
                      <TableCell className="text-right pr-8 sticky right-0 bg-white group-hover:bg-slate-50 transition-colors">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-full" onClick={() => openEdit(c)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 rounded-full" onClick={() => deleteDoc(doc(db!, "companies", companyId!, "master_categories", c.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  )
}
