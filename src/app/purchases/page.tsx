"use client"

import * as React from "react"
import { Plus, Package, Search, Loader2, MoreVertical, Truck, ShoppingCart, Calendar, AlertCircle, Eye, Edit, Trash2, Printer, X, Calculator, ArrowRight, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy, doc, increment, runTransaction, updateDoc, deleteDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { KPICard } from "@/components/dashboard/kpi-card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { toast } from "@/hooks/use-toast"
import { DocumentTemplate } from "@/components/documents/document-template"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function PurchasesPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const router = useRouter();

  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Queries
  const poQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "purchase_orders"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);
  const { data: purchaseOrders, isLoading } = useCollection(poQuery);

  // Stats
  const stats = React.useMemo(() => {
    if (!purchaseOrders) return { totalAmount: 0, monthlyAmount: 0, count: 0 };
    const thisMonth = new Date().toISOString().slice(0, 7);
    return {
      totalAmount: purchaseOrders.reduce((s, i) => s + (i.totalAmount || 0), 0),
      monthlyAmount: purchaseOrders.filter(i => i.orderDate?.startsWith(thisMonth)).reduce((s, i) => s + (i.totalAmount || 0), 0),
      count: purchaseOrders.length
    };
  }, [purchaseOrders]);

  const handleDeletePO = () => {
    if (!selectedRecord || !db || !companyId || !branchId) return;
    const docRef = doc(db, "companies", companyId, "branches", branchId, "purchase_orders", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: t('success') });
    setIsDeleteAlertOpen(false);
    setSelectedRecord(null);
  };

  const filteredPOs = purchaseOrders?.filter(po => 
    po.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold font-headline text-orange-600 uppercase tracking-tight">{t('purchases')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <Button className="rounded-full gap-2 h-10 px-8 bg-orange-600 hover:bg-orange-700 font-bold text-[10px] uppercase shadow-xl shadow-orange-100 transition-all active:scale-95 w-full md:w-auto" asChild>
          <Link href="/purchases/new">
            <Plus className="h-4 w-4" /> {t('receiveStock')}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 no-print">
        <KPICard title={t('totalPurchase')} value={`৳${stats.totalAmount.toLocaleString()}`} icon={ShoppingCart} colorClass="bg-blue-600" />
        <KPICard title={t('monthlyPurchase')} value={`৳${stats.monthlyAmount.toLocaleString()}`} icon={Calendar} colorClass="bg-green-600" />
        <KPICard title={t('totalOrders')} value={stats.count} icon={Package} colorClass="bg-orange-600" />
      </div>

      <div className="flex gap-2 bg-white p-3 rounded-xl border shadow-sm ring-1 ring-slate-100 no-print">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input 
            placeholder={t('search')} 
            className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs focus:ring-2 focus:ring-orange-500 transition-all outline-none" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 no-print"><Loader2 className="h-8 w-8 animate-spin text-orange-600" /></div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100 no-print">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="h-12 text-[10px] uppercase font-black pl-6">{t('poNumber')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('supplier')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('amount')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black text-center">{t('status')}</TableHead>
                  <TableHead className="h-12 text-right pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs?.map((po) => (
                  <TableRow key={po.id} className="h-16 hover:bg-muted/5 transition-colors group">
                    <TableCell className="pl-6">
                      <span className="font-black text-xs uppercase text-orange-600">{po.orderNumber}</span>
                      <p className="text-[8px] text-muted-foreground font-bold mt-0.5">{new Date(po.orderDate).toLocaleDateString()}</p>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-700">{po.supplierName}</TableCell>
                    <TableCell className="font-black text-xs text-slate-900">৳{po.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[8px] h-5 uppercase border-none px-2 font-black bg-green-50 text-green-700">
                        {t(`${po.status}_status` as any)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                         <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => { setSelectedRecord(po); setIsViewModalOpen(true); }}><Eye className="h-4 w-4" /></Button>
                         <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-orange-50 text-orange-600 transition-colors"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl">
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => { setSelectedRecord(po); setIsViewModalOpen(true); }}><Printer className="mr-2 h-3.5 w-3.5" /> {t('print')}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-xs font-bold text-red-600" onClick={() => { setSelectedRecord(po); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* VIEW DOCUMENT MODAL */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-[21cm] w-[95vw] p-0 border-none bg-transparent shadow-none overflow-y-auto max-h-[95vh] rounded-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Purchase Order View</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-3 mb-4 no-print fixed top-4 right-4 md:top-6 md:right-6 z-[100]">
            <Button onClick={() => window.print()} className="bg-white text-orange-600 hover:bg-orange-50 shadow-2xl rounded-full font-black text-[10px] uppercase h-10 px-6 gap-2 border-none ring-1 ring-orange-100">
              <Printer className="h-4 w-4" /> {t('print')}
            </Button>
          </div>
          {selectedRecord && (
            <div className="bg-white shadow-2xl rounded-none md:rounded-[2rem] overflow-hidden">
              <DocumentTemplate
                title={t('purchases')}
                type="po"
                docNumber={selectedRecord.orderNumber}
                date={selectedRecord.orderDate}
                customerName={selectedRecord.supplierName}
                items={selectedRecord.items.map((i: any) => ({
                  name: i.name,
                  quantity: i.quantity,
                  unit: i.unit,
                  unitPrice: i.unitCost,
                  total: i.total
                }))}
                subtotal={selectedRecord.totalAmount}
                grandTotal={selectedRecord.totalAmount}
                status={selectedRecord.status}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tight text-slate-900">{t('delete')}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">{t('errorSub')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest" onClick={handleDeletePO}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}