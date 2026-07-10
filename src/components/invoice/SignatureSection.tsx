import React from 'react';

export function SignatureSection() {
  return (
    <div style={{ marginTop: '60px', width: '100%' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ width: '25%', textAlign: 'center', verticalAlign: 'bottom' }}>
              <div style={{ borderTop: '1px solid #000', margin: '0 15px', paddingTop: '8px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>
                Customer Signature
              </div>
            </td>
            <td style={{ width: '25%', textAlign: 'center', verticalAlign: 'bottom' }}>
              <div style={{ borderTop: '1px solid #000', margin: '0 15px', paddingTop: '8px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>
                Prepared By
              </div>
            </td>
            <td style={{ width: '25%', textAlign: 'center', verticalAlign: 'bottom' }}>
              <div style={{ borderTop: '1px solid #000', margin: '0 15px', paddingTop: '8px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>
                Checked By
              </div>
            </td>
            <td style={{ width: '25%', textAlign: 'center', verticalAlign: 'bottom', position: 'relative' }}>
              {/* Seal Placeholder Effect */}
              <div style={{ 
                position: 'absolute', 
                top: '-50px', 
                left: '50%', 
                transform: 'translateX(-50%) rotate(15deg)',
                width: '70px',
                height: '70px',
                border: '2px solid rgba(0, 86, 179, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: 'black',
                color: 'rgba(0, 86, 179, 0.2)',
                textAlign: 'center',
                textTransform: 'uppercase',
                pointerEvents: 'none'
              }}>
                Proprietor<br/>WTS
              </div>
              <p style={{ margin: '0 0 5px 0', fontSize: '10px', fontWeight: '900', color: '#999', textTransform: 'uppercase' }}>Warrior Tech System</p>
              <div style={{ borderTop: '2px solid #000', margin: '0 15px', paddingTop: '8px', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: '#0056B3' }}>
                Authorized Signature
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
