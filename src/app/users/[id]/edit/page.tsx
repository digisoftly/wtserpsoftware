
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, User, Building, ShieldCheck, Camera, ShieldAlert, KeyRound, LayoutGrid } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  const [overrides, setOverrides] = React.useState<Record<string, string[]>>({});

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
      setOverrides(userProfile.permissionOverrides || {});
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
      fullName: `${formData.get("firstName")} ${formData.get("lastName")}`,
      employeeId: formData.get("employeeId") as string,
      department: formData.get("department") as string,
      designation: formData.get("designation") as string,
      roleId: selectedRole,
      branchId: formData.get("primaryBranch") as string,
      allowedBranches: selectedBranches,
      permissionOverrides: overrides,
      status: formData.get("status") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      updatedAt: serverTimestamp(),
    };

    try {
      await updateDoc(userRef, updates);
      
      await AuditService.logAction(db!, companyId!, {
        userId: currentAdminRole?.id || "admin",
        userName: currentAdminRole?.name || "Admin",
        action: 'UPDATE',
        module: 'users',
        recordId: id as string,
        details: `Updated terminal identity for ${updates.fullName}. Role: ${updates.roleId}. Status: ${updates.status}`
      });

      toast({ title: t('success'), description: "Identity synchronized." });
      router.push("/users");
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOverride = (module: string, action: string) => {
    setOverrides(prev => {
      const current = prev[module] || [];
      const updated = current.includes(action) ? current.filter(a => a !== action) : [...current, action];
      return { ...prev, [module]: updated };
    });
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
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Authority Override Matrix</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button variant="ghost" className="rounded-full text-[10px] font-black uppercase" onClick={() => router.back()}>Cancel</Button>
           <Button form="user-edit-form" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 rounded-full px-10 h-11 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100">
             {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
             Synchronize Matrix
           </Button>
        </div>
      </div>

      <form id="user-edit-form" onSubmit={handleSave}>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-white border p-1 rounded-xl shadow-sm mb-8 flex h-14 ring-1 ring-slate-100">
            <TabsTrigger value="profile" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-black data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
              <User className="h-4 w-4" /> {t('profile')}
            </TabsTrigger>
            <TabsTrigger value="permissions" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-black data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">
              <ShieldAlert className="h-4 w-4" /> {t('overrides')}
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-black data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600">
              <KeyRound className="h-4 w-4" /> {t('securitySettings')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <Card className="lg:col-span-4 border-none shadow-sm rounded-3xl p-8 bg-gradient-to-b from-blue-50/50 to-white text-center ring-1 ring-slate-100">
                <Avatar className="h-32 w-32 border-4 border-white shadow-2xl mx-auto mb-6">
                  <AvatarFallback className="text-3xl bg-blue-100 text-blue-600 font-black uppercase">{userProfile?.firstName?.[0]}{userProfile?.lastName?.[0]}</AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-black uppercase text-slate-900">{userProfile?.fullName}</h2>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{userProfile?.designation || "New User"}</p>
                
                <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                  <div className="space-y-1.5 text-left">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Account Status</Label>
                    <Select name="status" defaultValue={userProfile?.status || "active"}>
                      <SelectTrigger className="h-10 rounded-xl bg-white border-none ring-1 ring-slate-200"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active" className="text-xs font-black text-green-600">ACTIVE</SelectItem>
                        <SelectItem value="suspended" className="text-xs font-black text-red-600">SUSPENDED</SelectItem>
                        <SelectItem value="archived" className="text-xs font-black text-slate-400">ARCHIVED</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              <div className="lg:col-span-8 space-y-6">
                <Card className="p-8 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><Building className="h-4 w-4" /> Identity & Placement</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">First Name</Label><Input name="firstName" defaultValue={userProfile?.firstName} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Last Name</Label><Input name="lastName" defaultValue={userProfile?.lastName} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Employee ID</Label><Input name="employeeId" defaultValue={userProfile?.employeeId} className="h-11 rounded-xl font-mono uppercase" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Department</Label><Input name="department" defaultValue={userProfile?.department} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Primary Branch</Label>
                      <Select name="primaryBranch" defaultValue={userProfile?.branchId}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>{branches?.map(b => <SelectItem key={b.id} value={b.id}>{b.branchName}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <Card className="p-8 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
               <h3 className="text-xs font-black uppercase tracking-widest text-purple-600 mb-6 flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Direct Permission Overrides</h3>
               <p className="text-xs font-medium text-slate-500 mb-8 leading-relaxed">Add specific capabilities to this user that are not included in their assigned role. These overrides take precedence over role definitions.</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {["sales", "purchases", "inventory", "accounts", "users", "settings"].map(mod => (
                   <div key={mod} className="p-5 bg-slate-50 rounded-3xl ring-1 ring-slate-100 space-y-4">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                        <LayoutGrid className="h-3.5 w-3.5 text-purple-600" />
                        <span className="text-[11px] font-black uppercase text-slate-900">{mod}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {["create", "edit", "delete", "approve"].map(act => (
                          <div key={act} className={cn("px-3 py-1.5 rounded-full border text-[9px] font-black uppercase cursor-pointer transition-all", 
                            overrides[mod]?.includes(act) ? "bg-purple-600 border-purple-600 text-white" : "bg-white border-slate-200 text-slate-400 hover:border-purple-200")}
                            onClick={() => toggleOverride(mod, act)}>
                            {act}
                          </div>
                        ))}
                      </div>
                   </div>
                 ))}
               </div>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
             <Card className="p-8 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
                <h3 className="text-xs font-black uppercase tracking-widest text-orange-600 mb-6 flex items-center gap-2"><KeyRound className="h-4 w-4" /> Security Architecture</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-1.5">
                     <Label className="text-[10px] font-black uppercase text-slate-500">System Authorization Role</Label>
                     <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="h-12 rounded-2xl font-black uppercase tracking-tight"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {roles?.map(r => <SelectItem key={r.id} value={r.id} className="text-xs font-black uppercase">{r.name}</SelectItem>)}
                        </SelectContent>
                     </Select>
                   </div>
                   <div className="flex items-center justify-between p-6 bg-orange-50 rounded-3xl border-2 border-dashed border-orange-200">
                      <div>
                        <Label className="text-sm font-black uppercase text-orange-900">Session Guard</Label>
                        <p className="text-[9px] font-bold text-orange-600 uppercase">Immediate termination required</p>
                      </div>
                      <Button variant="outline" className="rounded-xl border-orange-200 text-orange-700 bg-white h-10 px-6 font-black text-[10px] uppercase">Force Logout</Button>
                   </div>
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
