"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Scan, Search, Barcode, Plus, Loader2, MoreVertical } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"

export default function SerialInventoryPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  const serialsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "serial_numbers"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: serials, isLoading } = useCollection(serialsQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "products");
  }, [db, companyId, branchId]);
  const { data: products } = useCollection(productsQuery);

  const handleAddSerial = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) return;

    const serialData = {
      companyId,
      branchId,
      productId: formData.get("productId") as string,
      serialNumber: formData.get("serialNumber") as string,
      status: "in_stock",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const colRef = collection(db, "companies", companyId, "branches", branchId, "serial_numbers");
    addDocumentNonBlocking(colRef, serialData);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-blue-600">Serial Inventory</h1>
          <p className="text-muted-foreground mt-1">Track individual items by serial number/IMEI</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Scan className="h-4 w-4" /> Bulk Scan
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 gap-2 rounded-full" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Scan or search serial number..." className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : serials && serials.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Serial Number</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serials?.map((s) => {
                const product = products?.find(p => p.id === s.productId);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono font-bold text-blue-600">{s.serialNumber}</TableCell>
                    <TableCell>{product?.name || "Unknown Product"}</TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-700">{s.status}</Badge></TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-400">
            <Scan className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-headline font-bold">No Tracked Items</h2>
          <p className="text-muted-foreground max-w-sm mt-2">
            Start scanning serial numbers to track high-value items individually in your inventory.
          </p>
          <Button className="mt-6 bg-blue-600" onClick={() => setIsAddModalOpen(true)}>Add Your First Serial</Button>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Register Serialized Item</DialogTitle></DialogHeader>
          <form onSubmit={handleAddSerial} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Select Product</Label>
              <Select name="productId" required>
                <SelectTrigger><SelectValue placeholder="Choose product" /></SelectTrigger>
                <SelectContent>
                  {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Serial Number / IMEI</Label>
              <Input name="serialNumber" required placeholder="Scan barcode or type ID" />
            </div>
            <Button type="submit" className="w-full bg-blue-600">Register Item</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
