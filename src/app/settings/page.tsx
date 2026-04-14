
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
  MessageSquare
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

export default function SettingsPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const [isSaving, setIsSaving] = React.useState(false);

  const settingsRef = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return doc(db, "companies", companyId, "system", "config");
  }, [db, companyId]);

  const { data: settings, isLoading } = useDoc(settingsRef);

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settingsRef) return;

    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    // Map all form entries to a settings object
    const updates: Record<string, any> = {
      updatedAt: serverTimestamp(),
    };

    formData.forEach((value, key) => {
      // Handle numeric values
      if (key.includes('Rate') || key.includes('Level') || key.includes('Days') || key.includes('Limit')) {
        updates[key] = Number(value);
      } else {
        updates[key] = value;
      }
    });

    // Handle switches manually as they don't appear in FormData if unchecked
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
      toast({ title: "Configuration Synchronized", description: "Global ERP settings updated successfully." });
    } catch (err) {
      toast({ variant: "destructive", title: "Sync Failed", description: "Could not save system configurations." });
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
              <Settings2 className="h-8 w-8" /> Control Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Configure global business rules and system architecture</p>
          </div>
          <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary/90 rounded-full px-8 gap-2 w-full sm:w-auto h-12 font-bold shadow-lg">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Save System State
          </Button>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-white border rounded-xl p-1 mb-6 shadow-sm flex overflow-x-auto h-auto no-scrollbar">
            <TabsTrigger value="general" className="rounded-lg gap-2 flex-1 min-w-[120px] py-2">
              <Building2 className="h-4 w-4" /> General
            </TabsTrigger>
            <TabsTrigger value="business" className="rounded-lg gap-2 flex-1 min-w-[120px] py-2">
              <Warehouse className="h-4 w-4" /> Rules
            </TabsTrigger>
            <TabsTrigger value="billing" className="rounded-lg gap-2 flex-1 min-w-[120px] py-2">
              <Percent className="h-4 w-4" /> Billing
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg gap-2 flex-1 min-w-[120px] py-2">
              <BellRing className="h-4 w-4" /> Alerts
            </TabsTrigger>
            <TabsTrigger value="integrations" className="rounded-lg gap-2 flex-1 min-w-[120px] py-2">
              <Share2 className="h-4 w-4" /> API
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg gap-2 flex-1 min-w-[120px] py-2">
              <Lock className="h-4 w-4" /> Security
            </TabsTrigger>
            <TabsTrigger value="backup" className="rounded-lg gap-2 flex-1 min-w-[120px] py-2">
              <Database className="h-4 w-4" /> Backup
            </TabsTrigger>
          </TabsList>

          {/* GENERAL SETTINGS */}
          <TabsContent value="general" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-none shadow-sm rounded-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-headline">Corporate Identity</CardTitle>
                  <CardDescription>Primary profile for legal documents and headers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-xs">Legal Entity Name</Label><Input name="companyName" defaultValue={settings?.companyName || "Warrior Tech System"} /></div>
                    <div className="space-y-2"><Label className="text-xs">VAT / Reg Number</Label><Input name="regNumber" defaultValue={settings?.regNumber} /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-xs">Support Email</Label><Input name="email" type="email" defaultValue={settings?.email} /></div>
                    <div className="space-y-2"><Label className="text-xs">Primary Phone</Label><Input name="phone" defaultValue={settings?.phone} /></div>
                  </div>
                  <div className="space-y-2"><Label className="text-xs">Headquarters Address</Label><Input name="address" defaultValue={settings?.address} /></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Primary Currency</Label>
                      <Select name="currency" defaultValue={settings?.currency || "BDT"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="BDT">Bangladeshi Taka (৳)</SelectItem><SelectItem value="USD">US Dollar ($)</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Regional Timezone</Label>
                      <Select name="timezone" defaultValue={settings?.timezone || "GMT+6"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="GMT+6">Dhaka (GMT+6)</SelectItem><SelectItem value="GMT+0">London (GMT+0)</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm rounded-xl flex flex-col items-center justify-center p-6 text-center bg-muted/10">
                <div className="w-32 h-32 rounded-3xl bg-primary flex items-center justify-center text-white text-5xl font-bold shadow-xl mb-6">W</div>
                <Button variant="outline" className="rounded-full">Upload Branding</Button>
                <p className="text-[10px] text-muted-foreground mt-4">Transparent PNG, 512x512 recommended</p>
              </Card>
            </div>
          </TabsContent>

          {/* BUSINESS RULES */}
          <TabsContent value="business" className="space-y-6">
            <Card className="border-none shadow-sm rounded-xl">
              <CardHeader>
                <CardTitle className="text-lg font-headline">Operational Logic</CardTitle>
                <CardDescription>Configure how the system handles stock and inventory</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-background border rounded-xl">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold">Auto Stock Synchronization</Label>
                        <p className="text-[10px] text-muted-foreground">Adjust levels automatically on Sales & Purchases</p>
                      </div>
                      <Switch id="autoStockUpdate" defaultChecked={settings?.autoStockUpdate} />
                    </div>
                    <div className="flex items-center justify-between p-4 bg-background border rounded-xl">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold">Allow Negative Stock</Label>
                        <p className="text-[10px] text-muted-foreground">Force process sales even if stock is zero</p>
                      </div>
                      <Switch id="allowNegativeStock" defaultChecked={settings?.allowNegativeStock} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Critical Low Stock Level</Label>
                      <Input name="lowStockLevel" type="number" defaultValue={settings?.lowStockLevel || 5} className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Default Discount Strategy</Label>
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

          {/* BILLING SETTINGS */}
          <TabsContent value="billing" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm rounded-xl">
                <CardHeader><CardTitle className="text-lg font-headline">Taxation & Prefixes</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Standard VAT / Tax Rate (%)</Label>
                    <Input name="taxRate" type="number" defaultValue={settings?.taxRate || 15} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-xs">Invoice Prefix</Label><Input name="invoicePrefix" defaultValue={settings?.invoicePrefix || "INV"} /></div>
                    <div className="space-y-2"><Label className="text-xs">Quotation Prefix</Label><Input name="quotePrefix" defaultValue={settings?.quotePrefix || "QT"} /></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm rounded-xl">
                <CardHeader><CardTitle className="text-lg font-headline">Recovery Rules</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-background border rounded-xl">
                    <div className="space-y-0.5"><Label className="text-sm font-bold">Enable Partial Payments</Label></div>
                    <Switch id="enablePartialPayment" defaultChecked={settings?.enablePartialPayment} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Late Fee Surcharge (%)</Label>
                    <Input name="lateFeeRate" type="number" defaultValue={settings?.lateFeeRate || 0} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* NOTIFICATION SETTINGS */}
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
                
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b pb-2">Automation Triggers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Auto-alert on Invoice Generation</span>
                      <Switch id="triggerInvoiceGen" defaultChecked={settings?.triggerInvoiceGen} />
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm">Confirm Receipt on Payment</span>
                      <Switch id="triggerPaymentRec" defaultChecked={settings?.triggerPaymentRec} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* INTEGRATIONS */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-sm rounded-xl">
                <CardHeader><CardTitle className="text-lg font-headline flex items-center gap-2 text-green-600"><Share2 className="h-5 w-5" /> WhatsApp Gateway</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label className="text-xs">Instance ID</Label><Input name="waInstanceId" defaultValue={settings?.waInstanceId} /></div>
                  <div className="space-y-2"><Label className="text-xs">API Secret Token</Label><Input name="waToken" type="password" defaultValue={settings?.waToken} /></div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm rounded-xl">
                <CardHeader><CardTitle className="text-lg font-headline flex items-center gap-2 text-blue-600"><Mail className="h-5 w-5" /> SMTP (Email Server)</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2"><Label className="text-xs">Host</Label><Input name="smtpHost" defaultValue={settings?.smtpHost || "smtp.gmail.com"} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-xs">Port</Label><Input name="smtpPort" defaultValue={settings?.smtpPort || "587"} /></div>
                    <div className="space-y-2"><Label className="text-xs">Encryption</Label><Input name="smtpEnc" defaultValue={settings?.smtpEnc || "TLS"} /></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SECURITY SETTINGS */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-none shadow-sm rounded-xl">
              <CardHeader><CardTitle className="text-lg font-headline">Access Policy</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-background border rounded-xl">
                      <div className="space-y-0.5"><Label className="text-sm font-bold">Two-Factor Authentication (2FA)</Label><p className="text-[10px] text-muted-foreground">Require OTP via email/app</p></div>
                      <Switch id="enable2FA" defaultChecked={settings?.enable2FA} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Session Timeout (Minutes)</Label>
                      <Input name="sessionTimeout" type="number" defaultValue={settings?.sessionTimeout || 60} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label className="text-xs">Min Password Length</Label><Input name="minPassLen" type="number" defaultValue={settings?.minPassLen || 8} /></div>
                    <div className="space-y-2"><Label className="text-xs">Failed Login Limit</Label><Input name="loginLimit" type="number" defaultValue={settings?.loginLimit || 5} /></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BACKUP SETTINGS */}
          <TabsContent value="backup" className="space-y-6">
            <Card className="border-none shadow-sm rounded-xl">
              <CardHeader><CardTitle className="text-lg font-headline">Data Recovery</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Automatic Backup Cycle</Label>
                      <Select name="backupCycle" defaultValue={settings?.backupCycle || "daily"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="daily">Every 24 Hours</SelectItem><SelectItem value="weekly">Once a Week</SelectItem><SelectItem value="monthly">Once a Month</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Cloud Storage Provider</Label>
                      <Select name="storageProvider" defaultValue={settings?.storageProvider || "firebase"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="firebase">Firebase Storage (Native)</SelectItem><SelectItem value="aws">Amazon S3</SelectItem><SelectItem value="gdrive">Google Drive</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex-1 p-6 bg-muted/20 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center">
                    <Database className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm font-bold">Manual Archive</p>
                    <p className="text-[10px] text-muted-foreground mb-4">Download a full JSON snapshot of your instance</p>
                    <Button type="button" variant="outline" className="rounded-full w-full">Generate Snapshot</Button>
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
