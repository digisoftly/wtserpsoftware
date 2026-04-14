"use client"

import * as React from "react"
import { 
  User, 
  Mail, 
  Phone, 
  Languages, 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  Camera,
  Lock,
  Bell,
  Globe,
  ArrowLeft
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useDoc, useMemoFirebase, useUser } from "@/firebase"
import { doc, serverTimestamp, updateDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ProfilePage() {
  const { user } = useUser();
  const { companyId, language, setLanguage, userRole } = useTenant();
  const db = useFirestore();
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);

  const userRef = useMemoFirebase(() => {
    if (!db || !companyId || !user) return null;
    return doc(db, "companies", companyId, "users", user.uid);
  }, [db, companyId, user]);

  const { data: profile, isLoading } = useDoc(userRef);

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userRef) return;

    setIsSaving(true);
    const formData = new FormData(e.currentTarget);
    
    const updates = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      preferredLanguage: formData.get("preferredLanguage") as string,
      updatedAt: serverTimestamp(),
    };

    try {
      await updateDoc(userRef, updates);
      
      // Update local language state if changed
      if (updates.preferredLanguage !== language) {
        setLanguage(updates.preferredLanguage as any);
      }

      toast({ title: "Profile Updated", description: "Your personal details have been synchronized." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-headline text-slate-900">Personal Account</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your identity and preferences</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Avatar and Summary */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden text-center p-8 bg-gradient-to-b from-blue-50/50 to-white">
            <div className="relative inline-block group mb-6">
              <Avatar className="h-32 w-32 border-4 border-white shadow-2xl">
                <AvatarImage src={`https://picsum.photos/seed/${user?.uid}/200/200`} />
                <AvatarFallback className="text-3xl bg-blue-100 text-blue-600 font-bold uppercase">
                  {profile?.firstName?.[0]}{profile?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full h-10 w-10 shadow-lg border-2 border-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            <h2 className="text-2xl font-bold font-headline text-slate-900">
              {profile?.firstName} {profile?.lastName}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                {userRole?.name || "Standard User"}
              </span>
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold text-slate-400">Account ID</p>
                <p className="text-xs font-mono font-medium truncate">#{user?.uid.slice(0, 8)}</p>
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase font-bold text-slate-400">Last Active</p>
                <p className="text-xs font-medium">Just now</p>
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400">Quick Access</h3>
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl hover:bg-blue-50 text-blue-600" onClick={() => router.push('/support')}>
                <Bell className="h-4 w-4" /> My Notifications
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl" onClick={() => router.push('/crm')}>
                <User className="h-4 w-4" /> CRM Activity
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Settings Form */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="identity" className="w-full">
            <TabsList className="bg-muted/50 p-1 rounded-2xl mb-6 flex h-14">
              <TabsTrigger value="identity" className="rounded-xl flex-1 gap-2 h-full font-bold">
                <User className="h-4 w-4" /> Identity
              </TabsTrigger>
              <TabsTrigger value="preferences" className="rounded-xl flex-1 gap-2 h-full font-bold">
                <Languages className="h-4 w-4" /> Preferences
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-xl flex-1 gap-2 h-full font-bold">
                <Lock className="h-4 w-4" /> Security
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSaveProfile}>
              <TabsContent value="identity" className="space-y-6">
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                  <CardHeader className="border-b bg-muted/10">
                    <CardTitle className="text-lg">Profile Details</CardTitle>
                    <CardDescription>Update your personal information used for system communications.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">First Name</Label>
                        <Input name="firstName" defaultValue={profile?.firstName} required className="h-12 rounded-xl focus:ring-2 focus:ring-primary" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Last Name</Label>
                        <Input name="lastName" defaultValue={profile?.lastName} required className="h-12 rounded-xl" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address (Read-only)</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input value={user?.email || ""} disabled className="h-12 pl-11 rounded-xl bg-slate-50 border-slate-200" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input name="phoneNumber" defaultValue={profile?.phoneNumber} placeholder="+880 1xxx-xxxxxx" className="h-12 pl-11 rounded-xl" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="preferences" className="space-y-6">
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                  <CardHeader className="border-b bg-muted/10">
                    <CardTitle className="text-lg">System Experience</CardTitle>
                    <CardDescription>Tailor the ERP interface to your working style.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                            <Languages className="h-5 w-5" />
                          </div>
                          <div>
                            <Label className="text-sm font-bold">Display Language</Label>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">System Localization</p>
                          </div>
                        </div>
                        <Select name="preferredLanguage" defaultValue={profile?.preferredLanguage || "EN"}>
                          <SelectTrigger className="h-12 rounded-xl border-2 border-slate-100">
                            <SelectValue placeholder="Choose language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EN">English (United States)</SelectItem>
                            <SelectItem value="BN">বাংলা (বাংলাদেশ)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                            <Globe className="h-5 w-5" />
                          </div>
                          <div>
                            <Label className="text-sm font-bold">Timezone</Label>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Event Timestamps</p>
                          </div>
                        </div>
                        <Select defaultValue="GMT+6">
                          <SelectTrigger className="h-12 rounded-xl border-2 border-slate-100">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GMT+6">Dhaka, Bangladesh (GMT+6)</SelectItem>
                            <SelectItem value="GMT+0">London, UK (GMT+0)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                  <CardHeader className="border-b bg-muted/10">
                    <CardTitle className="text-lg">Security & Access</CardTitle>
                    <CardDescription>Protect your account with robust authentication rules.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="flex items-center justify-between p-6 bg-blue-50 rounded-2xl border-2 border-dashed border-blue-100">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shrink-0">
                          <Lock className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-blue-900">Credential Refresh</p>
                          <p className="text-xs text-blue-700 mt-1">Request a password change link to your registered email address.</p>
                        </div>
                      </div>
                      <Button type="button" variant="outline" className="rounded-full bg-white border-blue-200 text-blue-700 hover:bg-blue-100 font-bold">
                        Reset Password
                      </Button>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Account Policies</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/10 rounded-2xl flex items-center justify-between">
                          <span className="text-sm font-medium">Session Timeout</span>
                          <span className="text-xs font-bold text-slate-500">60 Minutes</span>
                        </div>
                        <div className="p-4 bg-muted/10 rounded-2xl flex items-center justify-between">
                          <span className="text-sm font-medium">Multi-Factor Auth</span>
                          <span className="text-xs font-bold text-red-500 uppercase">Disabled</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Fixed Save Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-4 mt-8">
                <Button type="button" variant="ghost" className="rounded-full px-8 h-12 font-bold" onClick={() => router.push('/')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto bg-primary hover:bg-primary/90 rounded-full px-12 h-14 font-bold shadow-xl shadow-blue-100 gap-2">
                  {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                  Synchronize Profile
                </Button>
              </div>
            </form>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
