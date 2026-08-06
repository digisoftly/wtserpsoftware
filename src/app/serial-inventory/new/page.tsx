"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, Plus, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, doc, writeBatch } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"

export default function NewSerialPage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [targetProductId, setTargetProductId] = React.useState("");
  const [rawSerials, setRawSerials] = React.useState("");

  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "products");
  }, [db, companyId, branchId]);
  const { data: products } = useCollection(productsQuery);

  const handleAddSerials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || !targetProductId || !rawSerials) return;

    setIsSubmitting(true);
    try {
      const snList = rawSerials.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
      if (snList.length === 0) throw new Error("No serial numbers detected.");

      const batch = writeBatch(db);
      const colRef = collection(db, "companies", companyId, "branches", branchId, "serial_numbers");

      snList.forEach(sn => {
        const newDocRef = doc(colRef);
        batch.set(newDocRef, {
          id: newDocRef.id,
          companyId,
          branchId,
          productId: targetProductId,
          serialNumber: sn,
          status: "available",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      await batch.commit();
      toast({ title: t('success'), description: `${snList.length} units registered.` });
      router.push("/serial-inventory");
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold font-headline text-purple-600 uppercase tracking-tight">{t('addSerial')}</h1>
      </div>

      <Card className="p-8 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
        <form onSubmit={handleAddSerials} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('addProduct')}</Label>
            <Select value={targetProductId} onValueChange={setTargetProductId} required>
              <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200"><SelectValue placeholder="Search product..." /></SelectTrigger>
              <SelectContent className="rounded-xl">
                {products?.filter(p => p.serialNumberTrackingRequired).map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-sm font-bold">{p.name} ({p.sku})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Serial Numbers (Comma or Enter separated)</Label>
            <Textarea 
              className="min-h-[200px] rounded-2xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-purple-600 font-mono text-xs uppercase" 
              value={rawSerials} 
              onChange={e => setRawSerials(e.target.value)} 
              placeholder="SN001, SN002..."
              required
            />
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3 text-purple-600">
               <CheckCircle2 className="h-5 w-5" />
               <span className="text-xs font-black uppercase">Units Detected</span>
            </div>
            <span className="text-2xl font-black">{rawSerials.split(/[\n,]+/).filter(s => s.trim().length > 0).length}</span>
          </div>

          <div className="pt-6">
            <Button type="submit" disabled={isSubmitting || !targetProductId || !rawSerials} className="w-full bg-purple-600 hover:bg-purple-700 h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-100">
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
              Register Serials
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}