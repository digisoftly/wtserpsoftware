
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { 
  ArrowLeft, 
  User, 
  FileText, 
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
  ChevronDown,
  Edit,
  ShieldCheck,
  Tag,
  Briefcase,
  ExternalLink,
  UserCircle
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

  if (isProfileLoading) return <div className="flex h-[70vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;
  if (!customer) return <div className="p-20 text-center uppercase font-black text-muted-foreground">{t('noData')}</div>;

  return (
    <div className="space-y-4 md:space-y-6 pb-24 touch-scroll">
      {/* PREMIUM APP-STYLE HEADER */}
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden ring-1 ring-slate-100/50">
         <div className="h-24 md:h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="absolute top-4 left-4 text-white hover:bg-white/20 rounded-full h-10 w-10">
               <ArrowLeft className="h-5 w-5" />
            </Button>
         </div>
         <div className="px-6 md:px-10 pb-8 -mt-10 md:-mt-12 relative flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-8">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] md:rounded-[2.5rem] bg-white border-4 border-white shadow-2xl flex items-center justify-center overflow-hidden shrink-0">
               <div className="w-full h-full bg-blue-50 flex items-center justify-center text-blue-600 text-4xl font-black uppercase">
                  {customer.customerType === 'individual' ? (customer.fullName?.[0] || 'U') : (customer.companyName?.[0] || 'C')}
               </div>
            </div>
            <div className="flex-1 text-center md:text-left pb-1 space-y-1 overflow-hidden">
               <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                  <h1 className="text-xl md:text-3xl font-black font-headline uppercase text-slate-900 truncate w-full tracking-tight">
                    {customer.customerType !== 'individual' ? customer.companyName : customer.fullName}
                  </h1>
                  <Badge className="bg-blue-600 text-white border-none uppercase font-black text-[8px] md:text-[9px] h-5 px-3 rounded-full">
                    {customer.customerType}
                  </Badge>
               </div>
               <p className="text-[10px] md:text-[11px] font-black text-blue-600/60 uppercase tracking-[0.2em]">{customer.id} • Joined {formatDate(customer.createdAt)}</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
               <Button variant="outline" className="flex-1 md:flex-none rounded-full h-10 px-6 font-black text-[10px] uppercase border-slate-200 gap-2 bg-white" onClick={() => router.push(`/customers/${id}/edit`)}>
                  <Edit className="h-3.5 w-3.5" /> {t('edit')}
               </Button>
               <Button className="flex-1 md:flex-none bg-slate-900 hover:bg-black text-white rounded-full h-10 px-8 font-black text-[10px] uppercase gap-2 shadow-xl shadow-slate-200" onClick={() => router.push('/sales/new')}>
                  <Plus className="h-3.5 w-3.5" /> {t('sales')}
               </Button>
            </div>
         </div>
         
         <div className="px-6 md:px-10 pb-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-50 pt-6">
            <div className="flex items-center gap-3 group">
               <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors"><Phone className="h-4 w-4" /></div>
               <span className="text-[11px] font-bold text-slate-600 truncate">{customer.phoneNumber}</span>
            </div>
            <div className="flex items-center gap-3 group">
               <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors"><Mail className="h-4 w-4" /></div>
               <span className="text-[11px] font-bold text-slate-600 truncate">{customer.email || 'No Email Registered'}</span>
            </div>
            <div className="flex items-center gap-3 group">
               <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors"><MapPin className="h-4 w-4" /></div>
               <span className="text-[11px] font-bold text-slate-600 truncate">{customer.city || customer.address || 'Location N/A'}</span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        <KPICard title="totalRevenue" value={formatCurrency(stats.totalBilled)} icon={TrendingUp} colorClass="bg-blue-600" />
        <KPICard title="paidAmount" value={formatCurrency(stats.totalPaid)} icon={Wallet} colorClass="bg-green-600" />
        <KPICard title="salesDue" value={formatCurrency(stats.totalDue)} icon={AlertCircle} colorClass="bg-red-600" />
        <KPICard title="running" value={stats.activeProjects} icon={Folder} colorClass="bg-teal-600" />
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="bg-white border p-1 rounded-2xl shadow-sm mb-6 flex h-14 overflow-x-auto no-scrollbar ring-1 ring-slate-100/50 sticky top-20 z-40">
          <TabsTrigger value="documents" className="rounded-xl flex-1 px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">Folders</TabsTrigger>
          <TabsTrigger value="profile" className="rounded-xl flex-1 px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">Identity</TabsTrigger>
          <TabsTrigger value="account" className="rounded-xl flex-1 px-6 py-2 text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">Finances</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
           {groupedDocuments.length === 0 ? (
             <div className="p-20 bg-white rounded-[2.5rem] border border-dashed text-center flex flex-col items-center ring-1 ring-slate-100">
               <FileText className="h-12 w-12 text-slate-200 mb-6" />
               <p className="text-[10px] uppercase font-black text-muted-foreground tracking-[0.3em]">No Document History Found</p>
             </div>
           ) : groupedDocuments.map((group, gIdx) => (
             <Card key={group.id} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white ring-1 ring-slate-100/50">
                <Collapsible defaultOpen={gIdx === 0}>
                  <CollapsibleTrigger asChild>
                    <div className="p-5 bg-slate-50/50 border-b flex items-center justify-between cursor-pointer group active:bg-slate-100">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors"><Folder className="h-5 w-5" /></div>
                          <div>
                             <h3 className="text-[11px] font-black uppercase text-slate-900 tracking-tight">{group.id}</h3>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{group.items.length} Files Linked</p>
                          </div>
                       </div>
                       <ChevronDown className="h-5 w-5 text-slate-300 group-data-[state=open]:rotate-180 transition-transform" />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                     <div className="overflow-x-auto custom-scrollbar">
                        <Table>
                           <TableHeader className="bg-slate-50/30">
                              <TableRow className="h-10">
                                 <TableHead className="h-10 pl-6 text-[9px] font-black uppercase">Ref ID</TableHead>
                                 <TableHead className="h-10 text-[9px] font-black uppercase text-center">Type</TableHead>
                                 <TableHead className="h-10 text-[9px] font-black uppercase text-right">Value</TableHead>
                                 <TableHead className="h-10 text-right pr-6 w-20"></TableHead>
                              </TableRow>
                           </TableHeader>
                           <TableBody>
                              {group.items.map((item: any, iIdx: number) => (
                                <TableRow key={`${item.id}-${iIdx}`} className="h-14 hover:bg-slate-50 active:bg-slate-100 transition-colors border-slate-50">
                                   <TableCell className="pl-6 py-2">
                                      <span className="font-black text-[11px] text-blue-600 uppercase tracking-tighter">{item.invoiceNumber || item.quotationNumber}</span>
                                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">{formatDate(item.createdAt)}</p>
                                   </TableCell>
                                   <TableCell className="text-center py-2"><Badge variant="outline" className="text-[8px] font-black uppercase bg-slate-50 border-none px-2 h-4">{item.docType}</Badge></TableCell>
                                   <TableCell className="text-right font-black text-xs text-slate-900 py-2">{formatCurrency(item.totalAmount)}</TableCell>
                                   <TableCell className="text-right pr-6 py-2">
                                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-blue-600" onClick={() => router.push(`/${item.docType === 'Invoice' ? 'sales' : 'quotations'}/${item.id}/view`)}><Eye className="h-4 w-4" /></Button>
                                   </TableCell>
                                </TableRow>
                              ))}
                           </TableBody>
                        </Table>
                     </div>
                  </CollapsibleContent>
                </Collapsible>
             </Card>
           ))}
        </TabsContent>

        <TabsContent value="profile" className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-2">
           <Card className="border-none shadow-sm rounded-[2rem] p-6 md:p-8 bg-white ring-1 ring-slate-100 space-y-6">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b pb-3 flex items-center gap-2">
                 <Building className="h-4 w-4 text-blue-600" /> Identity Matrix
              </h3>
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Client Type</p><Badge className="bg-blue-50 text-blue-700 border-none uppercase font-black text-[9px]">{customer.customerType}</Badge></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Industry</p><p className="text-xs font-black text-slate-900 uppercase">{customer.industry || '---'}</p></div>
                 
                 <div className="col-span-2 space-y-3 pt-2 border-t border-slate-50">
                    <div className="flex items-start gap-3">
                       <UserCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                       <div>
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Key Contact Person</p>
                          <p className="text-sm font-black text-slate-900 uppercase">{customer.customerType === 'individual' ? customer.fullName : (customer.contactPerson || 'Proprietor/CEO')}</p>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">WhatsApp</p><p className="text-xs font-black text-slate-900 uppercase">{customer.whatsapp || customer.phoneNumber || '---'}</p></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Website</p><p className="text-xs font-black text-blue-600 uppercase flex items-center gap-1">{customer.website ? <><ExternalLink className="h-3 w-3" /> Visit</> : '---'}</p></div>
                 <div className="col-span-2 space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Primary Address</p><p className="text-xs font-bold text-slate-700 leading-relaxed uppercase">{customer.address || 'Location Not Recorded'}</p></div>
              </div>
           </Card>
           <Card className="border-none shadow-sm rounded-[2rem] p-6 md:p-8 bg-white ring-1 ring-slate-100 space-y-6">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b pb-3 flex items-center gap-2">
                 <ShieldCheck className="h-4 w-4 text-blue-600" /> Compliance Data
              </h3>
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Trade License</p><p className="text-xs font-mono font-black text-slate-900 uppercase">{customer.tradeLicense || '---'}</p></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">BIN / VAT ID</p><p className="text-xs font-mono font-black text-slate-900 uppercase">{customer.bin || '---'}</p></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">TIN Number</p><p className="text-xs font-mono font-black text-slate-900 uppercase">{customer.tin || '---'}</p></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Status</p><Badge className="bg-green-50 text-green-700 border-none uppercase font-black text-[9px]">Verified</Badge></div>
              </div>
           </Card>
        </TabsContent>

        <TabsContent value="account" className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-2">
           <Card className="border-none shadow-sm rounded-[2rem] p-6 md:p-8 bg-white ring-1 ring-slate-100 space-y-6">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b pb-3 flex items-center gap-2">
                 <CreditCard className="h-4 w-4 text-blue-600" /> Financial Settings
              </h3>
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Credit Limit</p><p className="text-sm font-black text-blue-600 tabular-nums">{formatCurrency(customer.creditLimit)}</p></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Credit Cycle</p><p className="text-sm font-black text-slate-900">{customer.creditDays || 0} Days</p></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Opening Due</p><p className="text-sm font-black text-red-600 tabular-nums">{formatCurrency(customer.openingDue)}</p></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Settlement Terms</p><p className="text-xs font-black text-slate-900 uppercase">{customer.paymentTerms || 'Cash'}</p></div>
              </div>
           </Card>
           <Card className="border-none shadow-sm rounded-[2rem] p-6 md:p-8 bg-white ring-1 ring-slate-100 space-y-6">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] border-b pb-3 flex items-center gap-2">
                 <Tag className="h-4 w-4 text-blue-600" /> CRM Classification
              </h3>
              <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Market Segment</p><Badge variant="secondary" className="font-black uppercase text-[9px] bg-slate-100 border-none">{customer.category || 'Retail'}</Badge></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Priority Rating</p><Badge className={cn("font-black uppercase text-[9px] border-none shadow-sm", customer.priority === 'VIP' ? "bg-purple-600" : "bg-blue-600")}>{customer.priority || 'Normal'}</Badge></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Lead Origin</p><p className="text-xs font-black text-slate-900 uppercase">{customer.leadSource || 'Direct'}</p></div>
                 <div className="space-y-1"><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Engagement Level</p><p className="text-xs font-black text-green-600 uppercase">High Activity</p></div>
              </div>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
