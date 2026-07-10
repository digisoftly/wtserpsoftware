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
 * WarriorERP - Permanently Locked A4 Print Specification
 * Page Size: 210mm x 297mm
 * Margins: 10mm Left/Right
 */
export default function InvoicePage() {
  return (
    <div style={{ 
      width: '210mm', 
      height: '297mm', 
      margin: '0 auto', 
      padding: '0', 
      boxSizing: 'border-box',
      backgroundColor: '#ffffff',
      color: '#222222',
      fontFamily: '"Times New Roman", Times, serif',
      position: 'relative',
      overflow: 'hidden',
      border: 'none'
    }} className="no-scrollbar">
      <div style={{ padding: '0 10mm' }}>
        <InvoiceHeader />
        
        <div style={{ marginTop: '7mm' }}>
          <DocumentTitle />
        </div>

        {/* Info Section Table - Fixed Border-to-Border Height 28mm */}
        <table style={{ width: '190mm', height: '28mm', borderCollapse: 'collapse', marginTop: '5mm', marginBottom: '5mm', tableLayout: 'fixed' }}>
          <tbody>
            <tr>
              <td style={{ width: '105mm', verticalAlign: 'top', padding: '0' }}>
                <CustomerInformation />
              </td>
              <td style={{ width: '85mm', verticalAlign: 'top', padding: '0' }}>
                <InvoiceInformation />
              </td>
            </tr>
          </tbody>
        </table>

        <ProductTable />

        <div style={{ marginTop: '5mm' }}>
          <ProjectInformation />
        </div>

        <div style={{ marginTop: '5mm' }}>
          <RemarksSection />
        </div>

        <SignatureSection />
      </div>

      <div style={{ position: 'absolute', bottom: '0', width: '210mm' }}>
        <InvoiceFooter />
      </div>
    </div>
  );
}
