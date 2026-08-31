
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  User, 
  FileText, 
  Receipt, 
  Truck, 
  Folder, 
  Loader2, 
  Plus, 
  TrendingUp, 
  Wallet, 
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Building,
  CreditCard,
  Eye,
  Printer,
  ChevronDown,
  ChevronRight,
  Edit,
  Globe,
  ShieldCheck,
  Tag,
  Briefcase
} from "lucide-react"
import { useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase"
import { doc, collection, query, where } from "firebase/firestore"
import { useTenant } from "@/context/tenant-context"
import { useTranslation } from "@/hooks/use-translation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { KPICard } from "@/components/dashboard/kpi-card"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function CustomerProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { companyId, branchId } = useTenant();
  const db = useFirestore();
  const { t, formatCurrency, formatDate } = useTranslation();

  const customerRef = useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return doc(db, "companies", companyId, "branches", branchId, "customers", id as string);
  }, [db, companyId, branchId, id]);
  const { data: customer, isLoading: isProfileLoading } = useDoc(customerRef);

  // Queries - Removed orderBy to avoid requiring composite indexes
  const getCustomerQuery = (col: string) => useMemoFirebase(() => {
    if (!db || !companyId || !branchId || !id) return null;
    return query(
      collection(db, "companies", companyId, "branches", branchId, col),
      where("customerId", "==", id)
    );
  }, [db, companyId, branchId, id, col]);

  const { data: rawInvoices } = useCollection(getCustomerQuery("sales_invoices"));
  const { data: rawQuotations } = useCollection(getCustomerQuery("quotations"));
  const { data: rawProjects } = useCollection(getCustomerQuery("projects"));

  // Client-side sorting for Newest First
  const invoices = React.useMemo(() => {
    if (!rawInvoices) return [];
    return [...rawInvoices].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [rawInvoices]);

  const quotations = React.useMemo(() => {
    if (!rawQuotations) return [];
    return [...rawQuotations].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [rawQuotations]);

  const projects = React.useMemo(() => {
    if (!rawProjects) return [];
    return [...rawProjects].sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [rawProjects]);

  const groupedDocuments = React.useMemo(() => {
    const groups: Record<string, any> = { "General": { items: [], id: 'general' } };
    quotations?.forEach(q => {
      const pName = q.projectName || "General";
      if (!groups[pName]) groups[pName] = { items: [], id: pName };
      groups[pName].items.push({ ...q, docType: 'Quotation' });
    });
    invoices?.forEach(inv => {
      const pName = inv.projectName || "General";
      if (!groups[pName]) groups[pName] = { items: [], id: pName };
      groups[pName].items.push({ ...inv, docType: 'Invoice' });
    });
    // Sort items within groups by date
    Object.values(groups).forEach(g => {
      g.items.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
    });
    return Object.values(groups).filter(g => g.items.length > 0);
  }, [quotations, invoices]);

  const stats = React.useMemo(() => ({
    totalBilled: invoices?.reduce((s, i) => s + (i.totalAmount || 0), 0) || 0,
    totalPaid: invoices?.reduce((s, i) => s + (i.paidAmount || 0), 0) || 0,
    totalDue: invoices?.reduce((s, i) => s + (i.balanceDue || 0), 0) || 0,
    activeProjects: projects?.filter(p => !['Completed', 'completed'].includes(p.status)).length || 0,
  }), [invoices, projects]);

  if (isProfileLoading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="h-10 w-10 animate-spin text-cyan-600" /></div>;
  if (!customer) return <div className="p-20 text-center uppercase font-black text-muted-foreground">{t('noData')}</div>;

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-8 rounded-[3rem] border shadow-sm ring-1 ring-slate-100">
        <div className="flex items-start gap-8">
           <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center text-cyan-600 shadow-inner border border-cyan-100 shrink-0">
              <User className="h-12 w-12" />
           </div>
           <div className="space-y-2">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-black font-headline uppercase tracking-tight text-slate-900 leading-none">
                  {customer.customerType === 'company' ? customer.companyName : customer.fullName}
                </h1>
                <Badge className="bg-cyan-50 text-cyan-700 text-[10px] font-black uppercase border-none px-3 h-6">
                  {customer.customerType}
                </Badge>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{customer.id} • Joined {formatDate(customer.createdAt)}</p>
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-[12px] font-bold text-slate-500 uppercase tracking-tighter mt-4">
                 <span className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full"><Phone className="h-3.5 w-3.5 text-cyan-600" /> {customer.phoneNumber}</span>
                 <span className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full"><Mail className="h-3.5 w-3.5 text-cyan-600" /> {customer.email || 'N/A'}</span>
                 <span className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full"><MapPin className="h-3.5 w-3.5 text-cyan-600" /> {customer.city || 'N/A'}</span>
              </div>
           </div>
        </div>
        <div className="flex flex-wrap gap-3">
           <Button variant="outline" className="rounded-full h-11 px-8 font-black text-[10px] uppercase gap-2 border-slate-200" onClick={() => router.push(`/customers/${id}/edit`)}>
              <Edit className="h-4 w-4" /> Edit Identity
           </Button>
           <Button className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-full h-11 px-10 font-black text-[10px] uppercase gap-2 shadow-xl shadow-cyan-100" onClick={() => router.push('/sales/new')}>
              <Plus className="h-4 w-4" /> New Sale
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="totalSales" value={formatCurrency(stats.totalBilled)} icon={TrendingUp} colorClass="bg-blue-600" />
        <KPICard title="paidAmount" value={formatCurrency(stats.totalPaid)} icon={Wallet} colorClass="bg-green-600" />
        <KPICard title="balanceDue" value={formatCurrency(stats.totalDue)} icon={AlertCircle} colorClass="bg-red-600" />
        <KPICard title="running" value={stats.activeProjects} icon={Folder} colorClass="bg-teal-600" />
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="bg-white border p-1.5 rounded-[1.5rem] shadow-sm mb-8 flex h-auto overflow-x-auto no-scrollbar ring-1 ring-slate-100 gap-1">
          <TabsTrigger value="documents" className="rounded-xl flex-1 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-600">Folders</TabsTrigger>
          <TabsTrigger value="profile" className="rounded-xl flex-1 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">Identity</TabsTrigger>
          <TabsTrigger value="account" className="rounded-xl flex-1 py-3 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
           {groupedDocuments.length === 0 ? (
             <div className="p-20 bg-white rounded-[3rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
               <FileText className="h-12 w-12 text-slate-200 mb-6" />
               <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]">No documents found for this client</p>
             </div>
           ) : groupedDocuments.map((group, gIdx) => (
             <Card key={group.id} className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white ring-1 ring-slate-100">
                <Collapsible defaultOpen={gIdx === 0}>
                  <CollapsibleTrigger asChild>
                    <div className="p-6 bg-slate-50/50 border-b flex items-center justify-between cursor-pointer group">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-slate-400 group-hover:text-cyan-600 transition-colors"><Folder className="h-5 w-5" /></div>
                          <div>
                             <h3 className="text-xs font-black uppercase text-slate-900 tracking-tight">{group.id}</h3>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{group.items.length} Documents</p>
                          </div>
                       </div>
                       <ChevronDown className="h-5 w-5 text-slate-300 group-data-[state=open]:rotate-180 transition-transform" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                     <Table>
                        <TableHeader className="bg-slate-50/30">
                           <TableRow>
                              <TableHead className="h-10 pl-8 text-[9px] font-black uppercase">Document ID</TableHead>
                              <TableHead className="h-10 text-[9px] font-black uppercase text-center">Type</TableHead>
                              <TableHead className="h-10 text-[9px] font-black uppercase text-right">Amount</TableHead>
                              <TableHead className="h-10 text-right pr-8">Actions</TableHead>
                           </TableRow>
                        </TableHeader>
                        <TableBody>
                           {group.items.map((item: any, iIdx: number) => (
                             <TableRow key={`${item.id}-${iIdx}`} className="h-16 hover:bg-muted/5 group border-slate-50">
                                <TableCell className="pl-8 font-black text-xs text-blue-600 uppercase tracking-tighter">{item.invoiceNumber || item.quotationNumber}</TableCell>
                                <TableCell className="text-center"><Badge className="text-[8px] font-black uppercase bg-slate-100 text-slate-600">{item.docType}</Badge></TableCell>
                                <TableCell className="text-right font-black text-xs text-slate-900">{formatCurrency(item.totalAmount)}</TableCell>
                                <TableCell className="text-right pr-8">
                                   <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-blue-600" onClick={() => router.push(`/${item.docType === 'Invoice' ? 'sales' : 'quotations'}/${item.id}/view`)}><Eye className="h-4 w-4" /></Button>
                                </TableCell>
                             </TableRow>
                           ))}
                        </TableBody>
                     </Table>
                  </CollapsibleContent>
                </Collapsible>
             </Card>
           ))}
        </TabsContent>

        <TabsContent value="profile" className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card className="border-none shadow-sm rounded-[2rem] p-8 bg-white ring-1 ring-slate-100 space-y-6">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-2 flex items-center gap-2"><Building className="h-4 w-4 text-cyan-600" /> Business Details</h3>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Trade License</p><p className="text-sm font-bold uppercase">{customer.tradeLicense || '---'}</p></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">BIN / VAT</p><p className="text-sm font-bold uppercase">{customer.bin || '---'}</p></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">TIN Number</p><p className="text-sm font-bold uppercase">{customer.tin || '---'}</p></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Industry</p><p className="text-sm font-bold uppercase">{customer.industry || '---'}</p></div>
              </div>
           </Card>
           <Card className="border-none shadow-sm rounded-[2rem] p-8 bg-white ring-1 ring-slate-100 space-y-6">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-2 flex items-center gap-2"><MapPin className="h-4 w-4 text-cyan-600" /> Contact Info</h3>
              <div className="grid grid-cols-1 gap-4">
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Primary Mobile</p><p className="text-sm font-bold uppercase">{customer.phoneNumber}</p></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">WhatsApp</p><p className="text-sm font-bold uppercase">{customer.whatsapp || '---'}</p></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Full Address</p><p className="text-sm font-bold leading-relaxed">{customer.address || '---'}</p></div>
              </div>
           </Card>
        </TabsContent>

        <TabsContent value="account" className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card className="border-none shadow-sm rounded-[2rem] p-8 bg-white ring-1 ring-slate-100 space-y-6">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-2 flex items-center gap-2"><CreditCard className="h-4 w-4 text-cyan-600" /> Financial Info</h3>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Credit Limit</p><p className="text-sm font-black text-blue-600">{formatCurrency(customer.creditLimit)}</p></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Credit Days</p><p className="text-sm font-bold">{customer.creditDays || 0} Days</p></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Opening Due</p><p className="text-sm font-black text-red-600">{formatCurrency(customer.openingDue)}</p></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Payment Terms</p><p className="text-sm font-bold uppercase">{customer.paymentTerms || 'Cash'}</p></div>
              </div>
           </Card>
           <Card className="border-none shadow-sm rounded-[2rem] p-8 bg-white ring-1 ring-slate-100 space-y-6">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b pb-2 flex items-center gap-2"><Tag className="h-4 w-4 text-cyan-600" /> CRM Status</h3>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Category</p><Badge variant="outline" className="font-black uppercase">{customer.category || 'Retail'}</Badge></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Priority</p><Badge className={cn("font-black uppercase", customer.priority === 'VIP' ? "bg-purple-600" : "bg-cyan-600")}>{customer.priority || 'Normal'}</Badge></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400">Lead Source</p><p className="text-sm font-bold uppercase">{customer.leadSource || 'Direct'}</p></div>
              </div>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
