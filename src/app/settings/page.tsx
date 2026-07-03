
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
  ShieldAlert
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
  "projects", 
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
  const { companyId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = React.useState(false);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [menuOrder, setMenuOrder] = React.useState<string[]>(DEFAULT_MENU_ORDER);

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
    };

    formData.forEach((value, key) => {
      if (key !== "systemDefaultLanguage" && key !== "companyLogo" && key !== "autoLogoutEnabled" && key !== "sessionTimeout") {
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
          <TabsList className="bg-white border rounded-xl p-1 mb-6 shadow-sm flex overflow-x-auto h-auto no-scrollbar">
            <TabsTrigger value="general" className="rounded-lg gap-2 flex-1 min-w-[120px] py-2">{t('general')}</TabsTrigger>
            <TabsTrigger value="navigation" className="rounded-lg gap-2 flex-1 min-w-[120px] py-2">{t('navigation')}</TabsTrigger>
            <TabsTrigger value="business" className="rounded-lg gap-2 flex-1 min-w-[120px] py-2">{t('businessRules')}</TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg gap-2 flex-1 min-w-[120px] py-2">{t('sessionManagement')}</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-none shadow-sm rounded-xl">
                <CardHeader><CardTitle className="text-lg font-headline">{t('general')}</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-xs font-bold uppercase">{t('companyName')}</Label><Input name="companyName" defaultValue={settings?.companyName} /></div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase">{t('systemLanguage')}</Label>
                      <Select name="systemDefaultLanguage" defaultValue={settings?.systemDefaultLanguage || "BN"}>
                        <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BN">বাংলা (Bangla)</SelectItem>
                          <SelectItem value="EN">English (US)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-xs font-bold uppercase">{t('email')}</Label><Input name="email" type="email" defaultValue={settings?.email} /></div>
                    <div className="space-y-2"><Label className="text-xs font-bold uppercase">{t('phone')}</Label><Input name="phone" defaultValue={settings?.phone} /></div>
                  </div>
                  <div className="space-y-2"><Label className="text-xs font-bold uppercase">{t('address')}</Label><Input name="address" defaultValue={settings?.address} /></div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm rounded-xl flex flex-col items-center justify-center p-6 text-center bg-muted/10">
                <div className="relative w-32 h-32 mb-6">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain rounded-2xl bg-white p-2 shadow-xl" />
                  ) : (
                    <div className="w-full h-full rounded-2xl bg-blue-600 flex items-center justify-center text-white text-4xl font-bold shadow-xl">W</div>
                  )}
                </div>
                <Button variant="outline" className="rounded-full gap-2" asChild>
                  <label className="cursor-pointer">
                    <Upload className="h-4 w-4" /> Change Logo
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                  </label>
                </Button>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="navigation" className="space-y-6">
            <Card className="border-none shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg font-headline">{t('navigation')}</CardTitle>
                <CardDescription>Drag and reorder items to customize the sidebar sequence.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-w-2xl">
                  {menuOrder.map((key, index) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-dashed group">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-muted-foreground w-4">{index + 1}</span>
                        <span className="font-bold text-sm">{t(key as any)}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => moveMenuItem(index, 'up')} disabled={index === 0}><ArrowUp className="h-4 w-4" /></Button>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => moveMenuItem(index, 'down')} disabled={index === menuOrder.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="business" className="space-y-6">
             <Card className="border-none shadow-sm rounded-xl">
               <CardHeader><CardTitle className="text-lg font-headline">{t('businessRules')}</CardTitle></CardHeader>
               <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-background border rounded-xl">
                        <div><Label className="text-sm font-bold">{t('autoStock')}</Label><p className="text-[10px] text-muted-foreground">{t('autoStockSub')}</p></div>
                        <Switch id="autoStockUpdate" defaultChecked={settings?.autoStockUpdate} />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-background border rounded-xl">
                        <div><Label className="text-sm font-bold">{t('negStock')}</Label><p className="text-[10px] text-muted-foreground">{t('negStockSub')}</p></div>
                        <Switch id="allowNegativeStock" defaultChecked={settings?.allowNegativeStock} />
                      </div>
                    </div>
                  </div>
               </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="border-none shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-lg font-headline flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" /> {t('sessionManagement')}
                </CardTitle>
                <CardDescription>Configure auto-logout policies for enhanced security.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center justify-between p-6 bg-blue-50/50 rounded-2xl border-2 border-dashed border-blue-100">
                  <div className="space-y-1">
                    <Label className="text-sm font-black uppercase text-blue-900">{t('autoLogoutEnabled')}</Label>
                    <p className="text-xs text-blue-700">Protect accounts by logging out inactive users automatically.</p>
                  </div>
                  <Switch name="autoLogoutEnabled" defaultChecked={settings?.autoLogoutEnabled} className="data-[state=checked]:bg-blue-600" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('sessionTimeout')}</Label>
                    <Select name="sessionTimeout" defaultValue={String(settings?.sessionTimeout || 60)}>
                      <SelectTrigger className="h-12 rounded-xl border-2 border-slate-100 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 Minutes</SelectItem>
                        <SelectItem value="30">30 Minutes</SelectItem>
                        <SelectItem value="60">60 Minutes</SelectItem>
                        <SelectItem value="120">120 Minutes</SelectItem>
                        <SelectItem value="240">4 Hours</SelectItem>
                        <SelectItem value="480">8 Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm">
                      <ShieldAlert className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Proximity Warning</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-tighter">A popup will appear 1 minute before expiration.</p>
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
