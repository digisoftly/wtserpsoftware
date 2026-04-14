
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Scan, Search, Barcode, Plus, Loader2, MoreVertical, Filter, History, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, setDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { KPICard } from "@/components/dashboard/kpi-card"
import { cn } from "@/lib/utils"

export default function SerialInventoryPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  const serialsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "serial_numbers"), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: serials, isLoading } = useCollection(serialsQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "products");
  }, [db, companyId, branchId]);
  const { data: products } = useCollection(productsQuery);

  const handleAddSerial = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!db || !companyId || !branchId) return;

    const serialRef = doc(collection(db, "companies", companyId, "branches", branchId, "serial_numbers"));
    await setDoc(serialRef, {
      id: serialRef.id,
      companyId,
      branchId,
      productId: formData.get("productId") as string,
      serialNumber: formData.get("serialNumber") as string,
      status: "available",
      createdAt: serverTimestamp(),
    });
    setIsAddModalOpen(false);
  };

  const filteredSerials = serials?.filter(s => {
    const matchesSearch = s.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Available</Badge>;
      case 'sold': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Sold</Badge>;
      case 'returned': return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Returned</Badge>;
      case 'damaged': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Damaged</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-purple-600">Unit Lifecycle Tracking</h1>
          <p className="text-sm text-muted-foreground mt-1">Unique item monitoring and warranty verification</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full gap-2"><Scan className="h-4 w-4" /> Bulk Upload</Button>
          <Button className="bg-purple-600 hover:bg-purple-700 gap-2 rounded-full px-6 shadow-lg shadow-purple-100" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4" /> Manual Register
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Serials" value={serials?.length || 0} icon={Barcode} colorClass="bg-purple-500" />
        <KPICard title="Ready to Sell" value={serials?.filter(s => s.status === 'available').length || 0} icon={Tag} colorClass="bg-green-500" />
        <KPICard title="Sold Units" value={serials?.filter(s => s.status === 'sold').length || 0} icon={History} colorClass="bg-blue-500" />
        <KPICard title="Service/Damaged" value={serials?.filter(s => ['damaged', 'under_service'].includes(s.status)).length || 0} icon={Filter} colorClass="bg-red-500" />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Verify S/N or IMEI..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Units</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="damaged">Damaged</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
      ) : serials && serials.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow><TableHead>Unique Serial / IMEI</TableHead><TableHead>Product Family</TableHead><TableHead>Status</TableHead><TableHead>Registered</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {filteredSerials?.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="font-mono font-bold text-purple-700 text-sm">{s.serialNumber}</TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">{products?.find(p => p.id === s.productId)?.name || "Unknown SKU"}</div>
                      <div className="text-[10px] text-muted-foreground font-mono uppercase">{s.productId.slice(-6)}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(s.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(s.createdAt?.toDate()).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="p-16 bg-white rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center">
          <Barcode className="h-12 w-12 text-purple-200 mb-4" />
          <h2 className="text-xl font-headline font-bold">Serial Database Empty</h2>
          <p className="text-sm text-muted-foreground max-w-md mt-2">Unique items are tracked here once added via Purchase Orders or manual intake.</p>
          <Button className="mt-6 bg-purple-600 rounded-full px-8" onClick={() => setIsAddModalOpen(true)}>Add First Serial</Button>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Register Serialized Unit</DialogTitle></DialogHeader>
          <form onSubmit={handleAddSerial} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase">Product Catalog</Label>
              <Select name="productId" required>
                <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Choose product..." /></SelectTrigger>
                <SelectContent>{products?.filter(p => p.serialNumberTrackingRequired).map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-purple-600">Unique ID / Serial Number</Label>
              <Input name="serialNumber" required placeholder="Scan or type IMEI/Serial" className="h-12 border-2 border-purple-50 rounded-xl" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-purple-600 rounded-lg px-8">Confirm Registration</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
