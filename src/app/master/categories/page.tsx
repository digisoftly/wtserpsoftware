
"use client"

import * as React from "react"
import { Search, Loader2, Edit, Trash2, Save, Layers, ChevronRight, ListTree, FolderTree, Network } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function MasterCategoriesPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = React.useState("main");
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const categoriesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_categories"), orderBy("name"));
  }, [db, companyId]);

  const { data: categories, isLoading } = useCollection(categoriesQuery);

  // Helper to determine the level of a category
  const getCategoryLevel = React.useCallback((cat: any, allCats: any[]): number => {
    if (!cat || cat.parentId === 'none') return 1;
    const parent = allCats.find(c => c.id === cat.parentId);
    if (!parent) return 1;
    return 2 + (allCats.find(c => c.id === parent.parentId) ? 1 : 0);
  }, []);

  // Categorize data for the three blocks
  const mainCategories = React.useMemo(() => categories?.filter(c => c.parentId === 'none') || [], [categories]);
  const subCategories = React.useMemo(() => categories?.filter(c => {
    const parent = mainCategories.find(m => m.id === c.parentId);
    return !!parent;
  }) || [], [categories, mainCategories]);
  const childCategories = React.useMemo(() => categories?.filter(c => {
    const parent = subCategories.find(s => s.id === c.parentId);
    return !!parent;
  }) || [], [categories, subCategories]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string).trim();
    const parentId = formData.get("parentId") as string || "none";

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
      parentId: parentId,
      description: formData.get("description") as string || "",
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = selectedRecord ? doc(db, "companies", companyId, "master_categories", selectedRecord.id) : doc(collection(db, "companies", companyId, "master_categories"));
      await setDoc(docRef, { ...categoryData, createdAt: selectedRecord?.createdAt || serverTimestamp(), id: docRef.id }, { merge: true });
      toast({ title: t('common.success') });
      setSelectedRecord(null);
      form.reset();
    } catch (err: any) {
      toast({ variant: "destructive", title: t('common.error'), description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredData = React.useMemo(() => {
    const source = activeTab === "main" ? mainCategories : activeTab === "sub" ? subCategories : childCategories;
    return source.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [activeTab, mainCategories, subCategories, childCategories, searchTerm]);

  const renderForm = (level: 'main' | 'sub' | 'child') => (
    <Card className="p-8 h-fit rounded-[2rem] border-none ring-1 ring-slate-100 shadow-sm bg-white space-y-6">
      <div className="flex items-center gap-3 border-b pb-4">
        {level === 'main' ? <ListTree className="h-5 w-5 text-blue-600" /> : level === 'sub' ? <FolderTree className="h-5 w-5 text-purple-600" /> : <Network className="h-5 w-5 text-pink-600" />}
        <h2 className="text-xs font-black uppercase text-slate-900 tracking-widest">
          {selectedRecord ? t('common.edit') : (level === 'main' ? "Add Main Category" : level === 'sub' ? "Add Sub Category" : "Add Child Category")}
        </h2>
      </div>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('common.label')} *</Label>
          <Input name="name" defaultValue={selectedRecord?.name} required className="h-12 rounded-xl border-none ring-1 ring-slate-200 font-bold text-xs" placeholder={level === 'main' ? "e.g. Security Systems" : "e.g. IP Cameras"} />
        </div>
        
        {level !== 'main' && (
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
              {level === 'sub' ? "Parent Main Category" : "Parent Sub Category"} *
            </Label>
            <Select name="parentId" defaultValue={selectedRecord?.parentId} required>
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs">
                <SelectValue placeholder="Select Parent..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl">
                {(level === 'sub' ? mainCategories : subCategories).map((cat, idx) => (
                  <SelectItem key={`${cat.id}-${idx}`} value={cat.id} className="text-xs font-bold uppercase">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {level === 'main' && <input type="hidden" name="parentId" value="none" />}

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('common.details')}</Label>
          <Input name="description" defaultValue={selectedRecord?.description} className="h-12 rounded-xl border-none ring-1 ring-slate-200" placeholder="Optional notes..." />
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <Button type="submit" disabled={isSubmitting} className={cn("w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl", 
            level === 'main' ? "bg-blue-600 hover:bg-blue-700 shadow-blue-100" : level === 'sub' ? "bg-purple-600 hover:bg-purple-700 shadow-purple-100" : "bg-pink-600 hover:bg-pink-700 shadow-pink-100")}>
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
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-blue-600 uppercase tracking-tight flex items-center gap-2">
            <Layers className="h-6 w-6" /> {t('nav.categories')}
          </h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Hierarchical Asset Classification</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSelectedRecord(null); setSearchTerm(""); }} className="w-full">
        <TabsList className="bg-white border p-1 rounded-2xl shadow-sm mb-8 flex h-14 ring-1 ring-slate-100">
          <TabsTrigger value="main" className="rounded-xl gap-2 flex-1 text-[10px] uppercase font-black data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
            <ListTree className="h-4 w-4" /> Main Category
          </TabsTrigger>
          <TabsTrigger value="sub" className="rounded-xl gap-2 flex-1 text-[10px] uppercase font-black data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">
            <FolderTree className="h-4 w-4" /> Sub Category
          </TabsTrigger>
          <TabsTrigger value="child" className="rounded-xl gap-2 flex-1 text-[10px] uppercase font-black data-[state=active]:bg-pink-50 data-[state=active]:text-pink-600">
            <Network className="h-4 w-4" /> Child Sub-category
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            {renderForm(activeTab as any)}
          </div>

          <div className="lg:col-span-8">
            <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
              <div className="p-5 border-b bg-slate-50/30 flex items-center justify-between">
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input 
                    placeholder={t('common.search')} 
                    className="pl-9 h-10 border-none bg-white ring-1 ring-slate-200 text-xs font-bold rounded-xl outline-none" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                  />
                </div>
                <Badge variant="outline" className="text-[9px] font-black uppercase bg-white px-3 h-6">
                  {filteredData.length} Records Found
                </Badge>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="h-12 text-[10px] font-black uppercase pl-8">Category Name</TableHead>
                      {activeTab !== 'main' && <TableHead className="h-12 text-[10px] font-black uppercase">Parent</TableHead>}
                      <TableHead className="h-12 text-[10px] font-black uppercase">Description</TableHead>
                      <TableHead className="text-right h-12 pr-8 sticky right-0 bg-white/95 w-24">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={4} className="h-40 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto text-blue-200" /></TableCell></TableRow>
                    ) : filteredData.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="h-40 text-center text-slate-300 italic text-[10px] font-black uppercase tracking-widest">No data available for this level</TableCell></TableRow>
                    ) : filteredData.map((c, idx) => (
                      <TableRow key={`${c.id}-${idx}`} className="h-16 hover:bg-muted/5 group border-slate-50 transition-colors">
                        <TableCell className="pl-8">
                          <div className="flex items-center gap-3">
                             <div className={cn("w-2 h-2 rounded-full", activeTab === 'main' ? "bg-blue-500" : activeTab === 'sub' ? "bg-purple-500" : "bg-pink-500")} />
                             <span className="text-[11px] font-black uppercase text-slate-900 tracking-tight">
                               {c.name}
                             </span>
                          </div>
                        </TableCell>
                        {activeTab !== 'main' && (
                          <TableCell className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                            {categories?.find(cat => cat.id === c.parentId)?.name || "---"}
                          </TableCell>
                        )}
                        <TableCell className="text-[10px] font-bold text-slate-400 uppercase max-w-[200px] truncate">
                          {c.description || "---"}
                        </TableCell>
                        <TableCell className="text-right pr-8 sticky right-0 bg-white group-hover:bg-slate-50 transition-colors">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-full" onClick={() => setSelectedRecord(c)}><Edit className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 rounded-full" onClick={() => deleteDoc(doc(db!, "companies", companyId!, "master_categories", c.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
