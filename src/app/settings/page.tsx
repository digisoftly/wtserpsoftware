
"use client"

import * as React from "react"
import { 
  Settings2,
  CheckCircle2,
  Loader2,
  ImageIcon,
  Save,
  Type
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import { Textarea } from "@/components/ui/textarea"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"

const DEFAULT_MENU_ORDER = [
  "dashboard", "sales", "quotations", "dispatch", "purchases", "returns", 
  "inventory", "serialTracking", "contracts", "projectBilling", "customers", 
  "suppliers", "accounts", "expenses", "masterManagement", "support", "crm", 
  "hrm", "branches", "reports", "ai", "users", "settings", "audit"
];

export default function SettingsPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = React.useState(false);
  
  const [kpiCards, setKpiCards] = React.useState<any[]>([]);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = React.useState<string | null>(null);
  const [loadingLogoPreview, setLoadingLogoPreview] = React.useState<string | null>(null);
  const [sealPreview, setSealPreview] = React.useState<string | null>(null);
  const [signPreview, setSignPreview] = React.useState<string | null>(null);
  const [menuOrder, setMenuOrder] = React.useState<string[]>(DEFAULT_MENU_ORDER);

  const [sidebarBg, setSidebarBg] = React.useState("#FFFFFF");
  const [sidebarText, setSidebarText] = React.useState("#000000");
  const [sidebarHover, setSidebarHover] = React.useState("#F1F5F9");
  const [sidebarActive, setSidebarActive] = React.useState("#E2E8F0");

  const settingsRef = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return doc(db, "companies", companyId, "system", "config");
  }, [db, companyId]);

  const { data: settings, isLoading } = useDoc(settingsRef);

  React.useEffect(() => {
    if (settings) {
      setLogoPreview(settings.companyLogo || null);
      setFaviconPreview(settings.companyFavicon || null);
      setLoadingLogoPreview(settings.loadingLogo || null);
      setSealPreview(settings.authorizedSeal || null);
      setSignPreview(settings.authorizedSignature || null);
      if (settings.sidebarMenuOrder) setMenuOrder(settings.sidebarMenuOrder);
      if (settings.dashboardKpiCards) setKpiCards(settings.dashboardKpiCards);
      if (settings.sidebarBgColor) setSidebarBg(settings.sidebarBgColor);
      if (settings.sidebarTextColor) setSidebarText(settings.sidebarTextColor);
      if (settings.sidebarHoverColor) setSidebarHover(settings.sidebarHoverColor);
      if (settings.sidebarActiveColor) setSidebarActive(settings.sidebarActiveColor);
    }
  }, [settings]);

  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settingsRef) return;

    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const updates: Record<string, any> = {
      updatedAt: serverTimestamp(),
      companyLogo: logoPreview,
      companyFavicon: faviconPreview,
      loadingLogo: loadingLogoPreview,
      authorizedSeal: sealPreview,
      authorizedSignature: signPreview,
      sidebarMenuOrder: menuOrder,
      dashboardKpiCards: kpiCards,
      sidebarBgColor: sidebarBg,
      sidebarTextColor: sidebarText,
      sidebarHoverColor: sidebarHover,
      sidebarActiveColor: sidebarActive,
    };

    formData.forEach((value, key) => {
      updates[key] = value;
    });

    // Patterns: NO await, chain .catch with Contextual Error
    setDoc(settingsRef, updates, { merge: true })
      .then(() => {
        toast({ title: t('success') });
        setIsSaving(false);
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: settingsRef.path,
          operation: 'write',
          requestResourceData: updates,
        });
        errorEmitter.emit('permission-error', permissionError);
        setIsSaving(false);
      });
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>;

  return (
    <div className="space-y-6 pb-10">
      <form onSubmit={handleSaveSettings}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold font-headline text-blue-600 flex items-center gap-2">
              <Settings2 className="h-8 w-8" /> System Configuration
            </h1>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Enterprise UI & Branding Terminal</p>
          </div>
          <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 rounded-full px-12 h-12 font-bold shadow-xl shadow-blue-100 transition-all active:scale-95">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} {t('save')}
          </Button>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-white border rounded-xl p-1 mb-6 shadow-sm flex overflow-x-auto h-auto no-scrollbar ring-1 ring-slate-100">
            <TabsTrigger value="general" className="rounded-lg gap-2 flex-1 min-w-[150px] py-3 text-[10px] font-black uppercase tracking-widest">Company & Style</TabsTrigger>
            <TabsTrigger value="documents" className="rounded-lg gap-2 flex-1 min-w-[150px] py-3 text-[10px] font-black uppercase tracking-widest">Document Lab</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-6">
                <Card className="border-none shadow-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center bg-white ring-1 ring-slate-100">
                  <Label className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Main Company Logo</Label>
                  <div className="w-32 h-32 mb-4 relative group">
                    {logoPreview ? (
                      <img src={logoPreview} className="w-full h-full object-contain rounded-xl border p-2 bg-slate-50" />
                    ) : (
                      <div className="w-full h-full bg-slate-50 rounded-xl border-2 border-dashed flex items-center justify-center"><ImageIcon className="text-slate-300" /></div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setLogoPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </div>
                </Card>
              </div>

              <Card className="md:col-span-2 border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 p-8 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Legal Name</Label><Input name="companyName" defaultValue={settings?.companyName} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Slogan / Motto</Label><Input name="companySlogan" defaultValue={settings?.companySlogan} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Official Email</Label><Input name="email" defaultValue={settings?.email} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Connect Phone</Label><Input name="phone" defaultValue={settings?.phone} className="h-11 rounded-xl" /></div>
                 </div>
                 <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Corporate Address</Label><Textarea name="address" defaultValue={settings?.address} className="rounded-xl min-h-[80px]" /></div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
             <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-8">
                <div className="flex items-center gap-3 border-b pb-4">
                   <Type className="h-5 w-5 text-blue-600" />
                   <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Contract & Service Bill Labels</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                   <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Header Labels</h4>
                     <div className="space-y-3">
                       <div className="space-y-1.5"><Label className="text-[9px] font-bold uppercase text-slate-400">Bill Number Label</Label><Input name="pdfLabel_billNo" defaultValue={settings?.pdfLabel_billNo || "Bill Number"} className="h-9 text-xs rounded-xl" /></div>
                       <div className="space-y-1.5"><Label className="text-[9px] font-bold uppercase text-slate-400">Bill Date Label</Label><Input name="pdfLabel_billDate" defaultValue={settings?.pdfLabel_billDate || "Bill Date"} className="h-9 text-xs rounded-xl" /></div>
                       <div className="space-y-1.5"><Label className="text-[9px] font-bold uppercase text-slate-400">SLA Ref Label</Label><Input name="pdfLabel_slaRef" defaultValue={settings?.pdfLabel_slaRef || "SLA Ref"} className="h-9 text-xs rounded-xl" /></div>
                       <div className="space-y-1.5"><Label className="text-[9px] font-bold uppercase text-slate-400">Status Label</Label><Input name="pdfLabel_status" defaultValue={settings?.pdfLabel_status || "Status"} className="h-9 text-xs rounded-xl" /></div>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Table Headers</h4>
                     <div className="space-y-3">
                       <div className="space-y-1.5"><Label className="text-[9px] font-bold uppercase text-slate-400">SL Column</Label><Input name="pdfTable_sl" defaultValue={settings?.pdfTable_sl || "SL"} className="h-9 text-xs rounded-xl" /></div>
                       <div className="space-y-1.5"><Label className="text-[9px] font-bold uppercase text-slate-400">Service Name Column</Label><Input name="pdfTable_serviceName" defaultValue={settings?.pdfTable_serviceName || "Service Name"} className="h-9 text-xs rounded-xl" /></div>
                       <div className="space-y-1.5"><Label className="text-[9px] font-bold uppercase text-slate-400">Description Column</Label><Input name="pdfTable_description" defaultValue={settings?.pdfTable_description || "Description / Location"} className="h-9 text-xs rounded-xl" /></div>
                       <div className="space-y-1.5"><Label className="text-[9px] font-bold uppercase text-slate-400">Unit Price Column</Label><Input name="pdfTable_unitPrice" defaultValue={settings?.pdfTable_unitPrice || "Unit Price"} className="h-9 text-xs rounded-xl" /></div>
                       <div className="space-y-1.5"><Label className="text-[9px] font-bold uppercase text-slate-400">Amount Column</Label><Input name="pdfTable_amount" defaultValue={settings?.pdfTable_amount || "Amount"} className="h-9 text-xs rounded-xl" /></div>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Summary Labels</h4>
                     <div className="space-y-3">
                       <div className="space-y-1.5"><Label className="text-[9px] font-bold uppercase text-slate-400">Total BDT Label</Label><Input name="pdfLabel_totalBdt" defaultValue={settings?.pdfLabel_totalBdt || "Total (BDT)"} className="h-9 text-xs rounded-xl" /></div>
                       <div className="space-y-1.5"><Label className="text-[9px] font-bold uppercase text-slate-400">In Words Label</Label><Input name="pdfLabel_inWords" defaultValue={settings?.pdfLabel_inWords || "Amount in Words"} className="h-9 text-xs rounded-xl" /></div>
                       <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Footer Heart Message</Label><Input name="footerHeartMsg" defaultValue={settings?.footerHeartMsg || "Thank You For Your Business"} className="h-10 text-xs rounded-xl" /></div>
                     </div>
                   </div>
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
