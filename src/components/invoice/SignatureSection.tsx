import React from 'react';

export function SignatureSection() {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        <tr>
          <td style={{ width: '25%', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #000', margin: '0 10px', paddingTop: '5px', fontSize: '11px' }}>
              CUSTOMER SIGNATURE
            </div>
          </td>
          <td style={{ width: '25%', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #000', margin: '0 10px', paddingTop: '5px', fontSize: '11px' }}>
              PREPARED BY
            </div>
          </td>
          <td style={{ width: '25%', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #000', margin: '0 10px', paddingTop: '5px', fontSize: '11px' }}>
              CHECKED BY
            </div>
          </td>
          <td style={{ width: '25%', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #000', margin: '0 10px', paddingTop: '5px', fontSize: '11px' }}>
              AUTHORIZED SIGNATURE
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
