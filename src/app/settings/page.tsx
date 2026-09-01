
"use client"

import * as React from "react"
import { 
  Settings2,
  CheckCircle2,
  Loader2,
  ImageIcon,
  Save,
  Type,
  LayoutGrid,
  Plus,
  Trash2,
  Palette,
  Monitor,
  RefreshCw
} from "lucide-react"
import * as Icons from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ICON_OPTIONS = [
  "LayoutDashboard", "ShoppingCart", "FileText", "Truck", "Package", "RotateCcw", "Boxes", "Database", 
  "Scan", "ClipboardList", "Handshake", "Users", "Store", "Wallet", "Receipt", "LifeBuoy", "Target", 
  "Briefcase", "Building2", "BarChart3", "Zap", "Settings", "UserRoundCog", "ShieldAlert"
];

// STRICT 24 ITEM DEFAULT LIST
const DEFAULT_GRID_ITEMS = [
  { label: "ড্যাশবোর্ড", icon: "LayoutDashboard", color: "bg-blue-500/20 text-blue-400" },
  { label: "বিক্রয়", icon: "ShoppingCart", color: "bg-emerald-500/20 text-emerald-400" },
  { label: "কোটেশন", icon: "FileText", color: "bg-amber-500/20 text-amber-400" },
  { label: "চালান", icon: "Truck", color: "bg-orange-500/20 text-orange-400" },
  { label: "ক্রয়", icon: "Package", color: "bg-rose-500/20 text-rose-400" },
  { label: "রিটার্নস", icon: "RotateCcw", color: "bg-red-500/20 text-red-400" },
  { label: "ইনভেন্টরি", icon: "Boxes", color: "bg-sky-500/20 text-sky-400" },
  { label: "মাস্টার ডাটা", icon: "Database", color: "bg-slate-500/20 text-slate-400" },
  { label: "সিরিয়াল", icon: "Scan", color: "bg-purple-500/20 text-purple-400" },
  { label: "প্রকল্প", icon: "ClipboardList", color: "bg-teal-500/20 text-teal-400" },
  { label: "সার্ভিস কন্ট্রাক্ট", icon: "Handshake", color: "bg-indigo-500/20 text-indigo-400" },
  { label: "গ্রাহক", icon: "Users", color: "bg-blue-500/20 text-blue-400" },
  { label: "সরবরাহকারী", icon: "Store", color: "bg-rose-600/20 text-rose-400" },
  { label: "হিসাব", icon: "Wallet", color: "bg-amber-600/20 text-amber-500" },
  { label: "ব্যয়", icon: "Receipt", color: "bg-red-600/20 text-red-500" },
  { label: "সাপোর্ট", icon: "LifeBuoy", color: "bg-indigo-600/20 text-indigo-500" },
  { label: "সিআরএম", icon: "Target", color: "bg-rose-700/20 text-rose-500" },
  { label: "এইচআরএম", icon: "Briefcase", color: "bg-purple-600/20 text-purple-500" },
  { label: "শাখা", icon: "Building2", color: "bg-slate-600/20 text-slate-500" },
  { label: "রিপোর্ট", icon: "BarChart3", color: "bg-blue-700/20 text-blue-500" },
  { label: "এআই", icon: "Zap", color: "bg-violet-600/20 text-violet-400" },
  { label: "সেটিংস", icon: "Settings", color: "bg-slate-700/20 text-slate-500" },
  { label: "ইউজার", icon: "UserRoundCog", color: "bg-violet-700/20 text-violet-500" },
  { label: "অডিট লগ", icon: "ShieldAlert", color: "bg-red-800/20 text-red-600" },
];

const SIDEBAR_KEYS = [
  "dashboard", "sales", "quotations", "dispatch", "purchases", "returns", 
  "inventory", "masterManagement", "serialTracking", "projectBilling", 
  "contracts", "customers", "suppliers", "accounts", "expenses", 
  "support", "crm", "hrm", "branches", "reports", "ai", "settings", "users", "audit"
];

export default function SettingsPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = React.useState(false);
  
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [loginGrid, setLoginGrid] = React.useState<any[]>([]);

  const settingsRef = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return doc(db, "companies", companyId, "system", "config");
  }, [db, companyId]);

  const { data: settings, isLoading } = useDoc(settingsRef);

  React.useEffect(() => {
    if (settings) {
      setLogoPreview(settings.companyLogo || null);
      setLoginGrid(settings.loginGridItems || DEFAULT_GRID_ITEMS);
    }
  }, [settings]);

  const resetToDefault = () => {
    setLoginGrid(DEFAULT_GRID_ITEMS);
    toast({ title: "Order Reset", description: "Default module sequence has been restored." });
  };

  const addGridItem = () => {
    setLoginGrid([...loginGrid, { label: "New Module", icon: "LayoutGrid", color: "bg-emerald-500/20 text-emerald-400" }]);
  };

  const updateGridItem = (idx: number, field: string, value: string) => {
    const next = [...loginGrid];
    next[idx] = { ...next[idx], [field]: value };
    setLoginGrid(next);
  };

  const removeGridItem = (idx: number) => {
    setLoginGrid(loginGrid.filter((_, i) => i !== idx));
  };

  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settingsRef) return;

    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const updates: Record<string, any> = {
      updatedAt: serverTimestamp(),
      companyLogo: logoPreview,
      loginGridItems: loginGrid,
      sidebarMenuOrder: SIDEBAR_KEYS, // Sync sidebar with strict list
    };

    formData.forEach((value, key) => {
      updates[key] = value;
    });

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
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t('save')}
          </Button>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-white border rounded-xl p-1 mb-6 shadow-sm flex overflow-x-auto h-auto no-scrollbar ring-1 ring-slate-100">
            <TabsTrigger value="general" className="rounded-lg gap-2 flex-1 min-w-[150px] py-3 text-[10px] font-black uppercase tracking-widest">Company & Style</TabsTrigger>
            <TabsTrigger value="login" className="rounded-lg gap-2 flex-1 min-w-[150px] py-3 text-[10px] font-black uppercase tracking-widest">Login UI Lab</TabsTrigger>
            <TabsTrigger value="documents" className="rounded-lg gap-2 flex-1 min-w-[150px] py-3 text-[10px] font-black uppercase tracking-widest">Document Lab</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          <TabsContent value="login" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 p-8 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                   <Monitor className="h-5 w-5 text-emerald-600" />
                   <h3 className="text-sm font-black uppercase tracking-widest">Branding Text</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Grid Headline</Label><Input name="loginHeadline" defaultValue={settings?.loginHeadline || "২৪টি মডিউল একটি প্ল্যাটফর্মে"} className="h-11 rounded-xl" /></div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Grid Sub-headline</Label><Input name="loginSubHeadline" defaultValue={settings?.loginSubHeadline || "ব্যবসার প্রতিটি বিভাগ, এক জায়গা থেকেই নিয়ন্ত্রণ"} className="h-11 rounded-xl" /></div>
                </div>
              </Card>

              <Card className="md:col-span-2 border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 p-8 space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Login & Navigation Order</h3>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" className="rounded-full h-8 px-4 text-[10px] font-black uppercase gap-2 border-amber-200 text-amber-700 bg-amber-50" onClick={resetToDefault}>
                      <RefreshCw className="h-3 w-3" /> Reset to Default
                    </Button>
                    <Button type="button" variant="outline" size="sm" className="rounded-full h-8 px-4 text-[10px] font-black uppercase gap-2" onClick={addGridItem}>
                      <Plus className="h-3 w-3" /> Add Item
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {loginGrid.map((item, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 relative group">
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 absolute top-2 right-2 text-slate-300 hover:text-red-600" onClick={() => removeGridItem(i)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black uppercase">Item Label</Label>
                        <Input value={item.label} onChange={e => updateGridItem(i, 'label', e.target.value)} className="h-9 rounded-lg bg-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase">Icon</Label>
                            <Select value={item.icon} onValueChange={val => updateGridItem(i, 'icon', val)}>
                               <SelectTrigger className="h-9 rounded-lg bg-white text-[10px]"><SelectValue /></SelectTrigger>
                               <SelectContent>
                                  {ICON_OPTIONS.map(opt => <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>)}
                               </SelectContent>
                            </Select>
                         </div>
                         <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase">Tailwind Color</Label>
                            <Input value={item.color} onChange={e => updateGridItem(i, 'color', e.target.value)} className="h-9 rounded-lg bg-white text-[9px]" placeholder="bg-blue-500/20 text-blue-400" />
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
