import React from 'react';

export function InvoiceHeader() {
  return (
    <header style={{ width: '190mm', height: '35mm' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8mm' }}>
        <div style={{ width: '25mm', height: '25mm', border: '0.2mm solid #cccccc', display: 'flex', alignItems: 'center', justifyCenter: 'center', overflow: 'hidden' }}>
          {/* Logo Placeholder */}
          <div style={{ fontSize: '8px', color: '#999', fontWeight: 'bold' }}>LOGO</div>
        </div>
        
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, letterSpacing: '-1px', display: 'flex', lineHeight: '1' }}>
            <span style={{ color: '#00D4AA' }}>WARRIOR</span>
            <span style={{ color: '#0056B3', marginLeft: '5px' }}>TECH</span>
            <span style={{ color: '#F57C00', marginLeft: '5px' }}>SYSTEM</span>
          </h1>
          <p style={{ margin: '1mm 0', color: '#F57C00', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', fontStyle: 'italic' }}>
            Innovative Security, Reliable Communication
          </p>
          <div style={{ marginTop: '2mm', fontSize: '10px', color: '#444', fontWeight: 'bold' }}>
            <span style={{ marginRight: '10mm' }}>📞 +880 1753-646372</span>
            <span style={{ marginRight: '10mm' }}>📧 warriortechsystem@gmail.com</span>
            <span>🌐 www.warriortechsystem.com</span>
          </div>
          <p style={{ margin: '1mm 0 0 0', fontSize: '10px', color: '#444', fontWeight: 'bold' }}>
            📍 GP.Ja-66/2, Gojnabi Rd, Wireless Gate, Mohakhali, Gulshan, Dhaka-1212.
          </p>
        </div>
      </div>
      <div style={{ borderBottom: '0.4mm dashed #FF0000', width: '190mm', marginTop: '4mm' }}></div>
    </header>
  );
}
