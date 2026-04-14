
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Truck, Plus, Search, Loader2, MoreVertical, Mail, Phone, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"

export default function SuppliersPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const suppliersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "suppliers");
  }, [db, companyId, branchId]);

  const { data: suppliers, isLoading } = useCollection(suppliersQuery);

  const handleAddSupplier = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!suppliersQuery || !companyId || !branchId) return;

    const supplierData = {
      companyId,
      branchId,
      name: formData.get("name") as string,
      contactPersonName: formData.get("contactPerson") as string,
      email: formData.get("email") as string,
      phoneNumber: formData.get("phone") as string,
      city: formData.get("city") as string,
      totalDueAmount: 0,
      totalPaidAmount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    addDocumentNonBlocking(suppliersQuery, supplierData);
    setIsAddModalOpen(false);
  };

  const filteredSuppliers = suppliers?.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-amber-700">Suppliers</h1>
          <p className="text-muted-foreground mt-1">Manage vendor relations and contacts</p>
        </div>
        <Button className="bg-amber-700 hover:bg-amber-800 gap-2 rounded-full shadow-lg shadow-amber-100" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search supplier name..." 
            className="pl-9 bg-background border-none ring-1 ring-input" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
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
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers?.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-bold">{s.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {s.email}</span>
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {s.phoneNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.city || "N/A"}</div>
                    </TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
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
          <p className="text-muted-foreground max-w-sm mt-2">Add your hardware vendors and service providers to manage procurement.</p>
          <Button className="mt-6 bg-amber-700 rounded-full px-8" onClick={() => setIsAddModalOpen(true)}>Add First Supplier</Button>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Register New Supplier</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSupplier} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input name="name" required placeholder="e.g. Global Tech Supplies" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input name="email" type="email" required placeholder="vendor@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input name="phone" required placeholder="+880 1..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>City / Location</Label>
              <Input name="city" placeholder="e.g. Dhaka" />
            </div>
            <Button type="submit" className="w-full bg-amber-700 rounded-full">Save Supplier Record</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
