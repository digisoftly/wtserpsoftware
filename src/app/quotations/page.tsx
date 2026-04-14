"use client"

import * as React from "react"
import { Plus, FileText, Search, Loader2, MoreVertical, Trash2, Calculator, CheckCircle2, ChevronRight, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy, doc, runTransaction, setDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { KPICard } from "@/components/dashboard/kpi-card"
import { toast } from "@/hooks/use-toast"

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
      setLineItems([]);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-purple-600">Sales Quotations</h1>
          <p className="text-sm text-muted-foreground mt-1">Generate proposals and convert them to invoices</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 gap-2 rounded-full px-8 shadow-lg" onClick={() => setIsAddModalOpen(true)}>
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
                {quotations?.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-bold text-purple-700">{q.quotationNumber}</TableCell>
                    <TableCell>{customers?.find(c => c.id === q.customerId)?.firstName || "Unknown"}</TableCell>
                    <TableCell className="font-bold">৳{q.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(q.status === "converted" ? "bg-green-50 text-green-700 border-green-200" : "bg-purple-50 text-purple-700")}>
                        {q.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button size="sm" variant="outline" className="gap-1 h-8 rounded-full" onClick={() => handleConvertToInvoice(q)} disabled={q.status === "converted"}>
                        <ShoppingCart className="h-3 w-3" /> Invoice
                      </Button>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw]">
          <DialogHeader><DialogTitle>New Proposal</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
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
            <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-purple-800 uppercase text-xs mb-4">Total Estimate</h3>
                <div className="text-3xl font-bold text-purple-700">৳{totalValue.toLocaleString()}</div>
              </div>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 h-12 font-bold gap-2" onClick={handleSubmitQuote} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin" /> : <ChevronRight />} Save Proposal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
