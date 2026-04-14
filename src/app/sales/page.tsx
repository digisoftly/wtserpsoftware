
"use client"

import * as React from "react"
import { 
  Plus, 
  ShoppingCart, 
  Search, 
  Filter, 
  Loader2, 
  MoreVertical, 
  FileText, 
  Users, 
  TrendingUp, 
  CreditCard, 
  Clock, 
  Trash2, 
  Calculator,
  Printer,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy, addDoc, doc, updateDoc, increment, runTransaction } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { cn } from "@/lib/utils"
import { KPICard } from "@/components/dashboard/kpi-card"
import { toast } from "@/hooks/use-toast"

interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function SalesPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [lineItems, setLineItems] = React.useState<InvoiceItem[]>([]);
  const [taxRate, setTaxRate] = React.useState(15); // Default 15% VAT
  const [discount, setDiscount] = React.useState(0);

  // Data Queries
  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "sales_invoices"),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId]);

  const { data: invoices, isLoading: isInvoicesLoading } = useCollection(invoicesQuery);

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
  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxAmount - discount;

  const handleAddLineItem = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    const existing = lineItems.find(item => item.productId === productId);
    if (existing) {
      setLineItems(lineItems.map(item => 
        item.productId === productId 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      setLineItems([...lineItems, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.unitPrice,
        total: product.unitPrice
      }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleSubmitInvoice = async () => {
    if (!selectedCustomerId || lineItems.length === 0) {
      toast({ variant: "destructive", title: "Incomplete Form", description: "Select a customer and at least one product." });
      return;
    }

    setIsSubmitting(true);
    try {
      // Use a transaction to ensure stock is only deducted if invoice is created
      await runTransaction(db, async (transaction) => {
        // 1. Check stock for all items
        for (const item of lineItems) {
          const productRef = doc(db, "companies", companyId!, "branches", branchId!, "products", item.productId);
          const productSnap = await transaction.get(productRef);
          if (!productSnap.exists()) throw new Error(`Product ${item.name} not found`);
          
          const currentStock = productSnap.data().currentStock || 0;
          if (currentStock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.name}. Available: ${currentStock}`);
          }
        }

        // 2. Deduct stock
        for (const item of lineItems) {
          const productRef = doc(db, "companies", companyId!, "branches", branchId!, "products", item.productId);
          transaction.update(productRef, {
            currentStock: increment(-item.quantity)
          });
        }

        // 3. Create invoice
        const invoiceRef = doc(collection(db, "companies", companyId!, "branches", branchId!, "sales_invoices"));
        const invoiceData = {
          id: invoiceRef.id,
          companyId,
          branchId,
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          customerId: selectedCustomerId,
          items: lineItems,
          subtotal,
          taxRate,
          taxAmount,
          discount,
          totalAmount: grandTotal,
          paidAmount: 0,
          dueAmount: grandTotal,
          status: "due",
          invoiceDate: new Date().toISOString(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        transaction.set(invoiceRef, invoiceData);
      });

      toast({ title: "Invoice Created", description: "Stock updated and invoice saved." });
      setIsAddModalOpen(false);
      setLineItems([]);
      setSelectedCustomerId("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Transaction Failed", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredInvoices = invoices?.filter(inv => 
    inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-green-600">Sales & Invoicing</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time inventory deduction & revenue tracking</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700 gap-2 rounded-full w-full md:w-auto px-8 shadow-lg" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          New Sale
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Revenue" value={`$${invoices?.reduce((s, i) => s + (i.totalAmount || 0), 0).toLocaleString()}`} icon={TrendingUp} colorClass="bg-green-500" />
        <KPICard title="Outstanding Due" value={`$${invoices?.reduce((s, i) => s + (i.dueAmount || 0), 0).toLocaleString()}`} icon={Clock} colorClass="bg-orange-500" />
        <KPICard title="Invoices Issued" value={invoices?.length || 0} icon={FileText} colorClass="bg-blue-500" />
        <KPICard title="Total Paid" value={`$${invoices?.reduce((s, i) => s + (i.paidAmount || 0), 0).toLocaleString()}`} icon={CreditCard} colorClass="bg-purple-500" />
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search invoice #..." className="pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {isInvoicesLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>
      ) : invoices && invoices.length > 0 ? (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Invoice Details</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices?.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="font-bold text-green-700">{inv.invoiceNumber}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{new Date(inv.invoiceDate).toLocaleDateString()}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{customers?.find(c => c.id === inv.customerId)?.firstName || "Unknown"}</div>
                    </TableCell>
                    <TableCell className="font-bold">${inv.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn(inv.status === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700")}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon"><Printer className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : (
        <div className="p-12 bg-white rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-headline font-bold">No Sales Recorded</h2>
          <p className="text-muted-foreground">Start processing orders to see your revenue growth.</p>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-headline flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-600" />
              New Sales Transaction
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-2">
                <Label>Customer Selection</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger><SelectValue placeholder="Choose client" /></SelectTrigger>
                  <SelectContent>
                    {customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">Items & Products</Label>
                  <Select onValueChange={handleAddLineItem}>
                    <SelectTrigger className="w-[200px] bg-green-50 border-green-200">
                      <SelectValue placeholder="Add product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map(p => (
                        <SelectItem key={p.id} value={p.id} disabled={p.currentStock <= 0}>
                          {p.name} ({p.currentStock} in stock)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="text-xs">Product</TableHead>
                        <TableHead className="text-xs w-[80px]">Qty</TableHead>
                        <TableHead className="text-xs">Price</TableHead>
                        <TableHead className="text-xs text-right">Total</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-xs py-10 text-muted-foreground">No items added yet</TableCell></TableRow>
                      ) : (
                        lineItems.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs font-medium">{item.name}</TableCell>
                            <TableCell>
                              <Input 
                                type="number" 
                                value={item.quantity} 
                                className="h-8 text-xs" 
                                onChange={(e) => {
                                  const qty = Math.max(1, Number(e.target.value));
                                  setLineItems(lineItems.map((li, i) => i === idx ? { ...li, quantity: qty, total: qty * li.unitPrice } : li));
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-xs">${item.unitPrice}</TableCell>
                            <TableCell className="text-xs text-right font-bold">${item.total.toLocaleString()}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleRemoveItem(idx)}>
                                <Trash2 className="h-4 w-4" />
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

            <div className="bg-muted/20 p-6 rounded-2xl border space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground border-b pb-2">Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <div className="flex items-center gap-2">
                    <span>VAT</span>
                    <Input type="number" className="w-12 h-6 p-1 text-[10px]" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} />
                    <span className="text-[10px]">%</span>
                  </div>
                  <span>+${taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span>Discount</span>
                  <Input type="number" className="w-20 h-7 text-right" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-lg text-green-700">
                  <span>Grand Total</span>
                  <span>${grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-6">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 h-12 rounded-xl text-lg font-bold gap-2"
                  disabled={isSubmitting}
                  onClick={handleSubmitInvoice}
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ChevronRight className="h-5 w-5" />}
                  Finalize Sale
                </Button>
                <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase font-semibold">Stock will be deducted instantly</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
