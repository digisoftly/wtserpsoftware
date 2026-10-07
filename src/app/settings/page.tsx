"use client"

import * as React from "react"
import { 
  Settings2,
  Loader2,
  ImageIcon,
  Save,
  Table as TableIcon,
  Ruler,
  Paintbrush,
  Layout,
  Type,
  AlignLeft,
  AlignCenter,
  Palette,
  Building2,
  User,
  CreditCard,
  FileText,
  AlignRight
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
    if (settings) {
      setLogoPreview(settings.companyLogo || null);
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

  const renderSectionHeader = (title: string, icon: any, color: string) => (
    <div className="flex items-center gap-3 border-b pb-4 mb-6">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-inner", color)}>
        {React.createElement(icon, { className: "h-5 w-5" })}
      </div>
      <div>
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">{title}</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase">Visual Identity Controls</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
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
            <TabsTrigger value="pdf_header" className="rounded-lg flex-1 min-w-[150px] py-3 text-[10px] font-black uppercase text-blue-600">Header Lab</TabsTrigger>
            <TabsTrigger value="pdf_customer" className="rounded-lg flex-1 min-w-[150px] py-3 text-[10px] font-black uppercase text-purple-600">Customer Lab</TabsTrigger>
            <TabsTrigger value="pdf_table" className="rounded-lg flex-1 min-w-[150px] py-3 text-[10px] font-black uppercase text-orange-600">Table Lab</TabsTrigger>
            <TabsTrigger value="pdf_footer" className="rounded-lg flex-1 min-w-[150px] py-3 text-[10px] font-black uppercase text-teal-600">Footer Lab</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm rounded-2xl flex flex-col items-center justify-center p-6 text-center bg-white ring-1 ring-slate-100">
                <Label className="text-[10px] font-black uppercase text-slate-400 mb-4 tracking-widest">Company Logo</Label>
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
                <p className="text-[9px] text-muted-foreground uppercase font-bold">Standard SVG/PNG recommended</p>
              </Card>

              <Card className="md:col-span-2 border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 p-8 space-y-6">
                 {renderSectionHeader("Organization Identity", Building2, "bg-blue-50 text-blue-600")}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Legal Name</Label><Input name="companyName" defaultValue={settings?.companyName} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Official Slogan</Label><Input name="companySlogan" defaultValue={settings?.companySlogan} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Primary Contact</Label><Input name="phone" defaultValue={settings?.phone} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Email Address</Label><Input name="email" defaultValue={settings?.email} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Website</Label><Input name="website" defaultValue={settings?.website} className="h-11 rounded-xl" /></div>
                    <div className="md:col-span-2 space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Full Address</Label><Textarea name="address" defaultValue={settings?.address} className="rounded-xl min-h-[80px]" /></div>
                 </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pdf_header" className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white ring-1 ring-slate-100">
                   {renderSectionHeader("Logo & Positioning", Layout, "bg-blue-50 text-blue-600")}
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Header Style</Label>
                         <Select name="pdf_header_align" defaultValue={settings?.pdf_header_align || "left"}>
                            <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                               <SelectItem value="left" className="text-xs font-bold uppercase">LOGO LEFT (SPLIT)</SelectItem>
                               <SelectItem value="center" className="text-xs font-bold uppercase">CENTERED (STACKED)</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Logo Size (px)</Label><Input type="number" name="pdf_header_logo_size" defaultValue={settings?.pdf_header_logo_size || 80} className="h-10 rounded-xl" /></div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Logo-Text Gap (mm)</Label><Input type="number" name="pdf_header_content_gap" defaultValue={settings?.pdf_header_content_gap || 6} className="h-10 rounded-xl" /></div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Top Margin (mm)</Label><Input type="number" name="pdf_header_top_gap" defaultValue={settings?.pdf_header_top_gap || 5} className="h-10 rounded-xl" /></div>
                   </div>
                </Card>

                <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white ring-1 ring-slate-100">
                   {renderSectionHeader("Header Typography", Type, "bg-purple-50 text-purple-600")}
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Title Color</Label>
                         <Input name="pdf_header_title_color" defaultValue={settings?.pdf_header_title_color || "#0056B3"} className="h-10 rounded-xl font-mono" />
                      </div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Title Size (px)</Label><Input type="number" name="pdf_header_title_size" defaultValue={settings?.pdf_header_title_size || 32} className="h-10 rounded-xl" /></div>
                      <div className="space-y-1.5">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Slogan Color</Label>
                         <Input name="pdf_header_slogan_color" defaultValue={settings?.pdf_header_slogan_color || "#F57C00"} className="h-10 rounded-xl font-mono" />
                      </div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Slogan Size (px)</Label><Input type="number" name="pdf_header_slogan_size" defaultValue={settings?.pdf_header_slogan_size || 12} className="h-10 rounded-xl" /></div>
                      <div className="space-y-1.5">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Contact Color</Label>
                         <Input name="pdf_header_contact_color" defaultValue={settings?.pdf_header_contact_color || "#333333"} className="h-10 rounded-xl font-mono" />
                      </div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Contact Size (px)</Label><Input type="number" name="pdf_header_contact_size" defaultValue={settings?.pdf_header_contact_size || 9.5} className="h-10 rounded-xl" /></div>
                   </div>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="pdf_customer" className="space-y-6">
             <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white ring-1 ring-slate-100 max-w-3xl mx-auto">
                {renderSectionHeader("Customer Section Lab", User, "bg-indigo-50 text-indigo-600")}
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <div className="space-y-1.5">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Client Name Color</Label>
                         <Input name="pdf_cust_name_color" defaultValue={settings?.pdf_cust_name_color || "#0F172A"} className="h-10 rounded-xl font-mono" />
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Client Name Size (px)</Label>
                         <Input type="number" name="pdf_cust_name_size" defaultValue={settings?.pdf_cust_name_size || 14} className="h-10 rounded-xl" />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <div className="space-y-1.5">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Detail Text Color</Label>
                         <Input name="pdf_cust_info_color" defaultValue={settings?.pdf_cust_info_color || "#475569"} className="h-10 rounded-xl font-mono" />
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Detail Text Size (px)</Label>
                         <Input type="number" name="pdf_cust_info_size" defaultValue={settings?.pdf_cust_info_size || 9.5} className="h-10 rounded-xl" />
                      </div>
                   </div>
                </div>
             </Card>
          </TabsContent>

          <TabsContent value="pdf_table" className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white ring-1 ring-slate-100">
                   {renderSectionHeader("Table & Grid Lab", TableIcon, "bg-orange-50 text-orange-600")}
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Header BG Color</Label>
                         <Input name="pdf_table_header_bg" defaultValue={settings?.pdf_table_header_bg || "#F57C00"} className="h-10 rounded-xl font-mono" />
                      </div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Row Font Size (pt)</Label><Input type="number" step="0.5" name="pdf_table_row_size" defaultValue={settings?.pdf_table_row_size || 10.5} className="h-10 rounded-xl" /></div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Row Height (mm)</Label><Input type="number" name="pdf_table_row_height" defaultValue={settings?.pdf_table_row_height || 7} className="h-10 rounded-xl" /></div>
                      <div className="space-y-1.5">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Border Color</Label>
                         <Input name="pdf_table_border_color" defaultValue={settings?.pdf_table_border_color || "#000000"} className="h-10 rounded-xl font-mono" />
                      </div>
                   </div>
                </Card>

                <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white ring-1 ring-slate-100">
                   {renderSectionHeader("Terms & Compliance", Ruler, "bg-indigo-50 text-indigo-600")}
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5 md:col-span-2"><Label className="text-[10px] font-black uppercase text-slate-400">Section Label</Label><Input name="pdf_terms_title" defaultValue={settings?.pdf_terms_title || "Terms & Conditions"} className="h-10 rounded-xl" /></div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Label Color</Label><Input name="pdf_terms_title_color" defaultValue={settings?.pdf_terms_title_color || "#94A3B8"} className="h-10 rounded-xl font-mono" /></div>
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Top Gap (mm)</Label><Input type="number" name="pdf_terms_top_gap" defaultValue={settings?.pdf_terms_top_gap || 8} className="h-10 rounded-xl" /></div>
                      <div className="md:col-span-2 space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Default Terms</Label><Textarea name="pdfTerms" defaultValue={settings?.pdfTerms} className="rounded-xl min-h-[100px] text-xs font-bold" /></div>
                   </div>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="pdf_footer" className="space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white ring-1 ring-slate-100">
                   {renderSectionHeader("Signature & Seal", CreditCard, "bg-teal-50 text-teal-600")}
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Top Gap (mm)</Label><Input type="number" name="pdf_signature_top_gap" defaultValue={settings?.pdf_signature_top_gap || 20} className="h-10 rounded-xl" /></div>
                      <div className="space-y-1.5">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Align Authority</Label>
                         <Select name="pdf_sig_align" defaultValue={settings?.pdf_sig_align || "center"}>
                            <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                               <SelectItem value="left" className="text-xs font-bold uppercase">LEFT</SelectItem>
                               <SelectItem value="center" className="text-xs font-bold uppercase">CENTER</SelectItem>
                               <SelectItem value="right" className="text-xs font-bold uppercase">RIGHT</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                   </div>
                </Card>

                <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white ring-1 ring-slate-100">
                   {renderSectionHeader("Brand Footer", Paintbrush, "bg-pink-50 text-pink-600")}
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Accent Line Color</Label>
                         <Input name="pdf_footer_accent" defaultValue={settings?.pdf_footer_accent || "#F57C00"} className="h-10 rounded-xl font-mono" />
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Brand Text Color</Label>
                         <Input name="pdf_footer_text_color" defaultValue={settings?.pdf_footer_text_color || "#0F172A"} className="h-10 rounded-xl font-mono" />
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Brand Font Size (pt)</Label>
                         <Input type="number" name="pdf_footer_brand_size" defaultValue={settings?.pdf_footer_brand_size || 22} className="h-10 rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                         <Label className="text-[10px] font-black uppercase text-slate-400">Thank You Text</Label>
                         <Input name="footerHeartMsg" defaultValue={settings?.footerHeartMsg || "Thank You For Your Business"} className="h-10 rounded-xl" />
                      </div>
                   </div>
                </Card>
             </div>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
