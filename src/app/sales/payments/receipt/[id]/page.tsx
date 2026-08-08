
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

export default function PaymentReceiptPage() {
  const { id } = useParams();
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const paymentRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return doc(db, "companies", companyId, "branches", branchId, "payments", id as string);
  }, [db, companyId, branchId, id]);

  const { data: payment, isLoading } = useDoc(paymentRef);

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;
  if (!payment) return <div className="p-20 text-center uppercase font-black text-muted-foreground">{t('dataNotFound')}</div>;

  return (
    <div className="max-w-[1000px] mx-auto space-y-6 pb-20">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b px-4 py-3 flex items-center justify-between no-print mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-black font-headline uppercase tracking-tight text-blue-600">PAYMENT RECEIPT</h1>
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{payment.receiptNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-full h-10 px-6 font-black text-[10px] uppercase gap-2 bg-white" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> {t('print')}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 rounded-full h-10 px-8 font-black text-[10px] uppercase gap-2 shadow-xl shadow-blue-100" onClick={() => window.print()}>
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-2xl rounded-none md:rounded-[2.5rem] overflow-hidden border border-slate-100 ring-1 ring-slate-100/50">
        <DocumentTemplate
          title="OFFICIAL PAYMENT RECEIPT"
          docNumber={payment.receiptNumber}
          date={payment.paymentDate}
          customerName={payment.customerName}
          customerInfo={`Ref Invoice: ${payment.invoiceNumber}\nPayment Method: ${payment.paymentMethod}\nReference: ${payment.reference || 'N/A'}`}
          items={[{
            name: "Partial Installment / Payment Received",
            description: `Payment for Invoice ${payment.invoiceNumber}. Method: ${payment.paymentMethod}`,
            quantity: 1,
            unit: "Inst",
            unitPrice: payment.amount,
            total: payment.amount
          }]}
          subtotal={payment.amount}
          grandTotal={payment.amount}
          status="authenticated"
          notes={payment.notes || "This is a computer-generated proof of payment."}
          type="agreement"
        />
      </div>
    </div>
  );
}
