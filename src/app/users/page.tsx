"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ShieldCheck, UserPlus, Lock, Loader2, MoreVertical, Shield, Plus, Settings2, Trash2, Edit, Users, UserX, UserCheck, Search, Filter, Mail, Building, Briefcase } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, deleteDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { KPICard } from "@/components/dashboard/kpi-card"

export default function UsersPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState("users");
  const [searchTerm, setSearchTerm] = React.useState("");

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

  const filteredUsers = React.useMemo(() => {
    return users?.filter(u => 
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const toggleUserStatus = async (user: any) => {
    if (!db || !companyId) return;
    const newStatus = user.status === 'suspended' ? 'active' : 'suspended';
    try {
      await updateDoc(doc(db, "companies", companyId, "users", user.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      toast({ title: t('success'), description: `User account is now ${newStatus}.` });
    } catch (err: any) {
      toast({ variant: "destructive", title: t('error') });
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-xl md:text-2xl font-black font-headline text-violet-600 uppercase tracking-tight">{t('users')}</h1>
           <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Global Identity & Authority Directory</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {activeTab === "roles" ? (
            <Button className="bg-violet-600 hover:bg-violet-700 gap-2 rounded-full px-8 shadow-xl shadow-violet-100 h-10 text-[10px] uppercase font-black transition-all active:scale-95" asChild>
              <Link href="/users/roles/new">
                <Plus className="h-4 w-4" /> Create System Role
              </Link>
            </Button>
          ) : (
            <Button className="bg-violet-600 hover:bg-violet-700 gap-2 rounded-full px-8 shadow-xl shadow-violet-100 h-10 text-[10px] uppercase font-black transition-all active:scale-95" asChild>
              <Link href="/users/new">
                <UserPlus className="h-4 w-4" /> {t('addUser')}
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Active Terminals" value={users?.filter(u => u.status === 'active').length || 0} icon={Users} colorClass="bg-blue-600" />
        <KPICard title="Total Provisioned" value={users?.length || 0} icon={ShieldCheck} colorClass="bg-violet-600" />
        <KPICard title="Suspended" value={users?.filter(u => u.status === 'suspended').length || 0} icon={UserX} colorClass="bg-red-600" />
        <KPICard title="Auth Roles" value={roles?.length || 0} icon={Lock} colorClass="bg-purple-600" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white border p-1 rounded-xl shadow-sm mb-6 flex h-11 ring-1 ring-slate-100">
          <TabsTrigger value="users" className="rounded-xl gap-2 flex-1 text-[10px] uppercase font-black h-9 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-600">
            <Users className="h-4 w-4" /> {t('userList')}
          </TabsTrigger>
          <TabsTrigger value="roles" className="rounded-xl gap-2 flex-1 text-[10px] uppercase font-black h-9 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-600">
            <Shield className="h-4 w-4" /> {t('roleList')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="bg-white p-3 rounded-2xl border ring-1 ring-slate-100 flex gap-3">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
               <input 
                placeholder="Search by name, email or employee ID..." 
                className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs font-bold transition-all outline-none focus:ring-2 focus:ring-violet-500" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
               />
             </div>
             <Button variant="outline" className="rounded-xl h-10 px-4 gap-2 text-[10px] font-black uppercase border-slate-200">
                <Filter className="h-3.5 w-3.5" /> Filter
             </Button>
          </div>

          {usersLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>
          ) : (
            <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="h-12 text-[10px] uppercase font-black pl-8">Identity</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">Professional</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black">Authorization</TableHead>
                      <TableHead className="h-12 text-[10px] uppercase font-black text-center">Status</TableHead>
                      <TableHead className="h-12 text-right pr-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.map((u) => (
                      <TableRow key={u.id} className="h-20 hover:bg-muted/5 transition-colors">
                        <TableCell className="pl-8">
                          <div className="flex flex-col">
                             <span className="font-black text-xs uppercase tracking-tight text-slate-900">{u.fullName}</span>
                             <span className="text-[9px] font-bold text-muted-foreground flex items-center gap-1 mt-1"><Mail className="h-2.5 w-2.5" /> {u.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                           <div className="flex flex-col">
                             <span className="text-[10px] font-black text-slate-700 uppercase tracking-tighter flex items-center gap-1"><Briefcase className="h-3 w-3 text-slate-300" /> {u.designation || 'Staff'}</span>
                             <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{u.department || 'General'}</span>
                           </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                             <Badge variant="secondary" className="w-fit text-[8px] font-black h-4 px-1.5 bg-violet-50 text-violet-700 border-none uppercase">
                               {roles?.find(r => r.id === u.roleId)?.name || "Restricted"}
                             </Badge>
                             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Building className="h-2.5 w-2.5" /> {u.branchId || 'Global'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("text-[8px] h-4 uppercase font-black border-none px-2", 
                            u.status === 'active' ? "bg-green-50 text-green-700" : 
                            u.status === 'suspended' ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600")}>
                            {u.status?.toUpperCase() || "ACTIVE"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-violet-600"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl p-2 border-slate-100">
                              <DropdownMenuItem className="h-10 rounded-xl text-xs font-bold" asChild><Link href={`/users/${u.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Modify Identity</Link></DropdownMenuItem>
                              <DropdownMenuItem className="h-10 rounded-xl text-xs font-bold" onClick={() => toggleUserStatus(u)}>
                                {u.status === 'suspended' ? <><UserCheck className="mr-2 h-4 w-4 text-green-600" /> Activate Terminal</> : <><UserX className="mr-2 h-4 w-4 text-red-600" /> Suspend Access</>}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1 bg-slate-50" />
                              <DropdownMenuItem className="h-10 rounded-xl text-red-600 text-xs font-bold focus:bg-red-50" onClick={() => deleteDoc(doc(db!, "companies", companyId!, "users", u.id))}><Trash2 className="mr-2 h-4 w-4" /> Archive Account</DropdownMenuItem>
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
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-black uppercase flex items-center gap-2 text-slate-900">
                        {role.isSuperAdmin ? <ShieldCheck className="h-4 w-4 text-violet-600" /> : <Shield className="h-4 w-4 text-muted-foreground" />}
                        {role.name}
                      </CardTitle>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{Object.keys(role.permissions || {}).length} Active Modules</p>
                    </div>
                    {!role.isSuperAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl p-2 border-slate-100">
                          <DropdownMenuItem className="h-10 rounded-xl text-xs font-bold" asChild><Link href={`/users/roles/${role.id}/edit`}><Settings2 className="h-4 w-4 mr-2" /> Adjust Auth Matrix</Link></DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1 bg-slate-50" />
                          <DropdownMenuItem className="h-10 rounded-xl text-red-600 text-xs font-bold focus:bg-red-50" onClick={() => deleteDoc(doc(db!, "companies", companyId!, "roles", role.id))}><Trash2 className="h-4 w-4 mr-2" /> Decommission Role</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
