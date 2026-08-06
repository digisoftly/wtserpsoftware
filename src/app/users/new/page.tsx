"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, doc, setDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"

export default function NewUserPage() {
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const rolesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return collection(db, "companies", companyId, "roles");
  }, [db, companyId]);
  const { data: roles } = useCollection(rolesQuery);

  const branchesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return collection(db, "companies", companyId, "branches");
  }, [db, companyId]);
  const { data: branches } = useCollection(branchesQuery);

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId) return;
    
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: t('error'), description: "Passwords do not match." });
      return;
    }

    setIsSubmitting(true);
    const userData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      roleId: formData.get("roleId") as string,
      branchId: formData.get("branchId") as string,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const newRef = doc(collection(db, "companies", companyId, "users"));
      await setDoc(newRef, { ...userData, id: newRef.id });
      toast({ title: t('success') });
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
        <h1 className="text-xl font-bold font-headline text-violet-600 uppercase tracking-tight">{t('addUser')}</h1>
      </div>

      <Card className="p-10 rounded-[2.5rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
        <form onSubmit={handleSaveUser} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">First Name</Label><Input name="firstName" required className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Last Name</Label><Input name="lastName" required className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Username</Label><Input name="username" required className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Email Address</Label><Input name="email" type="email" required className="h-11 rounded-xl" /></div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Assign Role</Label>
                <Select name="roleId" required>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200"><SelectValue placeholder="Select Role" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {roles?.map(r => <SelectItem key={r.id} value={r.id} className="text-xs font-bold">{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-slate-400">Home Location</Label>
                <Select name="branchId" required>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {branches?.map(b => <SelectItem key={b.id} value={b.id} className="text-xs font-bold">{b.branchName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Password</Label><Input name="password" type="password" required className="h-11 rounded-xl" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-400">Confirm Password</Label><Input name="confirmPassword" type="password" required className="h-11 rounded-xl" /></div>
            </div>
          </div>

          <div className="pt-8 border-t flex gap-4">
            <Button type="button" variant="ghost" className="flex-1 h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-[2] bg-violet-600 hover:bg-violet-700 h-14 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-violet-100">
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <Save className="h-5 w-5" />}
              Provision User
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}