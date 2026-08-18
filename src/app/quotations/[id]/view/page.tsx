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
  Share2
} from "lucide-react"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DocumentTemplate } from "@/components/documents/document-template"
import { useTranslation } from "@/hooks/use-translation"

export default function ViewQuotationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const quoteRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return doc(db, "companies", companyId, "branches", branchId, "quotations", id as string);
  }, [db, companyId, branchId, id]);

  const { data: quote, isLoading } = useDoc(quoteRef);

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Retrieving Secure Proposal...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="p-16 text-center bg-white rounded-[3rem] border border-dashed m-10">
        <AlertCircle className="h-12 w-12 text-red-200 mx-auto mb-6" />
        <h2 className="text-xl font-bold font-headline uppercase text-slate-900">{t('common.noData')}</h2>
        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mt-2">Proposal terminal could not locate record</p>
        <Button variant="outline" className="mt-8 rounded-full h-10 px-8 font-black text-[10px] uppercase" onClick={() => router.push('/quotations')}>
          <ArrowLeft className="h-3.5 w-3.5 mr-2" /> {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 pb-20">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b px-4 py-3 flex items-center justify-between no-print mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/quotations')} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-blue-600">{quote.quotationNumber}</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Proposal Analysis Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-full h-10 px-6 font-black text-[10px] uppercase gap-2 border-none ring-1 ring-slate-200 shadow-sm bg-white" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> {t('common.print')}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-full h-10 px-8 font-black text-[10px] uppercase gap-2 shadow-xl shadow-blue-100" onClick={() => window.print()}>
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-2xl rounded-none md:rounded-[2.5rem] overflow-hidden border border-slate-100 ring-1 ring-slate-100/50">
        <DocumentTemplate
          title={t('nav.quotations')}
          docNumber={quote.quotationNumber}
          date={quote.quotationDate}
          customerName={quote.customerName}
          customerInfo={`Phone: ${quote.customerPhone || 'N/A'}\nAddress: ${quote.customerAddress || 'Interested Prospect'}`}
          projectName={quote.projectName}
          projectLocation={quote.projectLocation}
          items={(quote.items || []).map((i: any) => ({
            ...i,
            quantity: i.qty || i.quantity,
            unitPrice: i.price || i.unitPrice,
            total: i.total
          }))}
          subtotal={quote.subtotal}
          taxAmount={quote.taxAmount}
          discount={quote.discount}
          grandTotal={quote.totalAmount}
          status={quote.status}
          notes={quote.notes}
          type="quotation"
          layoutOverride="warrior"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <Card className="border-none shadow-sm bg-slate-50 p-6 rounded-3xl ring-1 ring-slate-100">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Proposal Valuation</p>
           <div className="flex justify-between items-baseline">
             <span className="text-xs font-bold text-slate-600">Quote Total</span>
             <span className="text-lg font-black text-blue-600">৳{quote.totalAmount?.toLocaleString()}</span>
           </div>
           <div className="flex justify-between items-center mt-3 border-t border-slate-200 pt-2">
             <span className="text-[10px] font-black uppercase text-slate-400">Validity</span>
             <span className="text-[10px] font-black text-slate-900">{quote.expiryDate ? new Date(quote.expiryDate).toLocaleDateString() : '30 Days'}</span>
           </div>
        </Card>
        <Card className="border-none shadow-sm bg-slate-50 p-6 rounded-3xl ring-1 ring-slate-100 flex items-center justify-center gap-4">
           <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
             <Share2 className="h-5 w-5" />
           </div>
           <div className="text-center">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Proposal Status</p>
             <Badge className="text-[8px] h-4 uppercase font-black border-none">{quote.status}</Badge>
           </div>
        </Card>
        <Button className="h-full rounded-[2rem] bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest shadow-xl" onClick={() => router.push(`/quotations/${id}/edit`)}>
          <FileText className="h-4 w-4 mr-2" /> Modify Proposal
        </Button>
      </div>
    </div>
  );
}