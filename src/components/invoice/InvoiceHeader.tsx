import React from 'react';

/**
 * Locked Header Specifications:
 * Total Height: 42mm
 * Signature Red Dashed Line at bottom
 */
export function InvoiceHeader() {
  return (
    <header style={{ width: '190mm', height: '42mm', boxSizing: 'border-box', position: 'relative' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: 'none' }}>
        <tbody>
          <tr>
            <td style={{ width: '25mm', verticalAlign: 'middle', padding: '2mm 0' }}>
              <div style={{ width: '25mm', height: '25mm', border: '0.1mm solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '8px', color: '#999', fontWeight: 'bold' }}>LOGO</span>
              </div>
            </td>
            <td style={{ paddingLeft: '6mm', verticalAlign: 'middle' }}>
              <h1 style={{ margin: 0, fontSize: '38px', fontWeight: 900, letterSpacing: '-1.5px', display: 'flex', lineHeight: '1', fontFamily: 'inherit' }}>
                <span style={{ color: '#00D4AA' }}>WARRIOR</span>
                <span style={{ color: '#0056B3', marginLeft: '2.5mm' }}>TECH</span>
                <span style={{ color: '#F57C00', marginLeft: '2.5mm' }}>SYSTEM</span>
              </h1>
              <p style={{ margin: '1.5mm 0', color: '#F57C00', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '0.5px' }}>
                Innovative Security, Reliable Communication
              </p>
              <div style={{ marginTop: '2mm', fontSize: '10.5px', color: '#333', fontWeight: 'bold' }}>
                <span style={{ marginRight: '5mm' }}><span style={{ color: '#0056B3' }}>📞</span> +880 1753-646372</span>
                <span style={{ marginRight: '5mm' }}><span style={{ color: '#F57C00' }}>📧</span> warriortechsystem@gmail.com</span>
                <span><span style={{ color: '#0056B3' }}>🌐</span> www.warriortechsystem.com</span>
              </div>
              <p style={{ margin: '1mm 0 0 0', fontSize: '10.5px', color: '#333', fontWeight: 'bold' }}>
                <span style={{ color: '#0056B3' }}>📍</span> GP.Ja-66/2, Gojnabi Rd, Wireless Gate, Mohakhali, Gulshan, Dhaka-1212.
              </p>
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ position: 'absolute', bottom: 0, width: '190mm', borderBottom: '0.4mm dashed #FF0000' }}></div>
    </header>
  );
}
