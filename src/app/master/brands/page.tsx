"use client"

import * as React from "react"
import { Search, Loader2, Edit, Trash2, Tag, Save, Plus } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function MasterBrandsPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const { t, language } = useTranslation();
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const brandsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_brands"), orderBy("name"));
  }, [db, companyId]);

  const { data: brands, isLoading } = useCollection(brandsQuery);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = (formData.get("name") as string).trim();

    const exists = brands?.some(b => 
      b.name?.toLowerCase() === name.toLowerCase() && 
      b.id !== selectedRecord?.id
    );

    if (exists) {
      toast({ variant: "destructive", title: language === 'BN' ? "এই নামে ইতিমধ্যে তথ্য রয়েছে" : "Name already exists" });
      return;
    }

    setIsSubmitting(true);
    const brandData = {
      name: name,
      description: formData.get("description") as string || "",
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = selectedRecord ? doc(db, "companies", companyId, "master_brands", selectedRecord.id) : doc(collection(db, "companies", companyId, "master_brands"));
      await setDoc(docRef, { ...brandData, createdAt: selectedRecord?.createdAt || serverTimestamp(), id: docRef.id }, { merge: true });
      toast({ title: t('common_success') });
      setSelectedRecord(null);
      form.reset();
    } catch (err: any) {
      toast({ variant: "destructive", title: t('common_error'), description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = brands?.filter(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-xl font-black font-headline text-blue-600 uppercase tracking-tight">{t('brands')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="p-8 h-fit rounded-[2rem] border-none ring-1 ring-slate-100 shadow-sm bg-white">
          <h2 className="text-[10px] font-black uppercase text-slate-400 mb-6 tracking-widest">{selectedRecord ? t('common_edit') : t('addBrand')}</h2>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('common_label')} *</Label>
              <Input name="name" defaultValue={selectedRecord?.name} required className="h-12 rounded-xl border-none ring-1 ring-slate-200 font-bold" placeholder="e.g Sony" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('common_details')}</Label>
              <Input name="description" defaultValue={selectedRecord?.description} className="h-12 rounded-xl border-none ring-1 ring-slate-200" placeholder="Optional details" />
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100">
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} {t('common_save')}
              </Button>
              {selectedRecord && (
                <Button type="button" variant="ghost" onClick={() => setSelectedRecord(null)} className="h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                  {t('common_cancel')}
                </Button>
              )}
            </div>
          </form>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white ring-1 ring-slate-100">
          <div className="p-5 border-b bg-slate-50/30 flex items-center justify-between">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input placeholder={t('common_search')} className="pl-9 h-10 border-none bg-white ring-1 ring-slate-200 text-xs font-bold rounded-xl" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="h-12 text-[10px] font-black uppercase pl-8">{t('common_label')}</TableHead>
                  <TableHead className="h-12 text-[10px] font-black uppercase">{t('common_details')}</TableHead>
                  <TableHead className="text-right h-12 pr-8 sticky right-0 bg-white/95 w-24">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={3} className="h-40 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto text-blue-200" /></TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="h-40 text-center text-slate-300 italic text-[10px] font-black uppercase tracking-widest">No brands found</TableCell></TableRow>
                ) : filtered?.map((b, idx) => (
                  <TableRow 
                    key={b.id} 
                    className={cn(
                      "h-14 transition-all border-b border-white/50",
                      idx % 2 === 0 ? "bg-[#EAF6FF] hover:bg-[#D9EFFF]" : "bg-[#EEF9F1] hover:bg-[#E1F2E6]"
                    )}
                  >
                    <TableCell className="pl-8 font-black text-xs uppercase text-slate-900">{b.name}</TableCell>
                    <TableCell className="text-[10px] font-bold text-slate-400 uppercase">{b.description || "---"}</TableCell>
                    <TableCell className="text-right pr-8 sticky right-0 bg-transparent">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-full" onClick={() => setSelectedRecord(b)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 rounded-full" onClick={() => deleteDoc(doc(db!, "companies", companyId!, "master_brands", b.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
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
  )
}
