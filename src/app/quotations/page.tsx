
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
  ArrowRight,
  Download,
  Share2,
  Mail,
  MessageSquare,
  AlertCircle,
  Calendar,
  User,
  Calculator,
  LayoutGrid,
  FileBadge,
  PackagePlus,
  Box
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"
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
  id: string;
  productId: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountValue: number;
  discountType: 'percent' | 'amount';
  taxPercent: number;
  total: number;
  isCustom?: boolean;
}

export default function QuotationsPage() {
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();
  
  // UI State
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedRecord, setSelectedRecord] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Builder State
  const [isManualCustomer, setIsManualCustomer] = React.useState(false);
  const [manualCustomer, setManualCustomer] = React.useState({ name: "", phone: "", email: "", address: "" });
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [lineItems, setLineItems] = React.useState<QuoteItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = React.useState(0);
  const [notes, setNotes] = React.useState("1. Quotation is valid for 30 days.\n2. 50% Advance required for order processing.\n3. Goods once sold are not returnable.");
  const [status, setStatus] = React.useState("draft");
  const [expiryDate, setExpiryDate] = React.useState("");

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
  const calculations = React.useMemo(() => {
    const itemSubtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const itemDiscounts = lineItems.reduce((sum, item) => {
      const disc = item.discountType === 'percent' 
        ? (item.quantity * item.unitPrice * (item.discountValue / 100))
        : item.discountValue;
      return sum + disc;
    }, 0);
    const itemTaxes = lineItems.reduce((sum, item) => {
      const discountedPrice = (item.quantity * item.unitPrice) - (item.discountType === 'percent' ? (item.quantity * item.unitPrice * (item.discountValue / 100)) : item.discountValue);
      return sum + (discountedPrice * (item.taxPercent / 100));
    }, 0);

    const subtotal = itemSubtotal - itemDiscounts;
    const finalTotal = subtotal + itemTaxes - globalDiscount;

    return {
      rawSubtotal: itemSubtotal,
      discounts: itemDiscounts,
      taxes: itemTaxes,
      subtotal,
      finalTotal
    };
  }, [lineItems, globalDiscount]);

  const stats = React.useMemo(() => ({
    total: quotations?.length || 0,
    draft: quotations?.filter(q => q.status === 'draft').length || 0,
    approved: quotations?.filter(q => q.status === 'approved').length || 0,
    expired: quotations?.filter(q => q.status === 'expired').length || 0,
  }), [quotations]);

  const handleAddLineItem = (productId: string) => {
    const product = products?.find(p => p.id === productId);
    if (!product) return;
    
    const newItem: QuoteItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: product.id,
      name: product.name,
      description: "",
      quantity: 1,
      unit: product.unit || "Pcs",
      unitPrice: product.unitPrice || 0,
      discountValue: 0,
      discountType: 'percent',
      taxPercent: 0,
      total: product.unitPrice || 0,
      isCustom: false
    };
    setLineItems([...lineItems, newItem]);
  };

  const addCustomItem = () => {
    const newItem: QuoteItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: "custom",
      name: "",
      description: "",
      quantity: 1,
      unit: "Pcs",
      unitPrice: 0,
      discountValue: 0,
      discountType: 'percent',
      taxPercent: 0,
      total: 0,
      isCustom: true
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (id: string, field: keyof QuoteItem, value: any) => {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      
      // Calculate row total
      const raw = updated.quantity * updated.unitPrice;
      const disc = updated.discountType === 'percent' ? (raw * (updated.discountValue / 100)) : updated.discountValue;
      const taxed = (raw - disc) * (updated.taxPercent / 100);
      updated.total = raw - disc + taxed;
      
      return updated;
    }));
  };

  const handleSaveQuote = async () => {
    if (!db || !companyId || !branchId) return;
    if (!isManualCustomer && !selectedCustomerId) {
      toast({ variant: "destructive", title: "Missing Customer", description: "Please select or add a client." });
      return;
    }
    if (lineItems.length === 0) {
      toast({ variant: "destructive", title: t('error'), description: t('noItemsSelected') });
      return;
    }

    setIsSubmitting(true);
    try {
      const quoteRef = isEditModalOpen 
        ? doc(db, "companies", companyId, "branches", branchId, "quotations", selectedRecord.id)
        : doc(collection(db, "companies", companyId, "branches", branchId, "quotations"));
      
      let clientData = isManualCustomer ? manualCustomer : (customers?.find(c => c.id === selectedCustomerId) || {});

      const quoteData = {
        id: quoteRef.id,
        companyId,
        branchId,
        quotationNumber: isEditModalOpen ? selectedRecord.quotationNumber : `QTN-${Date.now().toString().slice(-4)}`,
        customerId: isManualCustomer ? "manual" : selectedCustomerId,
        customerName: isManualCustomer ? manualCustomer.name : `${clientData.firstName} ${clientData.lastName}`,
        customerEmail: clientData.email || "",
        customerPhone: isManualCustomer ? manualCustomer.phone : (clientData.phoneNumber || ""),
        customerAddress: isManualCustomer ? manualCustomer.address : (clientData.companyName || ""),
        items: lineItems,
        subtotal: calculations.subtotal,
        taxAmount: calculations.taxes,
        discount: globalDiscount,
        totalAmount: calculations.finalTotal,
        status,
        notes,
        expiryDate,
        quotationDate: new Date().toISOString(),
        createdAt: isEditModalOpen ? selectedRecord.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(quoteRef, quoteData, { merge: true });
      toast({ title: t('success'), description: "Quotation has been synchronized." });
      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      resetForm();
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedCustomerId("");
    setIsManualCustomer(false);
    setManualCustomer({ name: "", phone: "", email: "", address: "" });
    setLineItems([]);
    setGlobalDiscount(0);
    setStatus("draft");
    setSelectedRecord(null);
    setExpiryDate("");
  };

  const openEdit = (q: any) => {
    setSelectedRecord(q);
    setIsManualCustomer(q.customerId === 'manual');
    if (q.customerId === 'manual') {
      setManualCustomer({ name: q.customerName, phone: q.customerPhone, email: q.customerEmail, address: q.customerAddress });
    } else {
      setSelectedCustomerId(q.customerId);
    }
    setLineItems(q.items || []);
    setGlobalDiscount(q.discount || 0);
    setStatus(q.status || "draft");
    setNotes(q.notes || "");
    setExpiryDate(q.expiryDate || "");
    setIsEditModalOpen(true);
  };

  const handleShareWhatsApp = (q: any) => {
    const text = `Hello ${q.customerName}, here is your quotation ${q.quotationNumber} for ৳${q.totalAmount.toLocaleString()}. Status: ${q.status.toUpperCase()}.`;
    window.open(`https://wa.me/${q.customerPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredQuotations = quotations?.filter(q => 
    q.quotationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black font-headline text-blue-600 uppercase tracking-tight">{t('quotations')}</h1>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Customized Proposal Terminal</p>
        </div>
        <Button className="rounded-full gap-2 h-10 px-8 bg-blue-600 hover:bg-blue-700 font-bold text-[10px] uppercase shadow-xl shadow-blue-100 transition-all active:scale-95 w-full md:w-auto" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
          <Plus className="h-4 w-4" /> {t('createQuote')}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title={t('totalQuotations')} value={stats.total} icon={FileText} colorClass="bg-blue-600" />
        <KPICard title={t('pendingQuotes')} value={stats.draft} icon={Clock} colorClass="bg-orange-600" />
        <KPICard title={t('approvedQuotes')} value={stats.approved} icon={CheckCircle2} colorClass="bg-green-600" />
        <KPICard title="Expired" value={stats.expired} icon={X} colorClass="bg-red-600" />
      </div>

      <div className="flex gap-2 bg-white p-3 rounded-xl border shadow-sm ring-1 ring-slate-100">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input 
            placeholder={t('search')} 
            className="pl-9 h-10 w-full rounded-xl bg-slate-50/50 border-none text-xs focus:ring-2 focus:ring-blue-500 transition-all outline-none font-bold" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
      ) : (
        <Card className="border-none shadow-sm overflow-hidden rounded-[2rem] bg-white ring-1 ring-slate-100">
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="h-12 text-[10px] uppercase font-black pl-8">{t('quoteNumber')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('customer')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black">{t('amount')}</TableHead>
                  <TableHead className="h-12 text-[10px] uppercase font-black text-center">{t('status')}</TableHead>
                  <TableHead className="h-12 text-right pr-8 sticky right-0 bg-white/95 backdrop-blur-sm z-20 w-[180px]">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotations?.map((q) => (
                  <TableRow key={q.id} className="h-16 hover:bg-muted/5 transition-colors group">
                    <TableCell className="pl-8">
                      <span className="font-black text-xs uppercase text-blue-600 tracking-tighter">{q.quotationNumber}</span>
                      <p className="text-[8px] text-muted-foreground font-bold mt-0.5">{new Date(q.quotationDate).toLocaleDateString()}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{q.customerName}</span>
                        <span className="text-[9px] text-muted-foreground font-bold">{q.customerPhone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-xs text-slate-900">৳{q.totalAmount?.toLocaleString()}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("text-[8px] h-5 uppercase border-none px-2 font-black", 
                        q.status === 'approved' ? "bg-green-50 text-green-700" : 
                        q.status === 'sent' ? "bg-blue-50 text-blue-700" : 
                        q.status === 'rejected' ? "bg-red-50 text-red-700" : 
                        q.status === 'expired' ? "bg-slate-100 text-slate-600" : "bg-orange-50 text-orange-700")}>
                        {q.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8 sticky right-0 bg-white/90 backdrop-blur-sm group-hover:bg-slate-50/90 transition-colors z-20 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">
                      <div className="flex justify-end items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-blue-600 hover:bg-blue-50" onClick={() => { setSelectedRecord(q); setIsViewModalOpen(true); }}><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-amber-600 hover:bg-amber-50" onClick={() => openEdit(q)}><Edit className="h-3.5 w-3.5" /></Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-blue-50 text-blue-600"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => { setSelectedRecord(q); setIsViewModalOpen(true); }}><Printer className="mr-2 h-3.5 w-3.5" /> {t('print')}</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => handleShareWhatsApp(q)}><MessageSquare className="mr-2 h-3.5 w-3.5" /> WhatsApp</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs font-bold" onClick={() => {}}><Mail className="mr-2 h-3.5 w-3.5" /> Email Quote</DropdownMenuItem>
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

      {/* CUSTOMIZED QUOTATION BUILDER MODAL */}
      <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={(open) => { if(!open) { resetForm(); setIsAddModalOpen(false); setIsEditModalOpen(false); } }}>
        <DialogContent className="max-w-[95vw] w-[1400px] p-0 overflow-hidden border-none shadow-2xl bg-slate-50 rounded-[2.5rem] max-h-[96vh]">
          <DialogHeader className={cn("p-5 text-white flex-row items-center justify-between space-y-0 shrink-0", isEditModalOpen ? "bg-indigo-600" : "bg-blue-600")}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0">
                <FileBadge className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg md:text-xl font-bold font-headline uppercase tracking-tight">{isEditModalOpen ? "Modify Quotation" : "Draft New Proposal"}</DialogTitle>
                <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em] leading-none mt-1 hidden md:block">Sales Engineering Terminal</p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex flex-col lg:flex-row h-[calc(96vh-80px)] overflow-hidden">
            {/* BUILDER SIDE */}
            <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 overflow-y-auto custom-scrollbar">
              
              {/* HEADER GRID: CLIENT & DATES */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white p-6 rounded-[2rem] ring-1 ring-slate-100 shadow-sm">
                <div className="md:col-span-8 space-y-4">
                  <div className="flex items-center justify-between">
                     <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Client Identification</Label>
                     <div className="flex items-center gap-3 bg-slate-50 px-3 py-1 rounded-full scale-90">
                       <span className="text-[9px] font-black uppercase text-muted-foreground">New / Individual</span>
                       <Switch checked={isManualCustomer} onCheckedChange={setIsManualCustomer} className="data-[state=checked]:bg-blue-600" />
                     </div>
                  </div>
                  
                  {isManualCustomer ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                       <div className="space-y-1.5"><Label className="text-[9px] font-bold uppercase text-slate-500">Full Name</Label><Input className="h-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 text-xs font-bold" value={manualCustomer.name} onChange={e => setManualCustomer({...manualCustomer, name: e.target.value})} /></div>
                       <div className="space-y-1.5"><Label className="text-[9px] font-bold uppercase text-slate-500">Phone</Label><Input className="h-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 text-xs font-bold" value={manualCustomer.phone} onChange={e => setManualCustomer({...manualCustomer, phone: e.target.value})} /></div>
                       <div className="md:col-span-2 space-y-1.5"><Label className="text-[9px] font-bold uppercase text-slate-500">Full Address</Label><Input className="h-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 text-xs" value={manualCustomer.address} onChange={e => setManualCustomer({...manualCustomer, address: e.target.value})} /></div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                        <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-bold text-xs"><SelectValue placeholder="Search from customer database..." /></SelectTrigger>
                        <SelectContent className="rounded-xl max-h-[300px]">
                          {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-bold">{c.firstName} {c.lastName} - {c.companyName || 'Personal'}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="md:col-span-4 space-y-4">
                  <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Proposal Timeline</Label>
                  <div className="space-y-4">
                    <div className="relative">
                       <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-600" />
                       <Input type="date" className="h-11 pl-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 text-[11px] font-black uppercase" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} />
                       <span className="absolute -top-2 left-3 bg-white px-1 text-[8px] font-black text-slate-400 uppercase">Expiry Date</span>
                    </div>
                    <div className="space-y-1.5">
                       <Select value={status} onValueChange={setStatus}>
                         <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-200 font-black text-[10px] uppercase"><SelectValue /></SelectTrigger>
                         <SelectContent className="rounded-xl">
                            <SelectItem value="draft" className="text-xs font-black uppercase">Draft</SelectItem>
                            <SelectItem value="sent" className="text-xs font-black uppercase">Sent</SelectItem>
                            <SelectItem value="approved" className="text-xs font-black uppercase text-green-600">Approved</SelectItem>
                            <SelectItem value="rejected" className="text-xs font-black uppercase text-red-600">Rejected</SelectItem>
                         </SelectContent>
                       </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ITEM WORKSHEET */}
              <div className="bg-white rounded-[2rem] ring-1 ring-slate-100 shadow-sm overflow-hidden flex flex-col border border-slate-50 min-h-[400px]">
                <div className="p-5 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                   <div className="flex items-center gap-3">
                     <LayoutGrid className="h-4 w-4 text-blue-600" />
                     <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-widest">Product & Service Worksheet</h3>
                   </div>
                   <div className="flex gap-2">
                      <Select onValueChange={handleAddLineItem}>
                        <SelectTrigger className="h-10 w-[200px] rounded-full bg-white border-none ring-1 ring-slate-200 text-[10px] font-black uppercase shadow-sm">
                          <SelectValue placeholder="Add From Catalog" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                           {products?.map(p => <SelectItem key={p.id} value={p.id} className="text-xs font-bold">{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" className="rounded-full gap-2 border-blue-100 text-blue-700 bg-white h-10 px-4 font-black text-[10px] uppercase shadow-sm" onClick={addCustomItem}>
                        <PackagePlus className="h-4 w-4" /> Customized Row
                      </Button>
                   </div>
                </div>

                <div className="overflow-x-auto flex-1 custom-scrollbar">
                  <div className="min-w-[1000px]">
                    <Table>
                      <TableHeader className="bg-slate-50/30 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="text-[10px] uppercase font-black py-4 pl-8 w-[30%]">Description</TableHead>
                          <TableHead className="text-[10px] uppercase font-black text-center w-28">Qty</TableHead>
                          <TableHead className="text-[10px] uppercase font-black text-right w-32">Unit Price</TableHead>
                          <TableHead className="text-[10px] uppercase font-black text-center w-32">Discount</TableHead>
                          <TableHead className="text-[10px] uppercase font-black text-center w-24">Tax %</TableHead>
                          <TableHead className="text-[10px] uppercase font-black text-right pr-8 w-32">Row Total</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.length === 0 ? (
                          <TableRow><TableCell colSpan={7} className="h-64 text-center opacity-20"><Box className="h-12 w-12 mx-auto mb-4" /><p className="text-xs uppercase font-black tracking-widest">No Items Added to Proposal</p></TableCell></TableRow>
                        ) : (
                          lineItems.map((item, idx) => (
                            <TableRow key={item.id} className="group hover:bg-slate-50/50 transition-colors h-24">
                              <TableCell className="pl-8">
                                <div className="space-y-1.5">
                                  {item.isCustom ? (
                                    <Input className="h-9 text-[11px] font-black uppercase border-none ring-1 ring-slate-100 bg-slate-50/30 w-full rounded-lg" value={item.name} onChange={e => updateLineItem(item.id, 'name', e.target.value)} placeholder="Type product/service name..." />
                                  ) : (
                                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-tighter block">{item.name}</span>
                                  )}
                                  <textarea className="w-full text-[9px] font-bold bg-transparent border-none resize-none h-8 text-muted-foreground outline-none focus:ring-0" placeholder="Optional description or details..." value={item.description} onChange={e => updateLineItem(item.id, 'description', e.target.value)} />
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center gap-2 justify-center">
                                  <Input type="number" className="h-9 text-center font-black text-xs rounded-lg w-16 bg-slate-50 border-none" value={item.quantity} onChange={e => updateLineItem(item.id, 'quantity', Number(e.target.value))} />
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.unit || 'Pcs'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Input type="number" className="h-9 text-right font-black text-xs rounded-lg w-24 bg-slate-50 border-none ml-auto" value={item.unitPrice} onChange={e => updateLineItem(item.id, 'unitPrice', Number(e.target.value))} />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                   <Input type="number" className="h-9 text-center font-black text-xs rounded-lg w-16 bg-slate-50 border-none" value={item.discountValue} onChange={e => updateLineItem(item.id, 'discountValue', Number(e.target.value))} />
                                   <Select value={item.discountType} onValueChange={v => updateLineItem(item.id, 'discountType', v)}>
                                      <SelectTrigger className="h-9 w-12 rounded-lg bg-white p-0 text-[10px] font-black flex justify-center"><SelectValue /></SelectTrigger>
                                      <SelectContent><SelectItem value="percent">%</SelectItem><SelectItem value="amount">৳</SelectItem></SelectContent>
                                   </Select>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Input type="number" className="h-9 text-center font-black text-xs rounded-lg w-14 bg-slate-50 border-none mx-auto" value={item.taxPercent} onChange={e => updateLineItem(item.id, 'taxPercent', Number(e.target.value))} />
                              </TableCell>
                              <TableCell className="text-right pr-8"><span className="font-black text-xs text-blue-600">৳{item.total.toLocaleString()}</span></TableCell>
                              <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveItem(idx)}><X className="h-4 w-4" /></Button></TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>

            {/* SUMMARY SIDEBAR */}
            <div className="w-full lg:w-[400px] bg-white border-l border-slate-100 p-6 md:p-8 space-y-8 flex flex-col shadow-2xl relative z-20 shrink-0 overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                <div className={cn("p-8 rounded-[2.5rem] shadow-2xl space-y-4 text-center text-white", isEditModalOpen ? "bg-indigo-600" : "bg-blue-600")}>
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em]">Net Final Valuation</p>
                  <h2 className="text-3xl md:text-4xl font-headline font-black tracking-tighter">৳{calculations.finalTotal.toLocaleString()}</h2>
                  <div className="pt-6 space-y-2 border-t border-white/10 text-[10px] font-bold uppercase tracking-wider">
                    <div className="flex justify-between opacity-70"><span>Gross Subtotal</span><span>৳{calculations.rawSubtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between text-blue-100"><span>Line Discounts</span><span>- ৳{calculations.discounts.toLocaleString()}</span></div>
                    <div className="flex justify-between text-blue-100"><span>Vat Accrued</span><span>+ ৳{calculations.taxes.toLocaleString()}</span></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <Calculator className="h-3 w-3" /> Extra Global Discount (৳)
                    </Label>
                    <Input type="number" className="h-12 rounded-2xl bg-slate-50 border-none font-black text-sm text-red-600" value={globalDiscount || ''} onChange={e => setGlobalDiscount(Number(e.target.value))} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                      <FileText className="h-3 w-3" /> Notes & Conditions
                    </Label>
                    <textarea className="w-full min-h-[150px] rounded-2xl bg-slate-50 border-none p-4 text-[10px] font-bold text-slate-600 resize-none outline-none focus:ring-2 focus:ring-blue-500" value={notes} onChange={e => setNotes(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="mt-auto space-y-3">
                <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-[8px] font-black uppercase leading-tight">By saving, you generate a legal commercial proposal which can be printed or exported as PDF.</p>
                </div>
                <Button 
                  className={cn("w-full h-16 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 text-white", isEditModalOpen ? "bg-indigo-600 hover:bg-indigo-700" : "bg-blue-600 hover:bg-blue-700")} 
                  disabled={isSubmitting || lineItems.length === 0} 
                  onClick={handleSaveQuote}
                >
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mr-3" /> : <ArrowRight className="h-5 w-5 mr-3" />}
                  {isEditModalOpen ? "Update Proposal" : "Synchronize Quote"}
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
            <Button onClick={() => window.print()} className="bg-white text-blue-600 hover:bg-blue-50 shadow-2xl rounded-full font-black text-[10px] uppercase h-10 px-6 gap-2 border-none ring-1 ring-blue-100">
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>
          {selectedRecord && (
            <div className="bg-white shadow-2xl rounded-none md:rounded-[2rem] overflow-hidden">
              <DocumentTemplate
                title="Commercial Proposal"
                type="quotation"
                docNumber={selectedRecord.quotationNumber}
                date={selectedRecord.quotationDate}
                customerName={selectedRecord.customerName}
                customerInfo={`${selectedRecord.customerPhone}\n${selectedRecord.customerAddress}`}
                items={selectedRecord.items.map((i: any) => ({
                  name: i.name,
                  description: i.description,
                  quantity: i.quantity,
                  unit: i.unit,
                  unitPrice: i.unitPrice,
                  discount: i.discountValue,
                  total: i.total
                }))}
                subtotal={selectedRecord.subtotal}
                discount={selectedRecord.discount}
                taxAmount={selectedRecord.taxAmount}
                grandTotal={selectedRecord.totalAmount}
                status={selectedRecord.status}
                notes={selectedRecord.notes}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none p-10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline uppercase tracking-tight text-slate-900">{t('delete')}?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">This will permanently remove the proposal record. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest" onClick={() => { if(selectedRecord) deleteDocumentNonBlocking(doc(db!, "companies", companyId!, "branches", branchId!, "quotations", selectedRecord.id)); setIsDeleteAlertOpen(false); toast({ title: t('success') }); }}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
