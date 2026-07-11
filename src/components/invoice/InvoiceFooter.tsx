import React from 'react';

/**
 * Locked Footer Height: 18mm
 * Fixed at the very base of the A4 page
 */
export function InvoiceFooter() {
  return (
    <footer style={{ textAlign: 'center', paddingBottom: '4mm', height: '18mm', boxSizing: 'border-box' }}>
      <div style={{ borderTop: '0.4mm dotted #00D4AA', width: '180mm', margin: '0 auto 4mm auto' }}></div>
      <div style={{ fontSize: '12px', fontWeight: '900', color: '#555', textTransform: 'uppercase', marginBottom: '2mm', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3mm' }}>
        <span style={{ color: '#FF0000', fontSize: '14px' }}>❤</span> Thank You For Your Business <span style={{ color: '#FF0000', fontSize: '14px' }}>❤</span>
      </div>
      <div style={{ fontWeight: '900', fontSize: '20px', color: '#111', textTransform: 'uppercase', lineHeight: '1', letterSpacing: '-0.5px' }}>
        WARRIOR TECH SYSTEM
      </div>
      <div style={{ color: '#888', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '4px', marginTop: '1.5mm' }}>
        Innovative Security, Reliable Communication
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8mm', fontSize: '10px', fontWeight: '900', color: '#0056B3', textTransform: 'uppercase', marginTop: '3mm' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}><span style={{ color: '#F57C00', fontSize: '15px' }}>•</span> Security System</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}><span style={{ color: '#F57C00', fontSize: '15px' }}>•</span> Communication System</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}><span style={{ color: '#F57C00', fontSize: '15px' }}>•</span> Fire Safety</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}><span style={{ color: '#F57C00', fontSize: '15px' }}>•</span> Network & IT Solutions</span>
      </div>
    </footer>
  );
}
