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
  LayoutGrid
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, doc, runTransaction, serverTimestamp, increment } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates"
import { KPICard } from "@/components/dashboard/kpi-card"
import { useTranslation } from "@/hooks/use-translation"
import { DocumentTemplate } from "@/components/documents/document-template"

interface ChallanItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isCustom?: boolean;
}

export default function ChallansPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form State
  const [isManualCustomer, setIsManualCustomer] = React.useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState("");
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [manualCustomerName, setManualCustomerName] = React.useState("");
  const [manualCustomerPhone, setManualCustomerPhone] = React.useState("");
  const [manualCustomerAddress, setManualCustomerAddress] = React.useState("");
  
  const [dispatchDate, setDispatchDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [lineItems, setLineItems] = React.useState<ChallanItem[]>([]);
  const [deliveryMethod, setDeliveryMethod] = React.useState("Company Vehicle");
  const [vehicleNumber, setVehicleNumber] = React.useState("");
  const [driverName, setDriverName] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // Queries
  const challansQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return query(collection(db, "companies", companyId, "branches", branchId, "delivery_challans"), orderBy("createdAt", "desc"));
  }, [db, companyId, branchId]);
  const { data: challans, isLoading } = useCollection(challansQuery);

  const invoicesQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId) return null;
    return collection(db, "companies", companyId, "branches", branchId, "sales_invoices");
  }, [db, companyId, branchId]);
  const { data: invoices } = useCollection(invoicesQuery);

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
  const totalAmount = lineItems.reduce((sum, item) => sum + item.total, 0);

  const stats = React.useMemo(() => ({
    total: challans?.length || 0,
    pending: challans?.filter(c => c.status === 'pending').length || 0,
    delivered: challans?.filter(c => c.status === 'delivered').length || 0,
  }), [challans]);

  // Handle selection of Invoice to populate data
  React.useEffect(() => {
    if (!selectedInvoiceId || selectedInvoiceId === "none") return;
    const inv = invoices?.find(i => i.id === selectedInvoiceId);
    if (inv) {
      setIsManualCustomer(false);
      setSelectedCustomerId(inv.customerId);
      setLineItems(inv.items.map((item: any) => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku || "",
        quantity: item.qty,
        unitPrice: item.price || item.unitPrice || 0,
        total: item.total || (item.qty * (item.price || item.unitPrice || 0)),
        isCustom: false
      })));
    }
  }, [selectedInvoiceId, invoices]);

  const addCatalogItem = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;

    const existing = lineItems.find(i => i.productId === productId);
    if (existing) {
      setLineItems(lineItems.map(i => 
        i.productId === productId 
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice } 
          : i
      ));
    } else {
      setLineItems([...lineItems, {
        productId: product.id,
        name: product.name,
        sku: product.sku || "N/A",
        quantity: 1,
        unitPrice: product.unitPrice || 0,
        total: product.unitPrice || 0,
        isCustom: false
      }]);
    }
  };

  const addCustomItem = () => {
    setLineItems([...lineItems, {
      productId: `manual-${Date.now()}`,
      name: "",
      sku: "CUSTOM",
      quantity: 1,
      unitPrice: 0,
      total: 0,
      isCustom: true
    }]);
  };

  const updateItem = (index: number, field: keyof ChallanItem, value: any) => {
    const newItems = [...lineItems];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].total = Number(newItems[index].quantity || 0) * Number(newItems[index].unitPrice || 0);
    }
    setLineItems(newItems);
  };

  const removeItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleSaveChallan = async () => {
    if (!isManualCustomer && !selectedCustomerId) {
      toast({ variant: "destructive", title: t('error'), description: "Please select a customer or provide manual details." });
      return;
    }
    if (isManualCustomer && !manualCustomerName) {
      toast({ variant: "destructive", title: t('error'), description: "Please enter customer name." });
      return;
    }
    if (lineItems.length === 0) {
      toast({ variant: "destructive", title: t('error'), description: t('noItemsSelected') });
      return;
    }

    setIsSubmitting(true);
    try {
      await runTransaction(db!, async (transaction) => {
        const challanRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "delivery_challans"));
        
        let customerName = manualCustomerName;
        let customerPhone = manualCustomerPhone;
        let customerAddress = manualCustomerAddress;
        let finalCustomerId = selectedCustomerId;

        if (!isManualCustomer) {
          const customer = customers?.find(c => c.id === selectedCustomerId);
          customerName = customer ? `${customer.firstName} ${customer.lastName}` : "Client";
          customerPhone = customer?.phoneNumber || "";
          customerAddress = customer?.companyName || "---";
        } else {
          finalCustomerId = "manual";
        }

        const invoice = invoices?.find(i => i.id === selectedInvoiceId);

        const challanData = {
          id: challanRef.id,
          companyId,
          branchId,
          challanNumber: `CHL-${Date.now().toString().slice(-6)}`,
          invoiceId: selectedInvoiceId || "manual",
          invoiceNumber: invoice?.invoiceNumber || "MANUAL",
          customerId: finalCustomerId,
          customerName,
          customerPhone,
          customerAddress,
          dispatchDate,
          deliveryDate: "",
          deliveryMethod,
          vehicleNumber,
          driverName,
          notes,
          items: lineItems,
          totalAmount,
          status: "pending",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        transaction.set(challanRef, challanData);

        // Atomic Stock Adjustment for items that exist in inventory
        for (const item of lineItems) {
          if (!item.isCustom) {
            const productRef = doc(db!, "companies", companyId!, "branches", branchId!, "products", item.productId);
            transaction.update(productRef, { 
              currentStock: increment(-item.quantity),
              updatedAt: serverTimestamp()
            });
          }
        }
      });

      toast({ title: t('success'), description: t('successSub') });
      setIsAddModalOpen(false);
      resetForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareWhatsApp = (challan: any) => {
    const text = `Hello ${challan.customerName}, your delivery challan ${challan.challanNumber} has been generated. Dispatch Date: ${challan.dispatchDate}. Status: ${challan.status.toUpperCase()}.`;
    window.open(`https://wa.me/${challan.customerPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const resetForm = () => {
    setSelectedInvoiceId("none");
    setSelectedCustomerId("");
    setManualCustomerName("");
    setManualCustomerPhone("");
    setManualCustomerAddress("");
    setIsManualCustomer(false);
    setLineItems([]);
    setDispatchDate(new Date().toISOString().split('T')[0]);
    setDeliveryMethod("Company Vehicle");
    setVehicleNumber("");
    setDriverName("");
    setNotes("");
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
        <Button className="rounded-full gap-2 h-10 px-8 bg-amber-600 hover:bg-amber-700 font-bold text-[10px] uppercase shadow-xl shadow-amber-100 transition-all active:scale-95 w-full md:w-auto" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
          <Plus className="h-4 w-4" /> {t('addChallan')}
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="h-10 text-[10px] uppercase font-black pl-6">{t('challanNumber')}</TableHead>
                  <TableHead className="h-10 text-[10px] uppercase font-black">{t('customer')}</TableHead>
                  <TableHead className="h-10 text-[10px] uppercase font-black">{t('dispatchDate')}</TableHead>
                  <TableHead className="h-10 text-[10px] uppercase font-black text-center">{t('status')}</TableHead>
                  <TableHead className="h-10 text-right pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChallans?.map((c) => (
                  <TableRow key={c.id} className="h-14 hover:bg-muted/5 transition-colors group">
                    <TableCell className="pl-6">
                      <span className="font-black text-xs uppercase text-amber-600">{c.challanNumber}</span>
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
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-amber-50 text-amber-600 transition-colors"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                          <DropdownMenuItem className="text-xs font-bold" onClick={() => { setSelectedRecord(c); setIsViewModalOpen(true); }}><Eye className="mr-2 h-3.5 w-3.5" /> {t('view')}</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs font-bold" onClick={() => handleShareWhatsApp(c)}><Share2 className="mr-2 h-3.5 w-3.5" /> {t('share')}</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-xs font-bold text-red-600" onClick={() => { setSelectedRecord(c); setIsDeleteAlertOpen(true); }}><Trash2 className="mr-2 h-3.5 w-3.5" /> {t('delete')}</DropdownMenuItem>
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

      {/* NEW CHALLAN MODAL */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-[95vw] w-[1400px] p-0 overflow-hidden border-none shadow-2xl bg-slate-50 rounded-[2rem] md:rounded-[2.5rem]">
          <DialogHeader className="bg-amber-600 p-5 text-white flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-bold font-headline uppercase tracking-tight">{t('addChallan')}</DialogTitle>
                <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em] leading-none mt-1 hidden md:block">Logistics & Dispatch Terminal</p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row h-[85vh] lg:h-[80vh] overflow-hidden">
            {/* Form Side */}
            <div className="flex-1 flex flex-col p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto lg:overflow-hidden custom-scrollbar">
              
              {/* TOP GRID: LINKING & DATE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl ring-1 ring-slate-100 shadow-sm">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t('fromInvoice')} (Optional)</Label>
                  <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                    <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 transition-all focus:ring-2 focus:ring-amber-600">
                      <SelectValue placeholder="Link existing sales record..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-2xl max-h-[200px]">
                      <SelectItem value="none" className="text-xs font-bold text-slate-400 italic">None (Standalone Dispatch)</SelectItem>
                      {invoices?.map(i => <SelectItem key={i.id} value={i.id} className="text-xs font-bold">{i.invoiceNumber} - {i.customerName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t('dispatchDate')}</Label>
                  <Input type="date" className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 text-xs font-bold" value={dispatchDate} onChange={e => setDispatchDate(e.target.value)} />
                </div>
              </div>

              {/* CUSTOMER SECTION */}
              <div className="bg-white p-4 md:p-6 rounded-2xl ring-1 ring-slate-100 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-amber-600" /> Customer Identification
                  </h3>
                  <div className="flex items-center gap-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground">Individual Entry</Label>
                    <Switch checked={isManualCustomer} onCheckedChange={setIsManualCustomer} className="data-[state=checked]:bg-amber-600" />
                  </div>
                </div>

                {isManualCustomer ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Full Name</Label>
                      <Input className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 text-xs font-bold" value={manualCustomerName} onChange={e => setManualCustomerName(e.target.value)} placeholder="e.g. John Doe" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Phone Number</Label>
                      <Input className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 text-xs font-bold" value={manualCustomerPhone} onChange={e => setManualCustomerPhone(e.target.value)} placeholder="+880..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Delivery Address</Label>
                      <Input className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 text-xs font-bold" value={manualCustomerAddress} onChange={e => setManualCustomerAddress(e.target.value)} placeholder="Village, City, Area..." />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">{t('customer')}</Label>
                    <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 shadow-sm">
                        <SelectValue placeholder="Search from database..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold">{c.firstName} {c.lastName} - {c.companyName || 'Personal'}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* PRODUCT PICKER */}
              <div className="bg-white p-4 rounded-2xl ring-1 ring-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Select Product to Add</Label>
                    <Select onValueChange={addCatalogItem}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 shadow-sm transition-all focus:ring-2 focus:ring-amber-500">
                        <SelectValue placeholder={t('addProduct')} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {products?.map(p => (
                          <SelectItem key={p.id} value={p.id} className="text-xs font-bold">
                            {p.name} <span className="text-[9px] opacity-60 ml-2">(STOCK: {p.currentStock})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" className="h-12 rounded-xl gap-2 border-amber-200 text-amber-700 font-black text-[10px] uppercase bg-amber-50/50" onClick={addCustomItem}>
                    <PackagePlus className="h-4 w-4" /> {t('addCustomItem')}
                  </Button>
                </div>
              </div>

              {/* PRODUCT WORKSHEET */}
              <div className="flex-1 bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-sm ring-1 ring-slate-100 overflow-hidden flex flex-col border border-slate-50 min-h-[300px] md:min-h-0">
                <div className="p-4 border-b bg-slate-50/50">
                  <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                    <Barcode className="h-3.5 w-3.5" /> {t('itemDescription')}
                  </h3>
                </div>
                <div className="overflow-x-auto lg:overflow-y-auto flex-1 custom-scrollbar">
                  <Table>
                    <TableHeader className="bg-slate-50/50 sticky top-0 z-10 backdrop-blur-md">
                      <TableRow>
                        <TableHead className="text-[10px] uppercase font-black py-4 pl-4 md:pl-8">{t('itemDescription')}</TableHead>
                        <TableHead className="text-[10px] uppercase font-black text-center w-24">{t('qty')}</TableHead>
                        <TableHead className="text-[10px] uppercase font-black text-right w-32 hidden sm:table-cell">{t('unitPrice')}</TableHead>
                        <TableHead className="text-[10px] uppercase font-black text-right w-32 pr-4 md:pr-8">{t('total')}</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-48 text-center">
                            <div className="flex flex-col items-center opacity-20">
                              <Box className="h-12 w-12 mb-4" />
                              <p className="text-[10px] uppercase font-black tracking-[0.3em]">{t('noItemsSelected')}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        lineItems.map((item, idx) => (
                          <TableRow key={idx} className="h-16 hover:bg-slate-50/50 transition-colors group">
                            <TableCell className="pl-4 md:pl-8">
                              {item.isCustom ? (
                                <Input 
                                  className="h-8 text-[11px] font-black uppercase border-none ring-1 ring-slate-100 bg-slate-50/30" 
                                  value={item.name} 
                                  onChange={e => updateItem(idx, 'name', e.target.value)} 
                                  placeholder="Type individual product name..."
                                />
                              ) : (
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter">{item.name}</span>
                                  <p className="text-[9px] font-mono text-muted-foreground">{item.sku}</p>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Input 
                                type="number" 
                                className="h-8 w-16 mx-auto text-center font-black text-xs bg-slate-100 border-none" 
                                value={item.quantity} 
                                onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                              />
                            </TableCell>
                            <TableCell className="text-right hidden sm:table-cell">
                              <Input 
                                type="number" 
                                className="h-8 w-24 ml-auto text-right font-bold text-xs bg-slate-100 border-none" 
                                value={item.unitPrice} 
                                onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))}
                                disabled={!item.isCustom}
                              />
                            </TableCell>
                            <TableCell className="text-right pr-4 md:pr-8 text-xs font-black text-amber-600">
                              ৳{item.total.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 rounded-full hover:bg-red-50 md:opacity-0 md:group-hover:opacity-100" onClick={() => removeItem(idx)}>
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

            {/* Sidebar Summary */}
            <div className="w-full lg:w-[350px] bg-white border-t lg:border-t-0 lg:border-l border-slate-100 p-6 md:p-8 space-y-6 flex flex-col shadow-2xl relative z-20 shrink-0 overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                <div className="bg-amber-600 text-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl shadow-amber-100 space-y-4 text-center">
                  <p className="text-[10px] uppercase font-black opacity-60 tracking-[0.2em]">{t('grandTotal')}</p>
                  <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tighter">৳{totalAmount.toLocaleString()}</h2>
                </div>

                <div className="space-y-4 bg-slate-50 p-6 rounded-3xl ring-1 ring-slate-100">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <LayoutGrid className="h-3 w-3" /> Logistics Context
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('deliveryMethod')}</Label>
                      <Input className="h-10 rounded-xl bg-white border-none ring-1 ring-slate-200 text-xs font-bold" value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('vehicleNumber')}</Label>
                      <Input className="h-10 rounded-xl bg-white border-none ring-1 ring-slate-200 text-xs font-bold" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('driverName')}</Label>
                      <Input className="h-10 rounded-xl bg-white border-none ring-1 ring-slate-200 text-xs font-bold" value={driverName} onChange={e => setDriverName(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('notes')}</Label>
                    <textarea 
                      className="w-full min-h-[100px] rounded-2xl bg-slate-50 border-none p-4 text-xs font-medium focus:ring-2 focus:ring-amber-600 outline-none resize-none" 
                      placeholder="Special instructions for delivery team..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50 flex items-center gap-3 border-2 border-dashed border-blue-200">
                  <div className="p-2 rounded-xl bg-blue-600 text-white"><Calculator className="h-4 w-4" /></div>
                  <p className="text-[9px] font-black uppercase tracking-tighter leading-tight text-blue-700">Inventory sync active for catalog items only.</p>
                </div>
              </div>

              <div className="mt-auto pt-6 pb-4 lg:pb-0">
                <Button 
                  className="w-full h-16 bg-amber-600 hover:bg-amber-700 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-amber-100 transition-all active:scale-95" 
                  disabled={isSubmitting || lineItems.length === 0} 
                  onClick={handleSaveChallan}
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                  {t('postTransaction')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* VIEW CHALLAN DIALOG */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-[21cm] w-[95vw] p-0 border-none bg-transparent shadow-none overflow-y-auto max-h-[95vh] rounded-none">
          <div className="flex justify-end gap-3 mb-4 no-print fixed top-4 right-4 md:top-6 md:right-6 z-[100]">
             <Button onClick={() => window.print()} className="bg-white text-amber-600 hover:bg-amber-50 shadow-2xl rounded-full font-black text-[10px] uppercase h-10 px-6 gap-2 border-none ring-1 ring-amber-100">
              <Printer className="h-4 w-4" /> {t('print')}
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

      {/* DELETE ALERT */}
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
