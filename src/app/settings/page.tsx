"use client"

import * as React from "react"
import { 
  Building2, 
  CheckCircle2,
  Settings2,
  Lock,
  Percent,
  Warehouse,
  Upload,
  X,
  FileBarChart,
  ShieldCheck,
  Zap,
  Menu,
  Languages,
  Loader2,
  ArrowUp,
  ArrowDown,
  Globe,
  Clock,
  ShieldAlert,
  ShieldX,
  MonitorPlay,
  RotateCcw,
  MessageSquareWarning,
  AlertCircle,
  Layout,
  Palette,
  Type,
  Eye,
  Maximize2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { DocumentTemplate } from "@/components/documents/document-template"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

const DEFAULT_MENU_ORDER = [
  "dashboard", 
  "sales", 
  "quotations", 
  "dispatch", 
  "purchases", 
  "returns", 
  "inventory", 
  "masterManagement", 
  "serialTracking", 
  "project-billing", 
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
  "settings", 
  "users"
];

const DOCUMENT_LAYOUTS = [
  { value: "warrior", name: "Warrior (Official Premium)" },
  { value: "erppro", name: "ERP Pro (High Density)" },
  { value: "modern", name: "Modern (Bold Branding)" },
  { value: "professional", name: "Professional (Standard)" },
  { value: "minimal", name: "Minimalist (Clean)" },
  { value: "thermal", name: "Thermal (80mm Receipt)" },
];

export default function SettingsPage() {
  const { companyId, userRole } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = React.useState(false);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [menuOrder, setMenuOrder] = React.useState<string[]>(DEFAULT_MENU_ORDER);

  // Design Lab State for Preview
  const [previewLayout, setPreviewLayout] = React.useState<any>("warrior");
  const [docPrimaryColor, setDocPrimaryColor] = React.useState("#0056B3");
  const [docAccentColor, setDocAccentColor] = React.useState("#F57C00");
  const [docFontSize, setDocFontSize] = React.useState("standard");

  const isSuperAdmin = userRole?.isSuperAdmin === true;

  const settingsRef = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return doc(db, "companies", companyId, "system", "config");
  }, [db, companyId]);

  const { data: settings, isLoading } = useDoc(settingsRef);

  React.useEffect(() => {
    if (settings?.companyLogo) {
      setLogoPreview(settings.companyLogo);
    }
    if (settings?.sidebarMenuOrder && Array.isArray(settings.sidebarMenuOrder)) {
      setMenuOrder(settings.sidebarMenuOrder);
    }
    if (settings?.defaultTemplate_invoice) {
      setPreviewLayout(settings.defaultTemplate_invoice);
    }
    if (settings?.docPrimaryColor) setDocPrimaryColor(settings.docPrimaryColor);
    if (settings?.docAccentColor) setDocAccentColor(settings.docAccentColor);
    if (settings?.docFontSize) setDocFontSize(settings.docFontSize);
  }, [settings]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
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
      sidebarMenuOrder: menuOrder,
      systemDefaultLanguage: formData.get("systemDefaultLanguage"),
      autoLogoutEnabled: formData.get("autoLogoutEnabled") === "on",
      sessionTimeout: Number(formData.get("sessionTimeout") || 60),
      demoModeEnabled: formData.get("demoModeEnabled") === "on",
      defaultTemplate_invoice: formData.get("defaultTemplate_invoice"),
      defaultTemplate_quotation: formData.get("defaultTemplate_quotation"),
      defaultTemplate_po: formData.get("defaultTemplate_po"),
      docPrimaryColor: docPrimaryColor,
      docAccentColor: docAccentColor,
      docFontSize: docFontSize,
    };

    formData.forEach((value, key) => {
      if (!["systemDefaultLanguage", "companyLogo", "autoLogoutEnabled", "sessionTimeout", "demoModeEnabled", "defaultTemplate_invoice", "defaultTemplate_quotation", "defaultTemplate_po", "docPrimaryColor", "docAccentColor", "docFontSize"].includes(key)) {
        updates[key] = value;
      }
    });

    try {
      setDocumentNonBlocking(settingsRef, updates, { merge: true });
      toast({ title: t('success'), description: t('successSub') });
    } catch (err) {
      toast({ variant: "destructive", title: t('error') });
    } finally {
      setIsSaving(false);
    }
  };

  const mockPreviewData = {
    title: "SAMPLE QUOTATION",
    docNumber: "WTS/INV-26-07-0045",
    date: new Date().toISOString(),
    customerName: "Global Tech Solutions Ltd.",
    customerInfo: "+880 1700-000000\n123 Business Avenue, Suite 500, Innovation City\ninfo@globaltech.com",
    items: [
      { 
        name: "Enterprise 4K Security System", 
        quantity: 2, 
        unit: "Pcs", 
        unitPrice: 450, 
        total: 900, 
        brand: "Hikvision", 
        model: "DS-2CD1023G0", 
        warranty: "1 Year",
        country: "China"
      },
      { 
        name: "Fiber Optic Installation Service", 
        quantity: 1, 
        unit: "Site", 
        unitPrice: 1200, 
        total: 1200, 
        brand: "WTS", 
        model: "Service", 
        warranty: "Service Agreement",
        country: "Local"
      }
    ],
    subtotal: 2100,
    taxAmount: 315,
    taxRate: 15,
    discount: 100,
    grandTotal: 2315,
    status: "paid",
    notes: "This is a live preview of the Warrior High-Fidelity corporate document layout."
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>;

  return (
    <div className="space-y-6 pb-10">
      <form onSubmit={handleSaveSettings}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold font-headline text-blue-600 flex items-center gap-2">
              <Settings2 className="h-8 w-8" /> {t('controlCenter')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t('configSub')}</p>
          </div>
          <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 rounded-full px-8 h-12 font-bold shadow-lg shadow-blue-100">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {t('saveSystem')}
          </Button>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-white border rounded-xl p-1 mb-6 shadow-sm flex overflow-x-auto h-auto no-scrollbar ring-1 ring-slate-100">
            <TabsTrigger value="general" className="rounded-lg gap-2 flex-1 min-w-[120px] py-3 text-[10px] font-black uppercase tracking-widest">{t('general')}</TabsTrigger>
            <TabsTrigger value="documents" className="rounded-lg gap-2 flex-1 min-w-[120px] py-3 text-[10px] font-black uppercase tracking-widest">
              <Layout className="h-3.5 w-3.5" /> Documents
            </TabsTrigger>
            <TabsTrigger value="navigation" className="rounded-lg gap-2 flex-1 min-w-[120px] py-3 text-[10px] font-black uppercase tracking-widest">{t('navigation')}</TabsTrigger>
            <TabsTrigger value="messages" className="rounded-lg gap-2 flex-1 min-w-[120px] py-3 text-[10px] font-black uppercase tracking-widest">{t('messages')}</TabsTrigger>
            <TabsTrigger value="business" className="rounded-lg gap-2 flex-1 min-w-[120px] py-3 text-[10px] font-black uppercase tracking-widest">{t('businessRules')}</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="demo" className="rounded-lg gap-2 flex-1 min-w-[120px] py-3 text-[10px] font-black uppercase tracking-widest">{t('demoManagement')}</TabsTrigger>}
            <TabsTrigger value="security" className="rounded-lg gap-2 flex-1 min-w-[120px] py-3 text-[10px] font-black uppercase tracking-widest">{t('sessionManagement')}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100">
                <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">{t('general')}</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('companyName')}</Label><Input name="companyName" defaultValue={settings?.companyName} className="h-11 rounded-xl" /></div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('systemLanguage')}</Label>
                      <Select name="systemDefaultLanguage" defaultValue={settings?.systemDefaultLanguage || "BN"}>
                        <SelectTrigger className="h-11 rounded-xl bg-white border-none ring-1 ring-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="BN" className="text-xs font-bold">বাংলা (Bangla)</SelectItem>
                          <SelectItem value="EN" className="text-xs font-bold">English (US)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('email')}</Label><Input name="email" type="email" defaultValue={settings?.email} className="h-11 rounded-xl" /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('phone')}</Label><Input name="phone" defaultValue={settings?.phone} className="h-11 rounded-xl" /></div>
                  </div>
                  <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{t('address')}</Label><Input name="address" defaultValue={settings?.address} className="h-11 rounded-xl" /></div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm rounded-[2rem] flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 ring-1 ring-slate-100">
                <div className="relative w-32 h-32 mb-6">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain rounded-3xl bg-white p-3 shadow-2xl ring-1 ring-slate-100" />
                  ) : (
                    <div className="w-full h-full rounded-3xl bg-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl">W</div>
                  )}
                </div>
                <Button variant="outline" className="rounded-full gap-2 font-black text-[10px] uppercase tracking-widest h-10 px-6 border-none ring-1 ring-slate-200 bg-white" asChild>
                  <label className="cursor-pointer">
                    <Upload className="h-4 w-4" /> Change Logo
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                  </label>
                </Button>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
             <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Control Panel */}
                <div className="xl:col-span-4 space-y-6">
                  <Card className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100">
                    <CardHeader>
                      <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <Palette className="h-4 w-4 text-blue-600" /> Design Lab
                      </CardTitle>
                      <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Configure your document identity.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6 pt-0">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Base Layout</Label>
                          <Select 
                            name="defaultTemplate_invoice" 
                            defaultValue={settings?.defaultTemplate_invoice || "warrior"}
                            onValueChange={setPreviewLayout}
                          >
                            <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {DOCUMENT_LAYOUTS.map(l => <SelectItem key={l.value} value={l.value} className="text-xs font-bold">{l.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Primary Color</Label>
                            <div className="flex gap-2">
                              <Input 
                                type="color" 
                                className="w-10 h-10 p-0 rounded-lg border-none ring-1 ring-slate-200" 
                                value={docPrimaryColor}
                                onChange={e => setDocPrimaryColor(e.target.value)}
                              />
                              <Input 
                                className="h-10 text-[10px] font-mono font-bold uppercase rounded-lg" 
                                value={docPrimaryColor}
                                onChange={e => setDocPrimaryColor(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Accent Color</Label>
                            <div className="flex gap-2">
                              <Input 
                                type="color" 
                                className="w-10 h-10 p-0 rounded-lg border-none ring-1 ring-slate-200" 
                                value={docAccentColor}
                                onChange={e => setDocAccentColor(e.target.value)}
                              />
                              <Input 
                                className="h-10 text-[10px] font-mono font-bold uppercase rounded-lg" 
                                value={docAccentColor}
                                onChange={e => setDocAccentColor(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Typography Scale</Label>
                          <Select 
                            name="docFontSize" 
                            defaultValue={settings?.docFontSize || "standard"}
                            onValueChange={setDocFontSize}
                          >
                            <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                               <SelectItem value="compact" className="text-xs font-bold">Compact (9px)</SelectItem>
                               <SelectItem value="standard" className="text-xs font-bold">Standard (11px)</SelectItem>
                               <SelectItem value="large" className="text-xs font-bold">Medium (13px)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100">
                        <div className="p-4 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-100 flex items-center gap-3">
                           <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0" />
                           <p className="text-[9px] font-bold text-blue-700 uppercase leading-relaxed">
                             Customizations are applied globally to Invoices, Quotations, and POs.
                           </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-sm rounded-[2rem] bg-slate-900 text-white p-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-4">Module Defaults</h3>
                    <div className="space-y-4">
                       <div className="space-y-1.5">
                         <Label className="text-[9px] font-black uppercase opacity-60">Default Quotation Layout</Label>
                         <Select name="defaultTemplate_quotation" defaultValue={settings?.defaultTemplate_quotation || "warrior"}>
                           <SelectTrigger className="h-9 rounded-lg bg-white/10 border-none ring-1 ring-white/20 text-xs"><SelectValue /></SelectTrigger>
                           <SelectContent>{DOCUMENT_LAYOUTS.map(l => <SelectItem key={l.value} value={l.value}>{l.name}</SelectItem>)}</SelectContent>
                         </Select>
                       </div>
                       <div className="space-y-1.5">
                         <Label className="text-[9px] font-black uppercase opacity-60">Default Purchase Order Layout</Label>
                         <Select name="defaultTemplate_po" defaultValue={settings?.defaultTemplate_po || "warrior"}>
                           <SelectTrigger className="h-9 rounded-lg bg-white/10 border-none ring-1 ring-white/20 text-xs"><SelectValue /></SelectTrigger>
                           <SelectContent>{DOCUMENT_LAYOUTS.map(l => <SelectItem key={l.value} value={l.value}>{l.name}</SelectItem>)}</SelectContent>
                         </Select>
                       </div>
                    </div>
                  </Card>
                </div>

                {/* Live Preview Panel */}
                <div className="xl:col-span-8">
                  <Card className="border-none shadow-sm rounded-[2rem] bg-slate-200/50 ring-1 ring-slate-100 overflow-hidden sticky top-20">
                    <CardHeader className="bg-white/80 backdrop-blur-md border-b flex flex-row items-center justify-between py-4 px-8">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg animate-pulse">
                           <MonitorPlay className="h-4 w-4" />
                         </div>
                         <div>
                           <CardTitle className="text-[10px] font-black uppercase tracking-widest">Live Design Terminal</CardTitle>
                           <p className="text-[8px] font-bold text-muted-foreground uppercase mt-0.5">Instant Document Visualization</p>
                         </div>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100"><Maximize2 className="h-3.5 w-3.5" /></Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-[21cm] w-[95vw] p-0 border-none bg-transparent shadow-none overflow-y-auto max-h-[95vh] rounded-none">
                           <DialogHeader className="sr-only">
                              <DialogTitle>Full Document Preview</DialogTitle>
                           </DialogHeader>
                           <div className="bg-white shadow-2xl rounded-[2rem] overflow-hidden">
                              <DocumentTemplate 
                                {...mockPreviewData} 
                                layoutOverride={previewLayout}
                                customStyles={{ primaryColor: docPrimaryColor, accentColor: docAccentColor, fontSize: docFontSize }}
                              />
                           </div>
                        </DialogContent>
                      </Dialog>
                    </CardHeader>
                    <div className="p-4 md:p-8 flex justify-center bg-slate-100/30 overflow-hidden">
                      <div className="w-full max-w-[800px] bg-white shadow-2xl rounded-2xl overflow-hidden scale-[0.8] origin-top md:scale-100 h-[600px] overflow-y-auto custom-scrollbar border border-slate-200">
                        <DocumentTemplate 
                          {...mockPreviewData} 
                          layoutOverride={previewLayout}
                          customStyles={{ primaryColor: docPrimaryColor, accentColor: docAccentColor, fontSize: docFontSize }}
                        />
                      </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-md p-4 border-t text-center">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                         <Eye className="h-3 w-3" /> Previewing Active Configuration
                       </p>
                    </div>
                  </Card>
                </div>
             </div>
          </TabsContent>

          <TabsContent value="navigation" className="space-y-6">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">{t('navigation')}</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Reorder sidebar items by priority.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {menuOrder.map((key, index) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-100 group">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-slate-400 w-4">{index + 1}</span>
                        <span className="font-black text-[10px] uppercase tracking-tighter text-slate-700">{t(key as any)}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-white shadow-sm" onClick={() => moveMenuItem(index, 'up')} disabled={index === 0}><ArrowUp className="h-3 w-3" /></Button>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-white shadow-sm" onClick={() => moveMenuItem(index, 'down')} disabled={index === menuOrder.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 overflow-hidden">
               <CardHeader className="bg-slate-50/50 p-8 border-b">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                     <MessageSquareWarning className="h-5 w-5" />
                   </div>
                   <div>
                     <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">{t('errorAndPermissions')}</CardTitle>
                     <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Global Terminal Notification Overrides</p>
                   </div>
                 </div>
               </CardHeader>
               <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4 p-6 rounded-3xl bg-slate-50 ring-1 ring-slate-100">
                       <h3 className="text-xs font-black uppercase tracking-widest text-red-600 flex items-center gap-2">
                         <ShieldAlert className="h-4 w-4" /> {t('accessRestricted')}
                       </h3>
                       <div className="space-y-4 pt-4 border-t border-slate-200">
                          <div className="space-y-1.5">
                             <Label className="text-[9px] font-black uppercase text-slate-400">English Header</Label>
                             <Input name="msgTitle_permission_EN" defaultValue={settings?.msgTitle_permission_EN || t('accessRestricted')} className="h-10 text-xs font-bold" />
                          </div>
                          <div className="space-y-1.5">
                             <Label className="text-[9px] font-black uppercase text-slate-400">English Message</Label>
                             <Textarea name="msgBody_permission_EN" defaultValue={settings?.msgBody_permission_EN || t('accessRestrictedMsg')} className="text-xs min-h-[80px]" />
                          </div>
                          <div className="space-y-1.5 pt-4 border-t border-slate-200/50">
                             <Label className="text-[9px] font-black uppercase text-slate-400">বাংলা শিরোনাম</Label>
                             <Input name="msgTitle_permission_BN" defaultValue={settings?.msgTitle_permission_BN || "অ্যাক্সেস সীমিত"} className="h-10 text-xs font-bold" />
                          </div>
                          <div className="space-y-1.5">
                             <Label className="text-[9px] font-black uppercase text-slate-400">বাংলা বার্তা</Label>
                             <Textarea name="msgBody_permission_BN" defaultValue={settings?.msgBody_permission_BN || "এই ফিচারটি ব্যবহার করার জন্য আপনাকে অনুমতি দেওয়া হয়নি।"} className="text-xs min-h-[80px]" />
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4 p-6 rounded-3xl bg-slate-50 ring-1 ring-slate-100">
                       <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 flex items-center gap-2">
                         <AlertCircle className="h-4 w-4" /> {t('serverError')}
                       </h3>
                       <div className="space-y-4 pt-4 border-t border-slate-200">
                          <div className="space-y-1.5">
                             <Label className="text-[9px] font-black uppercase text-slate-400">English Header</Label>
                             <Input name="msgTitle_system_EN" defaultValue={settings?.msgTitle_system_EN || t('serverError')} className="h-10 text-xs font-bold" />
                          </div>
                          <div className="space-y-1.5">
                             <Label className="text-[9px] font-black uppercase text-slate-400">English Message</Label>
                             <Textarea name="msgBody_system_EN" defaultValue={settings?.msgBody_system_EN || t('serverErrorMsg')} className="text-xs min-h-[80px]" />
                          </div>
                          <div className="space-y-1.5 pt-4 border-t border-slate-200/50">
                             <Label className="text-[9px] font-black uppercase text-slate-400">বাংলা শিরোনাম</Label>
                             <Input name="msgTitle_system_BN" defaultValue={settings?.msgTitle_system_BN || "সিস্টেম ত্রুটি"} className="h-10 text-xs font-bold" />
                          </div>
                          <div className="space-y-1.5">
                             <Label className="text-[9px] font-black uppercase text-slate-400">বাংলা বার্তা</Label>
                             <Textarea name="msgBody_system_BN" defaultValue={settings?.msgBody_system_BN || "সাময়িক সমস্যা হয়েছে, পরে আবার চেষ্টা করুন।"} className="text-xs min-h-[80px]" />
                          </div>
                       </div>
                    </div>
                  </div>
               </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business" className="space-y-6">
             <Card className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100">
               <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900">{t('businessRules')}</CardTitle></CardHeader>
               <CardContent className="space-y-6 p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <div><Label className="text-xs font-black uppercase text-slate-900">{t('autoStock')}</Label><p className="text-[9px] text-muted-foreground uppercase mt-0.5">{t('autoStockSub')}</p></div>
                        <Switch id="autoStockUpdate" defaultChecked={settings?.autoStockUpdate} className="data-[state=checked]:bg-blue-600" />
                      </div>
                      <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <div><Label className="text-xs font-black uppercase text-slate-900">{t('negStock')}</Label><p className="text-[9px] text-muted-foreground uppercase mt-0.5">{t('negStockSub')}</p></div>
                        <Switch id="allowNegativeStock" defaultChecked={settings?.allowNegativeStock} className="data-[state=checked]:bg-blue-600" />
                      </div>
                    </div>
                  </div>
               </CardContent>
             </Card>
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="demo" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl rounded-[2.5rem] bg-violet-600 text-white overflow-hidden relative">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                   <CardHeader className="p-8">
                      <div className="flex items-center gap-4 mb-4">
                         <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center"><MonitorPlay className="h-6 w-6" /></div>
                         <CardTitle className="text-xl font-black font-headline uppercase tracking-tight">{t('demoManagement')}</CardTitle>
                      </div>
                      <CardDescription className="text-xs text-white/60 font-bold uppercase leading-relaxed">{t('demoModeSub')}</CardDescription>
                   </CardHeader>
                   <CardContent className="p-8 pt-0">
                      <div className="flex items-center justify-between p-6 bg-white/10 rounded-3xl backdrop-blur-xl border border-white/20">
                         <div className="space-y-0.5">
                            <Label className="text-sm font-black uppercase tracking-widest">{t('enableDemo')}</Label>
                            <p className="text-[9px] font-bold text-white/50">Guest users will have sandbox access</p>
                         </div>
                         <Switch name="demoModeEnabled" defaultChecked={settings?.demoModeEnabled} className="data-[state=checked]:bg-white data-[state=checked]:[&>span]:bg-violet-600" />
                      </div>
                   </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-[2.5rem] bg-white ring-1 ring-slate-100 p-8 space-y-6">
                   <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Sandbox Guard Rules</h3>
                   <div className="space-y-3">
                      {[
                        { icon: ShieldX, label: "Block Destructive Actions", desc: "Guests cannot delete invoices, inventory or users." },
                        { icon: RotateCcw, label: "Automatic Reset Pattern", desc: "Data reverts to baseline every 24 hours." },
                        { icon: ShieldAlert, label: "System Config Lock", desc: "Master settings are disabled for guest accounts." }
                      ].map((rule, i) => (
                        <div key={i} className="flex gap-4 items-start p-4 bg-slate-50 rounded-2xl">
                           <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-violet-600 shadow-sm shrink-0"><rule.icon className="h-5 w-5" /></div>
                           <div>
                              <p className="text-[11px] font-black uppercase text-slate-900">{rule.label}</p>
                              <p className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">{rule.desc}</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </Card>
              </div>
            </TabsContent>
          )}

          <TabsContent value="security" className="space-y-6">
            <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
              <CardHeader className="bg-slate-50/50 border-b p-8">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" /> {t('sessionManagement')}
                </CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold text-muted-foreground mt-1">Configure auto-logout policies for enhanced security.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center justify-between p-6 bg-blue-50/30 rounded-3xl border-2 border-dashed border-blue-100">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-black uppercase text-blue-900">{t('autoLogoutEnabled')}</Label>
                    <p className="text-[9px] font-bold text-blue-700 uppercase tracking-tighter">Protect accounts by logging out inactive users automatically.</p>
                  </div>
                  <Switch name="autoLogoutEnabled" defaultChecked={settings?.autoLogoutEnabled} className="data-[state=checked]:bg-blue-600" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('sessionTimeout')}</Label>
                    <Select name="sessionTimeout" defaultValue={String(settings?.sessionTimeout || 60)}>
                      <SelectTrigger className="h-12 rounded-2xl border-none ring-1 ring-slate-200 bg-white font-black text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="15" className="text-xs font-bold">15 Minutes</SelectItem>
                        <SelectItem value="30" className="text-xs font-bold">30 Minutes</SelectItem>
                        <SelectItem value="60" className="text-xs font-bold">60 Minutes</SelectItem>
                        <SelectItem value="120" className="text-xs font-bold">120 Minutes</SelectItem>
                        <SelectItem value="240" className="text-xs font-bold">4 Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-3xl flex items-center gap-4 border border-white shadow-inner">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-900">Proximity Warning</p>
                      <p className="text-[9px] text-slate-500 mt-1 uppercase font-bold tracking-tight">A popup will appear 1 minute before expiration.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}
