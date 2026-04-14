"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { LifeBuoy, Plus, Search, Loader2, MoreVertical, Filter, MessageSquare, Clock, UserCheck, AlertCircle } from "lucide-react"
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

export default function SupportPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const ticketsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "tickets"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: tickets, isLoading } = useCollection(ticketsQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  const handleAddTicket = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) return;

    const ticketData = {
      companyId,
      branchId,
      subject: formData.get("subject") as string,
      customerId: formData.get("customerId") as string,
      priority: formData.get("priority") as string,
      status: "open",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const colRef = collection(db, "companies", companyId, "branches", branchId, "tickets");
    addDocumentNonBlocking(colRef, ticketData);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-indigo-600 flex items-center gap-2">
            <LifeBuoy className="h-8 w-8" /> Support & Tickets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage customer queries and technical assistance</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 rounded-full px-8 shadow-lg" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Raise Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Open Tickets" value={tickets?.filter(t => t.status === 'open').length || 0} icon={MessageSquare} colorClass="bg-indigo-500" />
        <KPICard title="High Priority" value={tickets?.filter(t => t.priority === 'high').length || 0} icon={AlertCircle} colorClass="bg-red-500" />
        <KPICard title="Avg Response" value="45m" icon={Clock} colorClass="bg-blue-500" />
        <KPICard title="Resolved Today" value="0" icon={UserCheck} colorClass="bg-green-500" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      ) : tickets && tickets.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets?.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-[10px] text-indigo-600 font-bold uppercase">#TK-{t.id.slice(-6)}</TableCell>
                    <TableCell className="font-medium text-xs md:text-sm">{t.subject}</TableCell>
                    <TableCell className="text-xs">
                      {customers?.find(c => c.id === t.customerId)?.firstName || "Guest"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] capitalize", t.priority === 'high' ? "border-red-200 text-red-700 bg-red-50" : "bg-blue-50 text-blue-700")}>
                        {t.priority}
                      </Badge>
                    </TableCell>
                    <TableCell><Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] capitalize">{t.status}</Badge></TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="p-16 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
          <LifeBuoy className="h-12 w-12 text-indigo-200 mb-4" />
          <h2 className="text-xl font-headline font-bold">Inbox is Clear</h2>
          <p className="text-muted-foreground max-w-sm mt-2">All customer concerns have been addressed. No pending support tickets found.</p>
          <Button className="mt-6 bg-indigo-600 rounded-full px-8" onClick={() => setIsAddModalOpen(true)}>Create Ticket</Button>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Support Case</DialogTitle></DialogHeader>
          <form onSubmit={handleAddTicket} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs">Subject / Issue Title</Label>
              <Input name="subject" required placeholder="e.g. CCTV Camera Offline" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Related Customer</Label>
              <Select name="customerId" required>
                <SelectTrigger><SelectValue placeholder="Choose client" /></SelectTrigger>
                <SelectContent>
                  {customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Priority</Label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High / Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-indigo-600 rounded-full w-full">Raise Ticket</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
