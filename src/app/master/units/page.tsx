"use client"

import * as React from "react"
import { Search, Loader2, MoreVertical, Edit, Trash2, Ruler, Save, Plus } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export default function MasterUnitsPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const { t, language } = useTranslation();
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const unitsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_units"), orderBy("name"));
  }, [db, companyId]);

  const { data: units, isLoading } = useCollection(unitsQuery);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId) return;

    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).trim();
    
    const exists = units?.some(u => 
      u.name?.toLowerCase() === name.toLowerCase() && 
      u.id !== selectedRecord?.id
    );

    if (exists) {
      toast({ variant: "destructive", title: language === 'BN' ? "এই নামে ইতিমধ্যে তথ্য রয়েছে" : "Name already exists" });
      return;
    }

    setIsSubmitting(true);
    const unitData = {
      name: name,
      shortName: formData.get("shortName") as string,
      isDefault: formData.get("isDefault") === "on",
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = selectedRecord ? doc(db, "companies", companyId, "master_units", selectedRecord.id) : doc(collection(db, "companies", companyId, "master_units"));
      await setDoc(docRef, { ...unitData, createdAt: selectedRecord?.createdAt || serverTimestamp(), id: docRef.id }, { merge: true });
      toast({ title: t('success') });
      setSelectedRecord(null);
      e.currentTarget.reset();
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = units?.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 pb-10">
      <h1 className="text-xl font-bold font-headline text-blue-600 uppercase">{t('units')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="p-6 h-fit rounded-2xl border-none ring-1 ring-slate-100 shadow-sm bg-white">
          <h2 className="text-xs font-black uppercase text-slate-400 mb-6 tracking-widest">{selectedRecord ? t('edit') : t('addUnit')}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase">{t('label')} *</Label><Input name="name" defaultValue={selectedRecord?.name} required className="h-10 text-xs rounded-xl" /></div>
            <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase">{t('shortName')} *</Label><Input name="shortName" defaultValue={selectedRecord?.shortName} required className="h-10 text-xs rounded-xl" /></div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-dashed">
              <Label className="text-xs font-bold">{t('isDefault')}</Label>
              <Switch name="isDefault" defaultChecked={selectedRecord?.isDefault} />
            </div>
            <div className="pt-4 flex gap-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700 h-11 rounded-xl text-[10px] font-black uppercase">
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />} {t('save')}
              </Button>
              {selectedRecord && <Button type="button" variant="ghost" onClick={() => setSelectedRecord(null)} className="rounded-xl h-11 px-4 text-[10px] font-black uppercase">Cancel</Button>}
            </div>
          </form>
        </Card>

        <Card className="lg:col-span-2 border-none shadow-sm rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
          <div className="p-4 border-b bg-slate-50/50 flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder={t('search')} className="pl-9 h-9 border-none bg-white ring-1 ring-slate-100 text-xs" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{units?.length || 0} {t('units')}</span>
          </div>
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow>
                <TableHead className="h-10 text-[10px] uppercase font-black pl-6">{t('label')}</TableHead>
                <TableHead className="h-10 text-[10px] uppercase font-black">{t('shortName')}</TableHead>
                <TableHead className="text-right h-10 pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="h-40 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto text-blue-600" /></TableCell></TableRow>
              ) : filtered?.map((u) => (
                <TableRow key={u.id} className="h-12 hover:bg-muted/5 group">
                  <TableCell className="pl-6 font-bold text-xs uppercase">{u.name} {u.isDefault && <Badge className="ml-2 h-3.5 text-[7px] bg-green-50 text-green-700 border-none">Default</Badge>}</TableCell>
                  <TableCell className="text-xs font-mono text-blue-600 font-black">{u.shortName}</TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" onClick={() => setSelectedRecord(u)}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600" onClick={() => deleteDoc(doc(db!, "companies", companyId!, "master_units", u.id))}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
