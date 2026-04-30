"use client"

import * as React from "react"
import { 
  Plus, 
  FileText, 
  Search, 
  Loader2, 
  MoreVertical, 
  Trash2, 
  CheckCircle2, 
  ShoppingCart, 
  Eye, 
  Edit, 
  Printer,
  X,
  Clock,
  ArrowRightLeft,
  ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy, doc, runTransaction, setDoc, updateDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { KPICard } from "@/components/dashboard/kpi-card"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { DocumentTemplate } from "@/components/documents/document-template"
import { useTranslation } from "@/hooks/use-translation"

interface QuoteItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function QuotationsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [lineItems, setLineItems] = React.useState<QuoteItem[]>([]);
  const [discount, setDiscount] = React.useState(0);

  // Queries
  const quotesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "quotations"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);
  const { data: quotations, isLoading } = useCollection(quotesQuery);

  const customersQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "customers");
  }, [db, companyId, branchId]);
  const { data: customers } = useCollection(customersQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "products");
  }, [db, companyId, branchId]);
  const { data: products } = useCollection(productsQuery);

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const totalValue = subtotal - discount;

  const stats = React.useMemo(() => ({
    total: quotations?.length || 0,
    pending: quotations?.filter(q => q.status === 'draft').length || 0,
    approved: quotations?.filter(q => q.status === 'approved').length || 0,
    converted: quotations?.filter(q => q.status === 'converted').length || 0,
  }), [quotations]);

  const handleAddLineItem = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;
    
    const existingIdx = lineItems.findIndex(i => i.productId === productId);
    if (existingIdx > -1) {
      const updated = [...lineItems];
      updated[existingIdx].quantity += 1;
      updated[existingIdx].total = updated[existingIdx].quantity * updated[existingIdx].unitPrice;
      setLineItems(updated);
    } else {
      setLineItems([...lineItems, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.unitPrice || 0,
        total: product.unitPrice || 0
      }]);
    }
  };

  const handleUpdateLineQty = (idx: number, qty: number) => {
    const updated = [...lineItems];
    updated[idx].quantity = Math.max(1, qty);
    updated[idx].total = updated[idx].quantity * updated[idx].unitPrice;
    setLineItems(updated);
  };

  const handleSaveQuote = async () => {
    if (!db || !companyId || !branchId || !selectedCustomerId || lineItems.length === 0) {
      toast({ variant: "destructive", title: t('error'), description: t('noItemsSelected') });
      return;
    }
    setIsSubmitting(true);
    try {
      const quoteRef = isEditModalOpen 
        ? doc(db, "companies", companyId, "branches", branchId, "quotations", selectedRecord.id)
        : doc(collection(db, "companies", companyId, "branches", branchId, "quotations"));
      
      const quoteData = {
        id: quoteRef.id,
        companyId,
        branchId,
        quotationNumber: isEditModalOpen ? selectedRecord.quotationNumber : `QT-${Date.now().toString().slice(-6)}`,
        customerId: selectedCustomerId,
        customerName: customers?.find(c => c.id === selectedCustomerId)?.firstName || "Client",
        items: lineItems,
        subtotal,
        discount,
        totalAmount: totalValue,
        status: isEditModalOpen ? selectedRecord.status : "draft",
        quotationDate: new Date().toISOString(),
        createdAt: isEditModalOpen ? selectedRecord.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(quoteRef, quoteData, { merge: true });
      toast({ title: t('success'), description: t('recordProposalSub') });
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      resetForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertToInvoice = async (quote: any) => {
    if (!db || !companyId || !branchId) return;
    if (quote.status === "converted") {
      toast({ title: t('error'), description: "Already converted." });
      return;
    }

    setIsSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const quoteRef = doc(db, "companies", companyId, "branches", branchId, "quotations", quote.id);
        const invoiceRef = doc(collection(db, "companies", companyId, "branches", branchId, "sales_invoices"));
        
        transaction.set(invoiceRef, {
          ...quote,
          id: invoiceRef.id,
          invoiceNumber: `INV-QT-${quote.quotationNumber.split('-')[1]}`,
          invoiceDate: new Date().toISOString(),
          status: "due",
          balanceDue: quote.totalAmount,
          paidAmount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        transaction.update(quoteRef, { status: "converted", convertedToInvoiceId: invoiceRef.id, updatedAt: serverTimestamp() });
      });
      toast({ title: t('success'), description: "Quotation successfully converted to Sale." });
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuote = () => {
    if (!selectedRecord || !db || !companyId || !branchId) return;
    const docRef = doc(db, "companies", companyId, "branches", branchId, "quotations", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: t('success'), description: t('successSub') });
    setIsDeleteAlertOpen(false);
    setSelectedRecord(null);
  };

  const resetForm = () => {
    setSelectedCustomerId("");
    setLineItems([]);
    setDiscount(0);
    setSelectedRecord(null);
  };

  const openEdit = (q: any) => {
    setSelectedRecord(q);
    setSelectedCustomerId(q.customerId);
    setLineItems(q.items || []);
    setDiscount(q.discount || 0);
    setIsEditModalOpen(true);
  };

  const filteredQuotations = quotations?.filter(q => 
    q.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-headline text-purple-600 uppercase tracking-tight">{t('quotations')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{t('happeningToday')}</p>
        </div>
        <Button className="rounded-full gap-2 h-10 px-8 bg-purple-600 hover:bg-purple-700 font-bold text-[10px] uppercase shadow-xl shadow-purple-100 transition-all active:scale-95 w-full md:w-auto" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
          <Plus className="h-4 w-4" /> {t('createQuote')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('totalQuotations')} value={stats.total} icon={FileText} colorClass="bg-blue-600" />
        <KPICard title={t('pendingQuotes')} value={stats.pending} icon={Clock} colorClass="bg-orange-600" />
        <KPICard title={t('approvedQuotes')} value={stats.approved} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title={t('convertedQuotes')} value={stats.converted} icon={ShoppingCart} colorClass="bg-purple-600" />
      </div>

      <div className="flex gap-2 bg-white p-3 rounded-xl border shadow-sm ring-1 ring-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input 
            placeholder={t('search')} 
            className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs focus:ring-2 focus:ring-purple-500 transition-all outline-none" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="h-12 text-[10px] uppercase font-black pl-6">{t('quoteNumber')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('customer')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('amount')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black text-center">{t('status')}</TableHead>
                  <TableHead className="h-12 text-right pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations?.map((q) => (
                  <TableRow key={q.id} className="h-16 hover:bg-muted/5 transition-colors group">
                    <TableCell className="pl-6">
                      <span className="font-black text-xs uppercase text-purple-600">{q.quotationNumber}</span>
                      <p className="text-[8px] text-muted-foreground font-bold mt-0.5">{new Date(q.quotationDate).toLocaleDateString()}</p>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-slate-700">{q.customerName}</TableCell>
                    <TableCell className="font-black text-xs text-slate-900">৳{q.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("text-[8px] h-5 uppercase border-none px-2 font-black", 
                        q.status === 'converted' ? "bg-green-50 text-green-700" : 
                        q.status === 'approved' ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700")}>
                        {t(`${q.status}_status` as any)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        {q.status !== 'converted' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full text-green-600 hover:bg-green-50"
                            onClick={() => handleConvertToInvoice(q)}
                            title={t('sales')}
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-purple-50 text-purple-600"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl">
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => { setSelectedRecord(q); setIsViewModalOpen(true); }}><Eye className="mr-2 h-3.5 w-3.5" /> {t('view')}</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold" disabled={q.status === 'converted'} onClick={() => openEdit(q)}><Edit className="mr-2 h-3.5 w-3.5" /> {t('edit')}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-xs font-bold text-red-600" onClick={() => { setSelectedRecord(q); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}</DropdownMenuItem>
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

      {/* NEW/EDIT MODAL */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-[95vw] w-[1200px] p-0 overflow-hidden border-none shadow-2xl bg-slate-50 rounded-[2rem] md:rounded-[2.5rem]">
          <DialogHeader className={cn("p-5 text-white flex-row items-center justify-between space-y-0", isEditModalOpen ? "bg-blue-600" : "bg-purple-600")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-bold font-headline uppercase tracking-tight">{isEditModalOpen ? t('edit') : t('newQuotation')}</DialogTitle>
                <p className="text-[9px] font-black uppercase opacity-60 tracking-widest leading-none mt-1">Official Proposal Builder</p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row h-[80vh] overflow-hidden">
            {/* Form Side */}
            <div className="flex-1 flex flex-col p-6 space-y-6 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t('customer')}</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="h-12 rounded-2xl bg-white border-none ring-1 ring-slate-200 shadow-sm transition-all focus:ring-2 focus:ring-purple-500">
                      <SelectValue placeholder={t('search')} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold">{c.firstName} {c.lastName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Select Product to Add</Label>
                  <Select onValueChange={handleAddLineItem}>
                    <SelectTrigger className="h-12 rounded-2xl bg-white border-none ring-1 ring-slate-200 shadow-sm transition-all focus:ring-2 focus:ring-purple-500">
                      <SelectValue placeholder={t('addProduct')} />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map(p => <SelectItem key={p.id} value={p.id} className="text-xs font-bold">{p.name} (৳{p.unitPrice})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Items Table */}
              <div className="flex-1 bg-white rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1 custom-scrollbar">
                  <Table>
                    <TableHeader className="bg-slate-50 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="text-[10px] uppercase font-black py-4 pl-8">{t('itemDescription')}</TableHead>
                        <TableHead className="text-[10px] uppercase font-black text-center w-32">{t('qty')}</TableHead>
                        <TableHead className="text-[10px] uppercase font-black text-right w-40">{t('unitPrice')}</TableHead>
                        <TableHead className="text-[10px] uppercase font-black text-right w-40 pr-8">{t('total')}</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-64 text-center">
                            <div className="flex flex-col items-center opacity-20">
                              <Plus className="h-12 w-12 mb-4" />
                              <p className="text-[10px] uppercase font-black tracking-[0.3em]">{t('noItemsSelected')}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        lineItems.map((item, idx) => (
                          <TableRow key={idx} className="h-16 hover:bg-slate-50/50 transition-colors">
                            <TableCell className="pl-8">
                              <span className="text-xs font-black text-slate-900 uppercase tracking-tighter">{item.name}</span>
                            </TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                className="h-9 text-center font-black text-xs rounded-xl w-24 bg-slate-50 border-none mx-auto" 
                                value={item.quantity} 
                                onChange={e => handleUpdateLineQty(idx, Number(e.target.value))} 
                              />
                            </TableCell>
                            <TableCell className="text-right text-xs font-bold text-slate-500">৳{item.unitPrice.toLocaleString()}</TableCell>
                            <TableCell className="text-right pr-8 text-xs font-black text-purple-600">৳{item.total.toLocaleString()}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 rounded-full hover:bg-red-50" onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}>
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Summary Side */}
            <div className="w-full lg:w-[350px] bg-white border-l border-slate-100 p-8 space-y-8 flex flex-col shadow-2xl relative z-20">
              <div className="space-y-6">
                <div className={cn("p-8 rounded-[2.5rem] shadow-2xl space-y-4 text-center", isEditModalOpen ? "bg-blue-600 text-white" : "bg-purple-600 text-white")}>
                  <p className="text-[10px] uppercase font-black opacity-60 tracking-[0.2em]">{t('grandTotal')}</p>
                  <h2 className="text-4xl font-headline font-black tracking-tighter">৳{totalValue.toLocaleString()}</h2>
                  <div className="pt-4 space-y-2 border-t border-white/10 text-[10px] font-bold uppercase tracking-wider">
                    <div className="flex justify-between opacity-70"><span>{t('subtotal')}</span><span>৳{subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>{t('discount')}</span><span>- ৳{discount.toLocaleString()}</span></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('discount')}</Label>
                    <Input type="number" className="h-11 rounded-xl bg-slate-50 border-none font-bold text-xs" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} />
                  </div>
                  <div className="p-5 bg-slate-50 rounded-3xl space-y-3">
                    <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest text-center">{t('validUntil30Days')}</p>
                  </div>
                </div>
              </div>

              <div className="mt-auto">
                <Button 
                  className={cn("w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95", isEditModalOpen ? "bg-blue-600 hover:bg-blue-700 shadow-blue-100" : "bg-purple-600 hover:bg-purple-700 shadow-purple-100")} 
                  disabled={isSubmitting || lineItems.length === 0} 
                  onClick={handleSaveQuote}
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                  {t('save')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* VIEW DIALOG */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-[21cm] w-[95vw] p-0 border-none bg-transparent shadow-none overflow-y-auto max-h-[95vh]">
          <DialogHeader className="sr-only"><DialogTitle>Quotation View</DialogTitle></DialogHeader>
          <div className="flex justify-end gap-3 mb-4 no-print fixed top-4 right-4 z-[100]">
            <Button onClick={() => window.print()} className="bg-white text-purple-600 hover:bg-purple-50 shadow-2xl rounded-full font-black text-[10px] uppercase h-10 px-6 gap-2 border-none">
              <Printer className="h-4 w-4" /> {t('print')}
            </Button>
          </div>
          {selectedRecord && (
            <div className="bg-white shadow-2xl rounded-none md:rounded-[2rem] overflow-hidden">
              <DocumentTemplate
                title={t('quotations')}
                type="quotation"
                docNumber={selectedRecord.quotationNumber}
                date={selectedRecord.quotationDate}
                customerName={selectedRecord.customerName}
                customerInfo={customers?.find(c => c.id === selectedRecord.customerId)?.phoneNumber}
                items={selectedRecord.items.map((i: any) => ({
                  name: i.name,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                  total: i.total
                }))}
                subtotal={selectedRecord.subtotal}
                discount={selectedRecord.discount}
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
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest" onClick={handleDeleteQuote}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
