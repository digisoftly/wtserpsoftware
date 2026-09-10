
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
  RefreshCw,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  Ruler,
  Paintbrush,
  Layout
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

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

  const handleSaveSettings = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settingsRef) return;

    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const updates: Record<string, any> = {
      updatedAt: serverTimestamp(),
      companyLogo: logoPreview,
      loginGridItems: loginGrid,
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
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: settingsRef.path,
          operation: 'write',
          requestResourceData: updates,
        }));
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
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Universal UI & PDF Lab</p>
          </div>
          <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 rounded-full px-12 h-12 font-bold shadow-xl shadow-blue-100 transition-all active:scale-95">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t('save')}
          </Button>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-white border rounded-xl p-1 mb-6 shadow-sm flex overflow-x-auto h-auto no-scrollbar ring-1 ring-slate-100">
            <TabsTrigger value="general" className="rounded-lg flex-1 min-w-[150px] py-3 text-[10px] font-black uppercase">Company Info</TabsTrigger>
            <TabsTrigger value="login" className="rounded-lg flex-1 min-w-[150px] py-3 text-[10px] font-black uppercase">Login UI Lab</TabsTrigger>
            <TabsTrigger value="pdf_lab" className="rounded-lg flex-1 min-w-[150px] py-3 text-[10px] font-black uppercase text-blue-600">PDF Design Lab</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center bg-white ring-1 ring-slate-100">
                <Label className="text-[10px] font-black uppercase text-slate-400 mb-4">Company Logo</Label>
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
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Legal Name</Label><Input name="companyName" defaultValue={settings?.companyName} className="h-11" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Slogan</Label><Input name="companySlogan" defaultValue={settings?.companySlogan} className="h-11" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Official Email</Label><Input name="email" defaultValue={settings?.email} className="h-11" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Phone</Label><Input name="phone" defaultValue={settings?.phone} className="h-11" /></div>
                 </div>
                 <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Address</Label><Textarea name="address" defaultValue={settings?.address} className="rounded-xl min-h-[80px]" /></div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pdf_lab" className="space-y-8">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SECTION 1: HEADER & IDENTITY */}
                <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white ring-1 ring-slate-100 space-y-8">
                   <div className="flex items-center gap-3 border-b pb-4">
                      <Layout className="h-5 w-5 text-blue-600" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Header & Logo Style</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Header Style</Label>
                         <Select name="pdf_header_align" defaultValue={settings?.pdf_header_align || "left"}>
                            <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                               <SelectItem value="left" className="text-xs font-bold">LOGO LEFT (HORIZONTAL)</SelectItem>
                               <SelectItem value="center" className="text-xs font-bold">CENTERED (STACKED)</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Title Color (Hex)</Label>
                         <div className="flex gap-2">
                            <Input name="pdf_header_title_color" defaultValue={settings?.pdf_header_title_color || "#0056B3"} className="h-10 font-mono" />
                            <div className="w-10 h-10 rounded-lg border shadow-inner" style={{ backgroundColor: settings?.pdf_header_title_color || "#0056B3" }} />
                         </div>
                      </div>
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Logo Size (px)</Label><Input type="number" name="pdf_header_logo_size" defaultValue={settings?.pdf_header_logo_size || 80} className="h-10" /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Logo-Text Gap (mm)</Label><Input type="number" name="pdf_header_content_gap" defaultValue={settings?.pdf_header_content_gap || 6} className="h-10" /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Top Margin (mm)</Label><Input type="number" name="pdf_header_top_gap" defaultValue={settings?.pdf_header_top_gap || 5} className="h-10" /></div>
                   </div>
                </Card>

                {/* SECTION 2: TABLE CUSTOMIZATION */}
                <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white ring-1 ring-slate-100 space-y-8">
                   <div className="flex items-center gap-3 border-b pb-4">
                      <TableIcon className="h-5 w-5 text-orange-600" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Table & Grid Lab</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Header BG Color</Label>
                         <div className="flex gap-2">
                            <Input name="pdf_table_header_bg" defaultValue={settings?.pdf_table_header_bg || "#F57C00"} className="h-10 font-mono" />
                            <div className="w-10 h-10 rounded-lg border shadow-inner" style={{ backgroundColor: settings?.pdf_table_header_bg || "#F57C00" }} />
                         </div>
                      </div>
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Row Font Size (pt)</Label><Input type="number" name="pdf_table_row_size" defaultValue={settings?.pdf_table_row_size || 10.5} className="h-10" /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Row Height (mm)</Label><Input type="number" name="pdf_table_row_height" defaultValue={settings?.pdf_table_row_height || 7} className="h-10" /></div>
                   </div>
                </Card>

                {/* SECTION 3: TERMS & SIGNATURE */}
                <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white ring-1 ring-slate-100 space-y-8">
                   <div className="flex items-center gap-3 border-b pb-4">
                      <Ruler className="h-5 w-5 text-indigo-600" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Compliance & Flow</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2"><Label className="text-[10px] font-black uppercase text-slate-400">Terms Box Title</Label><Input name="pdf_terms_title" defaultValue={settings?.pdf_terms_title || "Terms & Conditions"} className="h-10" /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Terms Top Gap (mm)</Label><Input type="number" name="pdf_terms_top_gap" defaultValue={settings?.pdf_terms_top_gap || 8} className="h-10" /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Terms Font Size (pt)</Label><Input type="number" name="pdf_terms_size" defaultValue={settings?.pdf_terms_size || 9.5} className="h-10" /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Signature Top Gap (mm)</Label><Input type="number" name="pdf_signature_top_gap" defaultValue={settings?.pdf_signature_top_gap || 20} className="h-10" /></div>
                   </div>
                </Card>

                {/* SECTION 4: FOOTER BRANDING */}
                <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white ring-1 ring-slate-100 space-y-8">
                   <div className="flex items-center gap-3 border-b pb-4">
                      <Paintbrush className="h-5 w-5 text-teal-600" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Footer Branding</h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Footer Accent Color</Label><Input name="pdf_footer_accent" defaultValue={settings?.pdf_footer_accent || "#F57C00"} className="h-10" /></div>
                      <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Brand Name Size (pt)</Label><Input type="number" name="pdf_footer_brand_size" defaultValue={settings?.pdf_footer_brand_size || 22} className="h-10" /></div>
                      <div className="space-y-2 md:col-span-2"><Label className="text-[10px] font-black uppercase text-slate-400">Heart Message</Label><Input name="footerHeartMsg" defaultValue={settings?.footerHeartMsg || "Thank You For Your Business"} className="h-10" /></div>
                   </div>
                </Card>
             </div>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
