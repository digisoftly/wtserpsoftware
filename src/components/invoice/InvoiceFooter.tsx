import React from 'react';

/**
 * Locked Footer Height: 18mm
 */
export function InvoiceFooter() {
  return (
    <footer style={{ textAlign: 'center', paddingBottom: '4mm', height: '18mm', boxSizing: 'border-box' }}>
      <div style={{ borderTop: '0.3mm dotted #00D4AA', width: '180mm', margin: '0 auto 3mm auto' }}></div>
      <div style={{ fontSize: '11px', fontWeight: '900', color: '#666', textTransform: 'uppercase', marginBottom: '1.5mm', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2mm' }}>
        <span style={{ color: '#FF0000' }}>❤</span> Thank You For Your Business <span style={{ color: '#FF0000' }}>❤</span>
      </div>
      <div style={{ fontWeight: '900', fontSize: '18px', color: '#222', textTransform: 'uppercase', lineHeight: '1' }}>
        WARRIOR TECH SYSTEM
      </div>
      <div style={{ color: '#999', fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '3px', marginTop: '1mm' }}>
        Innovative Security, Reliable Communication
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6mm', fontSize: '9px', fontWeight: '900', color: '#0056B3', textTransform: 'uppercase', marginTop: '2mm' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}><span style={{ color: '#F57C00', fontSize: '12px' }}>•</span> Security System</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}><span style={{ color: '#F57C00', fontSize: '12px' }}>•</span> Communication System</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}><span style={{ color: '#F57C00', fontSize: '12px' }}>•</span> Fire Safety</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '1mm' }}><span style={{ color: '#F57C00', fontSize: '12px' }}>•</span> Network & IT Solutions</span>
      </div>
    </footer>
  );
}
