import React from 'react';

export function InvoiceHeader() {
  return (
    <header style={{ width: '100%', marginBottom: '5px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ width: '80px', height: '80px', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#999', fontWeight: 'bold' }}>
            LOGO
          </div>
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 900, letterSpacing: '-1px', display: 'flex', lineHeight: '1' }}>
              <span style={{ color: '#00D4AA' }}>WARRIOR</span>
              <span style={{ color: '#0056B3', marginLeft: '8px' }}>TECH</span>
              <span style={{ color: '#F57C00', marginLeft: '8px' }}>SYSTEM</span>
            </h1>
            <p style={{ margin: '2px 0 0 0', color: '#F57C00', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontStyle: 'italic' }}>
              Innovative Security, Reliable Communication
            </p>
            <div style={{ marginTop: '5px', fontSize: '10px', color: '#555', fontWeight: 'bold' }}>
              <span style={{ marginRight: '15px' }}>📞 +880 1753-646372</span>
              <span style={{ marginRight: '15px' }}>📧 warriortechsystem@gmail.com</span>
              <span>🌐 www.warriortechsystem.com</span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#555', fontWeight: 'bold' }}>
              📍 GP.Ja-66/2, Gojnabi Rd, Wireless Gate, Mohakhali, Gulshan, Dhaka-1212.
            </p>
          </div>
        </div>
      </div>
      <div style={{ borderBottom: '1px dashed #FF0000', width: '100%', marginTop: '10px', marginBottom: '10px' }}></div>
    </header>
  );
}
