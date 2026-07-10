import React from 'react';

export function InvoiceInformation() {
  return (
    <section style={{ border: '1px solid #000', padding: '10px', minHeight: '100px' }}>
      <h3 style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid #000' }}>
        INVOICE INFORMATION
      </h3>
      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ width: '100px', fontWeight: 'bold' }}>INVOICE NO</td>
            <td>: [INV-000000]</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>DATE</td>
            <td>: [INVOICE DATE]</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>DUE DATE</td>
            <td>: [DUE DATE]</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>STATUS</td>
            <td>: [PAID / DUE]</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
