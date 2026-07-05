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
  AlertCircle
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

export default function SettingsPage() {
  const { companyId, userRole } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = React.useState(false);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [menuOrder, setMenuOrder] = React.useState<string[]>(DEFAULT_MENU_ORDER);

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
    };

    formData.forEach((value, key) => {
      if (!["systemDefaultLanguage", "companyLogo", "autoLogoutEnabled", "sessionTimeout", "demoModeEnabled"].includes(key)) {
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

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-blue-600" /></div>;

  return (
    <div className="space-y-6 pb-20">
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
