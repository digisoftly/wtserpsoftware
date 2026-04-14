"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Folder, Plus, Search, Loader2, MoreVertical, Calendar, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"

export default function ProjectsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

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

  const handleAddProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!projectsQuery || !companyId || !branchId) return;

    const projectData = {
      companyId,
      branchId,
      name: formData.get("name") as string,
      customerId: formData.get("customerId") as string,
      startDate: new Date().toISOString(),
      deadline: formData.get("deadline") as string,
      budget: Number(formData.get("budget")),
      actualCost: 0,
      status: "active",
      createdByUserId: "current-user",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    addDocumentNonBlocking(projectsQuery, projectData);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-teal-600">Projects</h1>
          <p className="text-muted-foreground mt-1">Manage ongoing implementation and service projects</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 gap-2 rounded-full" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Project
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
      ) : projects && projects.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects?.map((p) => {
                const customer = customers?.find(c => c.id === p.customerId);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold">{p.name}</TableCell>
                    <TableCell>{customer ? `${customer.firstName} ${customer.lastName}` : "Unknown"}</TableCell>
                    <TableCell className="font-semibold">${p.budget?.toLocaleString()}</TableCell>
                    <TableCell className="text-xs">{p.deadline ? new Date(p.deadline).toLocaleDateString() : "N/A"}</TableCell>
                    <TableCell><Badge className="bg-teal-50 text-teal-700 border-teal-200">{p.status}</Badge></TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mb-4 text-teal-500">
            <Folder className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-headline font-bold">No Projects Active</h2>
          <p className="text-muted-foreground max-w-sm mt-2">Organize your installation tasks, timelines, and resources in projects.</p>
          <Button className="mt-6 bg-teal-600" onClick={() => setIsAddModalOpen(true)}>Initialize Project</Button>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
          <form onSubmit={handleAddProject} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input name="name" required placeholder="e.g. CCTV Installation - HQ" />
            </div>
            <div className="space-y-2">
              <Label>Select Customer</Label>
              <Select name="customerId" required>
                <SelectTrigger><SelectValue placeholder="Client" /></SelectTrigger>
                <SelectContent>
                  {customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Budget ($)</Label>
                <Input name="budget" type="number" required />
              </div>
              <div className="space-y-2">
                <Label>Deadline</Label>
                <Input name="deadline" type="date" required />
              </div>
            </div>
            <Button type="submit" className="w-full bg-teal-600">Start Project</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
