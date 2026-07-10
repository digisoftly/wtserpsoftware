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
 * WarriorERP - Pixel-Perfect A4 Replica
 * Dimensions: 210mm x 297mm (Fixed)
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
      overflow: 'hidden'
    }}>
      <div style={{ padding: '8mm 10mm' }}>
        <InvoiceHeader />
        
        <div style={{ marginTop: '5mm' }}>
          <DocumentTitle />
        </div>

        {/* Info Section Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '5mm', marginBottom: '5mm' }}>
          <tbody>
            <tr>
              <td style={{ width: '105mm', verticalAlign: 'top', paddingLeft: '5mm' }}>
                <CustomerInformation />
              </td>
              <td style={{ width: '85mm', verticalAlign: 'top', paddingRight: '5mm' }}>
                <InvoiceInformation />
              </td>
            </tr>
          </tbody>
        </table>

        <ProductTable />

        <div style={{ marginTop: '8mm' }}>
          <ProjectInformation />
        </div>

        <div style={{ marginTop: '5mm' }}>
          <RemarksSection />
        </div>

        <SignatureSection />
      </div>

      <div style={{ position: 'absolute', bottom: '8mm', width: '210mm' }}>
        <InvoiceFooter />
      </div>
    </div>
  );
}
