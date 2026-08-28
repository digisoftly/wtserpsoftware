
"use client"

import * as React from "react"
import { 
  Settings2,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  ArrowUp,
  ArrowDown,
  Palette,
  Eye,
  Table as TableIcon,
  ImageIcon,
  PenTool,
  FileBadge,
  LayoutGrid,
  Monitor,
  Type
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import { Textarea } from "@/components/ui/textarea"
import { DocumentTemplate } from "@/components/documents/document-template"
import { Badge } from "@/components/ui/badge"

const DEFAULT_MENU_ORDER = [
  "dashboard", 
  "sales", 
  "quotations", 
  "dispatch", 
  "purchases", 
  "returns", 
  "inventory", 
  "serialTracking", 
  "projectBilling", 
  "contracts", 
  "customers", 
  "suppliers", 
  "accounts", 
  "expenses", 
  "support", 
  "crm", 
  "hrm", 
  "branches", 
  "reports", 
  "ai", 
  "users",
  "settings"
];

const DOCUMENT_LAYOUTS = [
  { value: "warrior", name: "Warrior Official Premium" },
  { value: "erppro", name: "ERP Pro High Density" },
  { value: "modern", name: "Modern Bold Branding" },
  { value: "professional", name: "Professional Standard" },
  { value: "minimal", name: "Minimalist Clean" },
  { value: "thermal", name: "Thermal 80mm Receipt" },
];

export default function SettingsPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = React.useState(false);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [sealPreview, setSealPreview] = React.useState<string | null>(null);
  const [signPreview, setSignPreview] = React.useState<string | null>(null);
  const [menuOrder, setMenuOrder] = React.useState<string[]>(DEFAULT_MENU_ORDER);

  // UI Colors
  const [sidebarBgColor, setSidebarBgColor] = React.useState("#FFFFFF");
  const [sidebarHoverColor, setSidebarHoverColor] = React.useState("#F1F5F9");
  const [sidebarTextColor, setSidebarTextColor] = React.useState("#111827");

  // Design Lab State
  const [previewLayout, setPreviewLayout] = React.useState<any>("warrior");
  const [docPrimaryColor, setDocPrimaryColor] = React.useState("#0056B3");
  const [docAccentColor, setDocAccentColor] = React.useState("#F57C00");
  const [docFontSize, setDocFontSize] = React.useState("standard");

  const settingsRef = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return doc(db, "companies", companyId, "system", "config");
  }, [db, companyId]);

  const { data: settings, isLoading } = useDoc(settingsRef);

  React.useEffect(() => {
    if (settings) {
      setLogoPreview(settings.companyLogo || null);
      setSealPreview(settings.authorizedSeal || null);
      setSignPreview(settings.authorizedSignature || null);
      if (settings.sidebarMenuOrder) setMenuOrder(settings.sidebarMenuOrder);
      else setMenuOrder(DEFAULT_MENU_ORDER);
      
      if (settings.defaultTemplate_invoice) setPreviewLayout(settings.defaultTemplate_invoice);
      if (settings.docPrimaryColor) setDocPrimaryColor(settings.docPrimaryColor);
      if (settings.docAccentColor) setDocAccentColor(settings.docAccentColor);
      if (settings.docFontSize) setDocFontSize(settings.docFontSize);
      if (settings.sidebarBgColor) setSidebarBgColor(settings.sidebarBgColor);
      if (settings.sidebarHoverColor) setSidebarHoverColor(settings.sidebarHoverColor);
      if (settings.sidebarTextColor) setSidebarTextColor(settings.sidebarTextColor);
    }
  }, [settings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const moveMenuItem = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...menuOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    setMenuOrder(newOrder);
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settingsRef) return;

    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const updates: Record<string, any> = {
      updatedAt: serverTimestamp(),
      companyLogo: logoPreview,
      authorizedSeal: sealPreview,
      authorizedSignature: signPreview,
      sidebarMenuOrder: menuOrder,
      docPrimaryColor: docPrimaryColor,
      docAccentColor: docAccentColor,
      docFontSize: docFontSize,
      sidebarBgColor: sidebarBgColor,
      sidebarHoverColor: sidebarHoverColor,
      sidebarTextColor: sidebarTextColor,
    };

    formData.forEach((value, key) => {
      if (!["companyLogo", "authorizedSeal", "authorizedSignature", "sidebarMenuOrder", "sidebarBgColor", "sidebarHoverColor", "sidebarTextColor"].includes(key)) {
        updates[key] = value;
      }
    });

    try {
      setDocumentNonBlocking(settingsRef, updates, { merge: true });
      toast({ title: t('success') });
    } catch (err) {
      toast({ variant: "destructive", title: t('error') });
    } finally {
      setIsSaving(false);
    }
  };

  const mockPreviewData: any = {
    title: "SAMPLE QUOTATION",
    docNumber: "WTS/INV-2024-001",
    date: new Date().toISOString(),
    customerName: "Global Tech Solutions Ltd",
    customerInfo: "+880 1700-000000\nUttara Dhaka-1230",
    items: [{ name: "High Speed Camera", quantity: 2, unit: "Pcs", unitPrice: 5000, total: 10000, brand: "Hikvision", model: "DS-2C" }],
    subtotal: 10000,
    grandTotal: 10000,
    status: "paid",
    paidAmount: 8000,
    balanceDue: 2000,
    type: 'invoice'
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>;

  return (
    <div className="space-y-6 pb-10">
      <form onSubmit={handleSaveSettings}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold font-headline text-blue-600 flex items-center gap-2">
            <Settings2 className="h-8 w-8" /> System Configuration
          </h1>
          <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 rounded-full px-8 h-12 font-bold shadow-lg">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} {t('save')}
          </Button>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-white border rounded-xl p-1 mb-6 shadow-sm flex overflow-x-auto h-auto no-scrollbar ring-1 ring-slate-100">
            <TabsTrigger value="general" className="rounded-lg gap-2 flex-1 min-w-[120px] py-3 text-[10px] font-black uppercase tracking-widest">Company & Branding</TabsTrigger>
            <TabsTrigger value="documents" className="rounded-lg gap-2 flex-1 min-w-[120px] py-3 text-[10px] font-black uppercase tracking-widest">PDF Design & Text</TabsTrigger>
            <TabsTrigger value="navigation" className="rounded-lg gap-2 flex-1 min-w-[120px] py-3 text-[10px] font-black uppercase tracking-widest">{t('navigation')}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center bg-white ring-1 ring-slate-100">
                <Label className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Main Company Logo</Label>
                <div className="w-24 h-24 mb-4 relative group">
                  {logoPreview ? (
                    <img src={logoPreview} className="w-full h-full object-contain rounded-xl border p-2" />
                  ) : (
                    <div className="w-full h-full bg-slate-50 rounded-xl border-2 border-dashed flex items-center justify-center"><ImageIcon className="text-slate-300" /></div>
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, setLogoPreview)} />
                </div>
                <p className="text-[9px] text-slate-400">Click image to upload</p>
              </Card>

              <Card className="border-none shadow-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center bg-white ring-1 ring-slate-100">
                <Label className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Authorized Seal</Label>
                <div className="w-24 h-24 mb-4 relative group">
                  {sealPreview ? (
                    <img src={sealPreview} className="w-full h-full object-contain rounded-xl border p-2" />
                  ) : (
                    <div className="w-full h-full bg-slate-50 rounded-xl border-2 border-dashed flex items-center justify-center"><ShieldCheck className="text-slate-300" /></div>
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, setSealPreview)} />
                </div>
                <p className="text-[9px] text-slate-400">Blue Round Seal Image</p>
              </Card>

              <Card className="border-none shadow-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center bg-white ring-1 ring-slate-100">
                <Label className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Official Signature</Label>
                <div className="w-24 h-24 mb-4 relative group">
                  {signPreview ? (
                    <img src={signPreview} className="w-full h-full object-contain rounded-xl border p-2" />
                  ) : (
                    <div className="w-full h-full bg-slate-50 rounded-xl border-2 border-dashed flex items-center justify-center"><PenTool className="text-slate-300" /></div>
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, setSignPreview)} />
                </div>
                <p className="text-[9px] text-slate-400">Transparent PNG preferred</p>
              </Card>

              <Card className="md:col-span-3 border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100">
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Company Name</Label><Input name="companyName" defaultValue={settings?.companyName} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Slogan</Label><Input name="companySlogan" defaultValue={settings?.companySlogan} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Official Phone</Label><Input name="phone" defaultValue={settings?.phone} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Official Email</Label><Input name="email" defaultValue={settings?.email} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Website URL</Label><Input name="website" defaultValue={settings?.website} placeholder="www.example.com" className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Official Address</Label><Input name="address" defaultValue={settings?.address} className="h-11 rounded-xl" /></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-3 border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100">
                <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500">Sidebar UI Customization</CardTitle></CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">
                         <Monitor className="h-3 w-3" /> Background Color
                      </Label>
                      <div className="flex gap-2">
                         <Input type="color" value={sidebarBgColor} onChange={e => setSidebarBgColor(e.target.value)} className="h-11 w-16 p-1 rounded-lg" />
                         <Input value={sidebarBgColor} onChange={e => setSidebarBgColor(e.target.value)} className="h-11 flex-1 rounded-xl font-mono uppercase" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">
                         <Type className="h-3 w-3" /> Text Color
                      </Label>
                      <div className="flex gap-2">
                         <Input type="color" value={sidebarTextColor} onChange={e => setSidebarTextColor(e.target.value)} className="h-11 w-16 p-1 rounded-lg" />
                         <Input value={sidebarTextColor} onChange={e => setSidebarTextColor(e.target.value)} className="h-11 flex-1 rounded-xl font-mono uppercase" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">
                         <LayoutGrid className="h-3 w-3" /> Sub-menu Hover Color
                      </Label>
                      <div className="flex gap-2">
                         <Input type="color" value={sidebarHoverColor} onChange={e => setSidebarHoverColor(e.target.value)} className="h-11 w-16 p-1 rounded-lg" />
                         <Input value={sidebarHoverColor} onChange={e => setSidebarHoverColor(e.target.value)} className="h-11 flex-1 rounded-xl font-mono uppercase" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-6">
                <Card className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 p-8 space-y-6">
                  <div className="flex items-center gap-2 border-b pb-2">
                    <Palette className="h-4 w-4 text-blue-600" />
                    <h3 className="text-xs font-black uppercase tracking-widest">Visual Styles</h3>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Template Engine</Label>
                    <Select name="defaultTemplate_invoice" defaultValue={settings?.defaultTemplate_invoice || "warrior"} onValueChange={setPreviewLayout}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>{DOCUMENT_LAYOUTS.map(l => <SelectItem key={l.value} value={l.value}>{l.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Primary Color</Label><Input type="color" value={docPrimaryColor} onChange={e => setDocPrimaryColor(e.target.value)} className="h-12 w-full p-1" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Accent Color</Label><Input type="color" value={docAccentColor} onChange={e => setDocAccentColor(e.target.value)} className="h-12 w-full p-1" /></div>
                  </div>

                  <div className="flex items-center gap-2 border-b pb-2 pt-4">
                    <FileBadge className="h-4 w-4 text-blue-600" />
                    <h3 className="text-xs font-black uppercase tracking-widest">Custom PDF Text</h3>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Standard Terms & Conditions</Label>
                    <Textarea name="pdfTerms" defaultValue={settings?.pdfTerms} className="min-h-[100px] rounded-xl text-[10px] font-bold" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Footer Heart Message</Label>
                    <Input name="footerHeartMsg" defaultValue={settings?.footerHeartMsg} className="h-11 rounded-xl font-bold" />
                  </div>
                </Card>
              </div>

              <div className="lg:col-span-7 space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> PDF Preview Lab</p>
                    <Badge variant="outline" className="text-[9px] font-black px-2 bg-white">Dynamic Scale View</Badge>
                 </div>
                 <div className="bg-white rounded-[2rem] border shadow-2xl p-4 md:p-8 overflow-hidden">
                    <div className="scale-[0.55] sm:scale-[0.7] origin-top">
                       <DocumentTemplate {...mockPreviewData} layoutOverride={previewLayout} />
                    </div>
                 </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="navigation" className="space-y-6">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {menuOrder.map((key, index) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border group">
                    <span className="font-black text-[10px] uppercase text-slate-700">{t(key)}</span>
                    <div className="flex gap-1 opacity-100">
                      <Button type="button" variant="ghost" size="icon" onClick={() => moveMenuItem(index, 'up')} disabled={index === 0}><ArrowUp className="h-3 w-3" /></Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => moveMenuItem(index, 'down')} disabled={index === menuOrder.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-4 bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl flex items-center gap-4">
                 <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><LayoutGrid className="h-5 w-5" /></div>
                 <p className="text-[10px] font-bold text-blue-700 uppercase leading-relaxed">
                   Rearrange your terminal's sidebar layout. Changes will be synchronized across all branch terminals after saving.
                 </p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
