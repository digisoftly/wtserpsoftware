
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, UserPlus, Lock, Mail, Shield, User, Building, ShieldCheck, Camera, Phone, MapPin, Calendar, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { firebaseConfig } from "@/firebase/config"
import { initializeApp } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { collection, serverTimestamp, doc, setDoc, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { AuditService } from "@/lib/audit-service"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function NewUserPage() {
  const router = useRouter();
  const { companyId, userRole: currentAdminRole } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("personal");

  const rolesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "roles"), orderBy("name"));
  }, [db, companyId]);
  const { data: roles } = useCollection(rolesQuery);

  const branchesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "branches"), orderBy("branchName"));
  }, [db, companyId]);
  const { data: branches } = useCollection(branchesQuery);

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId) return;
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. Provision Firebase Auth Account via Secondary Instance (Prevents logging out admin)
      const secondaryAppName = `provisioner-${Date.now()}`;
      const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const newUid = userCredential.user.uid;
      await signOut(secondaryAuth); 

      // 2. Provision Firestore Document with Full Identity Schema
      const userData = {
        id: newUid,
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        fullName: `${formData.get("firstName")} ${formData.get("lastName")}`,
        employeeId: formData.get("employeeId") as string || `WTS-UID-${newUid.slice(-4).toUpperCase()}`,
        email: email,
        phoneNumber: formData.get("phoneNumber") as string || "",
        designation: formData.get("designation") as string || "Staff",
        department: formData.get("department") as string || "General",
        roleId: formData.get("roleId") || "default-user",
        branchId: formData.get("branchId") || "dhaka-main",
        allowedBranches: [formData.get("branchId") || "dhaka-main"],
        status: "active",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentAdminRole?.id || "system"
      };

      await setDoc(doc(db, "companies", companyId, "users", newUid), userData);

      // 3. Log Immutable Audit
      await AuditService.logAction(db, companyId, {
        userId: currentAdminRole?.id || "admin",
        userName: currentAdminRole?.name || "Admin",
        action: 'CREATE',
        module: 'users',
        recordId: newUid,
        details: `Identity Created: ${userData.fullName} (${email}). Assigned Role: ${userData.roleId}`
      });

      toast({ title: "User Created", description: "Login credentials and profile successfully synchronized." });
      router.push("/users");
    } catch (err: any) {
      toast({ variant: "destructive", title: "System Error", description: err.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between border-b pb-4 bg-white/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
             <h1 className="text-xl font-black font-headline text-slate-900 uppercase tracking-tight">Provision New Identity</h1>
             <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mt-1">Terminal Auth & Profile Setup</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button type="submit" form="user-provision-form" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 rounded-full px-10 h-11 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 gap-2">
             {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
             Finalize Identity
           </Button>
        </div>
      </div>

      <form id="user-provision-form" onSubmit={handleSaveUser}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border p-1 rounded-2xl shadow-sm mb-8 flex h-14 ring-1 ring-slate-100">
            <TabsTrigger value="personal" className="rounded-xl gap-2 flex-1 text-[10px] font-black uppercase data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
              <User className="h-4 w-4" /> 1. Personal Details
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-xl gap-2 flex-1 text-[100px] uppercase font-black data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
              <KeyRound className="h-4 w-4" /> 2. Auth & Access
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">First Name *</Label><Input name="firstName" required className="h-11 rounded-xl" /></div>
                       <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Last Name *</Label><Input name="lastName" required className="h-11 rounded-xl" /></div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Mobile / WhatsApp</Label><Input name="phoneNumber" className="h-11 rounded-xl" placeholder="+880..." /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Official Designation</Label><Input name="designation" className="h-11 rounded-xl" placeholder="e.g. Sales Executive" /></div>
                 </div>
                 <div className="space-y-6">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Employee ID</Label><Input name="employeeId" className="h-11 rounded-xl font-mono uppercase" placeholder="WTS-001" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Department</Label><Input name="department" className="h-11 rounded-xl" placeholder="e.g. Support" /></div>
                 </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card className="p-8 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                   <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                      <div className="flex items-center gap-3 text-blue-600 mb-2">
                        <Mail className="h-5 w-5" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Auth Identity</h3>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase">Login Email Address *</Label>
                        <Input name="email" type="email" required className="h-11 rounded-xl bg-white" placeholder="user@warrior.com" />
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                         <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Password *</Label><Input name="password" type="password" required className="h-11 rounded-xl bg-white" /></div>
                         <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Confirm *</Label><Input name="confirmPassword" type="password" required className="h-11 rounded-xl bg-white" /></div>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="bg-slate-50 p-6 rounded-3xl space-y-6">
                      <div className="flex items-center gap-3 text-purple-600 mb-2">
                        <ShieldCheck className="h-5 w-5" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Authority Level</h3>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase">System Role</Label>
                        <Select name="roleId" defaultValue="default-user">
                          <SelectTrigger className="h-11 rounded-xl bg-white font-bold uppercase"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl shadow-2xl">
                             {roles?.map(r => <SelectItem key={r.id} value={r.id} className="text-xs font-black uppercase">{r.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-black uppercase">Primary Branch</Label>
                        <Select name="branchId" defaultValue="dhaka-main">
                          <SelectTrigger className="h-11 rounded-xl bg-white font-bold uppercase"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl shadow-2xl">
                             {branches?.map(b => <SelectItem key={b.id} value={b.id} className="text-xs font-bold uppercase">{b.branchName}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                   </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
