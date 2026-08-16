
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, UserPlus, Lock, Mail, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore } from "@/firebase"
import { firebaseConfig } from "@/firebase/config"
import { initializeApp, getApp, getApps } from "firebase/app"
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth"
import { collection, serverTimestamp, doc, setDoc, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { useCollection, useMemoFirebase } from "@/firebase"
import { toast } from "@/hooks/use-toast"
import { AuditService } from "@/lib/audit-service"

export default function NewUserPage() {
  const router = useRouter();
  const { companyId, userRole: currentAdminRole } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
      // 1. Create Auth User using Secondary Instance (Prevents logging out admin)
      const secondaryAppName = `secondary-provisioner-${Date.now()}`;
      const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const newUid = userCredential.user.uid;
      
      // Cleanup secondary app immediately
      await signOut(secondaryAuth);

      // 2. Provision Firestore Document
      const userData = {
        id: newUid,
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        username: formData.get("username") as string,
        email: email,
        roleId: formData.get("roleId") as string,
        branchId: formData.get("branchId") as string,
        allowedBranches: [formData.get("branchId") as string],
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "companies", companyId, "users", newUid), userData);

      // 3. Log Audit
      if (currentAdminRole) {
        await AuditService.logAction(db, companyId, {
          userId: currentAdminRole.id,
          userName: currentAdminRole.name,
          action: 'CREATE',
          module: 'users',
          recordId: newUid,
          details: `Provisioned new user account: ${email}`
        });
      }

      toast({ title: t('success'), description: "User account created and synchronized." });
      router.push("/users");
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
           <h1 className="text-xl font-bold font-headline text-violet-600 uppercase tracking-tight">{t('addUser')}</h1>
           <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Provisioning New Terminal Identity</p>
        </div>
      </div>

      <form onSubmit={handleSaveUser} className="space-y-8">
        <Card className="p-8 md:p-10 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {/* Identity Group */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <UserPlus className="h-3.5 w-3.5" /> Identity Info
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase ml-1">First Name</Label><Input name="firstName" required className="h-11 rounded-xl" /></div>
                <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase ml-1">Last Name</Label><Input name="lastName" required className="h-11 rounded-xl" /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-[9px] font-black uppercase ml-1">Username</Label><Input name="username" required className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase ml-1">Login Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                  <Input name="email" type="email" required className="h-11 pl-10 rounded-xl font-bold" placeholder="user@warrior.com" />
                </div>
              </div>
            </div>

            {/* Access Group */}
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" /> Authority & Security
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase ml-1">System Role</Label>
                  <Select name="roleId" required>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold"><SelectValue placeholder="Select Role" /></SelectTrigger>
                    <SelectContent className="rounded-xl shadow-2xl">
                      {roles?.map(r => <SelectItem key={r.id} value={r.id} className="text-xs font-bold uppercase">{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black uppercase ml-1">Home Branch</Label>
                  <Select name="branchId" required>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                    <SelectContent className="rounded-xl shadow-2xl">
                      {branches?.map(b => <SelectItem key={b.id} value={b.id} className="text-xs font-bold uppercase">{b.branchName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="pt-4 border-t border-slate-50 grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase ml-1">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300" />
                      <Input name="password" type="password" required className="h-11 pl-10 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-black uppercase ml-1">Confirm</Label>
                    <Input name="confirmPassword" type="password" required className="h-11 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t flex flex-col sm:flex-row gap-4">
            <Button type="button" variant="ghost" className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-[2] bg-violet-600 hover:bg-violet-700 h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-violet-100 gap-3">
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
              Provision User Terminal
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
