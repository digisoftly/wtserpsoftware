"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Search, MoreVertical, Loader2, Building, UserCheck, UserX, Eye, Edit, Trash2, ShieldCheck, Mail, Phone } from "lucide-react"
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

  const stats = React.useMemo(() => ({
    total: customers?.length || 0,
    active: customers?.length || 0, // Placeholder
    due: 0 // Placeholder until linked with billing
  }), [customers]);

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
    toast({ title: "Customer Registered" });
  };

  const handleDeleteCustomer = () => {
    if (!selectedCustomer || !db) return;
    const docRef = doc(db, "companies", companyId!, "branches", branchId!, "customers", selectedCustomer.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Record Deleted" });
    setIsDeleteAlertOpen(false);
  };

  const openEdit = (cust: any) => {
    setSelectedCustomer(cust);
    setCustomerType(cust.customerType || "individual");
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-headline text-cyan-600">Customers</h1>
        <Button className="bg-cyan-600 hover:bg-cyan-700 gap-2 rounded-full h-9 px-6 text-[10px] uppercase font-bold shadow-lg shadow-cyan-100" onClick={() => setIsAddModalOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Total Customers" value={stats.total} icon={Users} colorClass="bg-blue-600" subtext="Directory size" />
        <KPICard title="Active Customers" value={stats.active} icon={UserCheck} colorClass="bg-green-600" subtext="With activity" />
        <KPICard title="Due Customers" value={stats.due} icon={UserX} colorClass="bg-red-600" subtext="Payment alerts" />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search name, email..." className="pl-9 h-9 border-none bg-white shadow-sm ring-1 ring-slate-100 text-xs" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-cyan-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-bold h-9">Type</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9">Name</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9">Contact</TableHead>
                  <TableHead className="text-right h-9"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers?.map((customer) => (
                  <TableRow key={customer.id} className="h-12 hover:bg-muted/10 transition-colors">
                    <TableCell>
                      <Badge variant="outline" className="text-[8px] uppercase font-black border-none bg-slate-100 px-1.5 h-4">
                        {customer.customerType === "company" ? "Corp" : "Indiv"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-xs">{customer.firstName} {customer.lastName}</div>
                      <div className="text-[9px] text-muted-foreground uppercase font-black">{customer.companyName || "Personal"}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
                        <Mail className="h-3 w-3 opacity-40" /> {customer.email || "---"}
                        <Phone className="h-3 w-3 opacity-40 ml-2" /> {customer.phoneNumber || "---"}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-cyan-50 text-cyan-600 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem className="text-xs" onClick={() => openEdit(customer)}><Edit className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 text-xs" onClick={() => { setSelectedCustomer(customer); setIsDeleteAlertOpen(true); }}>
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
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedCustomer(null); } }}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-cyan-600 p-6 text-white flex-row items-center gap-3">
            <Users className="h-6 w-6" />
            <DialogTitle className="text-xl font-bold font-headline uppercase">{isEditModalOpen ? "Edit Profile" : "New Client"}</DialogTitle>
          </DialogHeader>
          <div className="p-6 bg-slate-50 italic text-[10px] uppercase font-bold tracking-widest text-center py-20 text-muted-foreground">
            Customer Enrollment Form
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle className="font-headline">Remove Customer?</AlertDialogTitle><AlertDialogDescription className="text-xs">Record will be permanently deleted.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full text-[10px] uppercase font-bold h-9">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 rounded-full text-[10px] uppercase font-bold h-9" onClick={handleDeleteCustomer}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
