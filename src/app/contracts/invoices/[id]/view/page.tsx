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

export default function ViewContractInvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const invoiceRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return doc(db, "companies", companyId, "branches", branchId, "contract_invoices", id as string);
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
        <Button variant="outline" className="mt-8 rounded-full h-10 px-8 font-black text-[10px] uppercase" onClick={() => router.back()}>
          <ArrowLeft className="h-3.5 w-3.5 mr-2" /> {t('back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 pb-20">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b px-4 py-3 flex items-center justify-between no-print mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-blue-600">SLA INVOICE</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{invoice.billingMonth}</p>
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
          title="Service Contract Invoice"
          docNumber={`SLA-${invoice.id.slice(-6).toUpperCase()}`}
          date={invoice.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()}
          customerName={invoice.customerName}
          customerInfo={`Contract Ref: ${invoice.contractNumber}\nBilling Month: ${invoice.billingMonth}`}
          items={[{
            name: invoice.serviceName || "Service Subscription",
            description: `Monthly service fee for ${invoice.billingMonth}`,
            quantity: 1,
            unit: "Month",
            unitPrice: invoice.amount,
            total: invoice.amount
          }]}
          subtotal={invoice.amount}
          grandTotal={invoice.amount}
          status={invoice.status}
          type="invoice"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
        <Card className="border-none shadow-sm bg-slate-50 p-6 rounded-3xl ring-1 ring-slate-100">
           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Cycle Reconciliation</p>
           <div className="flex justify-between items-baseline">
             <span className="text-xs font-bold text-slate-600">Invoice Status</span>
             <Badge variant="outline" className={invoice.status === 'paid' ? "bg-green-50 text-green-700 border-none uppercase font-black text-[9px]" : "bg-orange-50 text-orange-700 border-none uppercase font-black text-[9px]"}>
               {invoice.status}
             </Badge>
           </div>
        </Card>
        <Button className="h-full rounded-[2rem] bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest shadow-xl" onClick={() => router.push(`/contracts/invoices/${id}/edit`)}>
          <FileText className="h-4 w-4 mr-2" /> Modify Invoice
        </Button>
      </div>
    </div>
  );
}
