"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Target, Plus, Search, Loader2, MoreVertical, Mail, Phone, Building2, Filter, Star } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KPICard } from "@/components/dashboard/kpi-card"
import { cn } from "@/lib/utils"

export default function CRMPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const leadsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "leads"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: leads, isLoading } = useCollection(leadsQuery);

  const handleAddLead = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) return;

    const leadData = {
      companyId,
      branchId,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      company: formData.get("company") as string,
      status: "new",
      priority: formData.get("priority") as string,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const colRef = collection(db, "companies", companyId, "branches", branchId, "leads");
    addDocumentNonBlocking(colRef, leadData);
    setIsAddModalOpen(false);
  };

  const filteredLeads = leads?.filter(l => l.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-rose-600">Sales Pipeline (CRM)</h1>
          <p className="text-sm text-muted-foreground mt-1">Track leads, deals, and conversions</p>
        </div>
        <Button className="bg-rose-600 hover:bg-rose-700 gap-2 rounded-full px-8 shadow-lg" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Capture Lead
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Leads" value={leads?.length || 0} icon={Target} colorClass="bg-rose-500" />
        <KPICard title="Qualified" value={leads?.filter(l => l.status === 'qualified').length || 0} icon={Star} colorClass="bg-amber-500" />
        <KPICard title="New Today" value={leads?.filter(l => l.status === 'new').length || 0} icon={Plus} colorClass="bg-blue-500" />
        <KPICard title="Avg Conversion" value="18%" icon={TrendingUp} colorClass="bg-green-500" />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto"><Filter className="h-4 w-4" /> Filters</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-rose-600" /></div>
      ) : leads && leads.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Lead Name</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads?.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-muted/30">
                    <TableCell className="font-bold">{lead.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        <Building2 className="h-3 w-3 text-muted-foreground" /> {lead.company || "Personal"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-[10px] text-muted-foreground">
                        <span>{lead.email}</span>
                        <span>{lead.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("capitalize text-[10px]", lead.status === 'new' ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-700")}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="p-16 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
          <Target className="h-12 w-12 text-rose-300 mb-4" />
          <h2 className="text-xl font-headline font-bold">No Leads in Pipeline</h2>
          <p className="text-muted-foreground max-w-sm mt-2">Start your sales cycle by adding potential clients here.</p>
          <Button className="mt-6 bg-rose-600 rounded-full px-8" onClick={() => setIsAddModalOpen(true)}>Add Lead</Button>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Lead Capture</DialogTitle></DialogHeader>
          <form onSubmit={handleAddLead} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs">Full Name</Label>
              <Input name="name" required placeholder="Prospect Name" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Company (Optional)</Label>
              <Input name="company" placeholder="Business Name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-xs">Email</Label><Input name="email" type="email" /></div>
              <div className="space-y-2"><Label className="text-xs">Phone</Label><Input name="phone" /></div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Priority</Label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-rose-600 rounded-full w-full">Save to CRM</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
