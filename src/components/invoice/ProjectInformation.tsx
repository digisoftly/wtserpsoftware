import React from 'react';

export function ProjectInformation() {
  return (
    <section style={{ border: '1px solid #000', padding: '10px' }}>
      <h4 style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold' }}>PROJECT INFORMATION:</h4>
      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ width: '150px', fontWeight: 'bold' }}>PROJECT NAME</td>
            <td>: [PROJECT NAME]</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>QUOTATION REF</td>
            <td>: [REF-000]</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>CHALLAN REF</td>
            <td>: [REF-000]</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
