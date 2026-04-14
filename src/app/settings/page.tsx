
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
  CheckCircle2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { setDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { toast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const [isSaving, setIsSaving] = React.useState(false);

  const companyRef = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return doc(db, "companies", companyId);
  }, [db, companyId]);

  const { data: company, isLoading } = useDoc(companyRef);

  const handleSaveSettings = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!companyRef) return;

    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const updates = {
      name: formData.get("companyName"),
      emailAddress: formData.get("email"),
      phoneNumber: formData.get("phone"),
      streetAddress: formData.get("address"),
      updatedAt: serverTimestamp(),
    };

    try {
      setDocumentNonBlocking(companyRef, updates, { merge: true });
      toast({ title: "Settings Updated", description: "Company profile has been saved successfully." });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed", description: "Could not save settings." });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <form onSubmit={handleSaveSettings}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-headline text-primary">System Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Configure company profile and system preferences</p>
          </div>
          <Button type="submit" disabled={isSaving} className="bg-primary hover:bg-primary/90 rounded-full px-6 gap-2 w-full sm:w-auto">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-white border rounded-xl p-1 mb-6 shadow-sm flex overflow-x-auto h-auto">
            <TabsTrigger value="profile" className="rounded-lg gap-2 flex-1 shrink-0">
              <Building2 className="h-4 w-4" /> <span className="hidden md:inline">Profile</span><span className="md:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="rounded-lg gap-2 flex-1 shrink-0">
              <Palette className="h-4 w-4" /> <span className="hidden md:inline">Appearance</span><span className="md:hidden">UI</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="rounded-lg gap-2 flex-1 shrink-0">
              <CreditCard className="h-4 w-4" /> <span className="hidden md:inline">Billing</span><span className="md:hidden">Plan</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-none shadow-sm rounded-xl">
                <CardHeader>
                  <CardTitle className="font-headline text-lg md:text-xl">Basic Information</CardTitle>
                  <CardDescription className="text-xs">Primary details for invoices and documents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-xs">Company Name</Label>
                      <Input id="companyName" name="companyName" defaultValue={company?.name || "Warrior Tech System"} className="text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="regNumber" className="text-xs">Registration Number</Label>
                      <Input id="regNumber" name="regNumber" defaultValue="WTS-BD-2023-9981" className="text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs">Public Email</Label>
                      <Input id="email" name="email" type="email" defaultValue={company?.emailAddress || "support@warriortech.com"} className="text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs">Phone Number</Label>
                      <Input id="phone" name="phone" defaultValue={company?.phoneNumber || "+880 1711-000000"} className="text-sm" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-xs">Headquarters Address</Label>
                    <Input id="address" name="address" defaultValue={company?.streetAddress || "GP.Ja-66/2, Gojonabi Road, Mohakhali, Dhaka"} className="text-sm" />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-none shadow-sm rounded-xl">
                  <CardHeader>
                    <CardTitle className="font-headline text-lg">Identity</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-2xl bg-primary flex items-center justify-center text-white text-4xl font-headline font-bold shadow-lg mb-4">
                      W
                    </div>
                    <Button type="button" variant="outline" size="sm" className="rounded-full text-xs">Change Logo</Button>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm rounded-xl bg-primary text-primary-foreground">
                  <CardHeader>
                    <CardTitle className="font-headline text-base">Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs">Bilingual Support</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs">Auto Stock Sync</span>
                      <Switch defaultChecked />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subscription">
            <Card className="border-none shadow-sm rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-accent p-6 md:p-8 text-white">
                <h3 className="text-xl md:text-2xl font-headline font-bold">Premium Enterprise Plan</h3>
                <p className="opacity-80 text-sm mt-1">Active until Dec 31, 2024</p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-bold">$199</span>
                  <span className="opacity-80 text-sm">/ month</span>
                </div>
              </div>
              <CardContent className="p-6 md:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                  <div className="p-4 bg-background rounded-xl border border-dashed text-center">
                    <p className="text-muted-foreground text-[10px] uppercase font-semibold mb-1">Branches</p>
                    <p className="text-xl md:text-2xl font-headline font-bold">Unlimited</p>
                  </div>
                  <div className="p-4 bg-background rounded-xl border border-dashed text-center">
                    <p className="text-muted-foreground text-[10px] uppercase font-semibold mb-1">User Seats</p>
                    <p className="text-xl md:text-2xl font-headline font-bold">50 / 100</p>
                  </div>
                  <div className="p-4 bg-background rounded-xl border border-dashed text-center">
                    <p className="text-muted-foreground text-[10px] uppercase font-semibold mb-1">Storage</p>
                    <p className="text-xl md:text-2xl font-headline font-bold">500 GB</p>
                  </div>
                </div>
                
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <Button type="button" variant="outline" className="rounded-full px-8 w-full sm:w-auto">Manage Billing</Button>
                  <Button type="button" className="bg-primary rounded-full px-8 w-full sm:w-auto">Upgrade Plan</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}
