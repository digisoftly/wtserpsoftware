"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { UserRoundCog, UserPlus, Clock, Search, MoreVertical, Mail, Briefcase, Loader2, Filter, Users, DollarSign, Edit, Trash2, Eye, Download } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy, doc, updateDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { KPICard } from "@/components/dashboard/kpi-card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"

export default function HRMPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const employeesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "employees"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: employees, isLoading } = useCollection(employeesQuery);

  const totalStaff = employees?.length || 0;
  const totalPayroll = employees?.reduce((sum, emp) => sum + (emp.salary || 0), 0) || 0;
  const activeStaff = employees?.filter(e => e.employmentStatus === 'active').length || 0;

  const handleAddEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) return;

    const employeeData = {
      companyId,
      branchId,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string || "",
      phoneNumber: formData.get("phoneNumber") as string || "",
      jobTitle: formData.get("jobTitle") as string,
      department: formData.get("department") as string,
      employeeIdNumber: `EMP-${Date.now().toString().slice(-4)}`,
      hireDate: new Date().toISOString(),
      salary: Number(formData.get("salary")),
      employmentStatus: "active",
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "branches", branchId, "employees"), employeeData);
    setIsAddModalOpen(false);
    toast({ title: "Staff Registered", description: `${employeeData.firstName} has been onboarded.` });
  };

  const handleUpdateEmployee = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRecord || !db) return;
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    try {
      const docRef = doc(db, "companies", companyId!, "branches", branchId!, "employees", selectedRecord.id);
      await updateDoc(docRef, {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        phoneNumber: formData.get("phoneNumber"),
        jobTitle: formData.get("jobTitle"),
        department: formData.get("department"),
        salary: Number(formData.get("salary")),
        updatedAt: serverTimestamp()
      });
      toast({ title: "Staff Record Updated" });
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = () => {
    if (!selectedRecord || !db) return;
    const docRef = doc(db, "companies", companyId!, "branches", branchId!, "employees", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Staff Removed" });
    setIsDeleteAlertOpen(false);
  };

  const openEdit = (emp: any) => {
    setSelectedRecord(emp);
    setIsEditModalOpen(true);
  };

  const filteredEmployees = employees?.filter(emp => 
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-purple-600">Human Resources</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage staff, payroll, and attendance</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button variant="outline" className="gap-2 shrink-0 rounded-full"><Clock className="h-4 w-4" /> Attendance</Button>
          <Button className="bg-purple-600 hover:bg-purple-700 gap-2 rounded-full px-6 shrink-0 shadow-lg" onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="h-4 w-4" /> New Staff
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Staff" value={totalStaff} icon={Users} colorClass="bg-purple-500" />
        <KPICard title="Active Status" value={activeStaff} icon={UserRoundCog} colorClass="bg-blue-500" />
        <KPICard title="Monthly Payroll" value={`৳${totalPayroll.toLocaleString()}`} icon={DollarSign} colorClass="bg-green-500" />
        <KPICard title="Departments" value={new Set(employees?.map(e => e.department)).size} icon={Briefcase} colorClass="bg-orange-500" />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search employees..." 
            className="pl-9 bg-background" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto rounded-full">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : employees && employees.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees?.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-[10px] shrink-0 uppercase">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-xs md:text-sm">{emp.firstName} {emp.lastName}</div>
                          <div className="text-[9px] text-muted-foreground uppercase font-mono">{emp.employeeIdNumber}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <Briefcase className="h-3 w-3 text-muted-foreground" /> {emp.jobTitle}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{emp.department}</TableCell>
                    <TableCell className="font-semibold text-xs">৳{emp.salary?.toLocaleString()}/mo</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px]" variant="secondary">Active</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(emp)}><Edit className="mr-2 h-4 w-4" /> Edit Profile</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedRecord(emp); toast({ title: "Generating Profile PDF" }); }}><Download className="mr-2 h-4 w-4" /> Export ID Card</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedRecord(emp); setIsDeleteAlertOpen(true); }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Terminate/Delete
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
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4 text-purple-500">
            <UserRoundCog className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-headline font-bold">Staff Directory Empty</h2>
          <p className="text-sm text-muted-foreground max-w-sm mt-2">Register your first employee to begin managing payroll and access.</p>
          <Button className="mt-6 bg-purple-600 rounded-full px-8 shadow-md" onClick={() => setIsAddModalOpen(true)}>Register Staff</Button>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); setSelectedRecord(null); } }}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">{isEditModalOpen ? "Adjust Staff Record" : "Add New Employee"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={isEditModalOpen ? handleUpdateEmployee : handleAddEmployee} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">First Name</Label>
                <Input name="firstName" required defaultValue={selectedRecord?.firstName} className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Last Name</Label>
                <Input name="lastName" required defaultValue={selectedRecord?.lastName} className="text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Work Email (Optional)</Label>
                <Input name="email" type="email" defaultValue={selectedRecord?.email} className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Phone Number (Optional)</Label>
                <Input name="phoneNumber" defaultValue={selectedRecord?.phoneNumber} className="text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Job Title</Label>
                <Input name="jobTitle" required defaultValue={selectedRecord?.jobTitle} placeholder="e.g. Sales Executive" className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Department</Label>
                <Input name="department" required defaultValue={selectedRecord?.department} placeholder="e.g. Sales & Marketing" className="text-sm" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Monthly Salary (৳)</Label>
              <Input name="salary" type="number" required defaultValue={selectedRecord?.salary} className="text-sm" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="rounded-full">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 rounded-full px-8">
                {isSubmitting ? <Loader2 className="animate-spin" /> : isEditModalOpen ? "Save Changes" : "Onboard Staff"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate Staff Record?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to remove {selectedRecord?.firstName} from the active directory? This will archive their payroll history.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteEmployee}>Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
