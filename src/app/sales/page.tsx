"use client"

import * as React from "react"
import { Plus, Search, Loader2, MoreVertical, Eye, Edit, Trash2, ShoppingCart, Scan, TrendingUp, Calendar, ShoppingBag, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { KPICard } from "@/components/dashboard/kpi-card"

export default function SalesPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "sales_invoices"), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: invoices, isLoading } = useCollection(invoicesQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  const stats = React.useMemo(() => {
    if (!invoices) return { today: 0, monthly: 0, total: 0, due: 0 };
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7);
    
    return {
      today: invoices.filter(i => i.invoiceDate?.startsWith(today)).reduce((s, i) => s + (i.totalAmount || 0), 0),
      monthly: invoices.filter(i => i.invoiceDate?.startsWith(thisMonth)).reduce((s, i) => s + (i.totalAmount || 0), 0),
      total: invoices.length,
      due: invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.totalAmount || 0), 0)
    };
  }, [invoices]);

  const handleDelete = () => {
    if (!selectedRecord || !db || !companyId || !branchId) return;
    const docRef = doc(db, "companies", companyId, "branches", branchId, "sales_invoices", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Deleted" });
    setIsDeleteAlertOpen(false);
  };

  const filteredInvoices = invoices?.filter(inv => inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-headline">Sales</h1>
        <Button className="rounded-full gap-2 h-9 px-6 bg-blue-600 font-bold text-[10px] uppercase shadow-lg shadow-blue-100" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" /> New Sale
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Today Sales" value={`৳${stats.today.toLocaleString()}`} icon={TrendingUp} colorClass="bg-blue-600" subtext="Current Day" />
        <KPICard title="Monthly Sales" value={`৳${stats.monthly.toLocaleString()}`} icon={Calendar} colorClass="bg-green-600" subtext="Current Month" />
        <KPICard title="Total Orders" value={stats.total} icon={ShoppingBag} colorClass="bg-purple-600" subtext="Life time" />
        <KPICard title="Due Amount" value={`৳${stats.due.toLocaleString()}`} icon={AlertCircle} colorClass="bg-red-600" subtext="Outstanding" />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search invoice..." className="pl-9 h-9 text-xs border-none bg-white shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/20">
                <TableHead className="h-9 text-[10px] uppercase font-bold">Invoice</TableHead>
                <TableHead className="h-9 text-[10px] uppercase font-bold">Client</TableHead>
                <TableHead className="h-9 text-[10px] uppercase font-bold">Total</TableHead>
                <TableHead className="h-9 text-[10px] uppercase font-bold">Status</TableHead>
                <TableHead className="h-9 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices?.map((inv) => (
                <TableRow key={inv.id} className="h-12 hover:bg-muted/10 transition-colors">
                  <TableCell className="font-bold text-xs">{inv.invoiceNumber}</TableCell>
                  <TableCell className="text-xs truncate max-w-[150px]">
                    {customers?.find(c => c.id === inv.customerId)?.firstName || "Client"}
                  </TableCell>
                  <TableCell className="font-bold text-xs">৳{inv.totalAmount?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[9px] h-5 uppercase border-none", inv.status === 'paid' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem className="text-xs"><Eye className="mr-2 h-3.5 w-3.5" /> View</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs"><Edit className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-xs text-red-600" onClick={() => { setSelectedRecord(inv); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* POS Placeholder Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-blue-600 p-6 text-white flex-row items-center gap-3 space-y-0">
            <ShoppingCart className="h-6 w-6" />
            <DialogTitle className="text-xl font-bold font-headline">New Sale</DialogTitle>
          </DialogHeader>
          <div className="p-6 h-[400px] flex items-center justify-center bg-muted/10 text-muted-foreground italic text-xs uppercase font-bold tracking-widest">
            POS Terminal Interface
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline">Delete Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full text-[10px] uppercase font-bold h-9">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 rounded-full text-[10px] uppercase font-bold h-9" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
