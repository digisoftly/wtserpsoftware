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
  Edit,
  History,
  CreditCard,
  Plus
} from "lucide-react"
import { useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, where, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

  const paymentsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "payments"),
      where("invoiceId", "==", id),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId, id]);
  const { data: payments } = useCollection(paymentsQuery);

  // Auto-print effect
  React.useEffect(() => {
    if (!isLoading && invoice && searchParams.get('print') === 'true') {
      const timer = setTimeout(() => {
        window.print();
      }, 800); 
      return () => clearTimeout(timer);
    }
  }, [isLoading, invoice, searchParams]);

  const handleShareWhatsApp = () => {
    if (!invoice) return;
    const text = `Hello ${invoice.customerName}, your invoice ${invoice.invoiceNumber} has been generated for ৳${invoice.totalAmount?.toLocaleString()}. Status: ${invoice.status?.toUpperCase()}.`;
    window.open(`https://wa.me/${invoice.customerPhone}?text=${encodeURIComponent(text)}`, '_blank');
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

  if (!invoice) return <div className="p-20 text-center uppercase font-black text-muted-foreground">{t('dataNotFound')}</div>;

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] min-h-screen pb-20 no-scrollbar">
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b px-6 py-4 flex items-center justify-between no-print shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/sales')} className="rounded-full">
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-black font-headline uppercase tracking-tight text-slate-900">{invoice.invoiceNumber}</h1>
              <Badge className={cn("text-[9px] h-5 uppercase px-2 font-black border-none shadow-sm", 
                invoice.status === "paid" ? "bg-green-600 text-white" : "bg-red-600 text-white")}>
                {invoice.status?.toUpperCase()}
              </Badge>
            </div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mt-0.5">Secure Transaction Viewer</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-full gap-2 border-slate-200 h-10 px-4 font-bold text-[10px] uppercase text-slate-600 bg-white" onClick={handleShareWhatsApp}>
            <MessageSquare className="h-3.5 w-3.5" /> WhatsApp
          </Button>
          <Button variant="outline" className="rounded-full h-10 px-6 font-black text-[10px] uppercase gap-2 border-none ring-1 ring-slate-200 shadow-sm bg-white" onClick={() => window.print()}>
            <Printer className="h-4 w-4 text-blue-600" /> {t('print')}
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 px-8 font-black text-[10px] uppercase gap-2 shadow-xl shadow-blue-100" onClick={() => window.print()}>
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto w-full p-4 md:p-10 grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* INVOICE PREVIEW */}
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-100 ring-1 ring-slate-100/50 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <DocumentTemplate
              title={t('taxInvoice')}
              docNumber={invoice.invoiceNumber}
              date={invoice.invoiceDate}
              customerName={invoice.customerName}
              customerInfo={`Mobile: ${invoice.customerPhone || 'N/A'}\n${invoice.customerAddress || 'Walk-in Customer'}`}
              projectName={invoice.projectName}
              projectLocation={invoice.projectLocation}
              items={(invoice.items || []).map((i: any) => ({
                name: i.name,
                quantity: i.qty,
                unit: i.unit,
                unitPrice: i.price,
                total: i.total,
                discount: i.discount,
                description: i.description,
                brand: i.brand,
                model: i.model,
                sn: i.sn,
                specs: i.specs,
                warranty: i.warranty
              }))}
              subtotal={invoice.subtotal}
              taxAmount={invoice.taxAmount}
              discount={invoice.discount}
              grandTotal={invoice.totalAmount}
              status={invoice.status}
              notes={invoice.notes}
              type="invoice"
              layoutOverride="warrior"
            />
          </div>
        </div>

        {/* PAYMENT SUMMARY & HISTORY */}
        <div className="xl:col-span-4 space-y-6 no-print">
          <Card className="border-none shadow-sm rounded-[2rem] bg-slate-900 text-white overflow-hidden">
             <CardHeader className="bg-white/5 p-6 border-b border-white/5">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-400" /> {t('payment')} Summary
                </CardTitle>
             </CardHeader>
             <CardContent className="p-8 space-y-6">
                <div className="flex justify-between items-end">
                   <p className="text-[9px] font-black uppercase opacity-60">Total Invoice</p>
                   <p className="text-xl font-black">৳{invoice.totalAmount?.toLocaleString()}</p>
                </div>
                <div className="flex justify-between items-end border-t border-white/5 pt-4">
                   <p className="text-[9px] font-black uppercase text-emerald-400">Total Collected</p>
                   <p className="text-xl font-black text-emerald-400">৳{invoice.paidAmount?.toLocaleString()}</p>
                </div>
                <div className="flex justify-between items-end border-t border-white/5 pt-4">
                   <p className="text-[9px] font-black uppercase text-red-400">Remaining Due</p>
                   <p className="text-2xl font-black text-red-400">৳{(invoice.balanceDue || 0).toLocaleString()}</p>
                </div>
                
                {invoice.status !== 'paid' && (
                  <Button className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest gap-2 mt-4 shadow-xl shadow-emerald-900/50" onClick={() => router.push(`/sales/payments/collect/${id}`)}>
                    <Plus className="h-4 w-4" /> {t('collectPayment')}
                  </Button>
                )}
             </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2rem] bg-white ring-1 ring-slate-100 overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-50 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <History className="h-4 w-4 text-blue-600" /> {t('paymentHistory')}
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase text-blue-600" onClick={() => router.push('/payments')}>
                {t('allPayments')}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                 <TableBody>
                   {payments?.length === 0 ? (
                     <TableRow><TableCell className="h-32 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No collection history</TableCell></TableRow>
                   ) : (
                     payments?.map((p) => (
                       <TableRow key={p.id} className="hover:bg-slate-50/50 h-14 cursor-pointer" onClick={() => router.push(`/sales/payments/receipt/${p.id}`)}>
                         <TableCell className="pl-6">
                            <p className="text-[10px] font-black text-slate-900 uppercase">{p.receiptNumber}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">{new Date(p.paymentDate).toLocaleDateString()}</p>
                         </TableCell>
                         <TableCell className="text-right pr-6">
                            <span className="text-xs font-black text-emerald-600">৳{p.amount?.toLocaleString()}</span>
                         </TableCell>
                       </TableRow>
                     ))
                   )}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
