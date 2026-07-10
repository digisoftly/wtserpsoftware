import React from 'react';

export function CustomerInformation() {
  return (
    <section style={{ border: '1px solid #000', padding: '8px', minHeight: '90px' }}>
      <h3 style={{ margin: '0 0 5px 0', fontSize: '11px', fontWeight: 'bold', borderBottom: '1px solid #000', textTransform: 'uppercase' }}>
        Customer Information
      </h3>
      <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ width: '60px', fontWeight: 'bold' }}>NAME</td>
            <td style={{ width: '10px' }}>:</td>
            <td>[CUSTOMER NAME]</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>COMPANY</td>
            <td>:</td>
            <td>[COMPANY NAME]</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>ADDRESS</td>
            <td>:</td>
            <td>[BILLING ADDRESS]</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>MOBILE</td>
            <td>:</td>
            <td>[MOBILE NUMBER]</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
