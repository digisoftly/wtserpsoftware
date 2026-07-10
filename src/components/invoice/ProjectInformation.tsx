import React from 'react';

export function ProjectInformation() {
  return (
    <div style={{ width: '190mm', border: '0.3mm solid #000', padding: '3mm 5mm', backgroundColor: '#fff', margin: '0 auto' }}>
      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', lineHeight: '1.5' }}>
        <tbody>
          <tr>
            <td style={{ width: '40mm', fontWeight: 'bold' }}>Project Name</td>
            <td style={{ width: '5mm', textAlign: 'center' }}>:</td>
            <td style={{ fontWeight: 'bold', color: '#333' }}>Corporate HQ Security Expansion Phase 2</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>Quotation Reference</td>
            <td style={{ textAlign: 'center' }}>:</td>
            <td>WTS/QT/2026/S-1042</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>Delivery Challan</td>
            <td style={{ textAlign: 'center' }}>:</td>
            <td>CHL-2026-088</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>Service Warranty</td>
            <td style={{ textAlign: 'center' }}>:</td>
            <td style={{ fontWeight: 'bold', color: '#0056B3' }}>24 Months Comprehensive</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>Project Manager</td>
            <td style={{ textAlign: 'center' }}>:</td>
            <td>Admin - Warrior Systems</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
