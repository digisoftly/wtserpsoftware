"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Folder, Plus, Search, Loader2, MoreVertical, ClipboardCheck, TrendingUp, DollarSign, Calendar, ListTodo, Edit, Trash2, Eye, Download, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy, doc, setDoc, updateDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { KPICard } from "@/components/dashboard/kpi-card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { toast } from "@/hooks/use-toast"

export default function ProjectsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
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

  const stats = React.useMemo(() => ({
    total: projects?.length || 0,
    running: projects?.filter(p => p.status === 'active').length || 0,
    completed: projects?.filter(p => p.status === 'completed').length || 0,
    pending: projects?.filter(p => p.status === 'pending').length || 0
  }), [projects]);

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
      toast({ title: "Project Initialized" });
      setIsAddModalOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRecord || !db) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const docRef = doc(db, "companies", companyId!, "branches", branchId!, "projects", selectedRecord.id);
      await updateDoc(docRef, {
        name: formData.get("name"),
        customerId: formData.get("customerId"),
        budget: Number(formData.get("budget")),
        deadline: formData.get("deadline"),
        updatedAt: serverTimestamp()
      });
      toast({ title: "Project Data Adjusted" });
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = () => {
    if (!selectedRecord || !db) return;
    const docRef = doc(db, "companies", companyId!, "branches", branchId!, "projects", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Project Track Removed" });
    setIsDeleteAlertOpen(false);
  };

  const openEdit = (p: any) => {
    setSelectedRecord(p);
    setIsEditModalOpen(true);
  };

  const filteredProjects = projects?.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-xl font-bold font-headline">Projects</h1>
        <Button className="bg-teal-600 hover:bg-teal-700 gap-2 rounded-full px-8 shadow-lg h-9 text-[10px] uppercase font-bold shadow-teal-100" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" /> Initialize
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Projects" value={stats.total} icon={Folder} colorClass="bg-blue-600" subtext="All tracks" />
        <KPICard title="Running" value={stats.running} icon={TrendingUp} colorClass="bg-teal-600" subtext="Active work" />
        <KPICard title="Completed" value={stats.completed} icon={ClipboardCheck} colorClass="bg-green-600" subtext="Delivered" />
        <KPICard title="Pending" value={stats.pending} icon={Clock} colorClass="bg-orange-600" subtext="Queue" />
      </div>

      <div className="flex items-center gap-4 bg-white p-3 rounded-xl border shadow-sm ring-1 ring-slate-100">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search project name..." className="pl-9 h-9 border-none bg-background text-xs ring-1 ring-slate-200" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-bold h-9">Project</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9">Customer</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9">Budget</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9">Status</TableHead>
                  <TableHead className="text-right h-9"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects?.map((p) => (
                  <TableRow key={p.id} className="h-12 hover:bg-muted/10 transition-colors">
                    <TableCell className="font-bold text-xs truncate max-w-[200px]">{p.name}</TableCell>
                    <TableCell className="text-xs truncate max-w-[150px]">
                      {customers?.find(c => c.id === p.customerId)?.firstName || "Client"}
                    </TableCell>
                    <TableCell className="font-black text-xs text-slate-900">৳{p.budget?.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="bg-teal-500 h-full rounded-full" style={{ width: `${p.progress || 0}%` }} />
                        </div>
                        <span className="text-[9px] font-bold text-muted-foreground">{p.progress || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-teal-50 text-teal-600 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem className="text-xs"><Eye className="mr-2 h-3.5 w-3.5" /> View</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs" onClick={() => openEdit(p)}><Edit className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 text-xs" onClick={() => { setSelectedRecord(p); setIsDeleteAlertOpen(true); }}>
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
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

      {/* ADD/EDIT MODAL */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedRecord(null); } }}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-teal-600 p-6 text-white flex-row items-center gap-3">
            <Folder className="h-6 w-6" />
            <DialogTitle className="text-xl font-bold font-headline uppercase">{isEditModalOpen ? "Edit Project" : "New Project"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={isEditModalOpen ? handleUpdateProject : handleAddProject} className="p-6 space-y-4 bg-slate-50">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Title</Label>
              <Input name="name" required defaultValue={selectedRecord?.name} placeholder="Describe engagement..." className="h-11 rounded-xl bg-white border-none ring-1 ring-slate-200 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Client</Label>
              <Select name="customerId" required defaultValue={selectedRecord?.customerId}>
                <SelectTrigger className="h-11 rounded-xl bg-white border-none ring-1 ring-slate-200 shadow-sm"><SelectValue placeholder="Identify client..." /></SelectTrigger>
                <SelectContent>{customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.firstName} {c.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Budget (৳)</Label><Input name="budget" type="number" required defaultValue={selectedRecord?.budget} className="h-11 rounded-xl bg-white border-none ring-1 ring-slate-200 text-xs" /></div>
              <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Deadline</Label><Input name="deadline" type="date" required defaultValue={selectedRecord?.deadline} className="h-11 rounded-xl bg-white border-none ring-1 ring-slate-200 text-xs" /></div>
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full bg-teal-600 hover:bg-teal-700 h-12 rounded-2xl text-[10px] font-black uppercase mt-4 tracking-widest shadow-xl shadow-teal-100 active:scale-95 transition-all">
              {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Finalize Initializer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle className="font-headline">Delete Project?</AlertDialogTitle><AlertDialogDescription className="text-xs">Record will be permanently archived. Billing tracks may be detached.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="rounded-full text-[10px] uppercase font-bold h-9">Cancel</AlertDialogCancel><AlertDialogAction className="bg-red-600 rounded-full text-[10px] uppercase font-bold h-9" onClick={handleDeleteProject}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
