
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
  TrendingUp, 
  CreditCard, 
  Clock, 
  Trash2, 
  Calculator,
  Printer,
  ChevronRight,
  Scan,
  AlertCircle,
  Eye,
  Edit,
  Download,
  CheckCircle2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, serverTimestamp, query, orderBy, doc, increment, runTransaction, where, updateDoc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { cn } from "@/lib/utils"
import { KPICard } from "@/components/dashboard/kpi-card"
import { toast } from "@/hooks/use-toast"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { usePermissions } from "@/hooks/use-permissions"

interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  requiresSerial: boolean;
  serialId?: string;
  serialNumber?: string;
}

export default function SalesPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { can } = usePermissions();
  
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [scanTerm, setScanTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [lineItems, setLineItems] = React.useState<InvoiceItem[]>([]);
  const [taxRate, setTaxRate] = React.useState(15);
  const [discount, setDiscount] = React.useState(0);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "sales_invoices"), orderBy("createdAt", "desc"));
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

  const serialsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "serial_numbers"), where("status", "==", "available"));
  }, [db, companyId, branchId]);
  const { data: availableSerials } = useCollection(serialsQuery);

  // OPTIMIZATION: Memoized Map for O(1) serial lookups during scan
  const serialLookupMap = React.useMemo(() => {
    const map = new Map<string, any>();
    availableSerials?.forEach(s => map.set(s.serialNumber.toLowerCase(), s));
    return map;
  }, [availableSerials]);

  // OPTIMIZATION: Memoized Financials to prevent heavy computation on every re-render
  const financials = React.useMemo(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const grandTotal = subtotal + taxAmount - discount;
    return { subtotal, taxAmount, grandTotal };
  }, [lineItems, taxRate, discount]);

  // KPI Memoization
  const stats = React.useMemo(() => {
    const revenue = invoices?.reduce((s, i) => s + (i.totalAmount || 0), 0) || 0;
    const dues = invoices?.filter(i => i.status === 'due').reduce((s, i) => s + (i.totalAmount || 0), 0) || 0;
    const count = invoices?.length || 0;
    return { revenue, dues, count };
  }, [invoices]);

  const handleScan = (val: string) => {
    setScanTerm(val);
    const foundSerial = serialLookupMap.get(val.toLowerCase());
    if (foundSerial) {
      const product = products?.find(p => p.id === foundSerial.productId);
      if (product) {
        if (lineItems.find(li => li.serialId === foundSerial.id)) {
          toast({ variant: "destructive", title: "Duplicate", description: "This serial is already added." });
        } else {
          setLineItems([...lineItems, {
            productId: product.id,
            name: product.name,
            quantity: 1,
            unitPrice: product.unitPrice,
            total: product.unitPrice,
            requiresSerial: true,
            serialId: foundSerial.id,
            serialNumber: foundSerial.serialNumber
          }]);
          toast({ title: "Detected", description: `${product.name} (S/N: ${foundSerial.serialNumber})` });
          setScanTerm("");
        }
      }
    }
  };

  const handleAddLineItem = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;
    if (product.serialNumberTrackingRequired) {
      toast({ title: "Serialized Item", description: "Please use the serial selection dropdown or scan the unit." });
      return;
    }
    const existing = lineItems.find(item => item.productId === productId && !item.requiresSerial);
    if (existing) {
      setLineItems(lineItems.map(item => 
        item.productId === productId && !item.requiresSerial 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice } : item
      ));
    } else {
      setLineItems([...lineItems, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.unitPrice,
        total: product.unitPrice,
        requiresSerial: false
      }]);
    }
  };

  const handleAddSerialItem = (serialId: string) => {
    const serial = availableSerials?.find(s => s.id === serialId);
    if (!serial) return;
    const product = products?.find(p => p.id === serial.productId);
    if (!product) return;
    if (lineItems.find(li => li.serialId === serial.id)) return;

    setLineItems([...lineItems, {
      productId: product.id,
      name: product.name,
      quantity: 1,
      unitPrice: product.unitPrice,
      total: product.unitPrice,
      requiresSerial: true,
      serialId: serial.id,
      serialNumber: serial.serialNumber
    }]);
  };

  const handleSubmitInvoice = async () => {
    if (!selectedCustomerId || lineItems.length === 0) {
      toast({ variant: "destructive", title: "Incomplete Form", description: "Select customer and products." });
      return;
    }

    setIsSubmitting(true);
    try {
      await runTransaction(db, async (transaction) => {
        const invoiceRef = doc(collection(db, "companies", companyId!, "branches", branchId!, "sales_invoices"));
        
        for (const item of lineItems) {
          const productRef = doc(db, "companies", companyId!, "branches", branchId!, "products", item.productId);
          transaction.update(productRef, { currentStock: increment(-item.quantity) });

          if (item.requiresSerial && item.serialId) {
            const serialRef = doc(db, "companies", companyId!, "branches", branchId!, "serial_numbers", item.serialId);
            transaction.update(serialRef, { status: "sold", saleInvoiceId: invoiceRef.id });
          }
        }

        transaction.set(invoiceRef, {
          id: invoiceRef.id,
          companyId,
          branchId,
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
          customerId: selectedCustomerId,
          items: lineItems,
          taxRate,
          discount,
          totalAmount: financials.grandTotal,
          status: "due",
          invoiceDate: new Date().toISOString(),
          createdAt: serverTimestamp(),
        });
      });

      toast({ title: "Invoice Finalized", description: "Inventory deducted and serials marked as Sold." });
      setIsAddModalOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateInvoice = async () => {
    if (!selectedRecord) return;
    setIsSubmitting(true);
    try {
      const invRef = doc(db, "companies", companyId!, "branches", branchId!, "sales_invoices", selectedRecord.id);
      await updateDoc(invRef, {
        customerId: selectedCustomerId,
        taxRate,
        discount,
        totalAmount: financials.grandTotal,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Invoice Updated", description: "Financial details have been saved." });
      setIsEditModalOpen(false);
      resetForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Update Failed", description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleDeleteInvoice = async () => {
    if (!selectedRecord) return;
    try {
      const docRef = doc(db, "companies", companyId!, "branches", branchId!, "sales_invoices", selectedRecord.id);
      deleteDocumentNonBlocking(docRef);
      toast({ title: "Invoice Deleted", description: "Record removed from ledger." });
      setIsDeleteAlertOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Delete Error", description: e.message });
    }
  };

  const resetForm = () => {
    setSelectedCustomerId("");
    setLineItems([]);
    setTaxRate(15);
    setDiscount(0);
    setSelectedRecord(null);
  };

  const openEdit = (inv: any) => {
    setSelectedRecord(inv);
    setSelectedCustomerId(inv.customerId);
    setLineItems(inv.items || []);
    setTaxRate(inv.taxRate || 15);
    setDiscount(inv.discount || 0);
    setIsEditModalOpen(true);
  };

  const handlePrint = (inv: any) => {
    toast({ title: "PDF Engine Initialized", description: `Generating document for ${inv.invoiceNumber}...` });
    setTimeout(() => window.print(), 1000);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline text-green-600">Sales & Invoicing</h1>
          <p className="text-sm text-muted-foreground mt-1">POS workflow with real-time serial tracking</p>
        </div>
        {can('sales', 'create') && (
          <Button className="bg-green-600 hover:bg-green-700 gap-2 rounded-full px-8 shadow-lg h-12 font-bold" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
            <Plus className="h-5 w-5" /> New POS Transaction
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Revenue" value={`৳${stats.revenue.toLocaleString()}`} icon={TrendingUp} colorClass="bg-green-500" />
        <KPICard title="Outstandings" value={`৳${stats.dues.toLocaleString()}`} icon={Clock} colorClass="bg-orange-500" />
        <KPICard title="Total Sales" value={stats.count} icon={FileText} colorClass="bg-blue-500" />
        <KPICard title="Daily Growth" value="+12%" icon={CreditCard} colorClass="bg-purple-500" />
      </div>

      {isInvoicesLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>
      ) : (
        <Card className="border-none shadow-sm rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Units Sold</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices?.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/20">
                    <TableCell className="font-bold text-green-700 uppercase">{inv.invoiceNumber}</TableCell>
                    <TableCell className="text-xs">{customers?.find(c => c.id === inv.customerId)?.firstName || "Guest"}</TableCell>
                    <TableCell className="text-xs font-medium">{inv.items?.reduce((s: number, i: any) => s + i.quantity, 0)} Units</TableCell>
                    <TableCell className="font-bold text-xs">৳{inv.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={cn("text-[10px] capitalize", inv.status === 'paid' ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700")}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handlePrint(inv)}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                          {can('sales', 'edit') && (
                            <DropdownMenuItem onClick={() => openEdit(inv)}><Edit className="mr-2 h-4 w-4" /> Edit Record</DropdownMenuItem>
                          )}
                          {can('sales', 'export') && (
                            <DropdownMenuItem onClick={() => handlePrint(inv)}><Download className="mr-2 h-4 w-4" /> Download PDF</DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {can('sales', 'delete') && (
                            <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedRecord(inv); setIsDeleteAlertOpen(true); }}>
                              <Trash2 className="mr-2 h-4 w-4" /> Delete Invoice
                            </DropdownMenuItem>
                          )}
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

      {/* NEW/EDIT INVOICE MODAL */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { setIsAddModalOpen(false); setIsEditModalOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-y-auto p-0 border-none shadow-2xl">
          <DialogHeader className={cn("p-6 text-white", isEditModalOpen ? "bg-blue-600" : "bg-green-600")}>
            <DialogTitle className="text-2xl font-headline flex items-center gap-3">
              <ShoppingCart className="h-6 w-6" /> {isEditModalOpen ? `Adjust Invoice ${selectedRecord?.invoiceNumber}` : "Dynamic POS Terminal"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            <div className="lg:col-span-8 p-6 space-y-6 border-r">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Step 1: Client</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Identify customer..." /></SelectTrigger>
                    <SelectContent>{customers?.map(c => <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {!isEditModalOpen && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-green-600">Step 2: Smart Scan (Serial / SKU)</Label>
                    <div className="relative">
                      <Scan className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                      <input placeholder="Ready to scan..." className="flex h-12 w-full pl-9 border-2 border-green-50 rounded-xl focus:outline-none focus:border-green-500 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50" value={scanTerm} onChange={e => handleScan(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between"><Label className="font-bold text-xs uppercase tracking-wider">Cart Items</Label>
                  {!isEditModalOpen && (
                    <div className="flex gap-2">
                      <Select onValueChange={handleAddLineItem}>
                        <SelectTrigger className="w-[180px] h-8 text-[10px] bg-muted/50 border-none"><SelectValue placeholder="+ Add Standard Item" /></SelectTrigger>
                        <SelectContent>{products?.filter(p => !p.serialNumberTrackingRequired).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                      <Select onValueChange={handleAddSerialItem}>
                        <SelectTrigger className="w-[180px] h-8 text-[10px] bg-purple-50 border-none text-purple-700 font-bold"><SelectValue placeholder="+ Select Available Serial" /></SelectTrigger>
                        <SelectContent>{availableSerials?.map(s => <SelectItem key={s.id} value={s.id}>{s.serialNumber} ({products?.find(p => p.id === s.productId)?.name})</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="border rounded-2xl overflow-hidden shadow-sm bg-white">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow><TableHead>Product Description</TableHead><TableHead className="w-[80px]">Qty</TableHead><TableHead>Price</TableHead><TableHead className="text-right">Total</TableHead><TableHead /></TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground italic"><ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-20" />Terminal waiting for items...</TableCell></TableRow>
                      ) : (
                        lineItems.map((item, idx) => (
                          <TableRow key={idx}>
                            <TableCell>
                              <div className="font-bold text-sm">{item.name}</div>
                              {item.requiresSerial && <Badge className="text-[9px] bg-purple-50 text-purple-700 uppercase mt-1 border-purple-100">S/N: {item.serialNumber}</Badge>}
                            </TableCell>
                            <TableCell>
                              <Input type="number" disabled={item.requiresSerial || isEditModalOpen} value={item.quantity} className="h-8 text-xs font-bold" onChange={e => {
                                const qty = Math.max(1, Number(e.target.value));
                                setLineItems(lineItems.map((li, i) => i === idx ? { ...li, quantity: qty, total: qty * li.unitPrice } : li));
                              }} />
                            </TableCell>
                            <TableCell className="text-xs">৳{item.unitPrice}</TableCell>
                            <TableCell className="text-right font-bold">৳{item.total.toLocaleString()}</TableCell>
                            <TableCell>
                              {!isEditModalOpen && <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setLineItems(lineItems.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-muted/10 p-6 flex flex-col justify-between">
              <div className="space-y-6">
                <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground border-b pb-2">Financials</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-bold">৳{financials.subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2"><span>VAT</span><Input type="number" className="w-12 h-7 p-1 text-xs" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} />%</div>
                    <span>+৳{financials.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm"><span>Discounts</span><Input type="number" className="w-24 h-8 text-right font-bold text-red-600" value={discount} onChange={e => setDiscount(Number(e.target.value))} /></div>
                  <div className="pt-4 border-t-2 border-dashed border-green-200">
                    <div className="flex justify-between items-baseline"><span className="text-xs uppercase font-bold text-muted-foreground">Amount Due</span><span className="text-3xl font-headline font-bold text-green-700">৳{financials.grandTotal.toLocaleString()}</span></div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-8">
                {isEditModalOpen ? (
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 h-16 rounded-2xl text-xl font-bold gap-3" onClick={handleUpdateInvoice} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 className="h-6 w-6" />} Save Adjustments
                  </Button>
                ) : (
                  <Button className="w-full bg-green-600 hover:bg-green-700 h-16 rounded-2xl text-xl font-bold gap-3 shadow-xl shadow-green-100" onClick={handleSubmitInvoice} disabled={isSubmitting || lineItems.length === 0}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <ChevronRight className="h-6 w-6" />} Finalize Transaction
                  </Button>
                )}
                <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-semibold uppercase"><AlertCircle className="h-3 w-3" /> Automatic stock deduction enforced</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice {selectedRecord?.invoiceNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will remove the record from your sales ledger. Note: This will NOT automatically reverse stock deductions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteInvoice}>Confirm Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
