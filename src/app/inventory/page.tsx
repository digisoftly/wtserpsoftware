"use client"

import * as React from "react"
import { Search, Plus, Loader2, MoreVertical, Edit, Trash2, Boxes, Filter, AlertCircle, ShoppingBag, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { KPICard } from "@/components/dashboard/kpi-card"

export default function InventoryPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isAddOpen, setIsAddOpen] = React.useState(false);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "products");
  }, [db, companyId, branchId]);
  const { data: products, isLoading } = useCollection(productsQuery);

  const stats = React.useMemo(() => ({
    totalProducts: products?.length || 0,
    lowStock: products?.filter(p => (p.currentStock || 0) <= (p.minStockLevel || 5)).length || 0,
    totalValue: products?.reduce((s, p) => s + ((p.currentStock || 0) * (p.unitPrice || 0)), 0) || 0
  }), [products]);

  const filtered = products?.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-headline">Inventory</h1>
        <Button className="rounded-full gap-2 h-9 px-6 bg-blue-600 font-bold text-[10px] uppercase shadow-lg shadow-blue-100" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title="Total Products" value={stats.totalProducts} icon={Boxes} colorClass="bg-blue-600" subtext="In catalog" />
        <KPICard title="Low Stock Items" value={stats.lowStock} icon={AlertCircle} colorClass="bg-red-600" subtext="Below limit" />
        <KPICard title="Total Stock Value" value={`৳${stats.totalValue.toLocaleString()}`} icon={DollarSign} colorClass="bg-green-600" subtext="Retail evaluation" />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search SKU or Name..." className="pl-9 h-9 text-xs border-none bg-white shadow-sm ring-1 ring-slate-100" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" className="h-9 rounded-lg text-[10px] uppercase font-bold ring-1 ring-slate-200 border-none"><Filter className="h-3.5 w-3.5 mr-2" /> Filter</Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead className="h-9 text-[10px] uppercase font-bold">Item</TableHead>
                <TableHead className="h-9 text-[10px] uppercase font-bold">SKU</TableHead>
                <TableHead className="h-9 text-[10px] uppercase font-bold">Stock</TableHead>
                <TableHead className="h-9 text-[10px] uppercase font-bold">Price</TableHead>
                <TableHead className="h-9 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map((p) => (
                <TableRow key={p.id} className="h-12 hover:bg-muted/10 transition-colors">
                  <TableCell>
                    <div className="font-bold text-xs">{p.name}</div>
                    <div className="text-[9px] text-muted-foreground uppercase font-black">{p.productType}</div>
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-muted-foreground uppercase">{p.sku}</TableCell>
                  <TableCell>
                    <span className={cn("text-xs font-black", (p.currentStock || 0) <= (p.minStockLevel || 5) ? "text-red-600" : "text-blue-600")}>
                      {p.currentStock || 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-900">৳{p.unitPrice?.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem className="text-xs"><Edit className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs text-red-600"><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-blue-600 p-6 text-white flex-row items-center gap-3 space-y-0">
            <Boxes className="h-6 w-6" />
            <DialogTitle className="text-xl font-bold font-headline uppercase tracking-tight">New Item</DialogTitle>
          </DialogHeader>
          <div className="p-6 grid grid-cols-2 gap-4 bg-slate-50">
             <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Name</Label><Input className="h-10 rounded-xl border-none ring-1 ring-slate-200 text-xs" placeholder="e.g. 4K Pro Camera" /></div>
             <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">SKU</Label><Input className="h-10 rounded-xl border-none ring-1 ring-slate-200 text-xs" placeholder="CAM-001" /></div>
             <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Unit Price</Label><Input className="h-10 rounded-xl border-none ring-1 ring-slate-200 text-xs" type="number" placeholder="0.00" /></div>
             <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Initial Stock</Label><Input className="h-10 rounded-xl border-none ring-1 ring-slate-200 text-xs" type="number" placeholder="0" /></div>
          </div>
          <div className="p-4 bg-white flex justify-end gap-2 border-t">
            <Button variant="ghost" size="sm" className="rounded-full text-[10px] uppercase font-bold" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-blue-600 rounded-full px-6 text-[10px] uppercase font-bold shadow-lg shadow-blue-100">Save Item</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
