import React from 'react';

export function ProjectInformation() {
  return (
    <section style={{ border: '1px solid #000', padding: '12px', marginTop: '15px', backgroundColor: '#fff' }}>
      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', lineHeight: '1.4' }}>
        <tbody>
          <tr>
            <td style={{ width: '180px', fontWeight: 'bold' }}>Project Name</td>
            <td style={{ width: '20px' }}>:</td>
            <td style={{ fontWeight: 'bold', color: '#333' }}>Corporate Security System Installation</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>Quotation Reference</td>
            <td>:</td>
            <td>WTS/QT/2026-104</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>Delivery Challan</td>
            <td>:</td>
            <td>---</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>Service Warranty</td>
            <td>:</td>
            <td style={{ fontWeight: 'bold', color: '#0056B3' }}>12 Months</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>Project Manager</td>
            <td>:</td>
            <td>System Administrator</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
