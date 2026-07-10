import React from 'react';

/**
 * Locked Block: 85mm Width x 28mm Height
 */
export function InvoiceInformation() {
  return (
    <div style={{ width: '85mm', height: '28mm', paddingLeft: '5mm' }}>
      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', marginTop: '6mm', tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td style={{ width: '35mm', fontWeight: 'bold', textTransform: 'uppercase', padding: '0.5mm 0' }}>Invoice No</td>
            <td style={{ width: '4mm', textAlign: 'center' }}>:</td>
            <td style={{ fontWeight: '900', color: '#0056B3' }}>WTS/INV-2026-0042</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', textTransform: 'uppercase', padding: '0.5mm 0' }}>Invoice Date</td>
            <td style={{ textAlign: 'center' }}>:</td>
            <td>15 February 2026</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', textTransform: 'uppercase', padding: '0.5mm 0' }}>Payment Methods</td>
            <td style={{ textAlign: 'center' }}>:</td>
            <td>Cash / Digital</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', textTransform: 'uppercase', padding: '0.5mm 0' }}>Status</td>
            <td style={{ textAlign: 'center' }}>:</td>
            <td style={{ fontWeight: '900', color: '#155724' }}>PAID</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
