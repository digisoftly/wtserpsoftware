import React from 'react';

/**
 * Locked Block Height: 55mm
 * Bottom-anchored above footer
 */
export function SignatureSection() {
  return (
    <div style={{ marginTop: '25mm', width: '190mm', height: '55mm' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <tbody>
          <tr>
            <td style={{ textAlign: 'center', verticalAlign: 'bottom', paddingBottom: '5mm' }}>
              <div style={{ borderTop: '0.4mm solid #000', margin: '0 4mm', paddingTop: '3mm', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>
                Customer Signature
              </div>
            </td>
            <td style={{ textAlign: 'center', verticalAlign: 'bottom', paddingBottom: '5mm' }}>
              <div style={{ borderTop: '0.4mm solid #000', margin: '0 4mm', paddingTop: '3mm', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>
                Prepared By
              </div>
            </td>
            <td style={{ textAlign: 'center', verticalAlign: 'bottom', paddingBottom: '5mm' }}>
              <div style={{ borderTop: '0.4mm solid #000', margin: '0 4mm', paddingTop: '3mm', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>
                Checked By
              </div>
            </td>
            <td style={{ textAlign: 'center', verticalAlign: 'bottom', position: 'relative', paddingBottom: '5mm' }}>
              {/* Seal Effect Placeholder */}
              <div style={{ 
                position: 'absolute', 
                top: '-20mm', 
                left: '50%', 
                transform: 'translateX(-50%) rotate(12deg)',
                width: '20mm',
                height: '20mm',
                border: '0.6mm solid rgba(0, 86, 179, 0.15)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: '900',
                color: 'rgba(0, 86, 179, 0.25)',
                textAlign: 'center',
                textTransform: 'uppercase'
              }}>
                Proprietor<br/>WTS
              </div>
              <p style={{ margin: '0 0 2mm 0', fontSize: '11px', fontWeight: '900', color: '#666', textTransform: 'uppercase' }}>Warrior Tech System</p>
              <div style={{ borderTop: '0.6mm solid #000', margin: '0 4mm', paddingTop: '3mm', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', color: '#0056B3' }}>
                Authorized Signature
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
