"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Wrench, Plus, ShieldCheck, Loader2, Search, MoreVertical, Calendar, FileCheck } from "lucide-react"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function ContractsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  const contractsColRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "service_contracts");
  }, [db, companyId, branchId]);

  const contractsQuery = useMemoFirebase(() => {
    if (!contractsColRef) return null;
    return query(contractsColRef, orderBy("createdAt", "desc"));
  }, [contractsColRef]);

  const { data: contracts, isLoading } = useCollection(contractsQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  const handleAddContract = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!contractsColRef || !companyId || !branchId) return;

    const contractData = {
      companyId,
      branchId,
      contractNumber: `AMC-${Date.now().toString().slice(-6)}`,
      customerId: formData.get("customerId") as string,
      serviceName: formData.get("serviceName") as string,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    addDocumentNonBlocking(contractsColRef, contractData);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-emerald-600">Service Contracts</h1>
          <p className="text-muted-foreground mt-1">Manage AMC and warranty agreements</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2 rounded-full shadow-lg shadow-emerald-100" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Contract
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : contracts && contracts.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Contract #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => {
                  const customer = customers?.find(cust => cust.id === c.customerId);
                  return (
                    <TableRow key={c.id} className="hover:bg-muted/30">
                      <TableCell className="font-bold">{c.contractNumber}</TableCell>
                      <TableCell>{customer ? `${customer.firstName} ${customer.lastName}` : "Loading..."}</TableCell>
                      <TableCell className="text-sm font-medium">{c.serviceName}</TableCell>
                      <TableCell className="text-xs">
                        {new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell><Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge></TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 text-emerald-500">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-headline font-bold">No Service Contracts</h2>
          <p className="text-muted-foreground max-w-sm mt-2">
            Keep track of Annual Maintenance Contracts (AMC) and warranty periods for your clients.
          </p>
          <Button className="mt-6 bg-emerald-600 rounded-full px-8" onClick={() => setIsAddModalOpen(true)}>Add First Contract</Button>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Service Agreement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddContract} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Select Customer</Label>
              <Select name="customerId" required>
                <SelectTrigger><SelectValue placeholder="Client" /></SelectTrigger>
                <SelectContent>
                  {customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Service Name</Label>
              <Input name="serviceName" required placeholder="e.g. Monthly CCTV Maintenance" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input name="startDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input name="endDate" type="date" required />
              </div>
            </div>
            <Button type="submit" className="w-full bg-emerald-600 rounded-full">Save Contract</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
