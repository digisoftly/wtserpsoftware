
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, UserPlus, Lock, Mail, Shield, User, Building, ShieldCheck, Camera, Phone, MapPin, Calendar } from "lucide-react"
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
      toast({ variant: "destructive", title: t('error'), description: "Passwords do not match." });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 1. Provision Firebase Auth Account via Secondary Instance
      const secondaryAppName = `provisioner-${Date.now()}`;
      const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const newUid = userCredential.user.uid;
      await signOut(secondaryAuth); // Cleanup

      // 2. Provision Firestore Document
      const userData = {
        id: newUid,
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        fullName: `${formData.get("firstName")} ${formData.get("lastName")}`,
        employeeId: formData.get("employeeId") as string,
        email: email,
        phoneNumber: formData.get("phoneNumber") as string,
        dob: formData.get("dob") as string,
        gender: formData.get("gender") as string,
        address: formData.get("address") as string,
        department: formData.get("department") as string,
        designation: formData.get("designation") as string,
        joiningDate: formData.get("joiningDate") as string,
        employeeType: formData.get("employeeType") as string,
        reportingManager: formData.get("reportingManager") as string,
        roleId: formData.get("roleId") || "default-user",
        branchId: formData.get("branchId") as string,
        allowedBranches: [formData.get("branchId") as string],
        status: "active",
        forcePasswordChange: formData.get("forcePasswordChange") === "on",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentAdminRole?.id || "system"
      };

      await setDoc(doc(db, "companies", companyId, "users", newUid), userData);

      // 3. Log Audit
      await AuditService.logAction(db, companyId, {
        userId: currentAdminRole?.id || "admin",
        userName: currentAdminRole?.name || "Admin",
        action: 'CREATE',
        module: 'users',
        recordId: newUid,
        details: `Provisioned identity for ${userData.fullName} (${email}) with role ${userData.roleId}`
      });

      toast({ title: t('success'), description: "User terminal provisioned successfully." });
      router.push("/users");
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
             <h1 className="text-xl font-black font-headline text-slate-900 uppercase tracking-tight">{t('addUser')}</h1>
             <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Enterprise Identity Provisioning</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase" onClick={() => router.back()}>Cancel</Button>
           <Button type="submit" form="user-provision-form" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 rounded-full px-10 h-11 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 gap-2">
             {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
             Provision Identity
           </Button>
        </div>
      </div>

      <form id="user-provision-form" onSubmit={handleSaveUser}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white border p-1 rounded-xl shadow-sm mb-6 flex h-14 ring-1 ring-slate-100">
            <TabsTrigger value="personal" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-black data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
              <User className="h-4 w-4" /> {t('personalInfo')}
            </TabsTrigger>
            <TabsTrigger value="company" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-black data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
              <Building className="h-4 w-4" /> {t('companyInfo')}
            </TabsTrigger>
            <TabsTrigger value="account" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-black data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
              <ShieldCheck className="h-4 w-4" /> {t('accountInfo')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            <Card className="p-8 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">First Name</Label><Input name="firstName" required className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Last Name</Label><Input name="lastName" required className="h-11 rounded-xl" /></div>
                  </div>
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Mobile Number</Label><Input name="phoneNumber" required className="h-11 rounded-xl" placeholder="+880..." /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Date of Birth</Label><Input name="dob" type="date" className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Gender</Label>
                      <Select name="gender" defaultValue="male">
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                   <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Address</Label><textarea name="address" className="w-full min-h-[120px] rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 p-4 text-xs font-medium" /></div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-6">
            <Card className="p-8 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Employee ID</Label><Input name="employeeId" required className="h-11 rounded-xl font-mono uppercase" placeholder="WTS-001" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Department</Label><Input name="department" required className="h-11 rounded-xl" placeholder="e.g. Sales" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Designation</Label><Input name="designation" required className="h-11 rounded-xl" placeholder="e.g. Manager" /></div>
                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Joining Date</Label><Input name="joiningDate" type="date" className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Employee Type</Label>
                  <Select name="employeeType" defaultValue="full-time">
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="full-time">Full Time</SelectItem><SelectItem value="part-time">Part Time</SelectItem><SelectItem value="contract">Contract</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-500">Branch</Label>
                  <Select name="branchId" required>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                    <SelectContent>{branches?.map(b => <SelectItem key={b.id} value={b.id}>{b.branchName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <Card className="p-8 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Login Email</Label><Input name="email" type="email" required className="h-11 rounded-xl font-bold" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Password</Label><Input name="password" type="password" required className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500">Confirm Password</Label><Input name="confirmPassword" type="password" required className="h-11 rounded-xl" /></div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Assigned Role</Label>
                    <Select name="roleId">
                      <SelectTrigger className="h-11 rounded-xl font-bold uppercase"><SelectValue placeholder="Default User" /></SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {roles?.map(r => <SelectItem key={r.id} value={r.id} className="text-xs font-black uppercase">{r.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                     <div>
                       <Label className="text-xs font-black uppercase text-slate-900">Security Requirement</Label>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">User must reset password on first login</p>
                     </div>
                     <input type="checkbox" name="forcePasswordChange" className="h-5 w-5 accent-blue-600" />
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
