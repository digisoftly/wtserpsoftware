"use client"

import * as React from "react"
import { 
  Plus, 
  Search, 
  Loader2, 
  MoreVertical, 
  Eye, 
  Trash2, 
  Truck, 
  Printer, 
  X, 
  CheckCircle2, 
  Calculator, 
  Clock,
  User,
  PackagePlus,
  Box,
  ArrowRight,
  Share2,
  FileText,
  Barcode,
  LayoutGrid,
  MapPin,
  Phone,
  Edit,
  Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, deleteDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { DocumentTemplate } from "@/components/documents/document-template"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ChallansPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  const router = useRouter();
  
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");

  // Queries
  const challansQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "delivery_challans"), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: challans, isLoading } = useCollection(challansQuery);

  const stats = React.useMemo(() => ({
    total: challans?.length || 0,
    pending: challans?.filter(c => c.status === 'pending').length || 0,
    delivered: challans?.filter(c => c.status === 'delivered').length || 0,
  }), [challans]);

  const handleShareWhatsApp = (challan: any) => {
    const text = `Hello ${challan.customerName}, your delivery challan ${challan.challanNumber} has been generated. Dispatch Date: ${challan.dispatchDate}. Status: ${challan.status.toUpperCase()}.`;
    window.open(`https://wa.me/${challan.customerPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredChallans = challans?.filter(c => 
    c.challanNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-headline text-amber-600 uppercase tracking-tight">{t('dispatch')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <Button className="rounded-full gap-2 h-10 px-8 bg-amber-600 hover:bg-amber-700 font-bold text-[10px] uppercase shadow-xl shadow-amber-100 transition-all active:scale-95 w-full md:w-auto" asChild>
          <Link href="/challans/new">
            <Plus className="h-4 w-4" /> {t('addChallan')}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard title={t('totalDispatch')} value={stats.total} icon={Truck} colorClass="bg-blue-600" />
        <KPICard title={t('pendingDeliveries')} value={stats.pending} icon={Clock} colorClass="bg-orange-600" />
        <KPICard title={t('deliveredOrders')} value={stats.delivered} icon={CheckCircle2} colorClass="bg-green-600" />
      </div>

      <div className="flex gap-2 bg-white p-3 rounded-xl border shadow-sm ring-1 ring-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input 
            placeholder={t('search')} 
            className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs focus:ring-2 focus:ring-amber-500 transition-all outline-none" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="h-10 text-[10px] uppercase font-black pl-6">{t('challanNumber')}</TableHead>
                  <TableHead className="h-10 text-[10px] uppercase font-black">{t('customer')}</TableHead>
                  <TableHead className="h-10 text-[10px] uppercase font-black">{t('dispatchDate')}</TableHead>
                  <TableHead className="h-10 text-[10px] uppercase font-black text-center">{t('status')}</TableHead>
                  <TableHead className="h-10 text-right pr-6 sticky right-0 bg-white/95 backdrop-blur-sm z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] w-[180px]">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChallans?.map((c) => (
                  <TableRow key={c.id} className="h-14 hover:bg-muted/5 transition-colors group">
                    <TableCell className="pl-6 font-black text-xs uppercase text-amber-600">
                      {c.challanNumber}
                      <p className="text-[8px] text-muted-foreground font-bold mt-0.5">INV: {c.invoiceNumber}</p>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-700">{c.customerName}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-500">{new Date(c.dispatchDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("text-[8px] h-5 uppercase border-none px-2 font-black", 
                        c.status === 'delivered' ? "bg-green-50 text-green-700" : 
                        c.status === 'processing' ? "bg-blue-50 text-blue-700" : 
                        c.status === 'cancelled' ? "bg-red-50 text-red-700" : "bg-orange-50 text-orange-700")}>
                        {t(`${c.status}_status` as any)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6 sticky right-0 bg-white/90 backdrop-blur-sm group-hover:bg-slate-50/90 transition-colors z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-end items-center gap-1">
                        <div className="hidden md:flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => { setSelectedRecord(c); setIsViewModalOpen(true); }} title={t('view')}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-amber-600 hover:bg-amber-50" onClick={() => router.push(`/challans/${c.id}/edit`)} title={t('edit')}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-slate-600 hover:bg-slate-100" onClick={() => { setSelectedRecord(c); setIsViewModalOpen(true); }} title={t('print')}><Printer className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-red-600 hover:bg-red-50" onClick={() => { setSelectedRecord(c); setIsDeleteAlertOpen(true); }} title={t('delete')}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden rounded-full hover:bg-amber-50 text-amber-600 transition-colors"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => { setSelectedRecord(c); setIsViewModalOpen(true); }}><Eye className="mr-2 h-3.5 w-3.5" /> {t('view')}</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => router.push(`/challans/${c.id}/edit`)}><Edit className="mr-2 h-3.5 w-3.5" /> {t('edit')}</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => handleShareWhatsApp(c)}><Share2 className="mr-2 h-3.5 w-3.5" /> {t('share')}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-xs font-bold text-red-600" onClick={() => { setSelectedRecord(c); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}</DropdownMenuItem>
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

      {/* VIEW CHALLAN DIALOG */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-[21cm] w-[95vw] p-0 border-none bg-transparent shadow-none overflow-y-auto max-h-[95vh] rounded-none">
          <DialogHeader className="sr-only">
            <DialogTitle>View Delivery Challan</DialogTitle>
          </DialogHeader>
          <div className="flex justify-end gap-3 mb-4 no-print fixed top-4 right-4 md:top-6 md:right-6 z-[100]">
             <Button onClick={() => window.print()} className="bg-white text-amber-600 hover:bg-amber-50 shadow-2xl rounded-full font-black text-[10px] uppercase h-10 px-6 gap-2 border-none ring-1 ring-amber-100">
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>
          {selectedRecord && (
            <div className="bg-white shadow-2xl rounded-none md:rounded-[2rem] overflow-hidden">
              <DocumentTemplate
                title="Delivery Challan"
                type="agreement"
                docNumber={selectedRecord.challanNumber}
                date={selectedRecord.dispatchDate}
                customerName={selectedRecord.customerName}
                customerInfo={`${selectedRecord.customerPhone}\n${selectedRecord.customerAddress}`}
                items={selectedRecord.items.map((i: any) => ({
                  name: i.name,
                  quantity: i.quantity,
                  unit: i.unit,
                  unitPrice: i.unitPrice,
                  total: i.total,
                  description: i.isCustom ? "Individual / Custom Item" : `SKU: ${i.sku}`
                }))}
                subtotal={selectedRecord.totalAmount}
                grandTotal={selectedRecord.totalAmount}
                status={selectedRecord.status}
                notes={selectedRecord.notes || `Delivery Via: ${selectedRecord.deliveryMethod}\nVehicle: ${selectedRecord.vehicleNumber}\nDriver: ${selectedRecord.driverName}`}
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
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest" onClick={() => { if(selectedRecord) deleteDocumentNonBlocking(doc(db!, "companies", companyId!, "branches", branchId!, "delivery_challans", selectedRecord.id)); setIsDeleteAlertOpen(false); toast({ title: t('success') }); }}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
