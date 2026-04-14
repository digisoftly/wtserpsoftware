
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Search, MoreVertical, Mail, Phone, MapPin, Loader2, Building2, User, Check, Filter, UserCheck, UserX, Building, Eye, Edit, Trash2 } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, doc, updateDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { KPICard } from "@/components/dashboard/kpi-card"
import { toast } from "@/hooks/use-toast"

export default function CustomersPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [customerType, setCustomerType] = React.useState<"individual" | "company">("individual");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);

  const { data: customers, isLoading } = useCollection(customersQuery);

  const filteredCustomers = customers?.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) return;

    const customerData = {
      companyId,
      branchId,
      customerType,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string || "",
      phoneNumber: formData.get("phoneNumber") as string || "",
      companyName: customerType === "company" ? (formData.get("companyName") as string) : "",
      city: formData.get("city") as string,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "branches", branchId, "customers"), customerData);
    setIsAddModalOpen(false);
    toast({ title: "Customer Registered", description: `${customerData.firstName} added to directory.` });
  };

  const handleUpdateCustomer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCustomer || !db) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const docRef = doc(db, "companies", companyId!, "branches", branchId!, "customers", selectedCustomer.id);
      await updateDoc(docRef, {
        customerType,
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        phoneNumber: formData.get("phoneNumber"),
        companyName: customerType === "company" ? formData.get("companyName") : "",
        city: formData.get("city"),
        updatedAt: serverTimestamp()
      });
      toast({ title: "Customer Updated", description: "Profile details saved." });
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Error", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = () => {
    if (!selectedCustomer || !db) return;
    const docRef = doc(db, "companies", companyId!, "branches", branchId!, "customers", selectedCustomer.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Record Deleted", description: "Customer removed from directory." });
    setIsDeleteAlertOpen(false);
  };

  const openEdit = (cust: any) => {
    setSelectedCustomer(cust);
    setCustomerType(cust.customerType || "individual");
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-cyan-600">Customers</h1>
          <p className="text-sm text-muted-foreground mt-1">Client relationship management</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700 gap-2 rounded-full w-full md:w-auto" onClick={() => setIsAddModalOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Total Clients" value={customers?.length || 0} icon={Users} colorClass="bg-cyan-500" />
        <KPICard title="Individuals" value={customers?.filter(c => c.customerType !== 'company').length || 0} icon={UserCheck} colorClass="bg-blue-500" />
        <KPICard title="Corporate" value={customers?.filter(c => c.customerType === 'company').length || 0} icon={Building} colorClass="bg-amber-500" />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full max-sm:max-w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, email, or company..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-cyan-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers?.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-muted/30">
                    <TableCell>
                      {customer.customerType === "company" ? <Badge variant="outline" className="text-[10px]">Company</Badge> : <Badge variant="outline" className="text-[10px]">Indiv</Badge>}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-xs md:text-sm">{customer.firstName} {customer.lastName}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{customer.companyName || "Personal"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-[10px] text-muted-foreground">
                        <div>{customer.email || "No Email"}</div>
                        <div>{customer.phoneNumber || "No Phone"}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(customer)}><Edit className="mr-2 h-4 w-4" /> Edit Profile</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedCustomer(customer); setIsDeleteAlertOpen(true); }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Customer
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
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedCustomer(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{isEditModalOpen ? "Edit Customer Details" : "Register New Customer"}</DialogTitle></DialogHeader>
          <form onSubmit={isEditModalOpen ? handleUpdateCustomer : handleAddCustomer} className="space-y-6 pt-4">
            <div className="space-y-3">
              <Label>Customer Type</Label>
              <RadioGroup value={customerType} onValueChange={(v: any) => setCustomerType(v)} className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 border p-3 rounded-lg"><RadioGroupItem value="individual" id="individual" /><Label htmlFor="individual">Individual</Label></div>
                <div className="flex items-center space-x-2 border p-3 rounded-lg"><RadioGroupItem value="company" id="company" /><Label htmlFor="company">Company</Label></div>
              </RadioGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name</Label><Input name="firstName" defaultValue={selectedCustomer?.firstName} required /></div>
              <div className="space-y-2"><Label>Last Name</Label><Input name="lastName" defaultValue={selectedCustomer?.lastName} required /></div>
            </div>
            {customerType === 'company' && <div className="space-y-2"><Label>Company Name</Label><Input name="companyName" defaultValue={selectedCustomer?.companyName} required /></div>}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email</Label><Input name="email" defaultValue={selectedCustomer?.email} type="email" /></div>
              <div className="space-y-2"><Label>Phone</Label><Input name="phoneNumber" defaultValue={selectedCustomer?.phoneNumber} /></div>
            </div>
            <div className="space-y-2"><Label>City</Label><Input name="city" defaultValue={selectedCustomer?.city} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin" /> : "Save Profile"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE ALERT */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the customer record for {selectedCustomer?.firstName}. All transaction history for this client will be unlinked.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteCustomer}>Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
