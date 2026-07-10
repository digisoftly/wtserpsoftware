import React from 'react';
import { InvoiceHeader } from '@/components/invoice/InvoiceHeader';
import { DocumentTitle } from '@/components/invoice/DocumentTitle';
import { CustomerInformation } from '@/components/invoice/CustomerInformation';
import { InvoiceInformation } from '@/components/invoice/InvoiceInformation';
import { ProductTable } from '@/components/invoice/ProductTable';
import { RemarksSection } from '@/components/invoice/RemarksSection';
import { ProjectInformation } from '@/components/invoice/ProjectInformation';
import { SignatureSection } from '@/components/invoice/SignatureSection';
import { InvoiceFooter } from '@/components/invoice/InvoiceFooter';

/**
 * Main Invoice Page - Locked A4 Layout
 * This page acts as the assembly point for the printable document.
 */
export default function InvoicePage() {
  return (
    <div style={{ 
      width: '210mm', 
      minHeight: '297mm', 
      margin: '0 auto', 
      padding: '10mm', 
      boxSizing: 'border-box',
      backgroundColor: '#ffffff'
    }}>
      <InvoiceHeader />
      
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <DocumentTitle />
      </div>

      {/* Information Section: Locked table layout for perfect horizontal alignment */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '10px' }}>
              <CustomerInformation />
            </td>
            <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: '10px' }}>
              <InvoiceInformation />
            </td>
          </tr>
        </tbody>
      </table>

      <ProductTable />

      <div style={{ width: '100%', marginTop: '20px' }}>
        <RemarksSection />
      </div>

      <div style={{ width: '100%', marginTop: '20px' }}>
        <ProjectInformation />
      </div>

      <div style={{ width: '100%', marginTop: '80px' }}>
        <SignatureSection />
      </div>

      <InvoiceFooter />
    </div>
  );
}
