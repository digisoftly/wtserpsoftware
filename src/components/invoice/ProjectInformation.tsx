import React from 'react';

export function ProjectInformation() {
  return (
    <section style={{ border: '1px solid #000', padding: '8px', minHeight: '60px' }}>
      <h4 style={{ margin: '0 0 5px 0', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Project Information:</h4>
      <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ width: '120px', fontWeight: 'bold' }}>PROJECT NAME</td>
            <td style={{ width: '10px' }}>:</td>
            <td>Corporate Security System Installation</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>QUOTATION REF</td>
            <td>:</td>
            <td>WTS/QT/2026-104</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>CHALLAN REF</td>
            <td>:</td>
            <td>WTS/CH/2026-205</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
