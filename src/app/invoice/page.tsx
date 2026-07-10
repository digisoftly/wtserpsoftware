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
 * Main Invoice Page - Pixel-Perfect A4 Layout
 * Optimized for standard ERP printing.
 */
export default function InvoicePage() {
  return (
    <div style={{ 
      width: '210mm', 
      minHeight: '297mm', 
      margin: '0 auto', 
      padding: '10mm 15mm', 
      boxSizing: 'border-box',
      backgroundColor: '#ffffff',
      color: '#000000',
      fontFamily: '"Times New Roman", Times, serif',
      fontSize: '11px',
      lineHeight: '1.2'
    }}>
      <InvoiceHeader />
      
      <div style={{ textAlign: 'center', margin: '15px 0' }}>
        <DocumentTitle />
      </div>

      {/* Information Section: Synchronized horizontal alignment */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
        <tbody>
          <tr>
            <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '5px' }}>
              <CustomerInformation />
            </td>
            <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: '5px' }}>
              <InvoiceInformation />
            </td>
          </tr>
        </tbody>
      </table>

      <ProductTable />

      <div style={{ width: '100%', marginTop: '10px' }}>
        <RemarksSection />
      </div>

      <div style={{ width: '100%', marginTop: '10px' }}>
        <ProjectInformation />
      </div>

      <div style={{ width: '100%', marginTop: '120px' }}>
        <SignatureSection />
      </div>

      <InvoiceFooter />
    </div>
  );
}
