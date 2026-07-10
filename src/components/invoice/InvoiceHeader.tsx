import React from 'react';

/**
 * Locked Header Height: 42mm
 */
export function InvoiceHeader() {
  return (
    <header style={{ width: '190mm', height: '42mm', boxSizing: 'border-box', paddingTop: '4mm' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ width: '25mm', verticalAlign: 'middle' }}>
              <div style={{ width: '25mm', height: '25mm', border: '0.1mm solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '8px', color: '#999', fontWeight: 'bold' }}>LOGO</span>
              </div>
            </td>
            <td style={{ paddingLeft: '8mm', verticalAlign: 'middle' }}>
              <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 900, letterSpacing: '-1px', display: 'flex', lineHeight: '1' }}>
                <span style={{ color: '#00D4AA' }}>WARRIOR</span>
                <span style={{ color: '#0056B3', marginLeft: '5px' }}>TECH</span>
                <span style={{ color: '#F57C00', marginLeft: '5px' }}>SYSTEM</span>
              </h1>
              <p style={{ margin: '1mm 0', color: '#F57C00', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', fontStyle: 'italic' }}>
                Innovative Security, Reliable Communication
              </p>
              <div style={{ marginTop: '2mm', fontSize: '10px', color: '#444', fontWeight: 'bold' }}>
                <span style={{ marginRight: '6mm' }}>📞 +880 1753-646372</span>
                <span style={{ marginRight: '6mm' }}>📧 warriortechsystem@gmail.com</span>
                <span>🌐 www.warriortechsystem.com</span>
              </div>
              <p style={{ margin: '1mm 0 0 0', fontSize: '10px', color: '#444', fontWeight: 'bold' }}>
                📍 GP.Ja-66/2, Gojnabi Rd, Wireless Gate, Mohakhali, Gulshan, Dhaka-1212.
              </p>
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ borderBottom: '0.4mm dashed #FF0000', width: '190mm', marginTop: '5mm' }}></div>
    </header>
  );
}
