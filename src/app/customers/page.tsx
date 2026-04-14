
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Search, MoreVertical, Mail, Phone, MapPin, Loader2, Building2, User, Check, Filter, UserCheck, UserX, Building } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { KPICard } from "@/components/dashboard/kpi-card"

export default function CustomersPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [customerType, setCustomerType] = React.useState<"individual" | "company">("individual");

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);

  const { data: customers, isLoading } = useCollection(customersQuery);

  const totalCustomers = customers?.length || 0;
  const companyCount = customers?.filter(c => c.customerType === 'company').length || 0;
  const individualCount = totalCustomers - companyCount;

  const filteredCustomers = customers?.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCustomer = (e: React.FormEvent<HTMLFormElement>) => {
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

    const colRef = collection(db, "companies", companyId, "branches", branchId, "customers");
    addDocumentNonBlocking(colRef, customerData);
    setIsAddModalOpen(false);
    setCustomerType("individual");
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
        <KPICard title="Total Clients" value={totalCustomers} icon={Users} colorClass="bg-cyan-500" />
        <KPICard title="Individuals" value={individualCount} icon={UserCheck} colorClass="bg-blue-500" />
        <KPICard title="Corporate" value={companyCount} icon={Building} colorClass="bg-amber-500" />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full max-sm:max-w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search name, email, or company..." 
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
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      ) : customers && customers.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers?.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      {customer.customerType === "company" ? (
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 gap-1 text-[10px]">
                          <Building2 className="h-3 w-3" /> Company
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700 gap-1 text-[10px]">
                          <User className="h-3 w-3" /> Individual
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-xs md:text-sm">{customer.firstName} {customer.lastName}</div>
                      <div className="text-[10px] text-muted-foreground uppercase font-mono">ID: {customer.id.slice(-6)}</div>
                    </TableCell>
                    <TableCell>
                      <span className={cn("text-xs", customer.customerType === "company" ? "font-semibold text-foreground" : "text-muted-foreground italic")}>
                        {customer.companyName || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Mail className="h-3 w-3" /> {customer.email || "No email"}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Phone className="h-3 w-3" /> {customer.phoneNumber || "No phone"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-[10px]">
                        <MapPin className="h-3 w-3 text-muted-foreground" /> {customer.city || "N/A"}
                      </div>
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
          <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center mb-4 text-cyan-500">
            <Users className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-headline font-bold">Customer Directory Empty</h2>
          <p className="text-sm text-muted-foreground max-w-sm mt-2">
            Build your client base by adding new contacts or importing your existing CRM list.
          </p>
          <Button className="mt-6 bg-cyan-600 rounded-full px-8" onClick={() => setIsAddModalOpen(true)}>Add Your First Customer</Button>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline text-xl md:text-2xl text-cyan-600">Register New Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCustomer} className="space-y-6 pt-4">
            <div className="space-y-3">
              <Label className="text-sm md:text-base">What type of customer are you adding?</Label>
              <RadioGroup 
                defaultValue="individual" 
                value={customerType}
                onValueChange={(val) => setCustomerType(val as "individual" | "company")}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="individual" id="individual" className="peer sr-only" />
                  <Label
                    htmlFor="individual"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-cyan-600 cursor-pointer transition-all"
                  >
                    <User className="mb-2 h-6 w-6" />
                    <span className="font-bold text-sm">Individual</span>
                    <span className="text-[10px] text-muted-foreground text-center mt-1">Single person or walk-in client</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="company" id="company" className="peer sr-only" />
                  <Label
                    htmlFor="company"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-amber-600 cursor-pointer transition-all"
                  >
                    <Building2 className="mb-2 h-6 w-6" />
                    <span className="font-bold text-sm">Company</span>
                    <span className="text-[10px] text-muted-foreground text-center mt-1">Corporate entity or business partner</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-xs">First Name</Label>
                <Input id="firstName" name="firstName" required placeholder="John" className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                <Input id="lastName" name="lastName" required placeholder="Doe" className="text-sm" />
              </div>
            </div>

            {customerType === "company" && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                <Label htmlFor="companyName" className="text-xs">Legal Company Name</Label>
                <Input id="companyName" name="companyName" required placeholder="Acme Corporation Ltd." className="text-sm" />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs">Email Address (Optional)</Label>
                <Input id="email" name="email" type="email" placeholder="john@example.com" className="text-sm" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-xs">Phone Number (Optional)</Label>
                <Input id="phoneNumber" name="phoneNumber" placeholder="+880 1700-000000" className="text-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-xs">City / Location</Label>
              <Input id="city" name="city" placeholder="Dhaka, Bangladesh" className="text-sm" />
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-full w-full sm:w-auto">Cancel</Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 rounded-full px-8 w-full sm:w-auto">Save Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
