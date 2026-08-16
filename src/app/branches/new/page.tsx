"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { 
  Building, 
  ArrowLeft, 
  Save, 
  Loader2, 
  MapPin
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, setDoc, serverTimestamp, query, where } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"

export default function NewBranchPage() {
  const router = useRouter();
  const { companyId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Queries
  const branchTypesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(
      collection(db, "companies", companyId, "master_data"), 
      where("type", "==", "branchTypes"),
      where("isActive", "==", true)
    );
  }, [db, companyId]);
  const { data: rawBranchTypes } = useCollection(branchTypesQuery);

  // Deduplicate branch types for dropdown to prevent key errors
  const branchTypes = React.useMemo(() => {
    if (!rawBranchTypes) return [];
    const seen = new Set();
    return rawBranchTypes.filter(t => {
      if (seen.has(t.name)) return false;
      seen.add(t.name);
      return true;
    });
  }, [rawBranchTypes]);

  const handleSaveBranch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const branchData = {
      branchName: formData.get("branchName") as string,
      branchCode: formData.get("branchCode") as string,
      branchType: formData.get("branchType") as string,
      contactPerson: formData.get("contactPerson") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      address: formData.get("address") as string,
      city: formData.get("city") as string,
      district: formData.get("district") as string,
      country: formData.get("country") as string,
      status: formData.get("status") === "on" ? "active" : "inactive",
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = doc(collection(db, "companies", companyId, "branches"));
      await setDoc(docRef, { ...branchData, id: docRef.id });
      toast({ title: t('success') });
      router.push("/branches");
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
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-blue-600">{t('addBranch')}</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Business Node Definition</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => router.back()}>
            {t('cancel')}
          </Button>
          <Button type="submit" form="branch-form" className="bg-blue-600 hover:bg-blue-700 rounded-full px-8 h-10 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 gap-2" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
            {t('save')}
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full p-4 md:p-10">
        <form id="branch-form" onSubmit={handleSaveBranch} className="space-y-8">
          <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">{t('branch')} Name *</Label><Input name="branchName" required className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">Branch Code *</Label><Input name="branchCode" required className="h-11 rounded-xl uppercase font-mono" /></div>
              
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">Branch Type</Label>
                <Select name="branchType" defaultValue="Head Office">
                  <SelectTrigger className="h-11 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {branchTypes && branchTypes.length > 0 ? (
                      branchTypes.map((type, idx) => (
                        <SelectItem key={`branch-type-new-${type.id}-${idx}`} value={type.name} className="text-xs font-bold">{type.name}</SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem key="def-ho-new" value="Head Office" className="text-xs font-bold">Head Office</SelectItem>
                        <SelectItem key="def-sc-new" value="Sales Center" className="text-xs font-bold">Sales Center</SelectItem>
                        <SelectItem key="def-wh-new" value="Warehouse" className="text-xs font-bold">Warehouse</SelectItem>
                        <SelectItem key="def-sp-new" value="Service Point" className="text-xs font-bold">Service Point</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">Contact Person</Label><Input name="contactPerson" className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">{t('phone')}</Label><Input name="phone" className="h-11 rounded-xl" /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
               <div className="md:col-span-3 space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">{t('address')}</Label><Input name="address" className="h-11 rounded-xl" /></div>
               <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">City</Label><Input name="city" className="h-11 rounded-xl" /></div>
               <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">District</Label><Input name="district" className="h-11 rounded-xl" /></div>
               <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground">Country</Label><Input name="country" defaultValue="Bangladesh" className="h-11 rounded-xl" /></div>
            </div>

            <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl ring-1 ring-slate-100">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm"><MapPin className="h-6 w-6" /></div>
                 <div>
                   <p className="text-sm font-black uppercase text-slate-900">{t('isActive')}</p>
                   <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Activate this node for operations</p>
                 </div>
               </div>
               <Switch name="status" defaultChecked className="data-[state=checked]:bg-blue-600" />
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
