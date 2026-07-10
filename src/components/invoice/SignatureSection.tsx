import React from 'react';

/**
 * Locked Block Height: 55mm
 */
export function SignatureSection() {
  return (
    <div style={{ marginTop: '30mm', width: '190mm', height: '55mm' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td style={{ textAlign: 'center', verticalAlign: 'bottom' }}>
              <div style={{ borderTop: '0.3mm solid #000', margin: '0 3mm', paddingTop: '2mm', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>
                Customer Signature
              </div>
            </td>
            <td style={{ textAlign: 'center', verticalAlign: 'bottom' }}>
              <div style={{ borderTop: '0.3mm solid #000', margin: '0 3mm', paddingTop: '2mm', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>
                Prepared By
              </div>
            </td>
            <td style={{ textAlign: 'center', verticalAlign: 'bottom' }}>
              <div style={{ borderTop: '0.3mm solid #000', margin: '0 3mm', paddingTop: '2mm', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>
                Checked By
              </div>
            </td>
            <td style={{ textAlign: 'center', verticalAlign: 'bottom', position: 'relative' }}>
              {/* Seal Effect Placeholder */}
              <div style={{ 
                position: 'absolute', 
                top: '-15mm', 
                left: '50%', 
                transform: 'translateX(-50%) rotate(12deg)',
                width: '18mm',
                height: '18mm',
                border: '0.5mm solid rgba(0, 86, 179, 0.15)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '7px',
                fontWeight: '900',
                color: 'rgba(0, 86, 179, 0.2)',
                textAlign: 'center',
                textTransform: 'uppercase'
              }}>
                Proprietor<br/>WTS
              </div>
              <p style={{ margin: '0 0 1.5mm 0', fontSize: '10px', fontWeight: '900', color: '#777', textTransform: 'uppercase' }}>Warrior Tech System</p>
              <div style={{ borderTop: '0.5mm solid #000', margin: '0 3mm', paddingTop: '2mm', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: '#0056B3' }}>
                Authorized Signature
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
