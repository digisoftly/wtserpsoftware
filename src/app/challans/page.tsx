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
  Download,
  Folder,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function ChallansPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t, formatCurrency } = useTranslation();
  const router = useRouter();
  
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [expandedCustomers, setExpandedCustomers] = React.useState<Record<string, boolean>>({});

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

  const filteredChallans = React.useMemo(() => {
    if (!challans) return [];
    return challans.filter(c => 
      c.challanNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.customerName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [challans, searchTerm]);

  // Grouping Logic
  const groupedData = React.useMemo(() => {
    const groups: Record<string, any> = {};

    filteredChallans.forEach(c => {
      const cId = c.customerId || 'unknown';
      const cName = c.customerName || t('unknownCustomer');

      if (!groups[cId]) {
        groups[cId] = {
          id: cId,
          name: cName,
          totalDocs: 0,
          totalAmount: 0,
          lastDate: c.dispatchDate,
          records: []
        };
      }

      groups[cId].records.push(c);
      groups[cId].totalDocs += 1;
      groups[cId].totalAmount += (Number(c.totalAmount) || 0);
      if (new Date(c.dispatchDate) > new Date(groups[cId].lastDate)) {
        groups[cId].lastDate = c.dispatchDate;
      }
    });

    return Object.values(groups);
  }, [filteredChallans, t]);

  const handleShareWhatsApp = (challan: any) => {
    const text = `Hello ${challan.customerName}, your delivery challan ${challan.challanNumber} has been generated. Dispatch Date: ${challan.dispatchDate}. Status: ${challan.status.toUpperCase()}.`;
    window.open(`https://wa.me/${challan.customerPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const toggleCustomer = (id: string) => {
    setExpandedCustomers(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
        <KPICard title="totalDispatch" value={stats.total} icon={Truck} colorClass="bg-blue-600" />
        <KPICard title="pendingDeliveries" value={stats.pending} icon={Clock} colorClass="bg-orange-600" />
        <KPICard title="deliveredOrders" value={stats.delivered} icon={CheckCircle2} colorClass="bg-green-600" />
      </div>

      <div className="flex gap-2 bg-white p-3 rounded-xl border shadow-sm ring-1 ring-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input 
            placeholder={t('search')} 
            className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs focus:ring-2 focus:ring-amber-500 transition-all outline-none font-bold" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>
      ) : groupedData.length > 0 ? (
        <div className="space-y-4">
          {groupedData.map((customer) => (
            <Card key={customer.id} className="border-none shadow-sm overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-slate-100">
              {/* CUSTOMER HEADER */}
              <div 
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50"
                onClick={() => toggleCustomer(customer.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase text-slate-900 leading-tight">{customer.name}</h2>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {customer.totalDocs} {t('documents')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden md:block">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('lastDocument')}</p>
                    <p className="text-[11px] font-bold text-slate-700">{new Date(customer.lastDate).toLocaleDateString()}</p>
                  </div>
                  {expandedCustomers[customer.id] ? <ChevronDown className="h-5 w-5 text-slate-300" /> : <ChevronRight className="h-5 w-5 text-slate-300" />}
                </div>
              </div>

              {/* RECORD TABLE */}
              {expandedCustomers[customer.id] && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="h-10">
                        <TableHead className="h-10 text-[9px] uppercase font-black pl-8">ID</TableHead>
                        <TableHead className="h-10 text-[9px] uppercase font-black">{t('date')}</TableHead>
                        <TableHead className="h-10 text-[9px] uppercase font-black text-center">{t('status')}</TableHead>
                        <TableHead className="h-10 text-right pr-8 w-32">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.records.map((c: any, cIdx: number) => (
                        <TableRow 
                          key={c.id} 
                          className={cn(
                            "h-14 transition-all border-b border-white/50",
                            cIdx % 2 === 0 ? "bg-[#EAF6FF] hover:bg-[#D9EFFF]" : "bg-[#EEF9F1] hover:bg-[#E1F2E6]"
                          )}
                        >
                          <TableCell className="pl-8 font-black text-[10px] text-amber-600 uppercase tracking-tighter">{c.challanNumber}</TableCell>
                          <TableCell className="text-[10px] font-bold text-slate-500">{new Date(c.dispatchDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={cn("text-[8px] h-4 uppercase border-none px-2 font-black", 
                              c.status === 'delivered' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>
                              {c.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-blue-600" onClick={() => { setSelectedRecord(c); setIsViewModalOpen(true); }}><Eye className="h-3.5 w-3.5" /></Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                                  <DropdownMenuItem className="text-xs font-bold" onClick={() => { setSelectedRecord(c); setIsViewModalOpen(true); }}><Printer className="mr-2 h-3.5 w-3.5" /> {t('print')}</DropdownMenuItem>
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
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="p-16 bg-white rounded-[2rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
          <Truck className="h-10 w-10 text-slate-200 mb-4" />
          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{t('noData')}</p>
        </div>
      )}

      {/* VIEW CHALLAN DIALOG */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-[21cm] w-[95vw] p-0 border-none bg-transparent shadow-none overflow-y-auto max-h-[95vh] rounded-none">
          <DialogHeader className="sr-only">
            <DialogTitle>View Delivery Challan</DialogTitle>
            <DialogDescription className="sr-only">
              Full document preview for shipping and logistics verification.
            </DialogDescription>
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
                customerInfo={`${selectedRecord.customerPhone || ''}\n${selectedRecord.customerAddress || ''}`}
                items={(selectedRecord.items || []).map((i: any) => ({
                  ...i,
                  quantity: i.qty,
                  unitPrice: i.price,
                  total: i.total
                }))}
                subtotal={selectedRecord.totalAmount}
                grandTotal={selectedRecord.totalAmount}
                status={selectedRecord.status}
                notes={selectedRecord.notes}
                layoutOverride="warrior"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tight text-slate-900">{t('confirmDelete')}?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed">This dispatch record will be permanently removed from the system audit trail.</AlertDialogDescription>
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
