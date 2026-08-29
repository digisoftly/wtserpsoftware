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
  MapPin,
  Layers,
  ImageIcon,
  X
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
  const [selectedBrandId, setSelectedBrandId] = React.useState<string>("");
  const [productImage, setProductImage] = React.useState<string | null>(null);

  // Hierarchical Category State
  const [catLevel1, setCatLevel1] = React.useState<string>("");
  const [catLevel2, setCatLevel2] = React.useState<string>("");
  const [catLevel3, setCatLevel3] = React.useState<string>("");

  // Master Data Queries
  const categoriesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_categories"), orderBy("name"));
  }, [db, companyId]);
  const { data: allCategories } = useCollection(categoriesQuery);

  const brandsQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_brands"), orderBy("name"));
  }, [db, companyId]);
  const { data: masterBrands } = useCollection(brandsQuery);

  const warrantyQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "master_data"), where("type", "==", "warrantyTypes"));
  }, [db, companyId]);
  const { data: warrantyTypes } = useCollection(warrantyQuery);

  // Computed Hierarchical Lists
  const level1List = React.useMemo(() => allCategories?.filter(c => c.parentId === 'none') || [], [allCategories]);
  const level2List = React.useMemo(() => allCategories?.filter(c => c.parentId === catLevel1 && catLevel1 !== "") || [], [allCategories, catLevel1]);
  const level3List = React.useMemo(() => allCategories?.filter(c => c.parentId === catLevel2 && catLevel2 !== "") || [], [allCategories, catLevel2]);

  const uniqueWarrantyTypes = React.useMemo(() => {
    if (!warrantyTypes) return [];
    const seen = new Set();
    return warrantyTypes.filter(w => {
      if (seen.has(w.name)) return false;
      seen.add(w.name);
      return true;
    });
  }, [warrantyTypes]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId || !branchId || isSubmitting) return;

    const finalCategoryId = catLevel3 || catLevel2 || catLevel1;

    if (!finalCategoryId) {
      toast({ variant: "destructive", title: t('error'), description: "Please select at least a Root Category" });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const brandName = masterBrands?.find(b => b.id === selectedBrandId)?.name || "";
    
    const productData = {
      companyId,
      branchId,
      name: formData.get("name") as string,
      sku: (formData.get("modelId") as string) || "",
      brandId: selectedBrandId,
      brand: brandName,
      categoryId: finalCategoryId,
      unitId: "piece",
      unitPrice: Number(formData.get("unitPrice")),
      costPrice: Number(formData.get("costPrice")),
      currentStock: Number(formData.get("currentStock")),
      minStockLevel: Number(formData.get("minStockLevel") || 5),
      warranty: formData.get("warranty") as string || "No Warranty",
      location: formData.get("location") as string || "",
      description: formData.get("description") as string || "",
      serialNumberTrackingRequired: isSerialTracking,
      imageUrl: productImage,
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
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Catalog Definition Terminal</p>
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

      <div className="max-w-6xl mx-auto w-full p-4 md:p-10">
        <form id="product-form" onSubmit={handleSaveProduct} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Image Upload */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 p-8 text-center">
                <Label className="text-[10px] font-black uppercase text-slate-400 mb-6 block tracking-widest">{t('image')}</Label>
                <div className="relative w-full aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden group">
                  {productImage ? (
                    <>
                      <img src={productImage} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <Button type="button" variant="destructive" size="icon" className="rounded-full h-10 w-10" onClick={() => setProductImage(null)}>
                           <X className="h-5 w-5" />
                         </Button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                        <ImageIcon className="h-8 w-8 text-slate-300" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Drop Product Photo</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} />
                </div>
                <p className="text-[9px] text-muted-foreground mt-4 uppercase font-bold">Standard 1:1 ratio recommended</p>
              </Card>
            </div>

            {/* Right Column: Details */}
            <div className="lg:col-span-8 space-y-8">
              <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-8">
                <CardContent className="p-0 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('itemName')} *</Label>
                      <Input name="name" required className="h-12 rounded-xl" placeholder="e.g. Sony 4K IP Camera Pro" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('brand')}</Label>
                      <Select name="brandId" onValueChange={setSelectedBrandId} required>
                        <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue placeholder="Select Brand" /></SelectTrigger>
                        <SelectContent className="rounded-xl shadow-2xl">
                          {masterBrands?.map((b, idx) => (
                            <SelectItem key={`brand-${b.id}-${idx}`} value={b.id} className="text-xs uppercase font-bold">{b.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('model')}</Label>
                      <Input name="modelId" className="h-12 rounded-xl font-mono uppercase" placeholder="e.g. SNC-VB770" />
                    </div>
                  </div>

                  <div className="space-y-4 p-6 bg-slate-50/50 rounded-3xl ring-1 ring-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                       <Layers className="h-4 w-4 text-blue-600" />
                       <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Classification</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Root Category *</Label>
                        <Select value={catLevel1} onValueChange={(val) => { setCatLevel1(val); setCatLevel2(""); setCatLevel3(""); }}>
                          <SelectTrigger className="h-10 rounded-xl bg-white border-none ring-1 ring-slate-200">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl shadow-2xl">
                            {level1List.map((c, i) => <SelectItem key={`${c.id}-${i}`} value={c.id} className="text-xs font-bold uppercase">{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Sub Category</Label>
                        <Select value={catLevel2} onValueChange={(val) => { setCatLevel2(val); setCatLevel3(""); }} disabled={!catLevel1 || level2List.length === 0}>
                          <SelectTrigger className="h-10 rounded-xl bg-white border-none ring-1 ring-slate-200">
                            <SelectValue placeholder={level2List.length === 0 ? "No Sub-categories" : "Select Sub-category"} />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl shadow-2xl">
                            {level2List.map((c, i) => <SelectItem key={`${c.id}-${i}`} value={c.id} className="text-xs font-bold uppercase">{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Child Category</Label>
                        <Select value={catLevel3} onValueChange={setCatLevel3} disabled={!catLevel2 || level3List.length === 0}>
                          <SelectTrigger className="h-10 rounded-xl bg-white border-none ring-1 ring-slate-200">
                            <SelectValue placeholder={level3List.length === 0 ? "No Child-categories" : "Select Child-category"} />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl shadow-2xl">
                            {level3List.map((c, i) => <SelectItem key={`${c.id}-${i}`} value={c.id} className="text-xs font-bold uppercase">{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('price')} (৳)</Label>
                      <Input name="unitPrice" type="number" required className="h-12 rounded-xl text-blue-600 font-black text-lg" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Cost Price (৳)</Label>
                      <Input name="costPrice" type="number" required className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground">Initial Stock</Label>
                      <Input name="currentStock" type="number" required className="h-12 rounded-xl font-bold" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3 text-emerald-500" /> {t('warranty')}
                      </Label>
                      <Select name="warranty" defaultValue="1 Year">
                        <SelectTrigger className="h-12 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl shadow-2xl">
                          {uniqueWarrantyTypes?.map((w, idx) => (
                            <SelectItem key={`warranty-${w.id || idx}-${idx}`} value={w.name} className="text-xs font-bold uppercase">{w.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-blue-500" /> Storage Location
                      </Label>
                      <Input name="location" className="h-12 rounded-xl" placeholder="e.g. Shelf A-04" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">{t('details')}</Label>
                    <Textarea name="description" className="min-h-[100px] rounded-2xl border-slate-200" placeholder="Technical specifications..." />
                  </div>

                  <div className="space-y-4 pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between bg-slate-50 p-6 rounded-3xl ring-1 ring-slate-100">
                      <div className="space-y-1">
                        <Label className="text-sm font-black uppercase text-slate-900">Serial Tracking Required?</Label>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Enable individual tracking for IMEI/SN</p>
                      </div>
                      <Switch checked={isSerialTracking} onCheckedChange={setIsSerialTracking} className="data-[state=checked]:bg-blue-600" />
                    </div>
                    {isSerialTracking && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Bulk Serial Entry</Label>
                        <Textarea value={rawSerials} onChange={e => setRawSerials(e.target.value)} placeholder="SN123, SN124, SN125..." className="min-h-[120px] rounded-2xl font-mono text-xs uppercase" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
