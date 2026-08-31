
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, User, Building, ShieldCheck, Camera, ShieldAlert, KeyRound, LayoutGrid, CheckCircle2 } from "lucide-react"
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

const SYSTEM_MODULES = [
  "dashboard", "sales", "payments", "quotations", "dispatch", "purchases", "returns",
  "inventory", "serialTracking", "projectBilling", "contracts", "customers", 
  "suppliers", "accounts", "expenses", "masterManagement", "support", "crm", "hrm", "settings", "users", "audit"
];

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
      setSelectedRole(userProfile.roleId || "");
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
        details: `Identity Modified for ${updates.fullName}. New Role: ${updates.roleId}. Access Status: ${updates.status}`
      });

      toast({ title: "Update Successful", description: "User permissions and profile updated." });
      router.push("/users");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
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
      <div className="flex items-center justify-between border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black font-headline text-slate-900 uppercase">Modify Identity Matrix</h1>
            <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mt-1">Authority Override & Profile Sync</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Button form="user-edit-form" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 rounded-full px-10 h-11 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-100 transition-all active:scale-95">
             {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
             Synchronize Identity
           </Button>
        </div>
      </div>

      <form id="user-edit-form" onSubmit={handleSave}>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="bg-white border p-1 rounded-xl shadow-sm mb-10 flex h-14 ring-1 ring-slate-100">
            <TabsTrigger value="profile" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-black data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
              <User className="h-4 w-4" /> Identity & Position
            </TabsTrigger>
            <TabsTrigger value="permissions" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-black data-[state=active]:bg-purple-50 data-[state=active]:text-purple-600">
              <ShieldAlert className="h-4 w-4" /> Authority Overrides
            </TabsTrigger>
            <TabsTrigger value="access" className="rounded-lg gap-2 flex-1 text-[10px] uppercase font-black data-[state=active]:bg-orange-50 data-[state=active]:text-orange-600">
              <KeyRound className="h-4 w-4" /> Access & Security
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <Card className="lg:col-span-4 border-none shadow-sm rounded-3xl p-8 bg-gradient-to-b from-blue-50/50 to-white text-center ring-1 ring-slate-100">
                <Avatar className="h-32 w-32 border-4 border-white shadow-2xl mx-auto mb-6">
                  <AvatarFallback className="text-3xl bg-blue-100 text-blue-600 font-black uppercase">{userProfile?.firstName?.[0]}{userProfile?.lastName?.[0]}</AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-black uppercase text-slate-900">{userProfile?.fullName}</h2>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{userProfile?.designation || "User Terminal"}</p>
                
                <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                  <div className="space-y-1.5 text-left">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Identity Status</Label>
                    <Select name="status" defaultValue={userProfile?.status || "active"}>
                      <SelectTrigger className="h-11 rounded-xl bg-white border-none ring-1 ring-slate-200 font-black"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl shadow-2xl">
                        <SelectItem value="active" className="text-xs font-black text-green-600">ACTIVE TERMINAL</SelectItem>
                        <SelectItem value="suspended" className="text-xs font-black text-red-600">SUSPENDED ACCESS</SelectItem>
                        <SelectItem value="archived" className="text-xs font-black text-slate-400">ARCHIVED ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              <div className="lg:col-span-8 space-y-6">
                <Card className="p-8 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2"><Building className="h-4 w-4" /> Identity & Placement</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">First Name</Label><Input name="firstName" defaultValue={userProfile?.firstName} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Last Name</Label><Input name="lastName" defaultValue={userProfile?.lastName} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Employee Code</Label><Input name="employeeId" defaultValue={userProfile?.employeeId} className="h-11 rounded-xl font-mono uppercase" placeholder="WTS-001" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Functional Dept</Label><Input name="department" defaultValue={userProfile?.department} className="h-11 rounded-xl" /></div>
                    <div className="space-y-1.5"><Label className="text-[10px) font-black uppercase">Primary Location</Label>
                      <Select name="primaryBranch" defaultValue={userProfile?.branchId}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl shadow-2xl">
                          {branches?.map(b => <SelectItem key={b.id} value={b.id} className="text-xs font-bold uppercase">{b.branchName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase">Mobile Contact</Label><Input name="phoneNumber" defaultValue={userProfile?.phoneNumber} className="h-11 rounded-xl" /></div>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <Card className="p-8 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
               <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shadow-inner">
                   <ShieldAlert className="h-5 w-5" />
                 </div>
                 <div>
                   <h3 className="text-sm font-black uppercase tracking-widest text-purple-600">Granular Authority Overrides</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Assign direct permissions that bypass global role definitions</p>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {SYSTEM_MODULES.map(mod => (
                   <div key={mod} className="p-5 bg-slate-50 rounded-[1.5rem] ring-1 ring-slate-200/50 space-y-4 transition-all hover:bg-white hover:shadow-lg">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                        <LayoutGrid className="h-3.5 w-3.5 text-purple-600 opacity-50" />
                        <span className="text-[10px] font-black uppercase text-slate-900 tracking-tight">{t(mod as any)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {["view", "create", "edit", "delete", "approve"].map(act => (
                          <div key={act} className={cn("px-2.5 py-1.5 rounded-lg border text-[8px] font-black uppercase cursor-pointer transition-all active:scale-95", 
                            overrides[mod]?.includes(act) ? "bg-purple-600 border-purple-600 text-white shadow-md" : "bg-white border-slate-200 text-slate-400 hover:border-purple-200")}
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

          <TabsContent value="access" className="space-y-6">
             <Card className="p-8 rounded-[2rem] border-none shadow-sm ring-1 ring-slate-100 bg-white">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-inner">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-orange-600">System Auth & Role</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Root level authorization management</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-1.5">
                     <Label className="text-[10px] font-black uppercase text-slate-500">Assigned System Role</Label>
                     <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="h-12 rounded-2xl font-black uppercase tracking-tight ring-2 ring-slate-100 border-none"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl shadow-2xl">
                          {roles?.map(r => <SelectItem key={r.id} value={r.id} className="text-xs font-black uppercase">{r.name}</SelectItem>)}
                        </SelectContent>
                     </Select>
                     <p className="text-[9px] font-bold text-slate-400 mt-2 px-1">Role defines the baseline permissions for this terminal user.</p>
                   </div>

                   <div className="p-6 bg-orange-50 rounded-[2rem] border-2 border-dashed border-orange-200 flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-sm font-black uppercase text-orange-900">Security Gate</Label>
                        <p className="text-[9px] font-bold text-orange-600 uppercase">Identity validation required</p>
                      </div>
                      <Button variant="outline" className="rounded-xl border-orange-200 text-orange-700 bg-white h-10 px-6 font-black text-[10px] uppercase shadow-sm">Reset Terminal Pass</Button>
                   </div>
                </div>

                <div className="mt-12 pt-8 border-t space-y-6">
                   <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Branch Access Perimeter</h3>
                   <div className="flex flex-wrap gap-3">
                      {branches?.map(b => (
                        <div 
                          key={b.id} 
                          onClick={() => setSelectedBranches(prev => prev.includes(b.id) ? prev.filter(id => id !== b.id) : [...prev, b.id])}
                          className={cn("px-4 py-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3", 
                            selectedBranches.includes(b.id) ? "border-blue-600 bg-blue-50 text-blue-900" : "border-slate-100 bg-slate-50 text-slate-400")}
                        >
                          {selectedBranches.includes(b.id) ? <CheckCircle2 className="h-4 w-4 text-blue-600" /> : <div className="h-4 w-4 rounded-full border-2 border-slate-200" />}
                          <span className="text-[10px] font-black uppercase tracking-tight">{b.branchName}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}
