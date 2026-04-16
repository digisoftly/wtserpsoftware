"use client"

import * as React from "react"
import { Target, Plus, Search, Loader2, MoreVertical, Trash2, Edit, Eye, Filter, CheckCircle2, DollarSign } from "lucide-react"
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
import { KPICard } from "@/components/dashboard/kpi-card"

export default function CRMPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = React.useState("");

  const leadsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "leads"), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: leads, isLoading } = useCollection(leadsQuery);

  const stats = React.useMemo(() => ({
    total: leads?.length || 0,
    converted: leads?.filter(l => l.status === 'qualified').length || 0,
    pipeline: leads?.length ? leads.length * 50000 : 0 // Dummy calculation
  }), [leads]);

  const filtered = leads?.filter(l => l.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-headline">CRM</h1>
        <Button className="rounded-full gap-2 h-9 px-6 bg-blue-600 font-bold text-[10px] uppercase shadow-lg shadow-blue-100">
          <Plus className="h-4 w-4" /> Add Lead
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Total Leads" value={stats.total} icon={Target} colorClass="bg-blue-600" subtext="New prospects" />
        <KPICard title="Converted Leads" value={stats.converted} icon={CheckCircle2} colorClass="bg-green-600" subtext="Qualified" />
        <KPICard title="Pipeline Value" value={`৳${stats.pipeline.toLocaleString()}`} icon={DollarSign} colorClass="bg-purple-600" subtext="Est. Opportunity" />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search leads..." className="pl-9 h-9 text-xs border-none bg-white shadow-sm ring-1 ring-slate-100" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
                <TableHead className="h-9 text-[10px] uppercase font-bold text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((lead) => (
                <TableRow key={lead.id} className="h-12 hover:bg-muted/10 transition-colors">
                  <TableCell>
                    <div className="font-bold text-xs">{lead.name}</div>
                    <div className="text-[9px] uppercase font-black text-muted-foreground">{lead.company || "Individual"}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
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
