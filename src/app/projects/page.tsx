"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Folder, Plus, Search, Loader2, MoreVertical, ClipboardCheck, TrendingUp, DollarSign, Calendar, ListTodo, Edit, Trash2, Eye, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search project name..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
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
                {filteredProjects?.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/30">
                    <TableCell className="font-bold text-teal-700">{p.name}</TableCell>
                    <TableCell className="text-sm">{customers?.find(c => c.id === p.customerId)?.firstName || "Client"}</TableCell>
                    <TableCell className="font-bold text-xs">৳{p.budget?.toLocaleString()}</TableCell>
                    <TableCell className="text-[10px] md:text-xs">{new Date(p.deadline).toLocaleDateString()}</TableCell>
                    <TableCell className="w-[120px]">
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${p.progress || 0}%` }} />
                      </div>
                      <span className="text-[9px] text-muted-foreground">{p.progress || 0}% Complete</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedRecord(p); toast({ title: "Loading Board" }); }}><ListTodo className="mr-2 h-4 w-4" /> Task Board</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(p)}><Edit className="mr-2 h-4 w-4" /> Edit Project</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedRecord(p); toast({ title: "Printing Summary" }); }}><Download className="mr-2 h-4 w-4" /> Download Brief</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedRecord(p); setIsDeleteAlertOpen(true); }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Record
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
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{isEditModalOpen ? "Adjust Project Details" : "New Implementation Project"}</DialogTitle></DialogHeader>
          <form onSubmit={isEditModalOpen ? handleUpdateProject : handleAddProject} className="space-y-4 pt-4">
            <div className="space-y-2"><Label>Project Name</Label><Input name="name" required defaultValue={selectedRecord?.name} placeholder="e.g. Head Office CCTV Setup" /></div>
            <div className="space-y-2">
              <Label>Customer Link</Label>
              <Select name="customerId" required defaultValue={selectedRecord?.customerId}>
                <SelectTrigger><SelectValue placeholder="Choose project client" /></SelectTrigger>
                <SelectContent>{customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Contract Budget (৳)</Label><Input name="budget" type="number" required defaultValue={selectedRecord?.budget} /></div>
              <div className="space-y-2"><Label>Completion Deadline</Label><Input name="deadline" type="date" required defaultValue={selectedRecord?.deadline} /></div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-teal-600 hover:bg-teal-700">
                {isSubmitting ? <Loader2 className="animate-spin" /> : isEditModalOpen ? "Save Changes" : "Start Tracking"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE ALERT */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Project Record?</AlertDialogTitle>
            <AlertDialogDescription>This will remove {selectedRecord?.name} from active operations. Billing history will be detached.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteProject}>Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
