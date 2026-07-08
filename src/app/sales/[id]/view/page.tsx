"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Loader2, 
  AlertCircle,
  FileText,
  Share2,
  MessageSquare,
  Mail,
  Copy,
  Receipt,
  CheckCircle2,
  Clock,
  ExternalLink
} from "lucide-react"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DocumentTemplate } from "@/components/documents/document-template"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

export default function ViewInvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const invoiceRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return doc(db, "companies", companyId, "branches", branchId, "sales_invoices", id as string);
  }, [db, companyId, branchId, id]);

  const { data: invoice, isLoading } = useDoc(invoiceRef);

  const handleShareWhatsApp = () => {
    if (!invoice) return;
    const text = `Hello ${invoice.customerName}, your invoice ${invoice.invoiceNumber} has been generated for ৳${invoice.totalAmount.toLocaleString()}. Status: ${invoice.status.toUpperCase()}.`;
    window.open(`https://wa.me/${invoice.customerPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: "Link Copied", description: "Internal document link ready to share." });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="h-20 w-20 rounded-3xl bg-blue-600/10 flex items-center justify-center animate-pulse">
              <Receipt className="h-10 w-10 text-blue-600" />
            </div>
            <Loader2 className="absolute -bottom-2 -right-2 h-8 w-8 animate-spin text-blue-600 bg-white rounded-full p-1 shadow-lg" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 animate-pulse">Retrieving Secure Document...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-16 text-center bg-white rounded-[3rem] border border-dashed m-10 shadow-xl">
        <AlertCircle className="h-16 w-16 text-red-200 mx-auto mb-6" />
        <h2 className="text-2xl font-black font-headline uppercase text-slate-900 tracking-tight">{t('dataNotFound')}</h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Terminal could not locate record ID: #{id?.slice(0, 8)}</p>
        <Button className="mt-8 rounded-full h-12 px-10 font-black text-[11px] uppercase tracking-widest bg-slate-900 text-white shadow-xl hover:bg-slate-800" onClick={() => router.push('/sales')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Sales
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] min-h-screen font-sans pb-20">
      {/* Sticky Action Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b px-6 py-4 flex items-center justify-between no-print shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/sales')} className="rounded-full hover:bg-slate-50">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-black font-headline uppercase tracking-tight text-slate-900">{invoice.invoiceNumber}</h1>
              <Badge className={cn("text-[9px] h-5 uppercase px-2 font-black border-none shadow-sm", 
                invoice.status === "paid" ? "bg-green-600 text-white" : "bg-orange-500 text-white")}>
                {invoice.status?.toUpperCase()}
              </Badge>
            </div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mt-0.5">Secure Transaction Viewer</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 pr-4 border-r border-slate-100 mr-1">
             <Button variant="outline" size="sm" className="rounded-full gap-2 border-slate-200 h-9 px-4 font-bold text-[10px] uppercase text-slate-600 bg-white hover:bg-slate-50" onClick={handleCopyLink}>
               <Copy className="h-3.5 w-3.5" /> Link
             </Button>
             <Button variant="outline" size="sm" className="rounded-full gap-2 border-slate-200 h-9 px-4 font-bold text-[10px] uppercase text-slate-600 bg-white hover:bg-slate-50" onClick={handleShareWhatsApp}>
               <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
             </Button>
          </div>
          <Button variant="outline" className="rounded-full h-10 px-6 font-black text-[10px] uppercase gap-2 border-none ring-1 ring-slate-200 shadow-sm bg-white hover:bg-slate-50" onClick={() => window.print()}>
            <Printer className="h-4 w-4 text-blue-600" /> {t('print')}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 px-8 font-black text-[10px] uppercase gap-2 shadow-xl shadow-blue-100 transition-all active:scale-95" onClick={() => window.print()}>
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto w-full p-6 lg:p-10 flex flex-col lg:flex-row gap-10">
        {/* Document Container */}
        <div className="flex-1">
          <div className="bg-white shadow-2xl rounded-[2.5rem] overflow-hidden border border-slate-100 ring-1 ring-slate-100/50 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <DocumentTemplate
              title={t('taxInvoice')}
              docNumber={invoice.invoiceNumber}
              date={invoice.invoiceDate}
              customerName={invoice.customerName}
              customerInfo={`Phone: ${invoice.customerPhone || 'N/A'}\nAddress: ${invoice.customerAddress || 'Walk-in Customer'}`}
              items={invoice.items.map((i: any) => ({
                name: i.name,
                quantity: i.qty,
                unit: i.unit,
                unitPrice: i.price,
                total: i.total,
                discount: i.discount,
                serialNumber: i.serials?.join(', ')
              }))}
              subtotal={invoice.subtotal}
              taxAmount={invoice.vatAmount}
              taxRate={invoice.vatPercent}
              discount={invoice.discount + (invoice.globalDiscount || 0)}
              grandTotal={invoice.grandTotal}
              status={invoice.status}
              notes={invoice.notes}
              type="invoice"
            />
          </div>
        </div>

        {/* Sidebar Summary & Status */}
        <div className="w-full lg:w-[380px] space-y-8 no-print animate-in fade-in slide-in-from-right-4 duration-700">
           <Card className="border-none shadow-sm rounded-3xl bg-white ring-1 ring-slate-100 overflow-hidden">
             <div className="bg-slate-900 p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                     {invoice.status === 'paid' ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <Clock className="h-5 w-5 text-orange-400" />}
                   </div>
                   <div>
                     <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">Payment Reconciliation</p>
                     <h3 className="text-sm font-black uppercase">{invoice.status} Status</h3>
                   </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full text-white/40 hover:text-white hover:bg-white/10" onClick={() => router.push(`/sales/${id}/edit`)}>
                  <Edit className="h-4 w-4" />
                </Button>
             </div>
             <CardContent className="p-8 space-y-6">
                <div className="space-y-4 pb-6 border-b border-slate-100">
                   <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                     <span>Total Paid</span>
                     <span className="text-sm font-black text-green-600">৳{invoice.paidAmount?.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                     <span>Balance Due</span>
                     <span className="text-sm font-black text-red-600">৳{invoice.balanceDue?.toLocaleString()}</span>
                   </div>
                </div>
                
                <div className="space-y-4 pt-2">
                   <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm"><FileText className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Payment Method</p>
                        <p className="text-[10px] font-black uppercase text-slate-900">{invoice.paymentMethod}</p>
                      </div>
                   </div>
                   {invoice.transactionId && (
                     <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl ring-1 ring-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm"><Receipt className="h-4 w-4" /></div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Transaction ID</p>
                          <p className="text-[10px] font-black uppercase text-blue-600 font-mono">{invoice.transactionId}</p>
                        </div>
                     </div>
                   )}
                </div>
             </CardContent>
           </Card>

           <Card className="p-8 rounded-3xl border-none shadow-sm ring-1 ring-slate-100 bg-white space-y-6">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-4">Digital Sharing</h4>
              <div className="grid grid-cols-2 gap-4">
                 <Button variant="outline" className="flex flex-col gap-2 h-20 rounded-2xl border-slate-100 hover:bg-slate-50 hover:border-slate-200 group" onClick={handleShareWhatsApp}>
                    <MessageSquare className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-black uppercase">WhatsApp</span>
                 </Button>
                 <Button variant="outline" className="flex flex-col gap-2 h-20 rounded-2xl border-slate-100 hover:bg-slate-50 hover:border-slate-200 group">
                    <Mail className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-black uppercase">Email Link</span>
                 </Button>
                 <Button variant="outline" className="flex flex-col gap-2 h-20 rounded-2xl border-slate-100 hover:bg-slate-50 hover:border-slate-200 group col-span-2" onClick={() => window.print()}>
                    <Download className="h-5 w-5 text-slate-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-black uppercase">Export Archive (.zip)</span>
                 </Button>
              </div>
           </Card>

           <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex items-center justify-between">
              <div className="relative z-10">
                 <p className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em] mb-1">Internal Reference</p>
                 <p className="text-xs font-bold font-mono">HASH_{invoice.id.slice(-10).toUpperCase()}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                 <ShieldCheck className="h-5 w-5 text-white" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}