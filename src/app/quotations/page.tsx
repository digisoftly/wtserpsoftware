"use client"

import * as React from "react"
import { 
  Plus, 
  FileText, 
  Search, 
  Loader2, 
  MoreVertical, 
  Trash2, 
  Calculator, 
  CheckCircle2, 
  ChevronRight, 
  ShoppingCart, 
  Users, 
  Eye, 
  Edit, 
  Download,
  Printer,
  X,
  Clock
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
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [lineItems, setLineItems] = React.useState<QuoteItem[]>([]);

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

  const stats = React.useMemo(() => ({
    total: quotations?.length || 0,
    pending: quotations?.filter(q => q.status === 'draft').length || 0,
    converted: quotations?.filter(q => q.status === 'converted').length || 0,
    approved: quotations?.filter(q => q.status === 'approved').length || 0
  }), [quotations]);

  const totalValue = lineItems.reduce((sum, item) => sum + item.total, 0);

  const handleAddLineItem = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;
    setLineItems([...lineItems, {
      productId: product.id,
      name: product.name,
      quantity: 1,
      unitPrice: product.unitPrice,
      total: product.unitPrice
    }]);
  };

  const handleSubmitQuote = async () => {
    if (!db || !companyId || !branchId || !selectedCustomerId || lineItems.length === 0) {
      toast({ variant: "destructive", title: "Cannot Save", description: "Initialization pending or form incomplete." });
      return;
    }
    setIsSubmitting(true);
    try {
      const quoteRef = doc(collection(db, "companies", companyId, "branches", branchId, "quotations"));
      await setDoc(quoteRef, {
        id: quoteRef.id,
        companyId,
        branchId,
        quotationNumber: `QT-${Date.now().toString().slice(-6)}`,
        customerId: selectedCustomerId,
        items: lineItems,
        totalAmount: totalValue,
        status: "draft",
        quotationDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Quotation Saved", description: "The proposal has been recorded as draft." });
      setIsAddModalOpen(false);
      resetForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateQuote = async () => {
    if (!db || !companyId || !branchId || !selectedRecord) return;
    setIsSubmitting(true);
    try {
      const quoteRef = doc(db, "companies", companyId, "branches", branchId, "quotations", selectedRecord.id);
      await updateDoc(quoteRef, {
        customerId: selectedCustomerId,
        items: lineItems,
        totalAmount: totalValue,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Quotation Updated", description: "Changes saved successfully." });
      setIsEditModalOpen(false);
      resetForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDeleteQuote = async () => {
    if (!db || !companyId || !branchId || !selectedRecord) return;
    try {
      const docRef = doc(db, "companies", companyId, "branches", branchId, "quotations", selectedRecord.id);
      deleteDocumentNonBlocking(docRef);
      toast({ title: "Quotation Removed", description: "Record deleted." });
      setIsDeleteAlertOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Delete Error", description: e.message });
    }
  }

  const handleConvertToInvoice = async (quote: any) => {
    if (!db || !companyId || !branchId) return;
    if (quote.status === "converted") {
      toast({ title: "Already Converted", description: "This quotation is already a sales invoice." });
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const quoteRef = doc(db, "companies", companyId, "branches", branchId, "quotations", quote.id);
        const invoiceRef = doc(collection(db, "companies", companyId, "branches", branchId, "sales_invoices"));
        
        transaction.set(invoiceRef, {
          ...quote,
          id: invoiceRef.id,
          invoiceNumber: `INV-FROM-${quote.quotationNumber.split('-')[1]}`,
          status: "due",
          invoiceDate: new Date().toISOString(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        transaction.update(quoteRef, { status: "converted", convertedToInvoiceId: invoiceRef.id });
      });
      toast({ title: "Quotation Converted", description: "New invoice generated from this proposal." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Conversion Failed", description: e.message });
    }
  };

  const resetForm = () => {
    setSelectedCustomerId("");
    setLineItems([]);
    setSelectedRecord(null);
  };

  const openEdit = (q: any) => {
    setSelectedRecord(q);
    setSelectedCustomerId(q.customerId);
    setLineItems(q.items || []);
    setIsEditModalOpen(true);
  };

  const openView = (q: any) => {
    setSelectedRecord(q);
    setIsViewModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  }

  const filteredQuotations = quotations?.filter(q => 
    q.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold font-headline">Quotations</h1>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 gap-2 rounded-full px-8 shadow-lg h-9 text-[10px] uppercase font-bold shadow-purple-100" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
          <Plus className="h-4 w-4" /> Create Quote
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <KPICard title="Total Quotations" value={stats.total} icon={FileText} colorClass="bg-blue-600" subtext="All time" />
        <KPICard title="Pending" value={stats.pending} icon={Clock} colorClass="bg-orange-600" subtext="Draft status" />
        <KPICard title="Approved" value={stats.approved} icon={CheckCircle2} colorClass="bg-green-600" subtext="Customer ready" />
        <KPICard title="Converted" value={stats.converted} icon={ShoppingCart} colorClass="bg-purple-600" subtext="Became Invoices" />
      </div>

      <div className="flex items-center gap-4 bg-white p-3 rounded-xl border shadow-sm no-print">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search quotation #..." className="pl-9 h-10 border-none ring-1 ring-input text-xs" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20 no-print"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden no-print">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-[10px] uppercase font-bold">Quote #</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Customer</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Value</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold">Status</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations?.map((q) => (
                  <TableRow key={q.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-bold text-xs">{q.quotationNumber}</TableCell>
                    <TableCell className="text-xs truncate max-w-[150px]">
                      {customers?.find(c => c.id === q.customerId)?.firstName || "Client"}
                    </TableCell>
                    <TableCell className="font-bold text-xs">৳{q.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[9px] h-5 uppercase border-none", q.status === "converted" ? "bg-green-50 text-green-700" : "bg-purple-50 text-purple-700")}>
                        {q.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-purple-50 text-purple-600 transition-colors"><MoreVertical className="h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32">
                          <DropdownMenuItem className="text-xs"><Eye className="mr-2 h-3.5 w-3.5" /> View</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs" disabled={q.status === 'converted'} onClick={() => openEdit(q)}><Edit className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-green-600 text-xs" onClick={() => handleConvertToInvoice(q)} disabled={q.status === "converted"}>
                            <ShoppingCart className="mr-2 h-3.5 w-3.5" /> Invoice
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 text-xs" onClick={() => { setSelectedRecord(q); setIsDeleteAlertOpen(true); }}>
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
        <DialogContent className="max-w-[21cm] w-[95vw] p-0 border-none bg-transparent shadow-none overflow-y-auto max-h-[95vh]">
          <DialogHeader className="sr-only"><DialogTitle>Quotation Details</DialogTitle></DialogHeader>
          <div className="flex justify-end gap-2 mb-4 no-print fixed top-4 right-4 z-50">
            <Button onClick={handlePrint} size="sm" className="bg-primary shadow-lg text-[10px] uppercase font-bold rounded-full"><Printer className="mr-2 h-3.5 w-3.5" /> Print</Button>
            <Button variant="outline" size="icon" onClick={() => setIsViewModalOpen(false)} className="bg-white rounded-full h-8 w-8"><X className="h-3.5 w-3.5" /></Button>
          </div>
          {selectedRecord && (
            <div className="bg-white shadow-2xl rounded-none md:rounded-xl overflow-hidden">
              <DocumentTemplate
                title="Quotation"
                type="quotation"
                docNumber={selectedRecord.quotationNumber}
                date={selectedRecord.quotationDate}
                customerName={customers?.find(c => c.id === selectedRecord.customerId)?.firstName + " " + (customers?.find(c => c.id === selectedRecord.customerId)?.lastName || "")}
                customerInfo={customers?.find(c => c.id === selectedRecord.customerId)?.email + "\n" + (customers?.find(c => c.id === selectedRecord.customerId)?.phoneNumber || "")}
                items={selectedRecord.items.map((i: any) => ({
                  name: i.name,
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
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

      {/* NEW/EDIT MODAL */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className={cn("p-6 text-white flex-row items-center gap-3", isEditModalOpen ? "bg-blue-600" : "bg-purple-600")}>
            <FileText className="h-6 w-6" />
            <DialogTitle className="text-xl font-bold font-headline uppercase">{isEditModalOpen ? "Edit Proposal" : "New Proposal"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 bg-slate-50">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Select Customer</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="h-11 rounded-xl bg-white border-none shadow-sm ring-1 ring-slate-200"><SelectValue placeholder="Identify client..." /></SelectTrigger>
                  <SelectContent>
                    {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.firstName} {c.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Items</Label>
                  <Select onValueChange={handleAddLineItem}>
                    <SelectTrigger className="w-[200px] h-9 bg-purple-50 border-purple-100 text-[10px] font-bold rounded-lg uppercase tracking-wider"><SelectValue placeholder="+ Add product..." /></SelectTrigger>
                    <SelectContent>
                      {products?.map(p => <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="border rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-slate-100">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-[10px] uppercase font-bold h-9">Description</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold h-9">Unit Price</TableHead>
                        <TableHead className="text-right text-[10px] uppercase font-bold h-9">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.length === 0 ? (
                        <TableRow><TableCell colSpan={3} className="py-10 text-center text-muted-foreground italic text-[10px] uppercase font-bold tracking-widest">No items added</TableCell></TableRow>
                      ) : (
                        lineItems.map((item, idx) => (
                          <TableRow key={idx} className="h-10">
                            <TableCell className="text-xs font-medium">{item.name}</TableCell>
                            <TableCell className="text-xs">৳{item.unitPrice.toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-right font-bold text-slate-900">৳{item.total.toLocaleString()}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            <div className={cn("p-6 rounded-3xl border border-transparent flex flex-col justify-between h-fit lg:sticky lg:top-0 shadow-xl", isEditModalOpen ? "bg-blue-600 text-white" : "bg-purple-600 text-white")}>
              <div>
                <h3 className="font-bold uppercase text-[10px] mb-4 tracking-widest opacity-80">Estimated Value</h3>
                <div className="text-4xl font-headline font-black">৳{totalValue.toLocaleString()}</div>
                <p className="text-[10px] opacity-60 mt-4 leading-relaxed font-medium">Valid for 30 days. Convertible to active invoice on approval.</p>
              </div>
              <Button className={cn("w-full h-12 font-bold gap-2 mt-10 rounded-2xl text-[10px] uppercase tracking-widest", isEditModalOpen ? "bg-white text-blue-600 hover:bg-blue-50" : "bg-white text-purple-600 hover:bg-purple-50")} onClick={isEditModalOpen ? handleUpdateQuote : handleSubmitQuote} disabled={isSubmitting || lineItems.length === 0}>
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : isEditModalOpen ? <CheckCircle2 className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />} 
                {isEditModalOpen ? "Save Changes" : "Record Proposal"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline">Delete Proposal?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">Record will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full text-[10px] uppercase font-bold h-9">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 rounded-full text-[10px] uppercase font-bold h-9" onClick={handleDeleteQuote}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
