"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ShieldCheck, UserPlus, Lock, Loader2, MoreVertical, Shield } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function UsersPage() {
  const { companyId } = useTenant();
  const db = useFirestore();

  const usersQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return collection(db, "companies", companyId, "users");
  }, [db, companyId]);

  const { data: users, isLoading } = useCollection(usersQuery);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-violet-600">Users & Roles</h1>
          <p className="text-muted-foreground mt-1">Access control and permission management</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700 gap-2 rounded-full">
          <UserPlus className="h-4 w-4" />
          Invite User
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>
      ) : users && users.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Primary Branch</TableHead>
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
                      <div className="font-bold">{u.firstName} {u.lastName}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                  <TableCell className="text-xs uppercase font-medium">{u.branchId || "HQ"}</TableCell>
                  <TableCell><Badge className="bg-violet-50 text-violet-700 border-violet-200" variant="outline">Active</Badge></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mb-4 text-violet-600">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-headline font-bold">Administrator Console</h2>
          <p className="text-muted-foreground max-w-sm mt-2">
            Manage system users, assign roles (Admin, Sales, Warehouse), and track activity logs.
          </p>
          <Button className="mt-6 bg-violet-600">Add First Administrator</Button>
        </div>
      )}
    </div>
  )
}
