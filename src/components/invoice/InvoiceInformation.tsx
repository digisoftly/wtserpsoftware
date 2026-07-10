import React from 'react';

export function InvoiceInformation() {
  return (
    <section style={{ border: '1px solid #000', padding: '8px', minHeight: '90px' }}>
      <h3 style={{ margin: '0 0 5px 0', fontSize: '11px', fontWeight: 'bold', borderBottom: '1px solid #000', textTransform: 'uppercase' }}>
        Invoice Information
      </h3>
      <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ width: '80px', fontWeight: 'bold' }}>INVOICE NO</td>
            <td style={{ width: '10px' }}>:</td>
            <td>[INV-000000]</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>DATE</td>
            <td>:</td>
            <td>[INVOICE DATE]</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>DUE DATE</td>
            <td>:</td>
            <td>[DUE DATE]</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>STATUS</td>
            <td>:</td>
            <td>[PAID / DUE]</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
