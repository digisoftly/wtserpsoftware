
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  UserCircle,
  ShieldCheck,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Lock,
  Camera
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase"
import { doc, updateDoc, serverTimestamp, collection, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { AuditService } from "@/lib/audit-service"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export default function EditUserPage() {
  const { id } = useParams();
  const router = useRouter();
  const { companyId, userRole: currentAdminRole } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState("");
  const [selectedBranches, setSelectedBranches] = React.useState<string[]>([]);

  const userRef = useMemoFirebase(() => {
    if (!db || !companyId || !id) return null;
    return doc(db, "companies", companyId, "users", id as string);
  }, [db, companyId, id]);

  const { data: userProfile, isLoading } = useDoc(userRef);

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

  React.useEffect(() => {
    if (userProfile) {
      setSelectedRole(userProfile.roleId);
      setSelectedBranches(userProfile.allowedBranches || []);
    }
  }, [userProfile]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userRef || isSubmitting) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const updates = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      employeeId: formData.get("employeeId") as string,
      department: formData.get("department") as string,
      designation: formData.get("designation") as string,
      roleId: selectedRole,
      branchId: formData.get("primaryBranch") as string,
      allowedBranches: selectedBranches,
      status: formData.get("status") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      updatedAt: serverTimestamp(),
    };

    try {
      await updateDoc(userRef, updates);
      
      if (db && companyId && currentAdminRole) {
        await AuditService.logAction(db, companyId, {
          userId: currentAdminRole.id,
          userName: currentAdminRole.name,
          action: 'UPDATE',
          module: 'users',
          recordId: id as string,
          details: `Updated profile for user ${updates.firstName} ${updates.lastName}`
        });
      }

      toast({ title: t('success') });
      router.push("/users");
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black font-headline text-slate-900 uppercase">{t('editUser')}</h1>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Identity & Authority Override</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase" onClick={() => router.back()}>Cancel</Button>
           <Button form="user-edit-form" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 rounded-full px-10 h-11 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100">
             {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
             Synchronize Identity
           </Button>
        </div>
      </div>

      <form id="user-edit-form" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden text-center p-8 bg-gradient-to-b from-blue-50/50 to-white ring-1 ring-slate-100">
            <div className="relative inline-block mb-6">
              <Avatar className="h-32 w-32 border-4 border-white shadow-2xl">
                <AvatarFallback className="text-3xl bg-blue-100 text-blue-600 font-black">
                  {userProfile?.firstName?.[0]}{userProfile?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-slate-50 cursor-pointer">
                <Camera className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900">{userProfile?.firstName} {userProfile?.lastName}</h2>
            <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mt-1">Employee ID: {userProfile?.employeeId || "NEW"}</p>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl p-6 ring-1 ring-slate-100 bg-white space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Security & Status</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase">Account Status</Label>
                <Select name="status" defaultValue={userProfile?.status || "active"}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="active" className="text-xs font-bold text-green-600">ACTIVE</SelectItem>
                    <SelectItem value="suspended" className="text-xs font-bold text-red-600">SUSPENDED</SelectItem>
                    <SelectItem value="archived" className="text-xs font-bold text-slate-400">ARCHIVED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase">System Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-black"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl shadow-2xl">
                    {roles?.filter(r => r.id !== 'super-admin').map(r => (
                      <SelectItem key={`role-${r.id}`} value={r.id} className="text-xs font-bold uppercase">{r.name}</SelectItem>
                    ))}
                    <SelectItem key="system-super-admin" value="super-admin" className="text-xs font-black text-violet-600">SUPER ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white ring-1 ring-slate-100">
            <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase">First Name</Label><Input name="firstName" defaultValue={userProfile?.firstName} className="h-11 rounded-xl" /></div>
               <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase">Last Name</Label><Input name="lastName" defaultValue={userProfile?.lastName} className="h-11 rounded-xl" /></div>
               <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase">Phone Number</Label><Input name="phoneNumber" defaultValue={userProfile?.phoneNumber} className="h-11 rounded-xl" /></div>
               <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase">Email Address (Login)</Label><Input value={userProfile?.email} disabled className="h-11 rounded-xl bg-slate-50" /></div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white ring-1 ring-slate-100">
            <CardHeader className="bg-slate-50/50 p-6 border-b border-slate-100">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-600" /> Professional Placement
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase">Employee ID</Label><Input name="employeeId" defaultValue={userProfile?.employeeId} className="h-11 rounded-xl font-mono uppercase" /></div>
                 <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase">Department</Label><Input name="department" defaultValue={userProfile?.department} className="h-11 rounded-xl uppercase" /></div>
                 <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase">Designation</Label><Input name="designation" defaultValue={userProfile?.designation} className="h-11 rounded-xl uppercase" /></div>
               </div>

               <div className="space-y-4 pt-6 border-t">
                  <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Branch Access Matrix</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {branches?.map(b => (
                      <div key={b.id} className={cn("p-4 rounded-2xl border flex items-center gap-3 transition-all", 
                        selectedBranches.includes(b.id) ? "bg-blue-50 border-blue-200 ring-1 ring-blue-100" : "bg-white border-slate-100")}>
                        <Checkbox 
                          checked={selectedBranches.includes(b.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedBranches([...selectedBranches, b.id]);
                            else setSelectedBranches(selectedBranches.filter(id => id !== b.id));
                          }}
                        />
                        <span className="text-[10px] font-black uppercase truncate">{b.branchName}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 max-w-sm">
                    <Label className="text-[10px] font-bold uppercase">Primary Operational Branch</Label>
                    <Select name="primaryBranch" defaultValue={userProfile?.branchId}>
                      <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {branches?.filter(b => selectedBranches.includes(b.id)).map(b => (
                          <SelectItem key={b.id} value={b.id} className="text-xs font-bold uppercase">{b.branchName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
