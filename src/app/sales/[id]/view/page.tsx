"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Loader2, 
  AlertCircle,
  FileText
} from "lucide-react"
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Button } from "@/components/ui/button"
import { DocumentTemplate } from "@/components/documents/document-template"
import { useTranslation } from "@/hooks/use-translation"

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

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Retrieving Secure Document...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-16 text-center bg-white rounded-[3rem] border border-dashed m-10">
        <AlertCircle className="h-12 w-12 text-red-200 mx-auto mb-6" />
        <h2 className="text-xl font-bold font-headline uppercase text-slate-900">{t('dataNotFound')}</h2>
        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest mt-2">Invoice terminal could not locate record</p>
        <Button variant="outline" className="mt-8 rounded-full h-10 px-8 font-black text-[10px] uppercase" onClick={() => router.push('/sales')}>
          <ArrowLeft className="h-3.5 w-3.5 mr-2" /> {t('back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 pb-20">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b px-4 py-3 flex items-center justify-between no-print mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/sales')} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-blue-600">{invoice.invoiceNumber}</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Document Analysis Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-full h-10 px-6 font-black text-[10px] uppercase gap-2 border-none ring-1 ring-slate-200 shadow-sm bg-white" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> {t('print')}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-full h-10 px-8 font-black text-[10px] uppercase gap-2 shadow-xl shadow-blue-100" onClick={() => window.print()}>
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-2xl rounded-none md:rounded-[2.5rem] overflow-hidden border border-slate-100 ring-1 ring-slate-100/50">
        <DocumentTemplate
          title={t('invoiceShortcut')}
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
            serialNumber: i.serials?.join(', ')
          }))}
          subtotal={invoice.subtotal}
          taxAmount={invoice.vatAmount}
          taxRate={invoice.vatPercent}
          discount={invoice.discount}
          grandTotal={invoice.totalAmount}
          status={invoice.status}
          notes={invoice.notes}
          type="invoice"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
        <Card className="border-none shadow-sm bg-slate-50 p-6 rounded-3xl ring-1 ring-slate-100">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Payment Reconciliation</p>
           <div className="flex justify-between items-baseline">
             <span className="text-xs font-bold text-slate-600">Paid Amount</span>
             <span className="text-lg font-black text-green-600">৳{invoice.paidAmount?.toLocaleString()}</span>
           </div>
           <div className="flex justify-between items-baseline mt-1">
             <span className="text-xs font-bold text-slate-600">Balance Due</span>
             <span className="text-lg font-black text-red-600">৳{invoice.balanceDue?.toLocaleString()}</span>
           </div>
        </Card>
        <Card className="border-none shadow-sm bg-slate-50 p-6 rounded-3xl ring-1 ring-slate-100 flex items-center justify-center gap-4">
           <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
             <FileText className="h-5 w-5" />
           </div>
           <div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Digital Audit</p>
             <p className="text-xs font-bold text-slate-700">Verified {new Date(invoice.createdAt?.toDate?.()).toLocaleDateString()}</p>
           </div>
        </Card>
        <Button className="h-full rounded-[2rem] bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest shadow-xl" onClick={() => router.push(`/sales/${id}/edit`)}>
          <FileText className="h-4 w-4 mr-2" /> Modify Record
        </Button>
      </div>
    </div>
  );
}
