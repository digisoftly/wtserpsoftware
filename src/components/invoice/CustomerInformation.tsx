import React from 'react';

export function CustomerInformation() {
  return (
    <section style={{ border: '1px solid #000', padding: '10px', minHeight: '100px' }}>
      <h3 style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid #000' }}>
        CUSTOMER INFORMATION
      </h3>
      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ width: '80px', fontWeight: 'bold' }}>NAME</td>
            <td>: [CUSTOMER NAME]</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>COMPANY</td>
            <td>: [COMPANY NAME]</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>ADDRESS</td>
            <td>: [BILLING ADDRESS]</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>MOBILE</td>
            <td>: [MOBILE NUMBER]</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
