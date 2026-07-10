import React from 'react';

export function InvoiceInformation() {
  return (
    <section style={{ padding: '0 10px' }}>
      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', lineHeight: '1.6', marginTop: '20px' }}>
        <tbody>
          <tr>
            <td style={{ width: '100px', fontWeight: 'bold', textTransform: 'uppercase' }}>Invoice No</td>
            <td style={{ width: '10px' }}>:</td>
            <td style={{ fontWeight: '900', color: '#0056B3' }}>WTS/INV-2026-0001</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Invoice Date</td>
            <td>:</td>
            <td>{new Date().toLocaleDateString('en-GB')}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Payment Methods</td>
            <td>:</td>
            <td>Cash / Digital</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>Status</td>
            <td>:</td>
            <td style={{ fontWeight: '900', color: '#008000' }}>PAID</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
