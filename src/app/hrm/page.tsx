
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { UserRoundCog, UserPlus, Clock, Search, MoreVertical, Mail, Briefcase, Loader2, Filter } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export default function HRMPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");

  const employeesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "employees"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: employees, isLoading } = useCollection(employeesQuery);

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

    const colRef = collection(db, "companies", companyId, "branches", branchId, "employees");
    addDocumentNonBlocking(colRef, employeeData);
    setIsAddModalOpen(false);
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
          <Button variant="outline" className="gap-2 shrink-0"><Clock className="h-4 w-4" /> Attendance</Button>
          <Button className="bg-purple-600 hover:bg-purple-700 gap-2 rounded-full px-6 shrink-0" onClick={() => setIsAddModalOpen(true)}>
            <UserPlus className="h-4 w-4" /> New Staff
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search employees..." 
            className="pl-9 bg-background border-none ring-1 ring-input" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto">
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
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-[10px] shrink-0">
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
                    <TableCell className="font-semibold text-xs">${emp.salary?.toLocaleString()}/mo</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px]" variant="secondary">Active</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
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
          <p className="text-sm text-muted-foreground max-w-sm mt-2">
            Your workforce data, payroll details, and performance reports will be centralized here.
          </p>
          <Button className="mt-6 bg-purple-600 rounded-full px-8" onClick={() => setIsAddModalOpen(true)}>Register Staff</Button>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">Add New Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEmployee} className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs">First Name</Label>
                <Input id="firstName" name="firstName" required className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                <Input id="lastName" name="lastName" required className="text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs">Work Email (Optional)</Label>
                <Input id="email" name="email" type="email" className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salary" className="text-xs">Monthly Salary ($)</Label>
                <Input id="salary" name="salary" type="number" required className="text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="jobTitle" className="text-xs">Job Title</Label>
                <Input id="jobTitle" name="jobTitle" required placeholder="e.g. Sales Executive" className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department" className="text-xs">Department</Label>
                <Input id="department" name="department" required placeholder="e.g. Sales & Marketing" className="text-sm" />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-full w-full sm:w-auto">Cancel</Button>
              <Button type="submit" className="bg-purple-600 rounded-full px-8 w-full sm:w-auto">Onboard Staff</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
