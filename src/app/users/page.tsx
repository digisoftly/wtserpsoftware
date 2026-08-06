"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ShieldCheck, UserPlus, Lock, Loader2, MoreVertical, Shield, Plus, Settings2, Trash2, Edit, Users, UserX, UserCheck } from "lucide-react"
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

export default function UsersPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = React.useState("users");

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

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-black font-headline text-violet-600 uppercase tracking-tight">{t('users')}</h1>
        <div className="flex flex-wrap gap-2">
          {activeTab === "roles" ? (
            <Button className="bg-violet-600 hover:bg-violet-700 gap-2 rounded-full px-8 shadow-xl shadow-violet-100 h-10 text-[10px] uppercase font-black transition-all active:scale-95" asChild>
              <Link href="/users/roles/new">
                <Plus className="h-4 w-4" /> Create Role
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
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="h-12 text-[10px] uppercase font-black pl-8">Identity</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black">Role</TableHead>
                    <TableHead className="h-12 text-[10px] uppercase font-black">Status</TableHead>
                    <TableHead className="h-12 text-right pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => (
                    <TableRow key={u.id} className="h-20 hover:bg-muted/5 transition-colors">
                      <TableCell className="pl-8">
                        <div className="font-black text-xs uppercase tracking-tight text-slate-900">{u.firstName} {u.lastName}</div>
                        <div className="text-[9px] font-bold text-muted-foreground">{u.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize text-[9px] font-black h-5 px-2 bg-slate-100 border-none">
                          {roles?.find(r => r.id === u.roleId)?.name || "Restricted"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-[8px] h-4 uppercase font-black border-none px-2", u.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")}>
                          {u.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-violet-600"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="text-xs font-bold" asChild><Link href={`/users/${u.id}/edit`}><Edit className="h-3.5 w-3.5 mr-2" /> {t('edit')}</Link></DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => toggleUserStatus(u)}>
                              {u.isActive ? <><UserX className="h-3.5 w-3.5 mr-2" /> Disable</> : <><UserCheck className="h-3.5 w-3.5 mr-2" /> Enable</>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600 text-xs font-bold" onClick={() => deleteDoc(doc(db!, "companies", companyId!, "users", u.id))}><Trash2 className="h-3.5 w-3.5 mr-2" /> {t('delete')}</DropdownMenuItem>
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
                <Card key={role.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden rounded-[2rem] bg-white ring-1 ring-slate-100">
                  <div className={cn("h-1.5", role.isSuperAdmin ? "bg-violet-600" : "bg-slate-100")} />
                  <CardHeader className="flex flex-row items-center justify-between p-6">
                    <div>
                      <CardTitle className="text-sm font-black uppercase flex items-center gap-2 text-slate-900">
                        {role.isSuperAdmin ? <ShieldCheck className="h-4 w-4 text-violet-600" /> : <Shield className="h-4 w-4 text-muted-foreground" />}
                        {role.name}
                      </CardTitle>
                    </div>
                    {!role.isSuperAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full h-8 w-8"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem className="text-xs font-bold" asChild><Link href={`/users/roles/${role.id}/edit`}><Settings2 className="h-3.5 w-3.5 mr-2" /> Modify Matrix</Link></DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 text-xs font-bold" onClick={() => deleteDoc(doc(db!, "companies", companyId!, "roles", role.id))}><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Role</DropdownMenuItem>
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