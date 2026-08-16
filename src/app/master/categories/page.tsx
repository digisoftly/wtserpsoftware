
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

    const formData = new FormData(e.currentTarget);
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
      toast({ title: t('success') });
      setSelectedRecord(null);
      e.currentTarget.reset();
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = categories?.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Helper to get depth level of a category
  const getLevel = (cat: any, list: any[]): number => {
    if (cat.parentId === 'none') return 1;
    const parent = list.find(c => c.id === cat.parentId);
    if (!parent) return 1;
    return 1 + getLevel(parent, list);
  };

  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-xl font-bold font-headline text-pink-600 uppercase flex items-center gap-2">
        <Layers className="h-5 w-5" /> {t('categories')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="p-6 h-fit rounded-2xl border-none ring-1 ring-slate-100 shadow-sm bg-white">
          <h2 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">{selectedRecord ? t('edit') : t('addCategory')}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase">{t('label')} *</Label>
              <Input name="name" defaultValue={selectedRecord?.name} required className="h-10 text-xs rounded-xl" placeholder="e.g. Network Switch" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase">{t('parentCategory')}</Label>
              <Select name="parentId" defaultValue={selectedRecord?.parentId || "none"}>
                <SelectTrigger className="h-10 text-xs rounded-xl bg-white border-none ring-1 ring-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-2xl">
                  <SelectItem value="none" className="text-xs font-bold text-blue-600">-- ROOT CATEGORY --</SelectItem>
                  {categories?.filter(cat => cat.id !== selectedRecord?.id).map((cat, idx) => (
                    <SelectItem key={`${cat.id}-${idx}`} value={cat.id} className="text-xs font-bold">
                      {getLevel(cat, categories || []) > 1 ? "— ".repeat(getLevel(cat, categories || []) - 1) : ""}{cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Leave as Root for Primary categories</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase">{t('details')}</Label>
              <Input name="description" defaultValue={selectedRecord?.description} className="h-10 text-xs rounded-xl" />
            </div>
            <div className="pt-4 flex gap-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1 bg-pink-600 hover:bg-pink-700 h-11 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-pink-100">
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} {t('save')}
              </Button>
              {selectedRecord && (
                <Button type="button" variant="ghost" onClick={() => setSelectedRecord(null)} className="rounded-xl h-11 px-4 text-[10px] font-black uppercase">
                  {t('cancel')}
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
          <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder={t('search')} className="pl-9 h-9 border-none bg-white ring-1 ring-slate-100 text-xs font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="h-10 text-[10px] uppercase font-black pl-6">{t('label')}</TableHead>
                  <TableHead className="h-10 text-[10px] uppercase font-black text-center">Level</TableHead>
                  <TableHead className="h-10 text-[10px] uppercase font-black">{t('parentCategory')}</TableHead>
                  <TableHead className="text-right h-10 pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto text-pink-600" /></TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-40 text-center text-slate-300 italic text-xs uppercase font-bold tracking-widest">No categories defined</TableCell></TableRow>
                ) : filtered?.map((c, idx) => {
                  const level = getLevel(c, categories || []);
                  return (
                    <TableRow key={`${c.id}-${idx}`} className="h-12 hover:bg-muted/5 group border-slate-50">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2">
                           {[...Array(level - 1)].map((_, i) => <div key={i} className="w-4 h-px bg-slate-200" />)}
                           {level > 1 && <ChevronRight className="h-3 w-3 text-slate-300" />}
                           <span className={cn("text-xs uppercase", level === 1 ? "font-black text-slate-900" : level === 2 ? "font-bold text-slate-700" : "font-medium text-slate-500")}>
                             {c.name}
                           </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                         <span className={cn("text-[9px] font-black px-2 py-0.5 rounded-full uppercase", 
                           level === 1 ? "bg-blue-50 text-blue-700" : 
                           level === 2 ? "bg-purple-50 text-purple-700" : 
                           "bg-slate-100 text-slate-600")}>
                           L{level}
                         </span>
                      </TableCell>
                      <TableCell className="text-[10px] font-bold text-muted-foreground uppercase">
                        {c.parentId !== 'none' ? categories?.find(cat => cat.id === c.parentId)?.name : "---"}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-pink-600 hover:bg-pink-50 rounded-full" onClick={() => setSelectedRecord(c)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:bg-red-50 rounded-full" onClick={() => { if(confirm(t('delete') + '?')) deleteDoc(doc(db!, "companies", companyId!, "master_categories", c.id)) }}><Trash2 className="h-3.5 w-3.5" /></Button>
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
