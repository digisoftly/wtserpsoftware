"use client"

import * as React from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Loader2, 
  AlertCircle,
  Share2,
  MessageSquare,
  Copy,
  Receipt,
  CheckCircle2,
  Clock,
  Edit
} from "lucide-react"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DocumentTemplate } from "@/components/documents/document-template"
import { useTranslation } from "@/hooks/use-translation"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

export default function ViewInvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const invoiceRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return doc(db, "companies", companyId, "branches", branchId, "sales_invoices", id as string);
  }, [db, companyId, branchId, id]);

  const { data: invoice, isLoading } = useDoc(invoiceRef);

  // Auto-print effect
  React.useEffect(() => {
    if (!isLoading && invoice && searchParams.get('print') === 'true') {
      const timer = setTimeout(() => {
        window.print();
      }, 800); // Give layout time to settle
      return () => clearTimeout(timer);
    }
  }, [isLoading, invoice, searchParams]);

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
            <div className="h-20 w-20 rounded-3xl bg-[#0D6EFD]/10 flex items-center justify-center animate-pulse">
              <Receipt className="h-10 w-10 text-[#0D6EFD]" />
            </div>
            <Loader2 className="absolute -bottom-2 -right-2 h-8 w-8 animate-spin text-[#0D6EFD] bg-white rounded-full p-1 shadow-lg" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#0D6EFD] animate-pulse">Retrieving Secure Document...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-16 text-center bg-white rounded-[2rem] border border-dashed m-10 shadow-xl">
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
    <div className="flex flex-col h-full bg-[#F8FAFC] min-h-screen font-sans pb-20 no-scrollbar">
      {/* Sticky Action Header - HIDDEN DURING PRINT */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b px-6 py-4 flex items-center justify-between no-print shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/sales')} className="rounded-full hover:bg-slate-100">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-black font-headline uppercase tracking-tight text-slate-900">{invoice.invoiceNumber}</h1>
              <Badge className={cn("text-[9px] h-5 uppercase px-2 font-black border-none shadow-sm", 
                invoice.status === "paid" ? "bg-[#198754] text-white" : "bg-[#DC3545] text-white")}>
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
            <Printer className="h-4 w-4 text-[#0D6EFD]" /> {t('print')}
          </Button>
          <Button className="bg-[#0D6EFD] hover:bg-[#0A58CA] text-white rounded-full h-10 px-8 font-black text-[10px] uppercase gap-2 shadow-xl shadow-blue-100 transition-all active:scale-95" onClick={() => window.print()}>
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto w-full p-4 md:p-10">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-100 ring-1 ring-slate-100/50 animate-in fade-in slide-in-from-bottom-4 duration-700 origin-top">
          <DocumentTemplate
            title={t('taxInvoice')}
            docNumber={invoice.invoiceNumber}
            date={invoice.invoiceDate}
            customerName={invoice.customerName}
            customerInfo={`Mobile: ${invoice.customerPhone || 'N/A'}\n${invoice.customerAddress || 'Walk-in Customer'}`}
            items={invoice.items.map((i: any) => ({
              name: i.name,
              quantity: i.qty,
              unit: i.unit,
              unitPrice: i.price,
              total: i.total,
              discount: i.discount,
              description: `Brand: ${i.brand || 'Warrior'} | Model: ${i.model || 'N/A'}`
            }))}
            subtotal={invoice.subtotal}
            taxAmount={invoice.vatAmount}
            taxRate={invoice.vatPercent}
            discount={invoice.discount + (invoice.globalDiscount || 0)}
            grandTotal={invoice.totalAmount}
            status={invoice.status}
            notes={invoice.notes}
            type="invoice"
            layoutOverride="warrior"
          />
        </div>

        <div className="mt-8 flex flex-col md:flex-row justify-center items-center gap-4 no-print pb-20">
           <div className="flex items-center gap-6 bg-slate-900 text-white px-8 py-3 rounded-full shadow-2xl ring-1 ring-white/10">
              <div className="flex items-center gap-3 border-r border-white/20 pr-6">
                 {invoice.status === 'paid' ? <CheckCircle2 className="h-5 w-5 text-[#198754]" /> : <Clock className="h-5 w-5 text-[#FFC107]" />}
                 <span className="text-[10px] font-black uppercase tracking-widest">{invoice.status}</span>
              </div>
              <div className="flex items-center gap-3">
                 <span className="text-[10px] font-black uppercase opacity-60">Net Amount:</span>
                 <span className="text-sm font-black tracking-tight">৳{invoice.totalAmount?.toLocaleString()}</span>
              </div>
              <Button variant="ghost" size="sm" className="rounded-full text-white/40 hover:text-white hover:bg-white/10 h-8 gap-2 ml-4" onClick={() => router.push(`/sales/${id}/edit`)}>
                <Edit className="h-3.5 w-3.5" /> <span className="text-[9px] font-black uppercase">Edit</span>
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}