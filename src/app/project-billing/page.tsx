"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Layers, CreditCard, Plus, Loader2, MoreVertical, ReceiptText } from "lucide-react"
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

export default function ProjectBillingPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  const billingQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "project_bills"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: bills, isLoading } = useCollection(billingQuery);

  const projectsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "projects");
  }, [db, companyId, branchId]);
  const { data: projects } = useCollection(projectsQuery);

  const handleAddBill = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!billingQuery || !companyId || !branchId) return;

    const billData = {
      companyId,
      branchId,
      billNumber: `BILL-${Date.now().toString().slice(-6)}`,
      projectId: formData.get("projectId") as string,
      milestone: formData.get("milestone") as string,
      amount: Number(formData.get("amount")),
      billDate: new Date().toISOString(),
      status: "unpaid",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    addDocumentNonBlocking(billingQuery, billData);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-violet-600">Project Billing</h1>
          <p className="text-muted-foreground mt-1">Milestone billing and expense tracking</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700 gap-2 rounded-full shadow-lg" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Generate Project Bill
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-violet-600" /></div>
      ) : bills && bills.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Bill #</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Milestone</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((b) => {
                  const project = projects?.find(p => p.id === b.projectId);
                  return (
                    <TableRow key={b.id} className="hover:bg-muted/30">
                      <TableCell className="font-bold">{b.billNumber}</TableCell>
                      <TableCell>{project?.name || "Unknown Project"}</TableCell>
                      <TableCell className="text-sm font-medium">{b.milestone}</TableCell>
                      <TableCell className="font-bold text-violet-600">৳{b.amount?.toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline" className="border-violet-200 text-violet-700 bg-violet-50">Unpaid</Badge></TableCell>
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
          <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center mb-4 text-violet-500">
            <ReceiptText className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-headline font-bold">Nothing to Bill</h2>
          <p className="text-muted-foreground max-w-sm mt-2">
            When project milestones are completed, you'll be able to generate invoices and track costs here.
          </p>
          <Button className="mt-6 bg-violet-600 rounded-full px-8" onClick={() => setIsAddModalOpen(true)}>Create Milestone Bill</Button>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Project Milestone Billing</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddBill} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Associated Project</Label>
              <Select name="projectId" required>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Milestone Description</Label>
              <Input name="milestone" required placeholder="e.g. Phase 1 Completion" />
            </div>
            <div className="space-y-2">
              <Label>Billing Amount (৳)</Label>
              <Input name="amount" type="number" step="0.01" required placeholder="0.00" />
            </div>
            <Button type="submit" className="w-full bg-violet-600 rounded-full">Post Bill</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
