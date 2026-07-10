import React from 'react';

export function CustomerInformation() {
  return (
    <section style={{ padding: '0 10px' }}>
      <h3 style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: '900', borderBottom: '1px solid #000', width: 'fit-content', paddingRight: '20px', textTransform: 'uppercase' }}>
        Customer Info
      </h3>
      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', lineHeight: '1.6' }}>
        <tbody>
          <tr>
            <td style={{ width: '80px', fontWeight: 'bold' }}>Name</td>
            <td style={{ width: '10px' }}>:</td>
            <td style={{ fontWeight: '900', textTransform: 'uppercase' }}>[CUSTOMER NAME]</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>Address</td>
            <td>:</td>
            <td>[BILLING ADDRESS]</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>Location</td>
            <td>:</td>
            <td>Dhaka</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold' }}>Mobile No</td>
            <td>:</td>
            <td style={{ fontWeight: 'bold' }}>[MOBILE NUMBER]</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
