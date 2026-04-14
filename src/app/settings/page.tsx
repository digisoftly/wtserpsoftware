
"use client"

import * as React from "react"
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  CreditCard,
  Palette,
  Layout,
  UserCog,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Settings2,
  BellRing,
  Share2,
  Database,
  Lock,
  Percent,
  Warehouse,
  FileText,
  Clock,
  MessageSquare,
  Upload,
  X,
  Image as ImageIcon
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
import Image from "next/image"

export default function SettingsPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = React.useState(false);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);

  const settingsRef = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return doc(db, "companies", companyId, "system", "config");
  }, [db, companyId]);

  const { data: settings, isLoading } = useDoc(settingsRef);

  React.useEffect(() => {
    if (settings?.companyLogo) {
      setLogoPreview(settings.companyLogo);
    }
  }, [settings]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Logo must be under 2MB." });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settingsRef) return;

    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const updates: Record<string, any> = {
      updatedAt: serverTimestamp(),
      companyLogo: logoPreview, // Save the logo data URI
    };

    formData.forEach((value, key) => {
      if (key.includes('Rate') || key.includes('Level') || key.includes('Days') || key.includes('Limit')) {
        updates[key] = Number(value);
      } else {
        updates[key] = value;
      }
    });

    const switches = [
      'allowNegativeStock', 'autoStockUpdate', 'enablePartialPayment', 
      'autoInvoiceGeneration', 'notifyEmail', 'notifySMS', 'notifyWhatsApp',
      'triggerInvoiceGen', 'triggerPaymentRec', 'enable2FA'
    ];
    
    switches.forEach(id => {
      const el = document.getElementById(id) as HTMLButtonElement;
      if (el) {
        updates[id] = el.getAttribute('data-state') === 'checked';
      }
    });

    try {
      setDocumentNonBlocking(settingsRef, updates, { merge: true });
      toast({ title: t('success'), description: t('successSub') });
    } catch (err) {
      toast({ variant: "destructive", title: t('error'), description: t('errorSub') });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <form onSubmit={handleSaveSettings}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline text-primary flex items-center gap-2">
              <Settings2 className="h-8 w-8" /> {t('controlCenter')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t('configSub')}</p>
          </div>
          <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary/90 rounded-full px-8 gap-2 w-full sm:w-auto h-12 font-bold shadow-lg">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {t('saveSystem')}
          </Button>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-white border rounded-xl p-1 mb-6 shadow-sm flex overflow-x-auto h-auto no-scrollbar">
            <TabsTrigger value="general" className="rounded-lg gap-2 flex-1 min-w-[120px] py-2">
              <Building2 className="h-4 w-4" /> {t('general')}
            </TabsTrigger>
            <TabsTrigger value="business" className="rounded-lg gap-2 flex-1 min-w-[120px] py-2">
              <Warehouse className="h-4 w-4" /> {t('businessRules')}
            </TabsTrigger>
            <TabsTrigger value="billing" className="rounded-lg gap-2 flex-1 min-w-[120px] py-2">
              <Percent className="h-4 w-4" /> {t('billing')}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg gap-2 flex-1 min-w-[120px] py-2">
              <BellRing className="h-4 w-4" /> {t('notifications')}
            </TabsTrigger>
            <TabsTrigger value="integrations" className="rounded-lg gap-2 flex-1 min-w-[120px] py-2">
              <Share2 className="h-4 w-4" /> {t('integrations')}
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg gap-2 flex-1 min-w-[120px] py-2">
              <Lock className="h-4 w-4" /> {t('security')}
            </TabsTrigger>
            <TabsTrigger value="backup" className="rounded-lg gap-2 flex-1 min-w-[120px] py-2">
              <Database className="h-4 w-4" /> {t('backup')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-none shadow-sm rounded-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-headline">{t('general')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-xs">{t('companyName')}</Label><Input name="companyName" defaultValue={settings?.companyName || "Warrior Tech System"} /></div>
                    <div className="space-y-2"><Label className="text-xs">VAT / Reg Number</Label><Input name="regNumber" defaultValue={settings?.regNumber} /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-xs">{t('email')}</Label><Input name="email" type="email" defaultValue={settings?.email} /></div>
                    <div className="space-y-2"><Label className="text-xs">{t('phone')}</Label><Input name="phone" defaultValue={settings?.phone} /></div>
                  </div>
                  <div className="space-y-2"><Label className="text-xs">{t('address')}</Label><Input name="address" defaultValue={settings?.address} /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">{t('currency')}</Label>
                      <Select name="currency" defaultValue={settings?.currency || "BDT"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="BDT">Bangladeshi Taka (৳)</SelectItem><SelectItem value="USD">US Dollar ($)</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">{t('timezone')}</Label>
                      <Select name="timezone" defaultValue={settings?.timezone || "GMT+6"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="GMT+6">Dhaka (GMT+6)</SelectItem><SelectItem value="GMT+0">London (GMT+0)</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm rounded-xl flex flex-col items-center justify-center p-6 text-center bg-muted/10">
                <div className="relative w-32 h-32 mb-6 group">
                  {logoPreview ? (
                    <div className="w-full h-full rounded-3xl bg-white border-2 border-primary/20 shadow-xl overflow-hidden flex items-center justify-center relative">
                      <img 
                        src={logoPreview} 
                        alt="Company Logo" 
                        className="max-w-full max-h-full object-contain p-2"
                      />
                      <button 
                        type="button"
                        onClick={handleRemoveLogo}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-3xl bg-primary flex items-center justify-center text-white text-5xl font-bold shadow-xl">
                      {settings?.companyName?.[0] || "W"}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Button variant="outline" className="rounded-full gap-2" asChild>
                    <label className="cursor-pointer">
                      <Upload className="h-4 w-4" />
                      Upload Branding
                      <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                    </label>
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-4">Transparent PNG, 512x512 recommended (Max 2MB)</p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="business" className="space-y-6">
            <Card className="border-none shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg font-headline">{t('opsLogic')}</CardTitle>
                <CardDescription>{t('opsSub')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-background border rounded-xl">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold">{t('autoStock')}</Label>
                        <p className="text-[10px] text-muted-foreground">{t('autoStockSub')}</p>
                      </div>
                      <Switch id="autoStockUpdate" defaultChecked={settings?.autoStockUpdate} />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-background border rounded-xl">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold">{t('negStock')}</Label>
                        <p className="text-[10px] text-muted-foreground">{t('negStockSub')}</p>
                      </div>
                      <Switch id="allowNegativeStock" defaultChecked={settings?.allowNegativeStock} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">{t('lowStockLevel')}</Label>
                      <Input name="lowStockLevel" type="number" defaultValue={settings?.lowStockLevel || 5} className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">{t('discountStrategy')}</Label>
                      <Select name="discountType" defaultValue={settings?.discountType || "flat"}>
                        <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="flat">Flat Amount (৳)</SelectItem><SelectItem value="percentage">Percentage (%)</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm rounded-xl">
                <CardHeader><CardTitle className="text-lg font-headline">Taxation & Prefixes</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">{t('taxRate')}</Label>
                    <Input name="taxRate" type="number" defaultValue={settings?.taxRate || 15} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-xs">{t('invPrefix')}</Label><Input name="invoicePrefix" defaultValue={settings?.invoicePrefix || "INV"} /></div>
                    <div className="space-y-2"><Label className="text-xs">{t('quotePrefix')}</Label><Input name="quotePrefix" defaultValue={settings?.quotePrefix || "QT"} /></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm rounded-xl">
                <CardHeader><CardTitle className="text-lg font-headline">Recovery Rules</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-background border rounded-xl">
                    <div className="space-y-0.5"><Label className="text-sm font-bold">{t('partialPay')}</Label></div>
                    <Switch id="enablePartialPayment" defaultChecked={settings?.enablePartialPayment} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{t('lateFee')}</Label>
                    <Input name="lateFeeRate" type="number" defaultValue={settings?.lateFeeRate || 0} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-none shadow-sm rounded-xl">
              <CardHeader><CardTitle className="text-lg font-headline">Communication Channels</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-xl flex items-center justify-between bg-blue-50/20">
                    <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-blue-600" /><Label className="font-bold">Email</Label></div>
                    <Switch id="notifyEmail" defaultChecked={settings?.notifyEmail} />
                  </div>
                  <div className="p-4 border rounded-xl flex items-center justify-between bg-purple-50/20">
                    <div className="flex items-center gap-3"><MessageSquare className="h-5 w-5 text-purple-600" /><Label className="font-bold">SMS</Label></div>
                    <Switch id="notifySMS" defaultChecked={settings?.notifySMS} />
                  </div>
                  <div className="p-4 border rounded-xl flex items-center justify-between bg-green-50/20">
                    <div className="flex items-center gap-3"><Share2 className="h-5 w-5 text-green-600" /><Label className="font-bold">WhatsApp</Label></div>
                    <Switch id="notifyWhatsApp" defaultChecked={settings?.notifyWhatsApp} />
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
