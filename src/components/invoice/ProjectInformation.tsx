import React from 'react';

/**
 * Locked Block Height: 30mm
 */
export function ProjectInformation() {
  return (
    <div style={{ width: '190mm', height: '30mm', border: '0.3mm solid #000', padding: '4mm 6mm', boxSizing: 'border-box', backgroundColor: '#fff', marginTop: '6mm' }}>
      <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', lineHeight: '1.6', tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td style={{ width: '45mm', fontWeight: 'bold' }}>Project Name</td>
            <td style={{ width: '5mm', textAlign: 'center' }}>:</td>
            <td style={{ fontWeight: 'bold', color: '#333' }}>Corporate HQ Security Expansion Phase 2</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>Quotation Reference</td>
            <td style={{ textAlign: 'center' }}>:</td>
            <td style={{ color: '#555' }}>WTS/QT/2026/S-1042</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>Delivery Challan</td>
            <td style={{ textAlign: 'center' }}>:</td>
            <td style={{ color: '#555' }}>CHL-2026-088</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>Service Warranty</td>
            <td style={{ textAlign: 'center' }}>:</td>
            <td style={{ fontWeight: '900', color: '#0056B3' }}>24 Months Comprehensive</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
