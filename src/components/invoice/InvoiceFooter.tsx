import React from 'react';

export function InvoiceFooter() {
  return (
    <footer style={{ marginTop: 'auto', paddingBottom: '20px', textAlign: 'center' }}>
      <div style={{ borderTop: '1px dotted #00D4AA', width: '90%', margin: '0 auto 15px auto' }}></div>
      <div style={{ fontSize: '11px', fontWeight: '900', color: '#777', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <span style={{ color: '#FF0000' }}>❤</span> Thank You For Your Business <span style={{ color: '#FF0000' }}>❤</span>
      </div>
      <div style={{ fontWeight: '900', fontSize: '20px', color: '#222', textTransform: 'uppercase', tracking: 'tight' }}>
        WARRIOR TECH SYSTEM
      </div>
      <div style={{ color: '#999', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '15px' }}>
        Innovative Security, Reliable Communication
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', fontSize: '9px', fontWeight: '900', color: '#0056B3', textTransform: 'uppercase', tracking: 'wider' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#F57C00', fontSize: '14px' }}>•</span> Security System</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#F57C00', fontSize: '14px' }}>•</span> Communication System</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#F57C00', fontSize: '14px' }}>•</span> Fire Safety</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#F57C00', fontSize: '14px' }}>•</span> Network & IT Solutions</span>
      </div>
    </footer>
  );
}
