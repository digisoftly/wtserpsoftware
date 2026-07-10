import React from 'react';
import { InvoiceHeader } from '@/components/invoice/InvoiceHeader';
import { DocumentTitle } from '@/components/invoice/DocumentTitle';
import { CustomerInformation } from '@/components/invoice/CustomerInformation';
import { InvoiceInformation } from '@/components/invoice/InvoiceInformation';
import { ProductTable } from '@/components/invoice/ProductTable';
import { PaymentSummary } from '@/components/invoice/PaymentSummary';
import { PaymentInformation } from '@/components/invoice/PaymentInformation';
import { RemarksSection } from '@/components/invoice/RemarksSection';
import { ProjectInformation } from '@/components/invoice/ProjectInformation';
import { SignatureSection } from '@/components/invoice/SignatureSection';
import { InvoiceFooter } from '@/components/invoice/InvoiceFooter';

export default function InvoicePage() {
  return (
    <div className="p-10 mx-auto" style={{ width: '210mm', minHeight: '297mm' }}>
      <InvoiceHeader />
      <DocumentTitle />
      
      <div className="flex gap-10">
        <CustomerInformation />
        <InvoiceInformation />
      </div>

      <ProductTable />
      <PaymentSummary />
      
      <div className="flex gap-10">
        <PaymentInformation />
        <RemarksSection />
      </div>

      <ProjectInformation />
      <SignatureSection />
      <InvoiceFooter />
    </div>
  );
}
