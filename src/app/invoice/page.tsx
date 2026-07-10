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
 * Main Invoice Page - Pixel-Perfect Official Replica
 * Strictly follows the traditional Warrior Tech System corporate layout.
 */
export default function InvoicePage() {
  return (
    <div style={{ 
      width: '210mm', 
      minHeight: '297mm', 
      margin: '0 auto', 
      padding: '10mm 5mm', 
      boxSizing: 'border-box',
      backgroundColor: '#ffffff',
      color: '#222222',
      fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
      fontSize: '11px',
      lineHeight: '1.2',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <InvoiceHeader />
      
      <DocumentTitle />

      {/* Information Section: Two-column grid */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
        <tbody>
          <tr>
            <td style={{ width: '55%', verticalAlign: 'top' }}>
              <CustomerInformation />
            </td>
            <td style={{ width: '45%', verticalAlign: 'top' }}>
              <InvoiceInformation />
            </td>
          </tr>
        </tbody>
      </table>

      <ProductTable />

      <div style={{ width: '100%', padding: '0 5px' }}>
        <ProjectInformation />
      </div>

      <div style={{ width: '100%', padding: '0 5px', marginTop: '10px' }}>
        <RemarksSection />
      </div>

      <SignatureSection />

      <InvoiceFooter />
    </div>
  );
}
