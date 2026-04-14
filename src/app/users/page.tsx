
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ShieldCheck, UserPlus, Lock, Loader2, MoreVertical, Shield, Plus, Check, X, Settings2, Trash2, Edit, Users } from "lucide-react"
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
import { toast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

const ACTIONS = ["view", "create", "edit", "delete", "export"] as const;

export default function UsersPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const [activeTab, setActiveTab] = React.useState("users");
  const [isRoleModalOpen, setIsRoleModalOpen] = React.useState(false);
  const [selectedRole, setSelectedRecord] = React.useState<any>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Queries
  const usersQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return collection(db, "companies", companyId, "users");
  }, [db, companyId]);
  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

  const rolesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "roles"), orderBy("name"));
  }, [db, companyId]);
  const { data: roles, isLoading: rolesLoading } = useCollection(rolesQuery);

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

      toast({ title: "Role Saved", description: `${roleName} permissions updated.` });
      setIsRoleModalOpen(false);
      resetRoleForm();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetRoleForm = () => {
    setRoleName("");
    setPermissions({});
    setSelectedRecord(null);
  };

  const openEditRole = (role: any) => {
    setSelectedRecord(role);
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
          <h1 className="text-3xl font-bold font-headline text-violet-600">Access Management</h1>
          <p className="text-muted-foreground mt-1">Users, roles, and granular feature permissions</p>
        </div>
        <div className="flex gap-2">
          {activeTab === "roles" && (
            <Button className="bg-violet-600 hover:bg-violet-700 gap-2 rounded-full shadow-lg" onClick={() => { resetRoleForm(); setIsRoleModalOpen(true); }}>
              <Plus className="h-4 w-4" /> Create New Role
            </Button>
          )}
          <Button variant="outline" className="gap-2 rounded-full">
            <UserPlus className="h-4 w-4" /> Invite User
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border p-1 rounded-xl shadow-sm mb-6 flex h-auto">
          <TabsTrigger value="users" className="rounded-lg gap-2 flex-1 py-2">
            <Users className="h-4 w-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="rounded-lg gap-2 flex-1 py-2">
            <Shield className="h-4 w-4" /> Roles & Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          {usersLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>
          ) : (
            <Card className="border-none shadow-sm rounded-xl overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Assigned Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center font-bold text-xs uppercase">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </div>
                          <div className="font-bold text-xs">{u.firstName} {u.lastName}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize text-[10px]">
                          {roles?.find(r => r.id === u.roleId)?.name || "Super Admin"}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge className="bg-green-50 text-green-700 border-green-200 text-[10px]" variant="outline">Active</Badge></TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Edit className="h-4 w-4 mr-2" /> Change Role</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600"><Trash2 className="h-4 w-4 mr-2" /> Deactivate</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="roles">
          {rolesLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {roles?.map((role) => (
                <Card key={role.id} className="border-none shadow-md hover:shadow-lg transition-all group overflow-hidden">
                  <div className={role.isSuperAdmin ? "h-1 bg-violet-600" : "h-1 bg-muted"} />
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
                        {role.isSuperAdmin ? <ShieldCheck className="h-5 w-5 text-violet-600" /> : <Shield className="h-5 w-5 text-muted-foreground" />}
                        {role.name}
                      </CardTitle>
                      <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">
                        {role.isSuperAdmin ? "Full Access" : `${Object.values(role.permissions || {}).flat().length} Permissions Enabled`}
                      </p>
                    </div>
                    {!role.isSuperAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditRole(role)}><Settings2 className="h-4 w-4 mr-2" /> Manage Permissions</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => deleteDoc(doc(db, "companies", companyId!, "roles", role.id))}><Trash2 className="h-4 w-4 mr-2" /> Delete Role</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(role.permissions || {}).slice(0, 5).map(([mod, actions]) => (
                        <Badge key={mod} variant="outline" className="text-[8px] uppercase font-bold bg-muted/20">
                          {mod}: {(actions as string[]).length}
                        </Badge>
                      ))}
                      {Object.keys(role.permissions || {}).length > 5 && <span className="text-[8px] text-muted-foreground">+{Object.keys(role.permissions || {}).length - 5} more</span>}
                    </div>
                    {!role.isSuperAdmin && (
                      <Button variant="outline" className="w-full mt-6 rounded-full border-violet-100 hover:bg-violet-50 text-violet-600 font-bold h-10" onClick={() => openEditRole(role)}>
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
        <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 bg-violet-600 text-white">
            <DialogTitle className="text-2xl font-headline flex items-center gap-3">
              <ShieldCheck className="h-6 w-6" /> {selectedRole ? `Manage: ${selectedRole.name}` : "Create Access Role"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveRole} className="p-6 space-y-8">
            <div className="space-y-2 max-w-sm">
              <Label className="text-[10px] uppercase font-bold text-violet-600 tracking-widest">Role Identification</Label>
              <Input 
                placeholder="e.g. Regional Manager" 
                value={roleName} 
                onChange={e => setRoleName(e.target.value)} 
                className="h-12 text-lg font-bold rounded-xl border-2 border-violet-50 focus:border-violet-500" 
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Permission Matrix</Label>
                <div className="flex gap-4 text-[10px] uppercase font-bold text-muted-foreground">
                  {ACTIONS.map(a => <span key={a} className="w-12 text-center">{a}</span>)}
                </div>
              </div>

              <div className="space-y-2">
                {MODULES.map((mod) => (
                  <div key={mod.key} className="flex items-center justify-between p-3 bg-white rounded-xl border border-dashed hover:border-violet-200 transition-colors group">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        id={`all-${mod.key}`}
                        checked={(permissions[mod.key] || []).length === ACTIONS.length}
                        onCheckedChange={() => toggleAllInModule(mod.key)}
                        className="border-muted group-hover:border-violet-400"
                      />
                      <div>
                        <Label htmlFor={`all-${mod.key}`} className="font-bold text-sm cursor-pointer">{mod.label}</Label>
                        <p className="text-[9px] text-muted-foreground leading-none">Global module access</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      {ACTIONS.map((action) => (
                        <div key={action} className="w-12 flex justify-center">
                          <Checkbox 
                            checked={(permissions[mod.key] || []).includes(action)}
                            onCheckedChange={() => togglePermission(mod.key, action)}
                            className="data-[state=checked]:bg-violet-600 border-muted group-hover:border-violet-200"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-violet-50 p-6 rounded-2xl border-2 border-dashed border-violet-200 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-violet-600">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-violet-900">Security Enforcement</p>
                  <p className="text-[10px] text-violet-700 max-w-xs leading-relaxed">Changes take effect immediately. Users assigned to this role will lose/gain access on their next interaction.</p>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Button type="button" variant="outline" className="flex-1 md:flex-none rounded-full px-8 h-12" onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1 md:flex-none bg-violet-600 hover:bg-violet-700 rounded-full px-12 h-12 font-bold shadow-lg shadow-violet-100 gap-2">
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                  Finalize Access Rules
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
