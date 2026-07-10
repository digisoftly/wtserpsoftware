import React from 'react';

export function SignatureSection() {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        <tr>
          <td style={{ width: '25%', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #000', margin: '0 10px', paddingTop: '5px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Customer Signature
            </div>
          </td>
          <td style={{ width: '25%', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #000', margin: '0 10px', paddingTop: '5px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Prepared By
            </div>
          </td>
          <td style={{ width: '25%', textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #000', margin: '0 10px', paddingTop: '5px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Checked By
            </div>
          </td>
          <td style={{ width: '25%', textAlign: 'center' }}>
            <div style={{ borderTop: '2px solid #000', margin: '0 10px', paddingTop: '5px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Authorized Signature
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
