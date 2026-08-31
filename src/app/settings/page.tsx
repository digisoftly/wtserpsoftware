
"use client"

import * as React from "react"
import { 
  Settings2,
  CheckCircle2,
  Loader2,
  Palette,
  ImageIcon,
  LayoutGrid,
  Activity,
  Plus,
  Trash2,
  BarChart3,
  Edit,
  MoveUp,
  MoveDown,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  Clock,
  ShieldCheck,
  MousePointer2
} from "lucide-react"
import * as Icons from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { toast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/use-translation"
import { Textarea } from "@/components/ui/textarea"
import { KPICard } from "@/components/dashboard/kpi-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"

const DEFAULT_MENU_ORDER = [
  "dashboard", "sales", "quotations", "dispatch", "purchases", "returns", 
  "inventory", "serialTracking", "projectBilling", "contracts", "customers", 
  "suppliers", "accounts", "expenses", "masterManagement", "support", "crm", "hrm", "branches", 
  "reports", "ai", "users", "settings"
];

const DATA_SOURCES = [
  { label: "Total Sales", value: "totalSales" },
  { label: "Today Sales", value: "todaySales" },
  { label: "Monthly Sales", value: "monthlySales" },
  { label: "Total Purchases", value: "totalPurchase" },
  { label: "Net Profit", value: "netProfit" },
  { label: "Total Expenses", value: "totalExpense" },
  { label: "Active Customers", value: "totalCustomers" },
  { label: "Total Suppliers", value: "totalSuppliers" },
  { label: "Low Stock Items", value: "lowStockCount" },
  { label: "Pending Projects", value: "pendingProjects" },
  { label: "Customer Due", value: "customerDue" },
  { label: "Supplier Due", value: "supplierDue" },
  { label: "Total Staff", value: "staffCount" },
];

export default function SettingsPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = React.useState(false);
  
  // Dashboard State
  const [kpiCards, setKpiCards] = React.useState<any[]>([]);
  const [isKpiModalOpen, setIsKpiModalOpen] = React.useState(false);
  const [editingCard, setEditingCard] = React.useState<any>(null);

  // Global UI State
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = React.useState<string | null>(null);
  const [loadingLogoPreview, setLoadingLogoPreview] = React.useState<string | null>(null);
  const [sealPreview, setSealPreview] = React.useState<string | null>(null);
  const [signPreview, setSignPreview] = React.useState<string | null>(null);
  const [menuOrder, setMenuOrder] = React.useState<string[]>(DEFAULT_MENU_ORDER);

  // Color States
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
      
      // Load Colors
      if (settings.sidebarBgColor) setSidebarBg(settings.sidebarBgColor);
      if (settings.sidebarTextColor) setSidebarText(settings.sidebarTextColor);
      if (settings.sidebarHoverColor) setSidebarHover(settings.sidebarHoverColor);
      if (settings.sidebarActiveColor) setSidebarActive(settings.sidebarActiveColor);
    }
  }, [settings]);

  const handleSaveKpi = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newCard = {
      id: editingCard?.id || Math.random().toString(36).substr(2, 9),
      title: formData.get("title") as string,
      valueKey: formData.get("valueKey") as string,
      iconName: formData.get("iconName") as string,
      colorClass: formData.get("colorClass") as string,
      bgColor: formData.get("bgColor") as string,
      size: formData.get("size") as string,
      shape: formData.get("shape") as string,
      showGraph: formData.get("showGraph") === "on",
      graphColor: formData.get("graphColor") as string,
    };

    if (editingCard) {
      setKpiCards(prev => prev.map(c => c.id === editingCard.id ? newCard : c));
    } else {
      setKpiCards(prev => [...prev, newCard]);
    }
    setIsKpiModalOpen(false);
    setEditingCard(null);
  };

  const deleteCard = (id: string) => {
    setKpiCards(prev => prev.filter(c => c.id !== id));
  };

  const moveCard = (index: number, direction: 'up' | 'down') => {
    const newCards = [...kpiCards];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newCards.length) return;
    [newCards[index], newCards[target]] = [newCards[target], newCards[index]];
    setKpiCards(newCards);
  };

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
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
      if (!["companyLogo", "companyFavicon", "loadingLogo", "authorizedSeal", "authorizedSignature", "sidebarMenuOrder", "dashboardKpiCards", "sidebarBgColor", "sidebarTextColor", "sidebarHoverColor", "sidebarActiveColor"].includes(key)) {
        updates[key] = value;
      }
    });

    try {
      await setDoc(settingsRef, updates, { merge: true });
      toast({ title: t('success') });
    } catch (err) {
      toast({ variant: "destructive", title: t('error') });
    } finally {
      setIsSaving(false);
    }
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
            <TabsTrigger value="branding" className="rounded-lg gap-2 flex-1 min-w-[150px] py-3 text-[10px] font-black uppercase tracking-widest">Sidebar UI</TabsTrigger>
            <TabsTrigger value="dashboard" className="rounded-lg gap-2 flex-1 min-w-[150px] py-3 text-[10px] font-black uppercase tracking-widest">Dashboard Matrix</TabsTrigger>
            <TabsTrigger value="documents" className="rounded-lg gap-2 flex-1 min-w-[150px] py-3 text-[10px] font-black uppercase tracking-widest">Document Lab</TabsTrigger>
            <TabsTrigger value="navigation" className="rounded-lg gap-2 flex-1 min-w-[150px] py-3 text-[10px] font-black uppercase tracking-widest">Navigation</TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg gap-2 flex-1 min-w-[150px] py-3 text-[10px] font-black uppercase tracking-widest">Security</TabsTrigger>
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
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Primary Branding Logo</p>
                </Card>

                <Card className="border-none shadow-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center bg-white ring-1 ring-slate-100">
                  <Label className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">System Favicon</Label>
                  <div className="w-16 h-16 mb-4 relative group">
                    {faviconPreview ? (
                      <img src={faviconPreview} className="w-full h-full object-contain rounded-lg border p-1 bg-slate-50" />
                    ) : (
                      <div className="w-full h-full bg-slate-50 rounded-lg border-2 border-dashed flex items-center justify-center text-slate-300">
                        <MousePointer2 className="h-6 w-6" />
                      </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setFaviconPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Browser Tab Icon (Square)</p>
                </Card>

                <Card className="border-none shadow-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center bg-white ring-1 ring-slate-100">
                  <Label className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Loading Screen Logo</Label>
                  <div className="w-24 h-24 mb-4 relative group">
                    {loadingLogoPreview ? (
                      <img src={loadingLogoPreview} className="w-full h-full object-contain rounded-xl border p-2 bg-slate-50" />
                    ) : (
                      <div className="w-full h-full bg-slate-50 rounded-xl border-2 border-dashed flex items-center justify-center text-slate-300">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setLoadingLogoPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">App Transition Icon</p>
                </Card>
              </div>

              <Card className="md:col-span-2 border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 p-8 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Legal Name</Label><Input name="companyName" defaultValue={settings?.companyName} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Slogan / Motto</Label><Input name="companySlogan" defaultValue={settings?.companySlogan} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Official Email</Label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/><Input name="email" defaultValue={settings?.email} className="h-11 rounded-xl pl-9" /></div></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Connect Phone</Label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/><Input name="phone" defaultValue={settings?.phone} className="h-11 rounded-xl pl-9" /></div></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Website URL</Label><div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"/><Input name="website" defaultValue={settings?.website} className="h-11 rounded-xl pl-9" /></div></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Currency</Label><Input name="currency" defaultValue={settings?.currency} className="h-11 rounded-xl" /></div>
                 </div>
                 <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Corporate Address</Label><div className="relative"><MapPin className="absolute left-3 top-4 h-3.5 w-3.5 text-slate-400"/><Textarea name="address" defaultValue={settings?.address} className="rounded-xl pl-9 min-h-[80px]" /></div></div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <Card className="p-8 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-blue-600" /> Sidebar UI Customization
                </CardTitle>
              </CardHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Background Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={sidebarBg} onChange={e => setSidebarBg(e.target.value)} className="w-12 h-11 p-1" />
                    <Input value={sidebarBg} onChange={e => setSidebarBg(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Text & Icon Color</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={sidebarText} onChange={e => setSidebarText(e.target.value)} className="w-12 h-11 p-1" />
                    <Input value={sidebarText} onChange={e => setSidebarText(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Hover Background</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={sidebarHover} onChange={e => setSidebarHover(e.target.value)} className="w-12 h-11 p-1" />
                    <Input value={sidebarHover} onChange={e => setSidebarHover(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Active Background</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={sidebarActive} onChange={e => setSidebarActive(e.target.value)} className="w-12 h-11 p-1" />
                    <Input value={sidebarActive} onChange={e => setSidebarActive(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
             <div className="flex items-center justify-between px-2">
                <div>
                   <h3 className="text-sm font-black uppercase text-slate-700 tracking-widest">KPI Matrix Designer</h3>
                   <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Manage dynamic analytical cards for the main terminal</p>
                </div>
                <Button type="button" onClick={() => { setEditingCard(null); setIsKpiModalOpen(true); }} className="bg-blue-600 rounded-full h-10 gap-2 text-[10px] font-black uppercase px-6">
                   <Plus className="h-4 w-4" /> Add KPI Card
                </Button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kpiCards.map((card, idx) => (
                  <div key={card.id} className="relative group">
                    <KPICard {...card} value="Sample" />
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button type="button" size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => moveCard(idx, 'up')} disabled={idx === 0}><MoveUp className="h-3.5 w-3.5" /></Button>
                      <Button type="button" size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => moveCard(idx, 'down')} disabled={idx === kpiCards.length -1}><MoveDown className="h-3.5 w-3.5" /></Button>
                      <Button type="button" size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => { setEditingCard(card); setIsKpiModalOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button type="button" size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={() => deleteCard(card.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
             </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6">
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-2"><FileText className="h-4 w-4" /> Default Templates</h3>
                   <div className="space-y-4">
                      {["invoice", "po", "quotation"].map(type => (
                        <div key={type} className="space-y-1.5">
                           <Label className="text-[10px] font-black uppercase text-slate-400">Default {type.toUpperCase()}</Label>
                           <Select name={`defaultTemplate_${type}`} defaultValue={settings?.[`defaultTemplate_${type}`] || "warrior"}>
                              <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="warrior">Warrior Official</SelectItem>
                                 <SelectItem value="professional">Professional Classic</SelectItem>
                                 <SelectItem value="erppro">ERP Pro Gradient</SelectItem>
                                 <SelectItem value="modern">Modern Minimal</SelectItem>
                              </SelectContent>
                           </Select>
                        </div>
                      ))}
                   </div>
                </Card>

                <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6">
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Digital Seal & Signature</h3>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2 text-center">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Authorized Seal</Label>
                         <div className="h-24 w-full bg-slate-50 border-2 border-dashed rounded-xl relative group flex items-center justify-center">
                            {sealPreview ? <img src={sealPreview} className="h-20 object-contain" /> : <ImageIcon className="text-slate-200" />}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setSealPreview(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }} />
                         </div>
                      </div>
                      <div className="space-y-2 text-center">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Authorized Sign</Label>
                         <div className="h-24 w-full bg-slate-50 border-2 border-dashed rounded-xl relative group flex items-center justify-center">
                            {signPreview ? <img src={signPreview} className="h-20 object-contain" /> : <ImageIcon className="text-slate-200" />}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setSignPreview(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }} />
                         </div>
                      </div>
                   </div>
                </Card>

                <Card className="md:col-span-2 p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6">
                   <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">Standard Footnotes</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-slate-500">Document Terms & Conditions</Label>
                         <Textarea name="pdfTerms" defaultValue={settings?.pdfTerms} className="min-h-[150px] rounded-2xl text-[11px] font-medium" />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase text-slate-500">Footer Appreciation Message</Label>
                         <Input name="footerHeartMsg" defaultValue={settings?.footerHeartMsg} className="h-12 rounded-xl" />
                      </div>
                   </div>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="navigation" className="space-y-6">
            <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6">
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-700">Sidebar Menu Ordering</CardTitle>
                <CardDescription className="text-xs font-medium">Re-arrange the sequence of terminals in the main navigation sidebar.</CardDescription>
              </CardHeader>
              <div className="space-y-2 max-w-md">
                {menuOrder.map((key, idx) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                    <span className="text-[11px] font-black uppercase text-slate-600">{t(key as any)}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                        const nextOrder = [...menuOrder];
                        if (idx > 0) {
                          [nextOrder[idx], nextOrder[idx - 1]] = [nextOrder[idx - 1], nextOrder[idx]];
                          setMenuOrder(nextOrder);
                        }
                      }}><MoveUp className="h-3 w-3" /></Button>
                      <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                        const nextOrder = [...menuOrder];
                        if (idx < menuOrder.length - 1) {
                          [nextOrder[idx], nextOrder[idx + 1]] = [nextOrder[idx + 1], nextOrder[idx]];
                          setMenuOrder(nextOrder);
                        }
                      }}><MoveDown className="h-3 w-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-inner"><Clock className="h-6 w-6" /></div>
                    <div><h3 className="text-sm font-black uppercase text-slate-700">Session Lifecycle</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Automatic Security Termination</p></div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <Label className="text-[11px] font-black uppercase">Enable Auto Logout</Label>
                      <Switch name="autoLogoutEnabled" defaultChecked={settings?.autoLogoutEnabled} className="data-[state=checked]:bg-orange-500" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Timeout Duration (Minutes)</Label>
                      <Input name="sessionTimeout" type="number" defaultValue={settings?.sessionTimeout || 60} className="h-12 rounded-2xl" />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner"><ShieldCheck className="h-6 w-6" /></div>
                    <div><h3 className="text-sm font-black uppercase text-slate-700">Audit Guard</h3><p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">System-wide transparency</p></div>
                  </div>
                  <div className="p-5 rounded-[2rem] bg-blue-50/50 border border-blue-100">
                    <p className="text-[11px] font-medium leading-relaxed text-blue-700">Every configuration change is recorded in the immutable audit log for security verification and forensic analysis.</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </form>

      {/* KPI MODAL */}
      <Dialog open={isKpiModalOpen} onOpenChange={setIsKpiModalOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-white">
          <DialogHeader className="bg-blue-600 p-6 text-white flex-row items-center gap-4 space-y-0">
             <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md shrink-0"><Activity className="h-6 w-6" /></div>
             <div>
               <DialogTitle className="text-xl font-bold font-headline uppercase tracking-tight">{editingCard ? 'Edit KPI Card' : 'New Analytical Card'}</DialogTitle>
               <DialogDescription className="text-[10px] font-black uppercase opacity-70 tracking-widest mt-0.5">Configuration Matrix</DialogDescription>
             </div>
          </DialogHeader>

          <form onSubmit={handleSaveKpi} className="p-8 space-y-6">
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-500">Display Label</Label>
                   <Input name="title" defaultValue={editingCard?.title} required className="h-11 rounded-xl" placeholder="e.g. Total Sales" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-500">Data Source</Label>
                   <Select name="valueKey" defaultValue={editingCard?.valueKey || "totalSales"}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl shadow-2xl">
                         {DATA_SOURCES.map(ds => <SelectItem key={ds.value} value={ds.value} className="text-xs font-bold uppercase">{ds.label}</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-500">Icon Name (Lucide)</Label>
                   <Input name="iconName" defaultValue={editingCard?.iconName || "Activity"} className="h-11 rounded-xl font-mono text-xs" placeholder="ShoppingCart, Wallet, etc." />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-500">Icon Background Class</Label>
                   <Input name="colorClass" defaultValue={editingCard?.colorClass || "bg-blue-600"} className="h-11 rounded-xl font-mono text-xs" />
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-500">Card Background (HEX)</Label>
                   <div className="flex gap-2">
                      <Input type="color" name="bgColor" defaultValue={editingCard?.bgColor || "#FFFFFF"} className="w-12 h-11 p-1" />
                      <Input name="bgColor" defaultValue={editingCard?.bgColor || "#FFFFFF"} className="h-11 rounded-xl" />
                   </div>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-500">Card Size</Label>
                   <Select name="size" defaultValue={editingCard?.size || "md"}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="sm">Small</SelectItem><SelectItem value="md">Standard</SelectItem><SelectItem value="lg">Large</SelectItem></SelectContent>
                   </Select>
                </div>
                <div className="space-y-2">
                   <Label className="text-[10px] font-black uppercase text-slate-500">Card Shape</Label>
                   <Select name="shape" defaultValue={editingCard?.shape || "rounded-2xl"}>
                      <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                         <SelectItem value="rounded-lg">Modern Square</SelectItem>
                         <SelectItem value="rounded-2xl">Rounded</SelectItem>
                         <SelectItem value="rounded-[2.5rem]">Classic Pill</SelectItem>
                         <SelectItem value="rounded-full">Super Round</SelectItem>
                      </SelectContent>
                   </Select>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                   <Label className="text-[10px] font-black uppercase">Show Sparkline Graph?</Label>
                   <Switch name="showGraph" defaultChecked={editingCard?.showGraph} />
                </div>
             </div>
             <DialogFooter className="pt-6 border-t mt-4">
                <Button type="button" variant="ghost" className="rounded-full px-8 h-12 text-[10px] font-black uppercase" onClick={() => setIsKpiModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-full px-12 h-12 text-[10px] font-black uppercase shadow-xl shadow-blue-100">Apply Card</Button>
             </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
