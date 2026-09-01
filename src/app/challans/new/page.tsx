
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  Truck,
  X,
  PlusCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, doc, runTransaction, serverTimestamp, increment, query, orderBy } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface ChallanItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  qty: number;
  unit: string;
  price: number;
  total: number;
  isCustom?: boolean;
}

export default function NewChallanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromInvoiceId = searchParams.get('fromInvoice');
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState("none");
  const [dispatchDate, setDispatchDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [deliveryMethod, setDeliveryMethod] = React.useState("Company Vehicle");
  const [vehicleNumber, setVehicleNumber] = React.useState("");
  const [driverName, setDriverName] = React.useState("");
  const [lineItems, setLineItems] = React.useState<ChallanItem[]>([]);
  const [notes, setNotes] = React.useState("");

  const sourceInvoiceRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !fromInvoiceId) return null;
    return doc(db, "companies", companyId, "branches", branchId, "sales_invoices", fromInvoiceId);
  }, [db, companyId, branchId, fromInvoiceId]);
  const { data: sourceInvoice } = useDoc(sourceInvoiceRef);

  React.useEffect(() => {
    if (sourceInvoice) {
      setSelectedCustomerId(sourceInvoice.customerId || "");
      setSelectedInvoiceId(sourceInvoice.id);
      const items = (sourceInvoice.items || []).map((item: any, idx: number) => ({
        ...item,
        id: `inv-item-${idx}-${Date.now()}`,
        qty: Number(item.qty || item.quantity || 0),
        price: Number(item.price || item.unitPrice || 0),
        total: Number(item.total || 0)
      }));
      setLineItems(items);
    }
  }, [sourceInvoice]);

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

  const handleSave = async () => {
    if (!selectedCustomerId || lineItems.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await runTransaction(db!, async (transaction) => {
        const challanRef = doc(collection(db!, "companies", companyId!, "branches", branchId!, "delivery_challans"));
        const customer = customers?.find(c => c.id === selectedCustomerId);
        
        const resolvedCustomerName = customer 
          ? (customer.customerType !== 'individual' ? customer.companyName : customer.fullName)
          : "Client";

        const challanData = {
          id: challanRef.id,
          challanNumber: `CHL-${Date.now().toString().slice(-6)}`,
          customerId: selectedCustomerId,
          customerName: resolvedCustomerName,
          customerPhone: customer?.phoneNumber || "",
          customerAddress: customer?.address || "",
          invoiceId: selectedInvoiceId,
          dispatchDate,
          deliveryMethod,
          vehicleNumber,
          driverName,
          items: lineItems,
          totalAmount: lineItems.reduce((s, i) => s + i.total, 0),
          status: "pending",
          notes,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        transaction.set(challanRef, challanData);
      });
      toast({ title: t('success') });
      router.push("/challans");
    } catch (e: any) {
      toast({ variant: "destructive", title: t('error'), description: e.message });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between border-b pb-4 bg-white sticky top-0 z-50 px-2">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ArrowLeft className="h-4 w-4" /></Button>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">{t('addChallan')}</h1>
        </div>
        <Button size="sm" className="font-bold text-xs gap-2 px-6 h-9 rounded-lg" disabled={isSubmitting} onClick={handleSave}>
          {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {t('save')} Dispatch
        </Button>
      </div>
      <Card className="border-none shadow-sm ring-1 ring-slate-200">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Customer</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Client" /></SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {customers?.map(c => <SelectItem key={c.id} value={c.id} className="text-xs font-medium">{c.customerType !== 'individual' ? c.companyName : c.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* ... other fields ... */}
          </div>
        </CardContent>
      </Card>
      {/* ... items table ... */}
    </div>
  );
}
