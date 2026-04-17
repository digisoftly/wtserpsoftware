"use client"

import * as React from "react"
import { Plus, Search, Loader2, MoreVertical, Eye, Trash2, ShoppingCart, TrendingUp, Calendar, ShoppingBag, AlertCircle, X, CheckCircle2, Calculator, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, runTransaction, serverTimestamp, increment } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { KPICard } from "@/components/dashboard/kpi-card"

interface InvoiceItem {
  productId: string;
  name: string;
  qty: number;
  price: number;
  total: number;
}

export default function SalesPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [invoiceDate, setInvoiceDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [lineItems, setLineItems] = React.useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = React.useState(0);
  const [vatPercent, setVatPercent] = React.useState(15);
  const [paidAmount, setPaidAmount] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState("cash");

  // Queries
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

  const productsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "products");
  }, [db, companyId, branchId]);
  const { data: products } = useCollection(productsQuery);

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const vatAmount = (subtotal - discount) * (vatPercent / 100);
  const totalAmount = subtotal - discount + vatAmount;
  const balanceDue = totalAmount - paidAmount;

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

  const handleAddProduct = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    const existing = lineItems.find(item => item.productId === productId);
    if (existing) {
      setLineItems(lineItems.map(item => 
        item.productId === productId 
          ? { ...item, qty: item.qty + 1, total: (item.qty + 1) * item.price } 
          : item
      ));
    } else {
      setLineItems([...lineItems, {
        productId: product.id,
        name: product.name,
        qty: 1,
        price: product.unitPrice || 0,
        total: product.unitPrice || 0
      }]);
    }
  };

  const handleUpdateQty = (idx: number, newQty: number) => {
    setLineItems(lineItems.map((item, i) => 
      i === idx ? { ...item, qty: Math.max(1, newQty), total: Math.max(1, newQty) * item.price } : item
    ));
  };

  const handleUpdatePrice = (idx: number, newPrice: number) => {
    setLineItems(lineItems.map((item, i) => 
      i === idx ? { ...item, price: newPrice, total: item.qty * newPrice } : item
    ));
  };

  const handleRemoveItem = (idx: number) => {
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  const handleSaveInvoice = async () => {
    if (!selectedCustomerId || lineItems.length === 0) {
      toast({ variant: "destructive", title: "Form Incomplete", description: "Please select a customer and add items." });
      return;
    }

    setIsSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const invoiceRef = doc(collection(db, "companies", companyId!, "branches", branchId!, "sales_invoices"));
        const invoiceData = {
          id: invoiceRef.id,
          companyId,
          branchId,
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          customerId: selectedCustomerId,
          invoiceDate,
          items: lineItems,
          subtotal,
          discount,
          vatPercent,
          vatAmount,
          totalAmount,
          paidAmount,
          balanceDue,
          paymentMethod,
          status: balanceDue <= 0 ? "paid" : paidAmount > 0 ? "partial" : "due",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        transaction.set(invoiceRef, invoiceData);

        // Update product stock
        for (const item of lineItems) {
          const productRef = doc(db, "companies", companyId!, "branches", branchId!, "products", item.productId);
          transaction.update(productRef, { 
            currentStock: increment(-item.qty),
            updatedAt: serverTimestamp()
          });
        }
      });

      toast({ title: "Invoice Generated", description: "Stock levels updated automatically." });
      setIsAddModalOpen(false);
      resetForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: "System Error", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomerId("");
    setLineItems([]);
    setDiscount(0);
    setPaidAmount(0);
    setPaymentMethod("cash");
    setInvoiceDate(new Date().toISOString().split('T')[0]);
  };

  const handleDelete = () => {
    if (!selectedRecord || !db || !companyId || !branchId) return;
    const docRef = doc(db, "companies", companyId, "branches", branchId, "sales_invoices", selectedRecord.id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Invoice Removed" });
    setIsDeleteAlertOpen(false);
  };

  const filteredInvoices = invoices?.filter(inv => inv.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-headline text-blue-600">Sales Registry</h1>
        <Button className="rounded-full gap-2 h-9 px-6 bg-blue-600 hover:bg-blue-700 font-bold text-[10px] uppercase shadow-lg shadow-blue-100" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
          <Plus className="h-4 w-4" /> New Sale
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Revenue Today" value={`৳${stats.today.toLocaleString()}`} icon={TrendingUp} colorClass="bg-blue-600" />
        <KPICard title="Monthly Volume" value={`৳${stats.monthly.toLocaleString()}`} icon={Calendar} colorClass="bg-green-600" />
        <KPICard title="Total Orders" value={stats.total} icon={ShoppingBag} colorClass="bg-purple-600" />
        <KPICard title="Receivables" value={`৳${stats.due.toLocaleString()}`} icon={AlertCircle} colorClass="bg-red-600" />
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input 
            placeholder="Search invoice number..." 
            className="pl-9 h-10 w-full rounded-xl bg-white border-none shadow-sm ring-1 ring-slate-100 text-xs focus:ring-blue-500 transition-all outline-none" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden rounded-xl">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow>
                <TableHead className="h-10 text-[10px] uppercase font-bold">Invoice #</TableHead>
                <TableHead className="h-10 text-[10px] uppercase font-bold">Client</TableHead>
                <TableHead className="h-10 text-[10px] uppercase font-bold">Total</TableHead>
                <TableHead className="h-10 text-[10px] uppercase font-bold">Status</TableHead>
                <TableHead className="h-10 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices?.map((inv) => (
                <TableRow key={inv.id} className="h-12 hover:bg-muted/10 transition-colors">
                  <TableCell className="font-bold text-xs uppercase text-blue-600">{inv.invoiceNumber}</TableCell>
                  <TableCell className="text-xs font-medium">
                    {customers?.find(c => c.id === inv.customerId)?.firstName || "Guest Client"}
                  </TableCell>
                  <TableCell className="font-bold text-xs">৳{inv.totalAmount?.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-[8px] h-5 uppercase border-none px-2", 
                      inv.status === 'paid' ? "bg-green-50 text-green-700" : 
                      inv.status === 'partial' ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700")}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-blue-50 text-blue-600"><MoreVertical className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem className="text-xs"><Eye className="mr-2 h-3.5 w-3.5" /> View</DropdownMenuItem>
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

      {/* MINIMAL SALES FORM DIALOG */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden border-none shadow-2xl bg-slate-50">
          <DialogHeader className="bg-blue-600 p-4 text-white flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold font-headline uppercase tracking-tight">Generate Invoice</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" className="text-white/80 hover:text-white" onClick={() => setIsAddModalOpen(false)}><X className="h-5 w-5" /></Button>
          </DialogHeader>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto max-h-[80vh]">
            {/* Left: Main Form */}
            <div className="lg:col-span-8 space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-2xl shadow-sm ring-1 ring-slate-100">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Identify Customer</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200">
                      <SelectValue placeholder="Search client database..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.firstName} {c.lastName} ({c.phoneNumber})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Transaction Date</Label>
                  <Input type="date" className="h-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 text-xs" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm ring-1 ring-slate-100">
                  <Search className="h-4 w-4 text-blue-600" />
                  <Select onValueChange={handleAddProduct}>
                    <SelectTrigger className="h-10 flex-1 border-none focus:ring-0 shadow-none text-xs font-medium">
                      <SelectValue placeholder="Scan barcode or search products..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map(p => (
                        <SelectItem key={p.id} value={p.id} className="text-xs">
                          <div className="flex justify-between w-full gap-8">
                            <span>{p.name} <small className="opacity-50">({p.sku})</small></span>
                            <span className="font-bold">৳{p.unitPrice?.toLocaleString()}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-[10px] uppercase font-bold">Product</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold text-center w-20">Qty</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold text-right w-24">Price</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold text-right w-24">Total</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic text-xs uppercase font-bold tracking-widest bg-slate-50/50">No items selected</TableCell>
                        </TableRow>
                      ) : (
                        lineItems.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-xs font-bold uppercase truncate max-w-[150px]">{item.name}</TableCell>
                            <TableCell>
                              <Input type="number" className="h-7 text-center font-bold text-xs rounded-lg" value={item.qty} onChange={e => handleUpdateQty(idx, Number(e.target.value))} />
                            </TableCell>
                            <TableCell>
                              <Input type="number" className="h-7 text-right font-bold text-xs rounded-lg" value={item.price} onChange={e => handleUpdatePrice(idx, Number(e.target.value))} />
                            </TableCell>
                            <TableCell className="text-right font-bold text-xs">৳{item.total.toLocaleString()}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:bg-red-50" onClick={() => handleRemoveItem(idx)}><Trash2 className="h-3 w-3" /></Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Right: Totals & Summary */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-blue-600 text-white p-6 rounded-[2rem] shadow-xl space-y-4 relative overflow-hidden">
                <Calculator className="absolute -bottom-4 -right-4 h-24 w-24 opacity-10" />
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-black opacity-60 tracking-widest text-center">Net Final Amount</p>
                  <h2 className="text-4xl font-headline font-black text-center">৳{totalAmount.toLocaleString()}</h2>
                </div>
                <div className="pt-4 space-y-2 border-t border-white/10 text-xs font-medium">
                  <div className="flex justify-between opacity-80"><span>Subtotal</span><span>৳{subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-red-200"><span>Discount</span><span>- ৳{discount.toLocaleString()}</span></div>
                  <div className="flex justify-between opacity-80"><span>VAT ({vatPercent}%)</span><span>+ ৳{vatAmount.toLocaleString()}</span></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm ring-1 ring-slate-100 space-y-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Adjustments</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Input type="number" placeholder="Discount ৳" className="h-10 text-xs font-bold rounded-xl" value={discount || ''} onChange={e => setDiscount(Number(e.target.value))} />
                    <Input type="number" placeholder="VAT %" className="h-10 text-xs font-bold rounded-xl" value={vatPercent || ''} onChange={e => setVatPercent(Number(e.target.value))} />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <Label className="text-[10px] font-bold uppercase text-blue-600">Settlement</Label>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input type="number" placeholder="Amount Paid ৳" className="h-12 pl-9 text-lg font-black text-blue-600 rounded-xl bg-blue-50/50 border-blue-100" value={paidAmount || ''} onChange={e => setPaidAmount(Number(e.target.value))} />
                    </div>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-10 rounded-xl text-xs font-bold">
                        <SelectValue placeholder="Payment Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash" className="text-xs">Cash Payment</SelectItem>
                        <SelectItem value="bkash" className="text-xs">bKash (MFS)</SelectItem>
                        <SelectItem value="bank" className="text-xs">Bank Transfer</SelectItem>
                        <SelectItem value="card" className="text-xs">POS Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className={cn("p-4 rounded-2xl flex items-center justify-between", balanceDue > 0 ? "bg-red-50" : "bg-green-50")}>
                   <div className="space-y-0.5">
                     <p className="text-[8px] uppercase font-bold text-muted-foreground">Remaining Due</p>
                     <p className={cn("text-lg font-black", balanceDue > 0 ? "text-red-600" : "text-green-600")}>৳{balanceDue.toLocaleString()}</p>
                   </div>
                   {balanceDue <= 0 && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                </div>

                <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 mt-2" disabled={isSubmitting || lineItems.length === 0} onClick={handleSaveInvoice}>
                  {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Post Transaction
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-3xl border-none p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600 mb-2">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black font-headline uppercase tracking-tight">Void Invoice?</h2>
              <p className="text-xs text-muted-foreground font-medium px-4">This action will permanently delete the transaction record and is not reversible.</p>
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <Button variant="ghost" className="flex-1 rounded-full text-[10px] uppercase font-black" onClick={() => setIsDeleteAlertOpen(false)}>Discard</Button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700 rounded-full text-[10px] uppercase font-black shadow-lg shadow-red-100" onClick={handleDelete}>Confirm Void</Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
