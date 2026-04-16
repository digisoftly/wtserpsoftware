"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { LifeBuoy, Plus, Search, Loader2, MoreVertical, Filter, MessageSquare, Clock, UserCheck, AlertCircle, CheckCircle2 } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

  const stats = React.useMemo(() => ({
    open: tickets?.filter(t => t.status === 'open').length || 0,
    closed: tickets?.filter(t => t.status === 'closed').length || 0,
    pending: tickets?.filter(t => t.status === 'pending').length || 0
  }), [tickets]);

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-headline text-indigo-600">Support Tickets</h1>
        <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-full gap-2 shadow-lg h-9 px-6 text-[10px] uppercase font-bold" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" /> Raise Case
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Open Tickets" value={stats.open} icon={AlertCircle} colorClass="bg-red-600" subtext="Requires action" />
        <KPICard title="Closed Tickets" value={stats.closed} icon={CheckCircle2} colorClass="bg-green-600" subtext="Resolved" />
        <KPICard title="Pending Tickets" value={stats.pending} icon={Clock} colorClass="bg-orange-600" subtext="Awaiting user" />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search tickets..." className="pl-9 h-9 border-none bg-white shadow-sm ring-1 ring-slate-100 text-xs" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      ) : tickets && tickets.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-bold h-9">Ticket ID</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9">Subject</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets?.map((t) => (
                  <TableRow key={t.id} className="h-12 hover:bg-muted/10 transition-colors">
                    <TableCell className="font-mono text-[10px] text-indigo-600 font-black uppercase">#TK-{t.id.slice(-4)}</TableCell>
                    <TableCell>
                      <div className="font-bold text-xs">{t.subject}</div>
                      <div className="text-[9px] uppercase text-muted-foreground font-black">{t.priority}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-indigo-50 text-indigo-600"><MoreVertical className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="p-16 bg-white rounded-3xl border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
          <LifeBuoy className="h-10 w-10 text-indigo-200 mb-4" />
          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Inbox is Clear</p>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-indigo-600 p-6 text-white flex-row items-center gap-3">
            <Plus className="h-6 w-6" />
            <DialogTitle className="text-xl font-bold font-headline uppercase">Open Support Case</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTicket} className="p-6 space-y-4 bg-slate-50">
            <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Subject</Label><Input name="subject" required placeholder="Issue title..." className="h-11 rounded-xl border-none ring-1 ring-slate-200 text-xs" /></div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Priority</Label>
              <Select name="priority" defaultValue="medium">
                <SelectTrigger className="h-11 rounded-xl bg-white border-none ring-1 ring-slate-200 shadow-sm"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low" className="text-xs">Low</SelectItem><SelectItem value="medium" className="text-xs">Medium</SelectItem><SelectItem value="high" className="text-xs">High</SelectItem></SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-2xl text-[10px] font-black uppercase mt-4 tracking-widest shadow-xl shadow-indigo-100 active:scale-95 transition-all">Submit Ticket</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
