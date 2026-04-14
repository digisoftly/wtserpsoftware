"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Truck, Plus, Search, Loader2, MoreVertical, Mail, Phone, MapPin, Filter, Edit, Trash2, Eye, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, doc, updateDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"

export default function SuppliersPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const suppliersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "suppliers");
  }, [db, companyId, branchId]);

  const { data: suppliers, isLoading } = useCollection(suppliersQuery);

  const handleAddSupplier = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) return;

    const supplierData = {
      companyId,
      branchId,
      name: formData.get("name") as string,
      contactPersonName: formData.get("contactPerson") as string,
      email: formData.get("email") as string || "",
      phoneNumber: formData.get("phone") as string || "",
      city: formData.get("city") as string,
      totalDueAmount: 0,
      totalPaidAmount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "branches", branchId, "suppliers"), supplierData);
    setIsAddModalOpen(false);
    toast({ title: "Supplier Registered", description: `${supplierData.name} added to database.` });
  };

  const handleUpdateSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRecord || !db) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const docRef = doc(db, "companies", companyId!, "branches", branchId!, "suppliers", selectedRecord.id);
      await updateDoc(docRef, {
        name: formData.get("name"),
        contactPersonName: formData.get("contactPerson"),
        email: formData.get("email"),
        phoneNumber: formData.get("phone"),
        city: formData.get("city"),
        updatedAt: serverTimestamp()
      });
      toast({ title: "Supplier Details Updated" });
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Error", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = () => {
    if (!selectedRecord || !db) return;
    const docRef = doc(db, "companies", companyId!, "branches", branchId!, "suppliers", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Supplier Removed" });
    setIsDeleteAlertOpen(false);
  };

  const openEdit = (s: any) => {
    setSelectedRecord(s);
    setIsEditModalOpen(true);
  };

  const filteredSuppliers = suppliers?.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-amber-700">Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage vendor relations and procurement contacts</p>
        </div>
        <Button className="bg-amber-700 hover:bg-amber-800 gap-2 rounded-full shadow-lg w-full md:w-auto px-8" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search supplier name..." 
            className="pl-9 bg-background border-none ring-1 ring-input" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto rounded-full"><Filter className="h-4 w-4" /> Filters</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-700" /></div>
      ) : suppliers && suppliers.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers?.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-bold text-xs md:text-sm">{s.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-[10px] md:text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {s.email || "No info"}</span>
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {s.phoneNumber || "No info"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-[10px] md:text-xs">
                      <div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-muted-foreground" /> {s.city || "N/A"}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(s)}><Edit className="mr-2 h-4 w-4" /> Edit Vendor</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedRecord(s); toast({ title: "Exporting Profile" }); }}><Download className="mr-2 h-4 w-4" /> Download PDF</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedRecord(s); setIsDeleteAlertOpen(true); }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Supplier
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
      ) : (
        <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-700">
            <Truck className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-headline font-bold">No Suppliers Registered</h2>
          <p className="text-sm text-muted-foreground max-w-sm mt-2">Add your hardware vendors and service providers to manage procurement.</p>
          <Button className="mt-6 bg-amber-700 rounded-full px-8 shadow-md" onClick={() => setIsAddModalOpen(true)}>Add First Supplier</Button>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedRecord(null); } }}>
        <DialogContent className="sm:max-w-md w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">{isEditModalOpen ? "Modify Supplier Record" : "Register New Supplier"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={isEditModalOpen ? handleUpdateSupplier : handleAddSupplier} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs">Company Name</Label>
              <Input name="name" required defaultValue={selectedRecord?.name} placeholder="e.g. Global Tech Supplies" className="text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Contact Person</Label>
              <Input name="contactPerson" defaultValue={selectedRecord?.contactPersonName} className="text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Email (Optional)</Label>
                <Input name="email" type="email" defaultValue={selectedRecord?.email} className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Phone (Optional)</Label>
                <Input name="phone" defaultValue={selectedRecord?.phoneNumber} className="text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">City / Location</Label>
              <Input name="city" defaultValue={selectedRecord?.city} placeholder="e.g. Dhaka" className="text-sm" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="rounded-full">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-amber-700 hover:bg-amber-800 rounded-full px-8">
                {isSubmitting ? <Loader2 className="animate-spin" /> : isEditModalOpen ? "Save Changes" : "Save Record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to remove {selectedRecord?.name}? Existing purchase orders from this vendor will remain in historical logs.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteSupplier}>Delete Record</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
