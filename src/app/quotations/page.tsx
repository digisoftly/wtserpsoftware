
"use client"

import * as React from "react"
import { Plus, FileText, Search, Loader2, MoreVertical, Trash2, Calculator, CheckCircle2, ChevronRight, ShoppingCart, Users, Eye, Edit, Download } from "lucide-react"
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
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
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
    if (!selectedCustomerId || lineItems.length === 0) return;
    setIsSubmitting(true);
    try {
      const quoteRef = doc(collection(db, "companies", companyId!, "branches", branchId!, "quotations"));
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
    if (!selectedRecord) return;
    setIsSubmitting(true);
    try {
      const quoteRef = doc(db, "companies", companyId!, "branches", branchId!, "quotations", selectedRecord.id);
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
    if (!selectedRecord) return;
    try {
      const docRef = doc(db, "companies", companyId!, "branches", branchId!, "quotations", selectedRecord.id);
      deleteDocumentNonBlocking(docRef);
      toast({ title: "Quotation Removed", description: "Record deleted." });
      setIsDeleteAlertOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Delete Error", description: e.message });
    }
  }

  const handleConvertToInvoice = async (quote: any) => {
    if (quote.status === "converted") {
      toast({ title: "Already Converted", description: "This quotation is already a sales invoice." });
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const quoteRef = doc(db, "companies", companyId!, "branches", branchId!, "quotations", quote.id);
        const invoiceRef = doc(collection(db, "companies", companyId!, "branches", branchId!, "sales_invoices"));
        
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

  const handlePrint = (q: any) => {
    toast({ title: "Preparing Document", description: `Quotation ${q.quotationNumber} is ready.` });
    setTimeout(() => window.print(), 500);
  }

  const filteredQuotations = quotations?.filter(q => 
    q.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-purple-600">Sales Quotations</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate proposals and convert them to invoices</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 gap-2 rounded-full px-8 shadow-lg" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
          <Plus className="h-4 w-4" />
          Create Quote
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Draft Proposals" value={quotations?.filter(q => q.status === 'draft').length || 0} icon={FileText} colorClass="bg-purple-500" />
        <KPICard title="Total Value" value={`৳${quotations?.reduce((s, q) => s + (q.totalAmount || 0), 0).toLocaleString()}`} icon={Calculator} colorClass="bg-blue-500" />
        <KPICard title="Converted" value={quotations?.filter(q => q.status === 'converted').length || 0} icon={CheckCircle2} colorClass="bg-green-500" />
        <KPICard title="Pending Clients" value={new Set(quotations?.map(q => q.customerId)).size} icon={Users} colorClass="bg-amber-500" />
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search quotation #..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Quote #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations?.map((q) => (
                  <TableRow key={q.id} className="hover:bg-muted/30">
                    <TableCell className="font-bold text-purple-700">{q.quotationNumber}</TableCell>
                    <TableCell className="text-xs">{customers?.find(c => c.id === q.customerId)?.firstName || "Unknown"}</TableCell>
                    <TableCell className="font-bold text-xs">৳{q.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px]", q.status === "converted" ? "bg-green-50 text-green-700 border-green-200" : "bg-purple-50 text-purple-700")}>
                        {q.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePrint(q)}><Eye className="mr-2 h-4 w-4" /> View Quote</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(q)} disabled={q.status === 'converted'}><Edit className="mr-2 h-4 w-4" /> Edit Record</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePrint(q)}><Download className="mr-2 h-4 w-4" /> Download PDF</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-green-600" onClick={() => handleConvertToInvoice(q)} disabled={q.status === "converted"}>
                            <ShoppingCart className="mr-2 h-4 w-4" /> Convert to Invoice
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedRecord(q); setIsDeleteAlertOpen(true); }}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Quote
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

      {/* NEW/EDIT MODAL */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className={cn("p-6 text-white", isEditModalOpen ? "bg-blue-600" : "bg-purple-600")}>
            <DialogTitle className="text-2xl font-headline flex items-center gap-3">
              <FileText className="h-6 w-6" /> {isEditModalOpen ? `Adjust Quote ${selectedRecord?.quotationNumber}` : "New Proposal"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Choose client" /></SelectTrigger>
                  <SelectContent>
                    {customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">Quoted Products</Label>
                  <Select onValueChange={handleAddLineItem}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Add product..." /></SelectTrigger>
                    <SelectContent>
                      {products?.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="border rounded-xl">
                  <Table>
                    <TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {lineItems.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-xs">{item.name}</TableCell>
                          <TableCell className="text-xs">৳{item.unitPrice}</TableCell>
                          <TableCell className="text-xs text-right font-bold">৳{item.total.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            <div className={cn("p-6 rounded-2xl border flex flex-col justify-between", isEditModalOpen ? "bg-blue-50 border-blue-100" : "bg-purple-50 border-purple-100")}>
              <div>
                <h3 className={cn("font-bold uppercase text-xs mb-4", isEditModalOpen ? "text-blue-800" : "text-purple-800")}>Total Estimate</h3>
                <div className={cn("text-3xl font-bold", isEditModalOpen ? "text-blue-700" : "text-purple-700")}>৳{totalValue.toLocaleString()}</div>
              </div>
              <Button className={cn("w-full h-12 font-bold gap-2", isEditModalOpen ? "bg-blue-600 hover:bg-blue-700" : "bg-purple-600 hover:bg-purple-700")} onClick={isEditModalOpen ? handleUpdateQuote : handleSubmitQuote} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : isEditModalOpen ? <CheckCircle2 /> : <ChevronRight />} {isEditModalOpen ? "Save Changes" : "Save Proposal"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quotation {selectedRecord?.quotationNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this proposal? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteQuote}>Delete Record</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
