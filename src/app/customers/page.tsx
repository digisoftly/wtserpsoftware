
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Users, UserPlus, Search, MoreVertical, Mail, Phone, MapPin, Loader2, Building2, User, Check } from "lucide-react"
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

  const filteredCustomers = customers?.filter(c => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCustomer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!customersQuery || !companyId || !branchId) return;

    const customerData = {
      companyId,
      branchId,
      customerType,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phoneNumber: formData.get("phoneNumber") as string,
      companyName: customerType === "company" ? (formData.get("companyName") as string) : "",
      city: formData.get("city") as string,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    addDocumentNonBlocking(customersQuery, customerData);
    setIsAddModalOpen(false);
    setCustomerType("individual"); // Reset for next time
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-cyan-600">Customers</h1>
          <p className="text-muted-foreground mt-1">Client relationship management</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700 gap-2 rounded-full" onClick={() => setIsAddModalOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search name, email, or company..." 
            className="pl-9 bg-background border-none ring-1 ring-input" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
        </div>
      ) : customers && customers.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
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
                      <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 gap-1">
                        <Building2 className="h-3 w-3" /> Company
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-cyan-200 bg-cyan-50 text-cyan-700 gap-1">
                        <User className="h-3 w-3" /> Individual
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold">{customer.firstName} {customer.lastName}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-mono">ID: {customer.id.slice(-6)}</div>
                  </TableCell>
                  <TableCell>
                    <span className={cn(customer.customerType === "company" ? "font-semibold text-foreground" : "text-muted-foreground text-xs italic")}>
                      {customer.companyName || "N/A"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" /> {customer.email}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" /> {customer.phoneNumber}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs">
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
        </Card>
      ) : (
        <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center mb-4 text-cyan-500">
            <Users className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-headline font-bold">Customer Directory Empty</h2>
          <p className="text-muted-foreground max-w-sm mt-2">
            Build your client base by adding new contacts or importing your existing CRM list.
          </p>
          <Button className="mt-6 bg-cyan-600 rounded-full" onClick={() => setIsAddModalOpen(true)}>Add Your First Customer</Button>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline text-2xl text-cyan-600">Register New Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCustomer} className="space-y-6 pt-4">
            <div className="space-y-3">
              <Label className="text-base">What type of customer are you adding?</Label>
              <RadioGroup 
                defaultValue="individual" 
                value={customerType}
                onValueChange={(val) => setCustomerType(val as "individual" | "company")}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="individual" id="individual" className="peer sr-only" />
                  <Label
                    htmlFor="individual"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-cyan-600 [&:has([data-state=checked])]:border-cyan-600"
                  >
                    <User className="mb-2 h-6 w-6" />
                    <span className="font-bold">Individual</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">Single person or walk-in client</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="company" id="company" className="peer sr-only" />
                  <Label
                    htmlFor="company"
                    className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-amber-600 [&:has([data-state=checked])]:border-amber-600"
                  >
                    <Building2 className="mb-2 h-6 w-6" />
                    <span className="font-bold">Company</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">Corporate entity or business partner</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" required placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" required placeholder="Doe" />
              </div>
            </div>

            {customerType === "company" && (
              <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                <Label htmlFor="companyName">Legal Company Name</Label>
                <Input id="companyName" name="companyName" required placeholder="Acme Corporation Ltd." />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" name="email" type="email" required placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" name="phoneNumber" required placeholder="+880 1700-000000" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City / Location</Label>
              <Input id="city" name="city" placeholder="Dhaka, Bangladesh" />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="rounded-full">Cancel</Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700 rounded-full px-8">Save Customer Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
