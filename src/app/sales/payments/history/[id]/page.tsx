
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  History, 
  Loader2, 
  MoreVertical, 
  Trash2, 
  Printer, 
  Download, 
  Eye,
  Receipt
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, where, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { PaymentService } from "@/lib/payment-service"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

export default function PaymentHistoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false);
  const [selectedPayment, setSelectedPayment] = React.useState<any>(null);

  const invoiceRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return doc(db, "companies", companyId, "branches", branchId, "sales_invoices", id as string);
  }, [db, companyId, branchId, id]);
  const { data: invoice } = useDoc(invoiceRef);

  const paymentsQuery = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, "payments"),
      where("invoiceId", "==", id),
      orderBy("createdAt", "desc")
    );
  }, [db, companyId, branchId, id]);
  const { data: payments, isLoading } = useCollection(paymentsQuery);

  const handleDelete = async () => {
    if (!db || !companyId || !branchId || !selectedPayment) return;
    try {
      await PaymentService.deletePayment(db, companyId, branchId, selectedPayment.id);
      toast({ title: t('success'), description: "Payment record reversed successfully." });
      setIsDeleteAlertOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
    }
  };

  if (isLoading) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-black font-headline uppercase tracking-tight text-slate-900">Payment History</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Linked to: {invoice?.invoiceNumber}</p>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 rounded-full h-9 px-6 text-[10px] font-black uppercase" onClick={() => router.push(`/sales/payments/collect/${id}`)}>
          Record Installment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <Card className="p-6 bg-slate-900 text-white rounded-2xl">
            <p className="text-[9px] font-black uppercase opacity-60">Invoice Total</p>
            <p className="text-2xl font-black">৳{invoice?.totalAmount?.toLocaleString()}</p>
         </Card>
         <Card className="p-6 bg-green-50 text-green-700 rounded-2xl border-none">
            <p className="text-[9px] font-black uppercase opacity-60">Total Collected</p>
            <p className="text-2xl font-black">৳{invoice?.paidAmount?.toLocaleString()}</p>
         </Card>
         <Card className="p-6 bg-red-50 text-red-700 rounded-2xl border-none">
            <p className="text-[9px] font-black uppercase opacity-60">Balance Remaining</p>
            <p className="text-2xl font-black">৳{(invoice?.balanceDue || 0).toLocaleString()}</p>
         </Card>
      </div>

      <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="h-12 pl-8 text-[10px] font-black uppercase text-slate-400">Date</TableHead>
              <TableHead className="h-12 text-[10px] font-black uppercase text-slate-400">Receipt #</TableHead>
              <TableHead className="h-12 text-[10px] font-black uppercase text-slate-400 text-center">Method</TableHead>
              <TableHead className="h-12 text-[10px] font-black uppercase text-slate-400 text-right">Amount</TableHead>
              <TableHead className="h-12 text-right pr-8">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments?.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-40 text-center text-slate-300 italic text-xs uppercase font-bold">No payments found</TableCell></TableRow>
            ) : (
              payments?.map((p) => (
                <TableRow key={p.id} className="h-16 hover:bg-muted/5 transition-colors">
                  <TableCell className="pl-8 text-xs font-bold text-slate-600">{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
                  <TableCell className="font-mono text-[11px] font-black text-blue-600 uppercase">{p.receiptNumber}</TableCell>
                  <TableCell className="text-center"><span className="text-[10px] font-black uppercase bg-slate-100 px-2 py-1 rounded-md">{p.paymentMethod}</span></TableCell>
                  <TableCell className="text-right font-black text-xs text-slate-900">৳{p.amount?.toLocaleString()}</TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => router.push(`/sales/payments/receipt/${p.id}`)}><Printer className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-red-600" onClick={() => { setSelectedPayment(p); setIsDeleteAlertOpen(true); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-[2.5rem] p-10 border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black uppercase text-slate-900">Reverse Payment?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs font-medium leading-relaxed">This will revert the invoice balance and remove the accounting entry. This action is permanent.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest">Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700 rounded-2xl h-12 text-[10px] font-black uppercase tracking-widest" onClick={handleDelete}>Confirm Reversal</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
