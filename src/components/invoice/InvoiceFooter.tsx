import React from 'react';

export function InvoiceFooter() {
  return (
    <footer style={{ textAlign: 'center', paddingBottom: '5mm' }}>
      <div style={{ borderTop: '0.3mm dotted #00D4AA', width: '180mm', margin: '0 auto 4mm auto' }}></div>
      <div style={{ fontSize: '11px', fontWeight: '900', color: '#666', textTransform: 'uppercase', marginBottom: '2mm', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2mm' }}>
        <span style={{ color: '#FF0000' }}>❤</span> Thank You For Your Business <span style={{ color: '#FF0000' }}>❤</span>
      </div>
      <div style={{ fontWeight: '900', fontSize: '18px', color: '#222', textTransform: 'uppercase' }}>
        WARRIOR TECH SYSTEM
      </div>
      <div style={{ color: '#999', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '4mm' }}>
        Innovative Security, Reliable Communication
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6mm', fontSize: '9px', fontWeight: '900', color: '#0056B3', textTransform: 'uppercase' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}><span style={{ color: '#F57C00', fontSize: '12px' }}>•</span> Security System</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}><span style={{ color: '#F57C00', fontSize: '12px' }}>•</span> Communication System</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}><span style={{ color: '#F57C00', fontSize: '12px' }}>•</span> Fire Safety</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}><span style={{ color: '#F57C00', fontSize: '12px' }}>•</span> Network & IT Solutions</span>
      </div>
    </footer>
  );
}
