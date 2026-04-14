
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Building2, Plus, MapPin, Phone, User, Search, Loader2, MoreVertical, Edit, Trash2, ShieldCheck } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, setDoc, updateDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export default function BranchesPage() {
  const { companyId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const branchesQuery = useMemoFirebase(() => {
    if (!db || !companyId) return null;
    return query(collection(db, "companies", companyId, "branches"), orderBy("name"));
  }, [db, companyId]);

  const { data: branches, isLoading } = useCollection(branchesQuery);

  const handleAddBranch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId) return;

    setIsSubmitting(true);
    try {
      const branchRef = doc(collection(db, "companies", companyId, "branches"));
      const branchData = {
        id: branchRef.id,
        companyId,
        name: formData.get("name") as string,
        code: formData.get("code") as string,
        address: formData.get("address") as string,
        phoneNumber: formData.get("phone") as string,
        managerName: formData.get("manager") as string,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(branchRef, branchData);
      toast({ title: "Branch Created", description: `${branchData.name} is now operational.` });
      setIsAddModalOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Creation Failed", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBranch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRecord || !db || !companyId) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const docRef = doc(db, "companies", companyId, "branches", selectedRecord.id);
      await updateDoc(docRef, {
        name: formData.get("name"),
        code: formData.get("code"),
        address: formData.get("address"),
        phoneNumber: formData.get("phone"),
        managerName: formData.get("manager"),
        updatedAt: serverTimestamp()
      });
      toast({ title: "Branch Updated" });
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBranch = () => {
    if (!selectedRecord || !db || !companyId) return;
    const docRef = doc(db, "companies", companyId, "branches", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Branch Removed" });
    setIsDeleteAlertOpen(false);
  };

  const openEdit = (b: any) => {
    setSelectedRecord(b);
    setIsEditModalOpen(true);
  };

  const filteredBranches = branches?.filter(b => 
    b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-blue-600 flex items-center gap-2">
            <Building2 className="h-8 w-8" /> Locations & Branches
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage distributed warehouse and shop operations</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2 rounded-full px-8 shadow-lg h-11" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add New Branch
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-blue-50/50">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-blue-600 tracking-widest">Active Locations</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold font-headline">{branches?.length || 0}</div></CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-green-50/50">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-green-600 tracking-widest">Primary Warehouse</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold font-headline">Dhaka Main</div></CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-purple-50/50">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-bold uppercase text-purple-600 tracking-widest">Operational Coverage</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold font-headline">100%</div></CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Filter by name or code..." 
            className="pl-9 h-10 bg-background border-none ring-1 ring-input" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches?.map((branch) => (
            <Card key={branch.id} className="border-none shadow-md hover:shadow-lg transition-all overflow-hidden group">
              <div className="h-1.5 bg-blue-600" />
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <Badge variant="secondary" className="mb-2 text-[9px] uppercase font-bold tracking-tighter bg-blue-50 text-blue-700">CODE: {branch.code}</Badge>
                  <CardTitle className="text-xl font-headline font-bold">{branch.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(branch)}><Edit className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedRecord(branch); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-4 w-4" /> Remove Branch</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" /> <span>{branch.address || "No address set"}</span></div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4 shrink-0" /> <span>{branch.phoneNumber || "No phone set"}</span></div>
                  <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4 shrink-0" /> <span>Manager: {branch.managerName || "Unassigned"}</span></div>
                </div>
                <div className="pt-4 border-t flex items-center justify-between">
                  <Badge className="bg-green-50 text-green-700 border-green-200">Operational</Badge>
                  <Button variant="link" className="text-blue-600 font-bold text-xs p-0 h-auto">View Analytics</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedRecord(null); } }}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              {isEditModalOpen ? "Modify Location" : "New Branch Setup"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={isEditModalOpen ? handleUpdateBranch : handleAddBranch} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Branch Name</Label>
                <Input name="name" required defaultValue={selectedRecord?.name} placeholder="e.g. Uttara Hub" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Short Code</Label>
                <Input name="code" required defaultValue={selectedRecord?.code} placeholder="e.g. UT-01" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Physical Address</Label>
              <Input name="address" defaultValue={selectedRecord?.address} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Contact Phone</Label>
                <Input name="phone" defaultValue={selectedRecord?.phoneNumber} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Manager Name</Label>
                <Input name="manager" defaultValue={selectedRecord?.managerName} />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 rounded-full w-full h-12 font-bold shadow-lg">
                {isSubmitting ? <Loader2 className="animate-spin" /> : isEditModalOpen ? "Save Changes" : "Initialize Branch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE ALERT */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Branch Location?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete {selectedRecord?.name}? This will isolate all historical operational data linked to this branch. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteBranch}>Confirm Removal</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
