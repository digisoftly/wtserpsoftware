"use client"

import * as React from "react"
import { Search, Plus, Loader2, MoreVertical, Edit, Trash2, Boxes, Filter } from "lucide-react"
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

  const filtered = products?.filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Button className="rounded-full gap-2 h-9 px-6 bg-blue-600 font-bold" onClick={() => setIsAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search SKU or Name..." className="pl-9 h-9 text-xs border-none bg-white shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" className="h-9 rounded-lg"><Filter className="h-3.5 w-3.5 mr-2" /> Filter</Button>
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
                <TableRow key={p.id} className="h-12 hover:bg-muted/10">
                  <TableCell>
                    <div className="font-bold text-xs">{p.name}</div>
                    <div className="text-[9px] text-muted-foreground uppercase">{p.productType}</div>
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-muted-foreground uppercase">{p.sku}</TableCell>
                  <TableCell>
                    <span className={cn("text-xs font-bold", (p.currentStock || 0) <= (p.minStockLevel || 5) ? "text-red-600" : "text-blue-600")}>
                      {p.currentStock || 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-bold">৳{p.unitPrice?.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full"><MoreVertical className="h-3.5 w-3.5" /></Button>
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
          <div className="bg-blue-600 p-6 text-white flex items-center gap-3">
            <Boxes className="h-6 w-6" />
            <h2 className="text-xl font-bold">New Item</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
             <div className="space-y-1"><label className="text-[10px] font-bold uppercase">Name</label><Input className="h-9" placeholder="Product name" /></div>
             <div className="space-y-1"><label className="text-[10px] font-bold uppercase">SKU</label><Input className="h-9" placeholder="ID" /></div>
             <div className="space-y-1"><label className="text-[10px] font-bold uppercase">Price</label><Input className="h-9" type="number" /></div>
             <div className="space-y-1"><label className="text-[10px] font-bold uppercase">Stock</label><Input className="h-9" type="number" /></div>
          </div>
          <div className="p-4 bg-muted/20 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-blue-600">Save Item</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}