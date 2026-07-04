
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { 
  ShieldCheck, 
  UserPlus, 
  Lock, 
  Loader2, 
  MoreVertical, 
  Shield, 
  Plus, 
  Check, 
  X, 
  Settings2, 
  Trash2, 
  Edit, 
  Users,
  Eye,
  UserX,
  UserCheck,
  Building,
  Briefcase,
  Key
} from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"

const MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "crm", label: "CRM (Leads)" },
  { key: "sales", label: "Sales" },
  { key: "quotations", label: "Quotations" },
  { key: "purchases", label: "Purchases" },
  { key: "returns", label: "Returns" },
  { key: "inventory", label: "Inventory" },
  { key: "serial-inventory", label: "Serial Inventory" },
  { key: "projects", label: "Projects" },
  { key: "project-billing", label: "Project Billing" },
  { key: "contracts", label: "Service Contracts" },
  { key: "customers", label: "Customers" },
  { key: "suppliers", label: "Suppliers" },
  { key: "accounts", label: "Accounts" },
  { key: "hrm", label: "HRM" },
  { key: "reports", label: "Reports" },
  { key: "support", label: "Support Tickets" },
  { key: "settings", label: "Settings" },
  { key: "users", label: "Users & Roles" },
];

const ACTIONS = ["view", "create", "edit", "delete", "export", "print", "download"] as const;

export default function UsersPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState("users");
  const [isRoleModalOpen, setIsRoleModalOpen] = React.useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);
  const [selectedRole, setSelectedRole] = React.useState<any>(null);
  const [selectedUser, setSelectedUser] = React.useState<any>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Queries
  const usersQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "users"), orderBy("createdAt", "desc"));
  }, [db, companyId]);
  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

  const rolesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "roles"), orderBy("name"));
  }, [db, companyId]);
  const { data: roles, isLoading: rolesLoading } = useCollection(rolesQuery);

  const branchesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "branches"), orderBy("name"));
  }, [db, companyId]);
  const { data: branches } = useCollection(branchesQuery);

  // Role Form State
  const [roleName, setRoleName] = React.useState("");
  const [permissions, setPermissions] = React.useState<Record<string, string[]>>({});

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !companyId || !roleName) return;
    setIsSubmitting(true);

    try {
      const roleRef = selectedRole ? doc(db, "companies", companyId, "roles", selectedRole.id) : doc(collection(db, "companies", companyId, "roles"));
      await setDoc(roleRef, {
        name: roleName,
        permissions,
        updatedAt: serverTimestamp(),
        createdAt: selectedRole ? selectedRole.createdAt : serverTimestamp(),
      }, { merge: true });

      toast({ title: t('success'), description: `${roleName} matrix updated.` });
      setIsRoleModalOpen(false);
      resetRoleForm();
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!db || !companyId) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const userData = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      roleId: formData.get("roleId") as string,
      branchId: formData.get("branchId") as string,
      isActive: true,
      updatedAt: serverTimestamp(),
    };

    try {
      if (selectedUser) {
        await updateDoc(doc(db, "companies", companyId, "users", selectedUser.id), userData);
      } else {
        // In real ERP, this would call a cloud function to create Firebase Auth user
        // For prototype, we simulate identity document creation
        const newRef = doc(collection(db, "companies", companyId, "users"));
        await setDoc(newRef, { ...userData, id: newRef.id, createdAt: serverTimestamp() });
      }
      toast({ title: t('success') });
      setIsUserModalOpen(false);
      setSelectedUser(null);
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error'), description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (user: any) => {
    if (!db || !companyId) return;
    try {
      await updateDoc(doc(db, "companies", companyId, "users", user.id), {
        isActive: !user.isActive,
        updatedAt: serverTimestamp()
      });
      toast({ title: t('success') });
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error') });
    }
  };

  const resetRoleForm = () => {
    setRoleName("");
    setPermissions({});
    setSelectedRole(null);
  };

  const openEditRole = (role: any) => {
    setSelectedRole(role);
    setRoleName(role.name);
    setPermissions(role.permissions || {});
    setIsRoleModalOpen(true);
  };

  const togglePermission = (moduleKey: string, action: string) => {
    setPermissions(prev => {
      const current = prev[moduleKey] || [];
      const updated = current.includes(action) 
        ? current.filter(a => a !== action) 
        : [...current, action];
      return { ...prev, [moduleKey]: updated };
    });
  };

  const toggleAllInModule = (moduleKey: string) => {
    setPermissions(prev => {
      const current = prev[moduleKey] || [];
      const updated = current.length === ACTIONS.length ? [] : [...ACTIONS];
      return { ...prev, [moduleKey]: updated };
    });
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-violet-600 uppercase tracking-tight">{t('users')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeTab === "roles" ? (
            <Button className="bg-violet-600 hover:bg-violet-700 gap-2 rounded-full px-8 shadow-xl shadow-violet-100 h-10 text-[10px] uppercase font-black transition-all active:scale-95" onClick={() => { resetRoleForm(); setIsRoleModalOpen(true); }}>
              <Plus className="h-4 w-4" /> Create Role
            </Button>
          ) : (
            <Button className="bg-violet-600 hover:bg-violet-700 gap-2 rounded-full px-8 shadow-xl shadow-violet-100 h-10 text-[10px] uppercase font-black transition-all active:scale-95" onClick={() => { setSelectedUser(null); setIsUserModalOpen(true); }}>
              <UserPlus className="h-4 w-4" /> {t('addUser')}
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border p-1 rounded-2xl shadow-sm mb-6 flex h-11 ring-1 ring-slate-100">
          <TabsTrigger value="users" className="rounded-xl gap-2 flex-1 text-[10px] uppercase font-black h-9 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-600">
            <Users className="h-4 w-4" /> {t('userList')}
          </TabsTrigger>
          <TabsTrigger value="roles" className="rounded-xl gap-2 flex-1 text-[10px] uppercase font-black h-9 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-600">
            <Shield className="h-4 w-4" /> {t('roleList')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          {usersLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>
          ) : (
            <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="h-12 text-[10px] uppercase font-black pl-8">User</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">Role</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">Location</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">Status</TableHead>
                      <TableHead className="h-12 text-right pr-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((u) => (
                      <TableRow key={u.id} className="h-20 hover:bg-muted/5 transition-colors">
                        <TableCell className="pl-8">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center font-black text-xs uppercase shadow-sm">
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </div>
                            <div>
                              <div className="font-black text-xs uppercase tracking-tight text-slate-900">{u.firstName} {u.lastName}</div>
                              <div className="text-[10px] font-bold text-muted-foreground">{u.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize text-[10px] font-black h-5 px-2 bg-slate-100 border-none">
                            {roles?.find(r => r.id === u.roleId)?.name || "Restricted Guest"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                             <Building className="h-3 w-3" />
                             {branches?.find(b => b.id === u.branchId)?.name || "Unassigned"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-[9px] h-5 uppercase font-black border-none", u.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                            {u.isActive ? "Active" : "Disabled"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-violet-50 text-violet-600"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                              <DropdownMenuItem className="text-xs font-bold" onClick={() => { setSelectedUser(u); setIsUserModalOpen(true); }}><Edit className="h-3.5 w-3.5 mr-2" /> Modify Profile</DropdownMenuItem>
                              <DropdownMenuItem className="text-xs font-bold" onClick={() => toggleUserStatus(u)}>
                                {u.isActive ? <><UserX className="h-3.5 w-3.5 mr-2" /> Disable User</> : <><UserCheck className="h-3.5 w-3.5 mr-2" /> Enable User</>}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-xs font-bold"><Key className="h-3.5 w-3.5 mr-2" /> Reset Password</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 text-xs font-bold" onClick={() => deleteDoc(doc(db!, "companies", companyId!, "users", u.id))}><Trash2 className="h-3.5 w-3.5 mr-2" /> Permanently Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="roles">
          {rolesLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles?.map((role) => (
                <Card key={role.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden rounded-[2rem] bg-white ring-1 ring-slate-100">
                  <div className={cn("h-1.5", role.isSuperAdmin ? "bg-violet-600" : "bg-slate-100")} />
                  <CardHeader className="flex flex-row items-center justify-between p-6">
                    <div>
                      <CardTitle className="text-sm font-black uppercase flex items-center gap-2 tracking-widest text-slate-900">
                        {role.isSuperAdmin ? <ShieldCheck className="h-4 w-4 text-violet-600" /> : <Shield className="h-4 w-4 text-muted-foreground" />}
                        {role.name}
                      </CardTitle>
                      <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-[0.2em] font-black">
                        {role.isSuperAdmin ? "FULL SYSTEM ACCESS" : `${Object.values(role.permissions || {}).flat().length} ACTIVE RULES`}
                      </p>
                    </div>
                    {!role.isSuperAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                          <DropdownMenuItem className="text-xs font-bold" onClick={() => openEditRole(role)}><Settings2 className="h-3.5 w-3.5 mr-2" /> Modify Matrix</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 text-xs font-bold" onClick={() => deleteDoc(doc(db!, "companies", companyId!, "roles", role.id))}><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Role</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </CardHeader>
                  <CardContent className="p-6 pt-0">
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Object.entries(role.permissions || {}).slice(0, 4).map(([mod, actions]) => (
                        <Badge key={mod} variant="outline" className="text-[8px] uppercase font-black bg-slate-50 border-none h-4">
                          {mod}: {(actions as string[]).length}
                        </Badge>
                      ))}
                    </div>
                    {!role.isSuperAdmin && (
                      <Button variant="outline" className="w-full mt-6 rounded-2xl border-violet-100 hover:bg-violet-50 text-violet-600 font-black h-10 text-[9px] uppercase tracking-widest" onClick={() => openEditRole(role)}>
                        Edit Permissions
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ROLE PERMISSION MODAL */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 border-none shadow-2xl rounded-[2.5rem] bg-slate-50 overflow-hidden">
          <DialogHeader className="p-6 bg-violet-600 text-white flex-row items-center gap-4 space-y-0">
             <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md shrink-0"><ShieldCheck className="h-6 w-6" /></div>
             <div>
               <DialogTitle className="text-xl font-black font-headline uppercase tracking-tight">{selectedRole ? `Manage: ${selectedRole.name}` : "Create Access Role"}</DialogTitle>
               <p className="text-[9px] font-black uppercase opacity-60 tracking-widest mt-0.5">Permission Security Terminal</p>
             </div>
          </DialogHeader>
          <form onSubmit={handleSaveRole} className="p-6 md:p-10 space-y-8 overflow-y-auto max-h-[75vh] custom-scrollbar">
            <div className="space-y-2 max-w-sm">
              <Label className="text-[10px] uppercase font-black text-violet-600 tracking-[0.2em]">Role Identification</Label>
              <Input 
                placeholder="e.g. Regional Manager" 
                value={roleName} 
                onChange={e => setRoleName(e.target.value)} 
                className="h-12 text-sm font-bold rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-violet-500" 
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-4 border-slate-200">
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Permission Matrix</Label>
                <div className="hidden md:flex gap-4 text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                  {ACTIONS.map(a => <span key={a} className="w-16 text-center">{a}</span>)}
                </div>
              </div>

              <div className="space-y-2">
                {MODULES.map((mod) => (
                  <div key={mod.key} className="flex flex-col md:flex-row items-center justify-between p-4 bg-white rounded-2xl ring-1 ring-slate-100 hover:ring-violet-200 transition-all group">
                    <div className="flex items-center gap-3 w-full md:w-auto mb-4 md:mb-0">
                      <Checkbox 
                        id={`all-${mod.key}`}
                        checked={(permissions[mod.key] || []).length === ACTIONS.length}
                        onCheckedChange={() => toggleAllInModule(mod.key)}
                        className="data-[state=checked]:bg-violet-600 border-slate-200"
                      />
                      <div>
                        <Label htmlFor={`all-${mod.key}`} className="font-black text-xs uppercase tracking-tight cursor-pointer">{mod.label}</Label>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase mt-0.5 tracking-tighter">Global module access</p>
                      </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto justify-between md:justify-start">
                      {ACTIONS.map((action) => (
                        <div key={action} className="w-10 md:w-16 flex flex-col items-center gap-2">
                          <span className="md:hidden text-[7px] font-black uppercase text-slate-400">{action}</span>
                          <Checkbox 
                            checked={(permissions[mod.key] || []).includes(action)}
                            onCheckedChange={() => togglePermission(mod.key, action)}
                            className="data-[state=checked]:bg-violet-600 border-slate-200"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-violet-50 p-6 rounded-3xl border-2 border-dashed border-violet-100 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-violet-600"><Lock className="h-6 w-6" /></div>
                <div>
                  <p className="text-xs font-black uppercase tracking-tight text-violet-900">Security Enforcement</p>
                  <p className="text-[10px] text-violet-700 max-w-sm leading-relaxed mt-1 font-medium">Changes take effect immediately. Users assigned to this role will lose or gain access on their next interaction.</p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Button type="button" variant="ghost" className="flex-1 md:flex-none rounded-full px-8 h-12 text-[10px] font-black uppercase tracking-widest" onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 md:flex-none bg-violet-600 hover:bg-violet-700 rounded-full px-12 h-14 text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-violet-100 gap-2 transition-all active:scale-95">
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                  Finalize Access Rules
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* USER MODAL */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="max-w-md p-0 border-none shadow-2xl rounded-[2rem] bg-slate-50 overflow-hidden">
          <DialogHeader className="bg-violet-600 p-6 text-white flex-row items-center gap-3 space-y-0">
             <UserPlus className="h-6 w-6" />
             <DialogTitle className="text-xl font-black font-headline uppercase tracking-tight">{selectedUser ? t('editUser') : t('addUser')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveUser} className="p-8 space-y-5">
             <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">First Name</Label><Input name="firstName" required defaultValue={selectedUser?.firstName} className="h-11 rounded-xl" /></div>
               <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Last Name</Label><Input name="lastName" required defaultValue={selectedUser?.lastName} className="h-11 rounded-xl" /></div>
             </div>
             <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Email Address</Label><Input name="email" type="email" required defaultValue={selectedUser?.email} className="h-11 rounded-xl" /></div>
             <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Assign Role</Label>
                <Select name="roleId" defaultValue={selectedUser?.roleId || "guest-admin"}>
                  <SelectTrigger className="h-11 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>{roles?.map(r => <SelectItem key={r.id} value={r.id} className="text-xs font-bold">{r.name}</SelectItem>)}</SelectContent>
                </Select>
             </div>
             <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Target Location</Label>
                <Select name="branchId" defaultValue={selectedUser?.branchId || branchId || ""}>
                  <SelectTrigger className="h-11 rounded-xl bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>{branches?.map(b => <SelectItem key={b.id} value={b.id} className="text-xs font-bold">{b.name}</SelectItem>)}</SelectContent>
                </Select>
             </div>
             <Button type="submit" disabled={isSubmitting} className="w-full bg-violet-600 hover:bg-violet-700 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-violet-100 transition-all active:scale-95 mt-4">
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : t('save')}
             </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
