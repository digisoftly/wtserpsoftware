"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  Package, 
  ArrowLeft, 
  Save, 
  Loader2, 
  Plus,
  ShieldCheck,
  MapPin
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, setDoc, serverTimestamp, writeBatch, orderBy, query, where } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"

export default function NewProductPage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSerialTracking, setIsSerialTracking] = React.useState(false);
  const [rawSerials, setRawSerials] = React.useState("");
  const [selectedBrandId, setSelectedBrandId] = React.useState<string | null>(null);

  // Master Data Queries
  const catsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_categories"), orderBy("name"));
  }, [db, companyId]);
  const { data: masterCats } = useCollection(catsQuery);

  const brandsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_brands"), orderBy("name"));
  }, [db, companyId]);
  const { data: masterBrands } = useCollection(brandsQuery);

  const modelsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    if (selectedBrandId) {
      return query(collection(db, "companies", companyId, "master_models"), where("brandId", "==", selectedBrandId), orderBy("name"));
    }
    return query(collection(db, "companies", companyId, "master_models"), orderBy("name"));
  }, [db, companyId, selectedBrandId]);
  const { data: masterModels } = useCollection(modelsQuery);

  const warrantyQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_data"), where("type", "==", "warrantyTypes"));
  }, [db, companyId]);
  const { data: warrantyTypes } = useCollection(warrantyQuery);

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const productData = {
      companyId,
      branchId,
      name: formData.get("name") as string,
      sku: (formData.get("modelId") as string) || "",
      brandId: formData.get("brandId") as string,
      categoryId: formData.get("categoryId") as string,
      unitId: "piece",
      unitPrice: Number(formData.get("unitPrice")),
      costPrice: Number(formData.get("costPrice")),
      currentStock: Number(formData.get("currentStock")),
      minStockLevel: Number(formData.get("minStockLevel") || 5),
      warranty: formData.get("warranty") as string || "No Warranty",
      location: formData.get("location") as string || "",
      description: formData.get("description") as string || "",
      serialNumberTrackingRequired: isSerialTracking,
      isActive: true,
      updatedAt: serverTimestamp(),
    };

    try {
      const batch = writeBatch(db);
      const productRef = doc(collection(db, "companies", companyId, "branches", branchId, "products"));
      
      batch.set(productRef, { ...productData, id: productRef.id, createdAt: serverTimestamp() });

      if (isSerialTracking && rawSerials.trim()) {
        const snList = rawSerials.split(/[\n,]+/).map(s => s.trim()).filter(s => s.length > 0);
        const snColRef = collection(db, "companies", companyId, "branches", branchId, "serial_numbers");
        snList.forEach(sn => {
          const snDocRef = doc(snColRef);
          batch.set(snDocRef, {
            id: snDocRef.id,
            companyId,
            branchId,
            productId: productRef.id,
            serialNumber: sn,
            status: "available",
            warranty: productData.warranty,
            location: productData.location,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        });
        batch.update(productRef, { currentStock: snList.length });
      }

      await batch.commit();
      toast({ title: t('success') });
      router.push("/inventory");
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-screen pb-20">
      <div className="sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-blue-600">{t('addProduct')}</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Catalog Definition</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button type="submit" form="product-form" className="bg-blue-600 hover:bg-blue-700 rounded-full px-8 h-10 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 gap-2" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            {t('save')}
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full p-4 md:p-10">
        <form id="product-form" onSubmit={handleSaveProduct} className="space-y-8">
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-8">
            <CardContent className="p-0 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('itemDescription')} *</Label>
                  <Input name="name" required className="h-12 rounded-xl" placeholder="Product Full Name" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('category')}</Label>
                  <Select name="categoryId">
                    <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue placeholder="Select Category" /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {masterCats?.map((c, idx) => (
                        <SelectItem key={`cat-${c.id}-${idx}`} value={c.id} className="text-xs uppercase">{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('brand')}</Label>
                  <Select name="brandId" onValueChange={setSelectedBrandId}>
                    <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue placeholder="Select Brand" /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {masterBrands?.map((b, idx) => (
                        <SelectItem key={`brand-${b.id}-${idx}`} value={b.id} className="text-xs uppercase">{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('model')}</Label>
                  <Select name="modelId">
                    <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue placeholder="Select Model" /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {masterModels?.map((m, idx) => (
                        <SelectItem key={`model-${m.id}-${idx}`} value={m.name} className="text-xs uppercase">{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('price')} (৳)</Label>
                  <Input name="unitPrice" type="number" required className="h-12 rounded-xl text-blue-600 font-bold" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('costPrice')} (৳)</Label>
                  <Input name="costPrice" type="number" required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('stock')}</Label>
                  <Input name="currentStock" type="number" required className="h-12 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">Min Limit</Label>
                  <Input name="minStockLevel" type="number" defaultValue={5} className="h-12 rounded-xl" />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> {t('warranty')}
                  </Label>
                  <Select name="warranty" defaultValue="1 Year">
                    <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {warrantyTypes?.map((w, idx) => (
                        <SelectItem key={`warranty-${w.id}-${idx}`} value={w.name} className="text-xs font-bold uppercase">{w.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {t('storageLocation')}
                  </Label>
                  <Input name="location" className="h-12 rounded-xl" placeholder="e.g. Shelf A1, Rack 2" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('details')}</Label>
                <Textarea name="description" className="min-h-[120px] rounded-2xl" placeholder="Full technical specifications..." />
              </div>

              <div className="space-y-4 pt-6 border-t">
                <div className="flex items-center justify-between bg-slate-50 p-6 rounded-3xl ring-1 ring-slate-100">
                  <div className="space-y-1">
                    <Label className="text-sm font-black uppercase text-slate-900">{t('serialRequired')}</Label>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Enable individual tracking for IMEI/SN</p>
                  </div>
                  <Switch checked={isSerialTracking} onCheckedChange={setIsSerialTracking} className="data-[state=checked]:bg-blue-600" />
                </div>
                {isSerialTracking && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Bulk Serial Entry</Label>
                    <Textarea value={rawSerials} onChange={e => setRawSerials(e.target.value)} placeholder="SN123, SN124, SN125..." className="min-h-[120px] rounded-2xl font-mono text-xs uppercase" />
                    <p className="text-[9px] font-bold text-blue-600 uppercase">Registered serials will automatically set the stock quantity.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}
