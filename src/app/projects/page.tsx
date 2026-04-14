"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Folder, Plus, Search, Loader2, MoreVertical, ClipboardCheck, TrendingUp, DollarSign, Calendar, ListTodo } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy, doc, setDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { KPICard } from "@/components/dashboard/kpi-card"
import { toast } from "@/hooks/use-toast"

export default function ProjectsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const projectsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "projects"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: projects, isLoading } = useCollection(projectsQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  const handleAddProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) return;

    setIsSubmitting(true);
    try {
      const projectRef = doc(collection(db, "companies", companyId, "branches", branchId, "projects"));
      await setDoc(projectRef, {
        id: projectRef.id,
        companyId,
        branchId,
        name: formData.get("name") as string,
        customerId: formData.get("customerId") as string,
        budget: Number(formData.get("budget")),
        deadline: formData.get("deadline") as string,
        status: "active",
        progress: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Project Initialized", description: "Tracking started for the implementation." });
      setIsAddModalOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-teal-600">Operations & Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">Track implementation timelines, tasks, and budgets</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 gap-2 rounded-full px-8 shadow-lg" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Initialize Project
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Active Work" value={projects?.filter(p => p.status === 'active').length || 0} icon={Folder} colorClass="bg-teal-500" />
        <KPICard title="Completions" value={projects?.filter(p => p.status === 'completed').length || 0} icon={ClipboardCheck} colorClass="bg-green-500" />
        <KPICard title="Budget Pool" value={`৳${projects?.reduce((s, p) => s + (p.budget || 0), 0).toLocaleString()}`} icon={DollarSign} colorClass="bg-blue-500" />
        <KPICard title="Deadlines Today" value="0" icon={Calendar} colorClass="bg-red-500" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects?.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold text-teal-700">{p.name}</TableCell>
                    <TableCell>{customers?.find(c => c.id === p.customerId)?.firstName || "Unknown"}</TableCell>
                    <TableCell className="font-bold">৳{p.budget?.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{new Date(p.deadline).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${p.progress || 0}%` }} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon"><ListTodo className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>New Implementation Project</DialogTitle></DialogHeader>
          <form onSubmit={handleAddProject} className="space-y-4 pt-4">
            <div className="space-y-2"><Label>Project Name</Label><Input name="name" required placeholder="e.g. CCTV Setup - Head Office" /></div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select name="customerId" required>
                <SelectTrigger><SelectValue placeholder="Choose customer" /></SelectTrigger>
                <SelectContent>
                  {customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Budget (৳)</Label><Input name="budget" type="number" required /></div>
              <div className="space-y-2"><Label>Deadline</Label><Input name="deadline" type="date" required /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : "Start Tracking"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
