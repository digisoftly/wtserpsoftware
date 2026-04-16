"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Scan, Search, Barcode, Plus, Loader2, MoreVertical, Filter, History, Tag, CheckCircle2, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, serverTimestamp, doc, setDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

  const stats = React.useMemo(() => ({
    total: serials?.length || 0,
    available: serials?.filter(s => s.status === 'available').length || 0,
    sold: serials?.filter(s => s.status === 'sold').length || 0,
    service: serials?.filter(s => ['under_service', 'damaged'].includes(s.status)).length || 0
  }), [serials]);

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

  const filteredSerials = React.useMemo(() => {
    return serials?.filter(s => {
      const matchesSearch = s.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [serials, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return <Badge variant="outline" className="bg-green-50 text-green-700 border-none text-[9px] uppercase h-5 font-black">Available</Badge>;
      case 'sold': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-none text-[9px] uppercase h-5 font-black">Sold</Badge>;
      case 'returned': return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-none text-[9px] uppercase h-5 font-black">Returned</Badge>;
      case 'damaged': return <Badge variant="outline" className="bg-red-50 text-red-700 border-none text-[9px] uppercase h-5 font-black">Damaged</Badge>;
      default: return <Badge variant="outline" className="text-[9px] uppercase h-5">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-xl font-bold font-headline">Serial Tracking</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full h-9 px-6 text-[10px] uppercase font-bold border-none shadow-sm ring-1 ring-slate-200"><Scan className="h-4 w-4 mr-2" /> Bulk</Button>
          <Button className="bg-purple-600 hover:bg-purple-700 gap-2 rounded-full px-6 shadow-lg h-9 text-[10px] uppercase font-bold" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4" /> Register Unit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Serials" value={stats.total} icon={Barcode} colorClass="bg-blue-600" subtext="Unique units" />
        <KPICard title="Available" value={stats.available} icon={CheckCircle2} colorClass="bg-green-600" subtext="Ready to sell" />
        <KPICard title="Sold" value={stats.sold} icon={History} colorClass="bg-purple-600" subtext="Life time sales" />
        <KPICard title="Under Service" value={stats.service} icon={AlertCircle} colorClass="bg-red-600" subtext="Issues/RMA" />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3 rounded-xl border shadow-sm ring-1 ring-slate-100">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Verify S/N or IMEI..." className="pl-9 h-9 border-none bg-background text-xs ring-1 ring-slate-200" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-9 text-[10px] uppercase font-bold rounded-lg border-none ring-1 ring-slate-200 shadow-sm"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Units</SelectItem>
              <SelectItem value="available" className="text-xs">Available</SelectItem>
              <SelectItem value="sold" className="text-xs">Sold</SelectItem>
              <SelectItem value="damaged" className="text-xs">Damaged</SelectItem>
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
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-bold h-9">Serial / IMEI</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9">Model</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9">Status</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold h-9 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSerials?.map((s) => (
                  <TableRow key={s.id} className="h-12 hover:bg-muted/10 transition-colors">
                    <TableCell className="font-mono font-black text-[10px] text-slate-900 uppercase">{s.serialNumber}</TableCell>
                    <TableCell className="text-xs truncate max-w-[150px] font-bold">
                      {products?.find(p => p.id === s.productId)?.name || "---"}
                    </TableCell>
                    <TableCell>{getStatusBadge(s.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-purple-50 text-purple-600 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="p-16 bg-white rounded-3xl border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
          <Barcode className="h-10 w-10 text-purple-200 mb-4" />
          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">No Serial Data</p>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-purple-600 p-6 text-white flex-row items-center gap-3">
            <Barcode className="h-6 w-6" />
            <DialogTitle className="text-xl font-bold font-headline uppercase">Register Unit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSerial} className="p-6 space-y-4 bg-slate-50">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Product</Label>
              <Select name="productId" required>
                <SelectTrigger className="h-11 rounded-xl bg-white border-none ring-1 ring-slate-200 shadow-sm"><SelectValue placeholder="Identify model..." /></SelectTrigger>
                <SelectContent>{products?.filter(p => p.serialNumberTrackingRequired).map(p => <SelectItem key={p.id} value={p.id} className="text-xs">{p.name} ({p.sku})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Unique ID</Label>
              <Input name="serialNumber" required placeholder="Scan or type..." className="h-11 rounded-xl border-none ring-1 ring-slate-200 text-xs" />
            </div>
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 h-12 rounded-2xl text-[10px] font-black uppercase mt-4 tracking-widest shadow-xl shadow-purple-100 active:scale-95 transition-all">Confirm Entry</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
