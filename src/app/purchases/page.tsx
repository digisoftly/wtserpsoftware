"use client"

import * as React from "react"
import { 
  Plus, 
  Package, 
  Search, 
  Loader2, 
  MoreVertical, 
  Truck, 
  ShoppingCart, 
  Calendar, 
  AlertCircle, 
  Eye, 
  Edit, 
  Trash2, 
  Printer, 
  X, 
  Calculator, 
  ArrowRight, 
  Download,
  User,
  Folder,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, deleteDoc } from "firebase/firestore"
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function PurchasesPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t, formatCurrency } = useTranslation();
  const router = useRouter();

  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [expandedSuppliers, setExpandedSuppliers] = React.useState<Record<string, boolean>>({});

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

  const filteredPOs = React.useMemo(() => {
    if (!purchaseOrders) return [];
    return purchaseOrders.filter(po => 
      po.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [purchaseOrders, searchTerm]);

  // Grouping Logic
  const groupedData = React.useMemo(() => {
    const groups: Record<string, any> = {};

    filteredPOs.forEach(po => {
      const sId = po.supplierId || 'unknown';
      const sName = po.supplierName || t('unknownCustomer');

      if (!groups[sId]) {
        groups[sId] = {
          id: sId,
          name: sName,
          totalDocs: 0,
          totalAmount: 0,
          lastDate: po.orderDate,
          records: []
        };
      }

      groups[sId].records.push(po);
      groups[sId].totalDocs += 1;
      groups[sId].totalAmount += (Number(po.totalAmount) || 0);
      if (new Date(po.orderDate) > new Date(groups[sId].lastDate)) {
        groups[sId].lastDate = po.orderDate;
      }
    });

    return Object.values(groups);
  }, [filteredPOs, t]);

  const handleDeletePO = () => {
    if (!selectedRecord || !db || !companyId || !branchId) return;
    const docRef = doc(db, "companies", companyId, "branches", branchId, "purchase_orders", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: t('success') });
    setIsDeleteAlertOpen(false);
    setSelectedRecord(null);
  };

  const toggleSupplier = (id: string) => {
    setExpandedSuppliers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold font-headline text-orange-600 uppercase tracking-tight">{t('purchases')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <Button className="rounded-full gap-2 h-10 px-8 bg-orange-600 hover:bg-orange-700 font-bold text-[10px] uppercase shadow-xl shadow-orange-100 transition-all active:scale-95 w-full md:w-auto" asChild>
          <Link href="/purchases/new">
            <Plus className="h-4 w-4" /> {t('purchases')}
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 no-print">
        <KPICard title="totalPurchase" value={formatCurrency(stats.totalAmount)} icon={ShoppingCart} colorClass="bg-blue-600" />
        <KPICard title="monthlyPurchase" value={formatCurrency(stats.monthlyAmount)} icon={Calendar} colorClass="bg-green-600" />
        <KPICard title="totalDocuments" value={stats.count} icon={Package} colorClass="bg-orange-600" />
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
      ) : groupedData.length > 0 ? (
        <div className="space-y-4">
          {groupedData.map((supplier) => (
            <Card key={supplier.id} className="border-none shadow-sm overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-slate-100">
              {/* SUPPLIER HEADER */}
              <div 
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50"
                onClick={() => toggleSupplier(supplier.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black uppercase text-slate-900 leading-tight">{supplier.name}</h2>
                    <div className="flex gap-3 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {supplier.totalDocs} {t('documents')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('totalAmount')}</p>
                    <p className="text-sm font-black text-orange-600">{formatCurrency(supplier.totalAmount)}</p>
                  </div>
                  <div className="text-right hidden md:block">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('lastDocument')}</p>
                    <p className="text-[11px] font-bold text-slate-700">{new Date(supplier.lastDate).toLocaleDateString()}</p>
                  </div>
                  {expandedSuppliers[supplier.id] ? <ChevronDown className="h-5 w-5 text-slate-300" /> : <ChevronRight className="h-5 w-5 text-slate-300" />}
                </div>
              </div>

              {/* RECORD TABLE */}
              {expandedSuppliers[supplier.id] && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="h-10">
                        <TableHead className="h-10 text-[9px] uppercase font-black pl-8">ID</TableHead>
                        <TableHead className="h-10 text-[9px] uppercase font-black">{t('date')}</TableHead>
                        <TableHead className="h-10 text-[9px] uppercase font-black text-right">{t('amount')}</TableHead>
                        <TableHead className="h-10 text-[9px] uppercase font-black text-center">{t('status')}</TableHead>
                        <TableHead className="h-10 text-right pr-8 w-32">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplier.records.map((po: any) => (
                        <TableRow key={po.id} className="h-14 hover:bg-slate-50/30 transition-colors border-slate-50">
                          <TableCell className="pl-8 font-black text-[10px] text-orange-600 uppercase tracking-tighter">{po.orderNumber}</TableCell>
                          <TableCell className="text-[10px] font-bold text-slate-500">{new Date(po.orderDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right font-black text-[10px] text-slate-900">{formatCurrency(po.totalAmount)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-[8px] h-4 uppercase border-none px-2 font-black bg-green-50 text-green-700">
                              {po.status?.toUpperCase() || 'RECEIVED'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <div className="flex justify-end gap-1">
                               <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-blue-600" onClick={() => { setSelectedRecord(po); setIsViewModalOpen(true); }}><Eye className="h-3.5 w-3.5" /></Button>
                               <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-slate-400"><MoreVertical className="h-4 w-4" /></Button>
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
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="p-24 bg-white rounded-[3rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100 no-print">
          <Package className="h-12 w-12 text-slate-200 mb-6" />
          <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]">{t('noData')}</p>
        </div>
      )}

      {/* VIEW DOCUMENT MODAL */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-[21cm] w-[95vw] p-0 border-none bg-transparent shadow-none overflow-y-auto max-h-[95vh] rounded-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Purchase Order View</DialogTitle>
            <DialogDescription>Review procurement details and itemized inventory intake records.</DialogDescription>
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
                items={(selectedRecord.items || []).map((i: any) => ({
                  ...i,
                  quantity: i.qty,
                  unitPrice: i.price,
                  total: i.total
                }))}
                subtotal={selectedRecord.totalAmount}
                grandTotal={selectedRecord.totalAmount}
                status={selectedRecord.status}
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
            <AlertDialogDescription className="text-sm font-medium leading-relaxed">This record will be permanently removed.</AlertDialogDescription>
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