"use client"

import * as React from "react"
import { Target, Plus, Search, Loader2, MoreVertical, Trash2, Edit, Eye, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function CRMPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = React.useState("");

  const leadsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "leads"), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: leads, isLoading } = useCollection(leadsQuery);

  const filtered = leads?.filter(l => l.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">CRM</h1>
        <Button className="rounded-full gap-2 h-9 px-6 bg-blue-600 font-bold">
          <Plus className="h-4 w-4" /> Add Lead
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search leads..." className="pl-9 h-9 text-xs border-none bg-white shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead className="h-9 text-[10px] uppercase font-bold">Name</TableHead>
                <TableHead className="h-9 text-[10px] uppercase font-bold">Company</TableHead>
                <TableHead className="h-9 text-[10px] uppercase font-bold">Priority</TableHead>
                <TableHead className="h-9 text-[10px] uppercase font-bold">Status</TableHead>
                <TableHead className="h-9 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((lead) => (
                <TableRow key={lead.id} className="h-12 hover:bg-muted/10">
                  <TableCell className="font-bold text-xs">{lead.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{lead.company || "Individual"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[9px] h-5 uppercase border-none bg-slate-100", lead.priority === 'high' ? "text-red-600" : "text-slate-600")}>
                      {lead.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-[9px] h-5 uppercase px-1.5", lead.status === 'qualified' ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700")}>
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full"><MoreVertical className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem className="text-xs"><Eye className="mr-2 h-3.5 w-3.5" /> View</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs text-red-600"><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}