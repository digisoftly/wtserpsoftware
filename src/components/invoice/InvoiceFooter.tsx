import React from 'react';

export function InvoiceFooter() {
  return (
    <footer style={{ marginTop: '20px', textAlign: 'center', fontSize: '9px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
      <div style={{ fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>
        Thank You For Your Business
      </div>
      <div style={{ fontWeight: 'bold', fontSize: '10px' }}>WARRIOR TECH SYSTEM</div>
      <div style={{ color: '#444', fontStyle: 'italic' }}>
        Innovative Security, Reliable Communication
      </div>
    </footer>
  );
}
