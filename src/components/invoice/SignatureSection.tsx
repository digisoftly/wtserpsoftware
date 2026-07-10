import React from 'react';

export function SignatureSection() {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        <tr>
          <td style={{ width: '25%', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #000', margin: '0 10px', paddingTop: '5px', fontSize: '11px', fontWeight: 'bold' }}>
              CUSTOMER SIGNATURE
            </div>
          </td>
          <td style={{ width: '25%', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #000', margin: '0 10px', paddingTop: '5px', fontSize: '11px', fontWeight: 'bold' }}>
              PREPARED BY
            </div>
          </td>
          <td style={{ width: '25%', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #000', margin: '0 10px', paddingTop: '5px', fontSize: '11px', fontWeight: 'bold' }}>
              CHECKED BY
            </div>
          </td>
          <td style={{ width: '25%', textAlign: 'center' }}>
            <div style={{ borderTop: '2px solid #000', margin: '0 10px', paddingTop: '5px', fontSize: '11px', fontWeight: 'bold' }}>
              AUTHORIZED SIGNATURE
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
